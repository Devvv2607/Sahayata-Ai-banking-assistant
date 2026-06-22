"""Conversation and turn endpoints (Phase 1: in-memory, unauthenticated).

Auth + persistence arrive in Phase 2. The AI/turn endpoints are rate-limited and the customer
audio upload is strictly validated.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.config import Settings, get_settings
from app.models.turn import (
    CustomerTurnResponse,
    StaffTurnRequest,
    StaffTurnResponse,
    StartConversationRequest,
    StartConversationResponse,
)
from app.providers.factory import (
    get_llm_provider,
    get_speech_provider,
    get_translation_provider,
)
from app.rate_limit import TURN_RATE_LIMIT, limiter
from app.services.audio_validation import AudioValidationError, validate_audio
from app.services.conversation_store import Conversation, store
from app.services.turn_service import TurnService

router = APIRouter(prefix="/conversations", tags=["conversations"])


def get_turn_service() -> TurnService:
    """Build a TurnService from the env-selected providers."""
    return TurnService(
        store=store,
        speech=get_speech_provider(),
        translation=get_translation_provider(),
        llm=get_llm_provider(),
    )


def _require_conversation(conversation_id: str) -> Conversation:
    conversation = store.get(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.post("", response_model=StartConversationResponse, status_code=201)
async def start_conversation(payload: StartConversationRequest) -> StartConversationResponse:
    conversation = store.create(customer_id=payload.customer_id)
    return StartConversationResponse(
        conversation_id=conversation.id, customer_id=conversation.customer_id
    )


@router.post("/{conversation_id}/turn/customer", response_model=CustomerTurnResponse)
@limiter.limit(TURN_RATE_LIMIT)
async def customer_turn(
    request: Request,
    conversation_id: str,
    audio: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    service: TurnService = Depends(get_turn_service),
) -> CustomerTurnResponse:
    conversation = _require_conversation(conversation_id)

    data = await audio.read()
    try:
        validate_audio(
            data,
            audio.content_type or "",
            max_bytes=settings.max_audio_bytes,
            max_seconds=settings.max_audio_seconds,
        )
    except AudioValidationError as err:
        raise HTTPException(status_code=err.status_code, detail=str(err)) from err

    return await service.process_customer_turn(conversation, data, audio.content_type or "")


@router.post("/{conversation_id}/turn/staff", response_model=StaffTurnResponse)
@limiter.limit(TURN_RATE_LIMIT)
async def staff_turn(
    request: Request,
    conversation_id: str,
    payload: StaffTurnRequest,
    service: TurnService = Depends(get_turn_service),
) -> StaffTurnResponse:
    conversation = _require_conversation(conversation_id)
    return await service.process_staff_turn(conversation, payload.text, payload.lang)
