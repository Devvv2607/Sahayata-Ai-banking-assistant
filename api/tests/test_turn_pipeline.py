"""End-to-end turn pipeline tests using the default fake providers."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import make_wav

client = TestClient(create_app())


def _start_conversation() -> str:
    res = client.post("/conversations", json={})
    assert res.status_code == 201
    return res.json()["conversation_id"]


def test_banking_processes_listed() -> None:
    res = client.get("/banking-processes")
    assert res.status_code == 200
    processes = res.json()
    assert len(processes) == 7
    assert {p["intent_key"] for p in processes} >= {"account_opening", "loan_enquiry"}


def test_customer_turn_detects_intent() -> None:
    conv_id = _start_conversation()
    res = client.post(
        f"/conversations/{conv_id}/turn/customer",
        files={"audio": ("turn.wav", make_wav(0.5), "audio/wav")},
    )
    assert res.status_code == 200
    body = res.json()
    # Fake STT returns a Marathi account-opening utterance.
    assert body["original_lang"] == "mr"
    assert body["translated_lang"] == "en"
    assert body["analysis"]["intent"] == "account_opening"
    assert "Aadhaar card" in body["analysis"]["required_documents"]


def test_customer_turn_rejects_bad_audio() -> None:
    conv_id = _start_conversation()
    res = client.post(
        f"/conversations/{conv_id}/turn/customer",
        files={"audio": ("turn.flac", b"\x00\x00\x00", "audio/flac")},
    )
    assert res.status_code == 415


def test_staff_turn_returns_translation_and_audio() -> None:
    conv_id = _start_conversation()
    # Establish the customer language first.
    client.post(
        f"/conversations/{conv_id}/turn/customer",
        files={"audio": ("turn.wav", make_wav(0.5), "audio/wav")},
    )
    res = client.post(
        f"/conversations/{conv_id}/turn/staff",
        json={"text": "Do you have an Aadhaar card?", "lang": "en"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["translated_lang"] == "mr"
    assert body["audio_base64"]  # fake TTS always returns audio


def test_turn_on_missing_conversation_is_404() -> None:
    res = client.post(
        "/conversations/does-not-exist/turn/staff",
        json={"text": "hello", "lang": "en"},
    )
    assert res.status_code == 404
