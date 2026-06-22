"""Conversation persistence abstraction.

The turn flow and dashboard depend only on :class:`ConversationGateway`. The in-memory
implementation here is used by the test suite and when no database is configured; the
Supabase-backed implementation lives in ``app.db.repository``.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime

from app.models.turn import (
    ConversationDetail,
    ConversationListItem,
    Speaker,
    UtteranceOut,
)


class ConversationGateway(ABC):
    @abstractmethod
    async def create(self, customer_id: str | None = None) -> str: ...

    @abstractmethod
    async def exists(self, conversation_id: str) -> bool: ...

    @abstractmethod
    async def customer_lang(self, conversation_id: str) -> str | None: ...

    @abstractmethod
    async def append(
        self,
        conversation_id: str,
        speaker: Speaker,
        original_text: str,
        original_lang: str,
        translated_text: str | None = None,
        translated_lang: str | None = None,
        sentiment: str | None = None,
    ) -> None: ...

    @abstractmethod
    async def set_meta(
        self, conversation_id: str, primary_intent: str, sentiment_label: str, escalated: bool
    ) -> None: ...

    @abstractmethod
    async def get_detail(self, conversation_id: str) -> ConversationDetail | None: ...

    @abstractmethod
    async def list(self, branch_id: str | None = None) -> list[ConversationListItem]: ...


# --- In-memory implementation ----------------------------------------------


@dataclass
class _Utterance:
    speaker: Speaker
    original_text: str
    original_lang: str
    translated_text: str | None
    translated_lang: str | None
    sentiment: str | None
    created_at: datetime


@dataclass
class _Conversation:
    id: str
    customer_id: str | None
    started_at: datetime
    ended_at: datetime | None = None
    primary_intent: str | None = None
    sentiment_label: str | None = None
    escalated: bool = False
    utterances: list[_Utterance] = field(default_factory=list)


class InMemoryConversationGateway(ConversationGateway):
    def __init__(self) -> None:
        self._data: dict[str, _Conversation] = {}

    async def create(self, customer_id: str | None = None) -> str:
        conv = _Conversation(
            id=str(uuid.uuid4()), customer_id=customer_id, started_at=datetime.now(UTC)
        )
        self._data[conv.id] = conv
        return conv.id

    async def exists(self, conversation_id: str) -> bool:
        return conversation_id in self._data

    async def customer_lang(self, conversation_id: str) -> str | None:
        conv = self._data.get(conversation_id)
        if conv is None:
            return None
        for utt in reversed(conv.utterances):
            if utt.speaker is Speaker.customer:
                return utt.original_lang
        return None

    async def append(
        self,
        conversation_id: str,
        speaker: Speaker,
        original_text: str,
        original_lang: str,
        translated_text: str | None = None,
        translated_lang: str | None = None,
        sentiment: str | None = None,
    ) -> None:
        self._data[conversation_id].utterances.append(
            _Utterance(
                speaker=speaker,
                original_text=original_text,
                original_lang=original_lang,
                translated_text=translated_text,
                translated_lang=translated_lang,
                sentiment=sentiment,
                created_at=datetime.now(UTC),
            )
        )

    async def set_meta(
        self, conversation_id: str, primary_intent: str, sentiment_label: str, escalated: bool
    ) -> None:
        conv = self._data[conversation_id]
        conv.primary_intent = primary_intent
        conv.sentiment_label = sentiment_label
        conv.escalated = conv.escalated or escalated

    async def get_detail(self, conversation_id: str) -> ConversationDetail | None:
        conv = self._data.get(conversation_id)
        if conv is None:
            return None
        return ConversationDetail(
            id=conv.id,
            customer_id=conv.customer_id,
            started_at=conv.started_at,
            ended_at=conv.ended_at,
            primary_intent=conv.primary_intent,
            sentiment_label=conv.sentiment_label,
            escalated=conv.escalated,
            utterances=[
                UtteranceOut(
                    speaker=u.speaker,
                    original_text=u.original_text,
                    original_lang=u.original_lang,
                    translated_text=u.translated_text,
                    translated_lang=u.translated_lang,
                    sentiment=u.sentiment,
                    created_at=u.created_at,
                )
                for u in conv.utterances
            ],
        )

    async def list(self, branch_id: str | None = None) -> list[ConversationListItem]:
        items = [
            ConversationListItem(
                id=c.id,
                customer_id=c.customer_id,
                started_at=c.started_at,
                ended_at=c.ended_at,
                primary_intent=c.primary_intent,
                escalated=c.escalated,
                utterance_count=len(c.utterances),
            )
            for c in self._data.values()
        ]
        items.sort(key=lambda i: i.started_at, reverse=True)
        return items


# Module-level singleton for the in-memory gateway (persists across requests in one process).
in_memory_gateway = InMemoryConversationGateway()


def get_conversation_gateway() -> ConversationGateway:
    """Return the DB-backed gateway when a database is configured, else the in-memory one."""
    from app.db import database

    if database.is_available():
        from app.db.repository import DbConversationGateway

        return DbConversationGateway()
    return in_memory_gateway
