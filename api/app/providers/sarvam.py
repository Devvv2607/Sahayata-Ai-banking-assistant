"""Sarvam AI provider adapters (speech-to-text, text-to-speech, translation).

Sarvam specializes in Indian languages. These adapters implement the provider interfaces and
are selected via the ``sarvam`` env toggles. Activated once ``SARVAM_API_KEY`` is set; until
then the fakes are used and this module is not imported.

API reference: https://docs.sarvam.ai
"""

from __future__ import annotations

import httpx

from app.models.turn import SynthesisResult, TranscriptionResult
from app.providers.base import SpeechProvider, TranslationProvider

_BASE_URL = "https://api.sarvam.ai"
_TIMEOUT = httpx.Timeout(30.0)
_AUTH_HEADER = "api-subscription-key"


def _to_sarvam_lang(lang: str) -> str:
    """Map an internal short code (e.g. 'mr') to Sarvam's BCP-47 form ('mr-IN')."""
    return lang if "-" in lang else f"{lang}-IN"


def _from_sarvam_lang(code: str) -> str:
    """Map a Sarvam language code ('mr-IN') back to our short code ('mr')."""
    return code.split("-", 1)[0] if code else code


class SarvamSpeechProvider(SpeechProvider):
    """Saarika (STT) + Bulbul (TTS)."""

    def __init__(self, api_key: str) -> None:
        self._headers = {_AUTH_HEADER: api_key}

    async def transcribe(
        self, audio: bytes, mime_type: str, hint_languages: list[str] | None = None
    ) -> TranscriptionResult:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{_BASE_URL}/speech-to-text",
                headers=self._headers,
                data={"model": "saarika:v2.5", "language_code": "unknown"},
                files={"file": ("audio", audio, mime_type or "audio/wav")},
            )
            response.raise_for_status()
            body = response.json()
        return TranscriptionResult(
            text=body.get("transcript", ""),
            language=_from_sarvam_lang(body.get("language_code", "")) or "unknown",
            confidence=1.0,
        )

    async def synthesize(self, text: str, language: str) -> SynthesisResult:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{_BASE_URL}/text-to-speech",
                headers=self._headers,
                json={
                    "inputs": [text],
                    "target_language_code": _to_sarvam_lang(language),
                    "model": "bulbul:v2",
                    "speaker": "anushka",
                },
            )
            response.raise_for_status()
            body = response.json()
        audios = body.get("audios") or [""]
        return SynthesisResult(audio_base64=audios[0], mime_type="audio/wav")


class SarvamTranslationProvider(TranslationProvider):
    """Mayura translation (context-aware, Indian-language-first)."""

    def __init__(self, api_key: str) -> None:
        self._headers = {_AUTH_HEADER: api_key}

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{_BASE_URL}/translate",
                headers=self._headers,
                json={
                    "input": text,
                    "source_language_code": _to_sarvam_lang(source_lang),
                    "target_language_code": _to_sarvam_lang(target_lang),
                    "model": "mayura:v1",
                },
            )
            response.raise_for_status()
            body = response.json()
        return str(body.get("translated_text", text))
