"""Tests for the audio upload validation security control."""

from __future__ import annotations

import pytest

from app.services.audio_validation import AudioValidationError, validate_audio
from tests.conftest import make_wav

MAX_BYTES = 5_242_880
MAX_SECONDS = 30


def _validate(data: bytes, mime: str) -> None:
    validate_audio(data, mime, max_bytes=MAX_BYTES, max_seconds=MAX_SECONDS)


def test_accepts_valid_wav() -> None:
    result = validate_audio(
        make_wav(0.5), "audio/wav", max_bytes=MAX_BYTES, max_seconds=MAX_SECONDS
    )
    assert result.mime_type == "audio/wav"
    assert result.duration_seconds is not None
    assert result.duration_seconds < 1


def test_strips_codec_parameters_from_mime() -> None:
    # MediaRecorder sends e.g. 'audio/webm;codecs=opus'.
    webm = b"\x1a\x45\xdf\xa3" + b"\x00" * 64
    result = validate_audio(
        webm, "audio/webm;codecs=opus", max_bytes=MAX_BYTES, max_seconds=MAX_SECONDS
    )
    assert result.mime_type == "audio/webm"


def test_rejects_empty_payload() -> None:
    with pytest.raises(AudioValidationError):
        _validate(b"", "audio/wav")


def test_rejects_unsupported_type() -> None:
    with pytest.raises(AudioValidationError) as exc:
        _validate(make_wav(0.2), "audio/flac")
    assert exc.value.status_code == 415


def test_rejects_magic_byte_mismatch() -> None:
    # Declared WAV but content is not a RIFF/WAVE container.
    with pytest.raises(AudioValidationError) as exc:
        _validate(b"NOT_A_REAL_WAV_FILE_AT_ALL", "audio/wav")
    assert exc.value.status_code == 415


def test_rejects_oversized_payload() -> None:
    with pytest.raises(AudioValidationError) as exc:
        validate_audio(make_wav(0.2), "audio/wav", max_bytes=10, max_seconds=MAX_SECONDS)
    assert exc.value.status_code == 413


def test_rejects_overlong_wav() -> None:
    long_wav = make_wav(seconds=31, rate=8000)
    with pytest.raises(AudioValidationError) as exc:
        validate_audio(long_wav, "audio/wav", max_bytes=MAX_BYTES, max_seconds=MAX_SECONDS)
    assert exc.value.status_code == 413
