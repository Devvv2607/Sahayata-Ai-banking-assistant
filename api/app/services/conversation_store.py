"""In-memory conversation store for Phase 1 (no persistence yet).

Replaced by the Supabase-backed store in Phase 2. Kept behind a small interface so the turn
service does not care where conversations live.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from app.models.turn import Speaker


@dataclass
class Utterance:
    speaker: Speaker
    original_text: str
    original_lang: str
    translated_text: str | None = None
    translated_lang: str | None = None


@dataclass
class Conversation:
    id: str
    customer_id: str | None = None
    staff_lang: str = "en"
    customer_lang: str | None = None
    utterances: list[Utterance] = field(default_factory=list)


class ConversationStore:
    """Process-local conversation store. Not for production; Phase 2 swaps in Supabase."""

    def __init__(self) -> None:
        self._conversations: dict[str, Conversation] = {}

    def create(self, customer_id: str | None = None, staff_lang: str = "en") -> Conversation:
        conv = Conversation(id=str(uuid.uuid4()), customer_id=customer_id, staff_lang=staff_lang)
        self._conversations[conv.id] = conv
        return conv

    def get(self, conversation_id: str) -> Conversation | None:
        return self._conversations.get(conversation_id)

    def append(self, conversation_id: str, utterance: Utterance) -> None:
        self._conversations[conversation_id].utterances.append(utterance)


# Module-level singleton for Phase 1.
store = ConversationStore()
