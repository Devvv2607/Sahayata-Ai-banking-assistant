"""Supabase-backed :class:`ConversationGateway` (async psycopg).

Uses the shared connection pool. The backend connects with elevated privileges and enforces
branch scoping in the application layer (RLS is the database backstop for direct anon-key
clients). Until staff login is wired, conversations are attributed to the seeded demo staff.
"""

from __future__ import annotations

from psycopg.rows import dict_row

from app.db.database import get_pool
from app.models.turn import (
    ConversationDetail,
    ConversationListItem,
    Speaker,
    UtteranceOut,
)
from app.services.conversation_gateway import ConversationGateway

# Seeded demo identities (see supabase/seed.sql), used until auth links real staff/branch.
DEMO_STAFF_ID = "44444444-4444-4444-4444-444444444444"
DEMO_BRANCH_ID = "11111111-1111-1111-1111-111111111111"


class DbConversationGateway(ConversationGateway):
    """Implements the ConversationGateway protocol against Postgres."""

    async def create(self, customer_id: str | None = None) -> str:
        async with get_pool().connection() as conn:
            cur = await conn.execute(
                """
                insert into public.conversations (customer_id, staff_id, branch_id)
                values (%s, %s, %s) returning id
                """,
                (customer_id, DEMO_STAFF_ID, DEMO_BRANCH_ID),
            )
            row = await cur.fetchone()
            if row is None:  # pragma: no cover - insert ... returning always yields a row
                raise RuntimeError("Failed to create conversation.")
            return str(row[0])

    async def exists(self, conversation_id: str) -> bool:
        async with get_pool().connection() as conn:
            cur = await conn.execute(
                "select 1 from public.conversations where id = %s", (conversation_id,)
            )
            return (await cur.fetchone()) is not None

    async def customer_lang(self, conversation_id: str) -> str | None:
        async with get_pool().connection() as conn:
            cur = await conn.execute(
                """
                select original_lang from public.utterances
                where conversation_id = %s and speaker = 'customer'
                order by created_at desc limit 1
                """,
                (conversation_id,),
            )
            row = await cur.fetchone()
            return str(row[0]) if row else None

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
        async with get_pool().connection() as conn:
            await conn.execute(
                """
                insert into public.utterances
                  (conversation_id, speaker, original_text, original_lang,
                   translated_text, translated_lang, sentiment)
                values (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    conversation_id,
                    speaker.value,
                    original_text,
                    original_lang,
                    translated_text,
                    translated_lang,
                    sentiment,
                ),
            )

    async def set_meta(
        self, conversation_id: str, primary_intent: str, sentiment_label: str, escalated: bool
    ) -> None:
        async with get_pool().connection() as conn:
            await conn.execute(
                """
                update public.conversations
                set primary_intent = %s,
                    sentiment_label = %s,
                    escalated = escalated or %s
                where id = %s
                """,
                (primary_intent, sentiment_label, escalated, conversation_id),
            )

    async def get_detail(self, conversation_id: str) -> ConversationDetail | None:
        async with get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                select id, customer_id, started_at, ended_at, primary_intent,
                       sentiment_label, escalated
                from public.conversations where id = %s
                """,
                (conversation_id,),
            )
            conv = await cur.fetchone()
            if conv is None:
                return None
            await cur.execute(
                """
                select speaker, original_text, original_lang, translated_text,
                       translated_lang, sentiment, created_at
                from public.utterances
                where conversation_id = %s order by created_at asc
                """,
                (conversation_id,),
            )
            utterances = await cur.fetchall()
        return ConversationDetail(
            id=str(conv["id"]),
            customer_id=str(conv["customer_id"]) if conv["customer_id"] else None,
            started_at=conv["started_at"],
            ended_at=conv["ended_at"],
            primary_intent=conv["primary_intent"],
            sentiment_label=conv["sentiment_label"],
            escalated=conv["escalated"],
            utterances=[UtteranceOut(**u) for u in utterances],
        )

    async def list(self, branch_id: str | None = None) -> list[ConversationListItem]:
        async with get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                select c.id, c.customer_id, c.started_at, c.ended_at, c.primary_intent,
                       c.escalated, count(u.id) as utterance_count
                from public.conversations c
                left join public.utterances u on u.conversation_id = c.id
                where c.branch_id = %s
                group by c.id
                order by c.started_at desc
                """,
                (branch_id or DEMO_BRANCH_ID,),
            )
            rows = await cur.fetchall()
        return [
            ConversationListItem(
                id=str(r["id"]),
                customer_id=str(r["customer_id"]) if r["customer_id"] else None,
                started_at=r["started_at"],
                ended_at=r["ended_at"],
                primary_intent=r["primary_intent"],
                escalated=r["escalated"],
                utterance_count=r["utterance_count"],
            )
            for r in rows
        ]
