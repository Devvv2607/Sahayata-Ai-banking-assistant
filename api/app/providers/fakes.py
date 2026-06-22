"""Deterministic, dependency-free provider fakes.

Used for local development without credentials, for the CI test suite, and as the default
when provider toggles are unset. They are intentionally useful (keyword intent detection, a
small bilingual phrase map) so the full pipeline can be exercised end-to-end on mocks.
"""

from __future__ import annotations

import base64

from app.models.turn import (
    Sentiment,
    SynthesisResult,
    TranscriptionResult,
    TurnAnalysis,
)
from app.providers.base import LLMProvider, SpeechProvider, TranslationProvider

# A tiny seeded phrase book (customer-language -> English) for believable mock demos.
_PHRASEBOOK: dict[str, str] = {
    "मला नवीन खाते उघडायचे आहे": "I want to open a new bank account",
    "मला बचत खाते उघडायचे आहे": "I want to open a savings account",
    "મારે એક નવી લોન લેવી છે": "I want to take a new loan",
    "माझ्या खात्यात समस्या आहे": "There is a problem with my account",
}
_DEFAULT_MOCK_UTTERANCE = "मला नवीन खाते उघडायचे आहे"

# 44-byte silent WAV header — a valid, tiny placeholder audio payload.
_SILENT_WAV = bytes.fromhex(
    "524946462400000057415645666d7420100000000100010044ac000088580100020010006461746100000000"
)

_NEGATIVE_MARKERS = ("problem", "issue", "complaint", "fraud", "wrong", "not working", "समस्या")


class FakeSpeechProvider(SpeechProvider):
    async def transcribe(
        self, audio: bytes, mime_type: str, hint_languages: list[str] | None = None
    ) -> TranscriptionResult:
        # Deterministic: real bytes are ignored; return a seeded customer utterance.
        return TranscriptionResult(text=_DEFAULT_MOCK_UTTERANCE, language="mr", confidence=0.97)

    async def synthesize(self, text: str, language: str) -> SynthesisResult:
        return SynthesisResult(
            audio_base64=base64.b64encode(_SILENT_WAV).decode("ascii"),
            mime_type="audio/wav",
        )


class FakeTranslationProvider(TranslationProvider):
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if text in _PHRASEBOOK:
            return _PHRASEBOOK[text]
        # Fallback: tag so the path is visible without pretending to translate.
        return f"[{source_lang}->{target_lang}] {text}"


class FakeLLMProvider(LLMProvider):
    async def analyze_turn(
        self, text: str, process_context: list[dict[str, object]] | None = None
    ) -> TurnAnalysis:
        lowered = text.lower()
        sentiment = (
            Sentiment.negative
            if any(m in lowered for m in _NEGATIVE_MARKERS)
            else Sentiment.neutral
        )

        # Match against seeded banking_processes keywords, if provided. A keyword matches when
        # all of its words appear in the text (order-independent), which is more forgiving than
        # raw substring matching for a mock.
        for process in process_context or []:
            keywords = process.get("keywords") or []
            if isinstance(keywords, list) and any(
                isinstance(k, str) and all(word in lowered for word in k.lower().split())
                for k in keywords
            ):
                return TurnAnalysis(
                    intent=str(process.get("intent_key", "unknown")),
                    confidence=0.9,
                    sentiment=sentiment,
                    escalate=sentiment is Sentiment.negative,
                    suggested_guidance=_as_str_list(process.get("steps")),
                    required_documents=_as_str_list(process.get("required_documents")),
                )

        return TurnAnalysis(
            intent="unknown",
            confidence=0.3,
            sentiment=sentiment,
            escalate=sentiment is Sentiment.negative,
        )


def _as_str_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    return []
