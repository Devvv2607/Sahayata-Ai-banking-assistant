"""Abstract provider interfaces.

Feature code (services, routers) depends only on these interfaces — never on a vendor SDK
directly. Concrete adapters (Sarvam, Google, Gemini) and deterministic test fakes implement
them, selected at runtime by the env-driven factory in ``app.providers.factory``.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.turn import SynthesisResult, TranscriptionResult, TurnAnalysis


class SpeechProvider(ABC):
    """Speech-to-text and text-to-speech."""

    @abstractmethod
    async def transcribe(
        self, audio: bytes, mime_type: str, hint_languages: list[str] | None = None
    ) -> TranscriptionResult:
        """Transcribe audio and detect its language."""

    @abstractmethod
    async def synthesize(self, text: str, language: str) -> SynthesisResult:
        """Synthesize speech for ``text`` in ``language``."""


class TranslationProvider(ABC):
    """Context-aware translation between customer and staff languages."""

    @abstractmethod
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate ``text`` from ``source_lang`` to ``target_lang``."""


class LLMProvider(ABC):
    """Structured reasoning: intent/guidance/sentiment analysis and summaries."""

    @abstractmethod
    async def analyze_turn(
        self, text: str, process_context: list[dict[str, object]] | None = None
    ) -> TurnAnalysis:
        """Return structured analysis of a customer utterance, grounded in known processes."""
