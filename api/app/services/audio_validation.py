"""Server-side validation of uploaded audio.

Security control for the customer-turn endpoint. Enforces a content-type allowlist, a size
cap, and **magic-byte verification** (the declared MIME type is never trusted on its own).
For WAV, the true duration is computed from the header and capped; for compressed formats the
size cap plus the browser-side recording limit bound the duration.
"""

from __future__ import annotations

import io
import wave
from dataclasses import dataclass


@dataclass(frozen=True)
class MagicCheck:
    offset: int
    signature: bytes


def _matches(data: bytes, checks: list[MagicCheck]) -> bool:
    return any(data[c.offset : c.offset + len(c.signature)] == c.signature for c in checks)


# Signatures per allowed type.
_SIGNATURES: dict[str, list[MagicCheck]] = {
    "audio/wav": [MagicCheck(0, b"RIFF")],  # plus 'WAVE' at offset 8, checked below
    "audio/x-wav": [MagicCheck(0, b"RIFF")],
    "audio/webm": [MagicCheck(0, b"\x1a\x45\xdf\xa3")],  # EBML / Matroska
    "audio/ogg": [MagicCheck(0, b"OggS")],
    "audio/mpeg": [MagicCheck(0, b"ID3")],  # plus frame-sync fallback below
}

ALLOWED_TYPES = frozenset(_SIGNATURES)


class AudioValidationError(Exception):
    """Raised when an uploaded audio payload fails validation.

    ``status_code`` is 415 for unsupported/invalid type and 413 for too-large payloads.
    """

    def __init__(self, message: str, status_code: int = 415) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class ValidatedAudio:
    mime_type: str
    size_bytes: int
    duration_seconds: float | None


def validate_audio(
    data: bytes,
    declared_mime: str,
    *,
    max_bytes: int,
    max_seconds: int,
) -> ValidatedAudio:
    """Validate an uploaded audio blob, returning its verified metadata or raising."""
    if not data:
        raise AudioValidationError("Empty audio payload.")

    if len(data) > max_bytes:
        raise AudioValidationError(f"Audio exceeds the {max_bytes}-byte limit.", status_code=413)

    # Normalize the declared type (strip parameters like ';codecs=opus').
    mime = declared_mime.split(";", 1)[0].strip().lower()
    if mime not in ALLOWED_TYPES:
        raise AudioValidationError(f"Unsupported audio type '{declared_mime}'.")

    # Magic-byte verification — do not trust the declared type alone.
    if not _passes_magic(data, mime):
        raise AudioValidationError(f"Audio content does not match the declared type '{mime}'.")

    duration = _wav_duration_seconds(data) if mime in ("audio/wav", "audio/x-wav") else None
    if duration is not None and duration > max_seconds:
        raise AudioValidationError(
            f"Audio is {duration:.1f}s, exceeding the {max_seconds}s limit.", status_code=413
        )

    return ValidatedAudio(mime_type=mime, size_bytes=len(data), duration_seconds=duration)


def _passes_magic(data: bytes, mime: str) -> bool:
    checks = _SIGNATURES[mime]
    if mime in ("audio/wav", "audio/x-wav"):
        return _matches(data, checks) and data[8:12] == b"WAVE"
    if mime == "audio/mpeg":
        # 'ID3' tag or an MPEG frame-sync (0xFFEx).
        return _matches(data, checks) or (
            len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0
        )
    return _matches(data, checks)


def _wav_duration_seconds(data: bytes) -> float | None:
    try:
        with wave.open(io.BytesIO(data), "rb") as wav:
            frames = wav.getnframes()
            rate = wav.getframerate()
            if rate <= 0:
                return None
            return frames / float(rate)
    except (wave.Error, EOFError, ValueError):
        return None
