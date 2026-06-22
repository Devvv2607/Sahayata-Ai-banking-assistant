"""Runtime provider selection, driven by env toggles in ``Settings``.

Defaults to the deterministic fakes so the app runs with zero credentials. Concrete vendor
adapters are selected by setting ``SPEECH_PROVIDER`` / ``TRANSLATION_PROVIDER`` /
``LLM_PROVIDER``.
"""

from __future__ import annotations

from app.config import Settings, get_settings
from app.providers.base import LLMProvider, SpeechProvider, TranslationProvider
from app.providers.fakes import (
    FakeLLMProvider,
    FakeSpeechProvider,
    FakeTranslationProvider,
)


def get_speech_provider(settings: Settings | None = None) -> SpeechProvider:
    settings = settings or get_settings()
    match settings.speech_provider:
        case "sarvam":
            from app.providers.sarvam import SarvamSpeechProvider

            return SarvamSpeechProvider(api_key=_require(settings.sarvam_api_key, "SARVAM_API_KEY"))
        case "fake":
            return FakeSpeechProvider()
        case other:  # pragma: no cover - guarded by Settings Literal
            raise NotImplementedError(f"speech provider '{other}' is not implemented yet")


def get_translation_provider(settings: Settings | None = None) -> TranslationProvider:
    settings = settings or get_settings()
    match settings.translation_provider:
        case "sarvam":
            from app.providers.sarvam import SarvamTranslationProvider

            return SarvamTranslationProvider(
                api_key=_require(settings.sarvam_api_key, "SARVAM_API_KEY")
            )
        case "fake":
            return FakeTranslationProvider()
        case other:  # pragma: no cover
            raise NotImplementedError(f"translation provider '{other}' is not implemented yet")


def get_llm_provider(settings: Settings | None = None) -> LLMProvider:
    settings = settings or get_settings()
    match settings.llm_provider:
        case "fake":
            return FakeLLMProvider()
        case other:  # pragma: no cover
            raise NotImplementedError(f"llm provider '{other}' is not implemented yet")


def _require(value: str | None, name: str) -> str:
    if not value:
        raise RuntimeError(f"{name} is required for the selected provider but is not set.")
    return value
