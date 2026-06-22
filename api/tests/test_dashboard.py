"""Tests for persistence + dashboard read endpoints (in-memory gateway)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import make_wav

client = TestClient(create_app())


def _start() -> str:
    return client.post("/conversations", json={}).json()["conversation_id"]


def test_conversation_persists_turns_and_is_reopenable() -> None:
    conv_id = _start()
    client.post(
        f"/conversations/{conv_id}/turn/customer",
        files={"audio": ("t.wav", make_wav(0.4), "audio/wav")},
    )
    client.post(
        f"/conversations/{conv_id}/turn/staff",
        json={"text": "Do you have an Aadhaar card?", "lang": "en"},
    )

    detail = client.get(f"/conversations/{conv_id}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["id"] == conv_id
    assert body["primary_intent"] == "account_opening"
    assert len(body["utterances"]) == 2
    assert body["utterances"][0]["speaker"] == "customer"
    assert body["utterances"][1]["speaker"] == "staff"


def test_list_conversations_includes_created() -> None:
    conv_id = _start()
    res = client.get("/conversations", params={"branch_id": "any"})
    assert res.status_code == 200
    ids = [c["id"] for c in res.json()]
    assert conv_id in ids


def test_get_unknown_conversation_is_404() -> None:
    assert client.get("/conversations/does-not-exist").status_code == 404
