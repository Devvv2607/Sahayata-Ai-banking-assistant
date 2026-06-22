"""Shared test fixtures and helpers."""

from __future__ import annotations

import io
import wave


def make_wav(seconds: float = 0.5, rate: int = 8000) -> bytes:
    """Build a valid little silent mono 16-bit WAV of the given duration."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(b"\x00\x00" * int(seconds * rate))
    return buffer.getvalue()
