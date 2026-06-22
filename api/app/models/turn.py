"""Domain and API schemas for the conversation turn pipeline.

These models are the contract between the routers, the turn service, and the providers.
All are strict Pydantic v2 models (``extra='forbid'``) so malformed data is rejected early.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Speaker(StrEnum):
    customer = "customer"
    staff = "staff"


class Sentiment(StrEnum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


# --- Provider result models -----------------------------------------------


class TranscriptionResult(_Strict):
    """Output of speech-to-text."""

    text: str
    language: str = Field(description="BCP-47-ish language code detected, e.g. 'hi', 'mr'.")
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class SynthesisResult(_Strict):
    """Output of text-to-speech."""

    audio_base64: str = Field(description="Base64-encoded audio payload.")
    mime_type: str = "audio/wav"


class TurnAnalysis(_Strict):
    """Structured LLM analysis of a customer utterance (intent, guidance, docs, sentiment)."""

    intent: str
    confidence: float = Field(ge=0.0, le=1.0)
    sentiment: Sentiment = Sentiment.neutral
    escalate: bool = False
    suggested_guidance: list[str] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)


class BankingProcess(_Strict):
    """A seeded banking process (knowledge base entry) used for guidance and grounding."""

    intent_key: str
    display_name: str
    required_documents: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


# --- API request/response schemas ------------------------------------------


class StartConversationRequest(_Strict):
    customer_id: str | None = None
    branch_id: str | None = None


class StartConversationResponse(_Strict):
    conversation_id: str
    customer_id: str | None = None


class CustomerTurnResponse(_Strict):
    """Returned to the officer dashboard after a customer turn."""

    original_text: str
    original_lang: str
    translated_text: str
    translated_lang: str
    analysis: TurnAnalysis


class StaffTurnRequest(_Strict):
    text: str = Field(min_length=1, max_length=2000)
    lang: str = Field(min_length=2, max_length=12)


class StaffTurnResponse(_Strict):
    translated_text: str
    translated_lang: str
    audio_base64: str | None = Field(
        default=None, description="TTS audio; null if synthesis failed (graceful degradation)."
    )


# --- Dashboard read models -------------------------------------------------


class UtteranceOut(_Strict):
    speaker: Speaker
    original_text: str
    original_lang: str
    translated_text: str | None = None
    translated_lang: str | None = None
    sentiment: str | None = None
    created_at: datetime


class ConversationListItem(_Strict):
    id: str
    customer_id: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
    primary_intent: str | None = None
    escalated: bool = False
    utterance_count: int = 0


class ConversationDetail(_Strict):
    id: str
    customer_id: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
    primary_intent: str | None = None
    sentiment_label: str | None = None
    escalated: bool = False
    utterances: list[UtteranceOut] = Field(default_factory=list)
