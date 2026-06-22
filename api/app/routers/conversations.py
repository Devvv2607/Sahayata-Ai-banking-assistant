"""Conversation and turn endpoints.

Phase 1: turn pipeline (audio validation, STT/translate/analyze, TTS).
Phase 2: persistence via the conversation gateway + dashboard read endpoints.
Auth + branch scoping from the JWT arrive in the Phase 2 auth slice; until then conversations
are attributed to the seeded demo staff/branch.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile

from app.config import Settings, get_settings
from app.models.turn import (
    ConversationDetail,
    ConversationListItem,
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
from app.services.conversation_gateway import ConversationGateway, get_conversation_gateway
from app.services.turn_service import TurnService

router = APIRouter(prefix="/conversations", tags=["conversations"])


def get_gateway() -> ConversationGateway:
    return get_conversation_gateway()


def get_turn_service(
    gateway: ConversationGateway = Depends(get_gateway),
) -> TurnService:
    return TurnService(
        gateway=gateway,
        speech=get_speech_provider(),
        translation=get_translation_provider(),
        llm=get_llm_provider(),
    )


async def _require_conversation(conversation_id: str, gateway: ConversationGateway) -> None:
    if not await gateway.exists(conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found.")


@router.post("", response_model=StartConversationResponse, status_code=201)
async def start_conversation(
    payload: StartConversationRequest,
    gateway: ConversationGateway = Depends(get_gateway),
) -> StartConversationResponse:
    conversation_id = await gateway.create(customer_id=payload.customer_id)
    return StartConversationResponse(
        conversation_id=conversation_id, customer_id=payload.customer_id
    )


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(
    branch_id: str | None = Query(default=None),
    gateway: ConversationGateway = Depends(get_gateway),
) -> list[ConversationListItem]:
    return await gateway.list(branch_id)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    gateway: ConversationGateway = Depends(get_gateway),
) -> ConversationDetail:
    detail = await gateway.get_detail(conversation_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return detail


@router.post("/{conversation_id}/turn/customer", response_model=CustomerTurnResponse)
@limiter.limit(TURN_RATE_LIMIT)
async def customer_turn(
    request: Request,
    conversation_id: str,
    audio: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    gateway: ConversationGateway = Depends(get_gateway),
    service: TurnService = Depends(get_turn_service),
) -> CustomerTurnResponse:
    await _require_conversation(conversation_id, gateway)

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

    return await service.process_customer_turn(conversation_id, data, audio.content_type or "")


@router.post("/{conversation_id}/turn/staff", response_model=StaffTurnResponse)
@limiter.limit(TURN_RATE_LIMIT)
async def staff_turn(
    request: Request,
    conversation_id: str,
    payload: StaffTurnRequest,
    gateway: ConversationGateway = Depends(get_gateway),
    service: TurnService = Depends(get_turn_service),
) -> StaffTurnResponse:
    await _require_conversation(conversation_id, gateway)
    return await service.process_staff_turn(conversation_id, payload.text, payload.lang)
