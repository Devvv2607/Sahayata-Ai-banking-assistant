"""Turn pipeline orchestration.

Ties together the speech, translation, and LLM providers and the conversation gateway. Contains
no vendor SDK calls directly — only provider interfaces — so it is fully unit-testable with the
fakes and the in-memory gateway.
"""

from __future__ import annotations

import logging

from app.models.turn import CustomerTurnResponse, Speaker, StaffTurnResponse
from app.providers.base import LLMProvider, SpeechProvider, TranslationProvider
from app.services import banking_knowledge
from app.services.conversation_gateway import ConversationGateway

logger = logging.getLogger(__name__)

DEFAULT_CUSTOMER_LANG = "hi"
DEFAULT_STAFF_LANG = "en"


class TurnService:
    def __init__(
        self,
        gateway: ConversationGateway,
        speech: SpeechProvider,
        translation: TranslationProvider,
        llm: LLMProvider,
    ) -> None:
        self._gateway = gateway
        self._speech = speech
        self._translation = translation
        self._llm = llm

    async def process_customer_turn(
        self,
        conversation_id: str,
        audio: bytes,
        mime_type: str,
        staff_lang: str = DEFAULT_STAFF_LANG,
    ) -> CustomerTurnResponse:
        # 1. Speech-to-text + language detection.
        transcript = await self._speech.transcribe(audio, mime_type)

        # 2. Translate into the staff's language.
        translated = await self._translation.translate(
            transcript.text, transcript.language, staff_lang
        )

        # 3. Structured analysis, grounded in the banking knowledge base.
        analysis = await self._llm.analyze_turn(translated, banking_knowledge.as_llm_context())

        # 4. Persist the utterance and roll up conversation metadata.
        await self._gateway.append(
            conversation_id,
            Speaker.customer,
            original_text=transcript.text,
            original_lang=transcript.language,
            translated_text=translated,
            translated_lang=staff_lang,
            sentiment=analysis.sentiment.value,
        )
        await self._gateway.set_meta(
            conversation_id,
            primary_intent=analysis.intent,
            sentiment_label=analysis.sentiment.value,
            escalated=analysis.escalate,
        )

        return CustomerTurnResponse(
            original_text=transcript.text,
            original_lang=transcript.language,
            translated_text=translated,
            translated_lang=staff_lang,
            analysis=analysis,
        )

    async def process_staff_turn(
        self, conversation_id: str, text: str, lang: str
    ) -> StaffTurnResponse:
        target_lang = await self._gateway.customer_lang(conversation_id) or DEFAULT_CUSTOMER_LANG

        # Translate the staff reply into the customer's language.
        translated = await self._translation.translate(text, lang, target_lang)

        # Synthesize speech — degrade gracefully to text-only if TTS fails.
        audio_base64: str | None = None
        try:
            synthesis = await self._speech.synthesize(translated, target_lang)
            audio_base64 = synthesis.audio_base64
        except Exception:  # noqa: BLE001 - any provider failure must not block the reply
            logger.warning("TTS synthesis failed; returning text-only reply.", exc_info=True)

        await self._gateway.append(
            conversation_id,
            Speaker.staff,
            original_text=text,
            original_lang=lang,
            translated_text=translated,
            translated_lang=target_lang,
        )

        return StaffTurnResponse(
            translated_text=translated, translated_lang=target_lang, audio_base64=audio_base64
        )
