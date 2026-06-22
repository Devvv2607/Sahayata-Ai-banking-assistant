"""Turn pipeline orchestration.

Ties together the speech, translation, and LLM providers and the conversation store. Contains
no vendor SDK calls directly — only provider interfaces — so it is fully unit-testable with
the fakes.
"""

from __future__ import annotations

import logging

from app.models.turn import (
    CustomerTurnResponse,
    Speaker,
    StaffTurnResponse,
)
from app.providers.base import LLMProvider, SpeechProvider, TranslationProvider
from app.services import banking_knowledge
from app.services.conversation_store import Conversation, ConversationStore, Utterance

logger = logging.getLogger(__name__)

DEFAULT_CUSTOMER_LANG = "hi"


class TurnService:
    def __init__(
        self,
        store: ConversationStore,
        speech: SpeechProvider,
        translation: TranslationProvider,
        llm: LLMProvider,
    ) -> None:
        self._store = store
        self._speech = speech
        self._translation = translation
        self._llm = llm

    async def process_customer_turn(
        self, conversation: Conversation, audio: bytes, mime_type: str
    ) -> CustomerTurnResponse:
        # 1. Speech-to-text + language detection.
        transcript = await self._speech.transcribe(audio, mime_type)
        conversation.customer_lang = transcript.language

        # 2. Translate into the staff's language.
        translated = await self._translation.translate(
            transcript.text, transcript.language, conversation.staff_lang
        )

        # 3. Structured analysis, grounded in the banking knowledge base.
        analysis = await self._llm.analyze_turn(translated, banking_knowledge.as_llm_context())

        # 4. Persist the utterance.
        self._store.append(
            conversation.id,
            Utterance(
                speaker=Speaker.customer,
                original_text=transcript.text,
                original_lang=transcript.language,
                translated_text=translated,
                translated_lang=conversation.staff_lang,
            ),
        )

        return CustomerTurnResponse(
            original_text=transcript.text,
            original_lang=transcript.language,
            translated_text=translated,
            translated_lang=conversation.staff_lang,
            analysis=analysis,
        )

    async def process_staff_turn(
        self, conversation: Conversation, text: str, lang: str
    ) -> StaffTurnResponse:
        target_lang = conversation.customer_lang or DEFAULT_CUSTOMER_LANG

        # Translate the staff reply into the customer's language.
        translated = await self._translation.translate(text, lang, target_lang)

        # Synthesize speech — degrade gracefully to text-only if TTS fails.
        audio_base64: str | None = None
        try:
            synthesis = await self._speech.synthesize(translated, target_lang)
            audio_base64 = synthesis.audio_base64
        except Exception:  # noqa: BLE001 - any provider failure must not block the reply
            logger.warning("TTS synthesis failed; returning text-only reply.", exc_info=True)

        self._store.append(
            conversation.id,
            Utterance(
                speaker=Speaker.staff,
                original_text=text,
                original_lang=lang,
                translated_text=translated,
                translated_lang=target_lang,
            ),
        )

        return StaffTurnResponse(
            translated_text=translated,
            translated_lang=target_lang,
            audio_base64=audio_base64,
        )
