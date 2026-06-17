# Sahayata AI — Architecture

## Overview

Sahayata AI is a staff-facing copilot for bank branch officers. It is a two-tier application
plus managed services:

```
            ┌──────────────────────────────────────────────────────────┐
            │                     Branch officer                        │
            │              (operates the web copilot)                   │
            └───────────────────────────┬──────────────────────────────┘
                                         │  HTTPS (Supabase JWT)
                          ┌──────────────▼───────────────┐
                          │   web/  Next.js (App Router)  │   → Vercel
                          │   TypeScript · Tailwind · zod │
                          └──────────────┬───────────────┘
                                         │  REST (multipart audio + JSON)
                          ┌──────────────▼───────────────┐
                          │   api/  FastAPI (Python)      │   → GCP Cloud Run
                          │   Pydantic v2 · JWT middleware│
                          │   CORS allowlist · rate limit │
                          └───┬───────────┬───────────┬───┘
                              │           │           │
             ┌────────────────▼──┐  ┌─────▼──────┐  ┌─▼──────────────────┐
             │ providers/        │  │ Supabase   │  │ Vertex AI / Gemini │
             │  SpeechProvider   │  │ Postgres   │  │ (intent, guidance, │
             │  → Sarvam (Google │  │ + Auth     │  │  summary, sentiment)│
             │    fallback)      │  │ + RLS      │  └────────────────────┘
             │  TranslationProv. │  └────────────┘
             │  LLMProvider      │
             └───────────────────┘
```

## Provider abstraction

All speech, translation, and LLM calls go through interfaces in `api/app/providers/`, so any
vendor can be swapped via environment toggles without touching feature code, and every
provider is replaceable with a deterministic mock in tests.

| Interface | Primary impl | Fallback / mock |
|---|---|---|
| `SpeechProvider` (`transcribe`, `synthesize`) | Sarvam (Saarika STT, Bulbul TTS) | Google Cloud STT/TTS · `FakeSpeechProvider` |
| `TranslationProvider` (`translate`) | Sarvam Translate | Gemini / Google Translate · `FakeTranslationProvider` |
| `LLMProvider` (`analyze_turn`, `summarize`) | Gemini (Vertex AI; Flash default, Pro for summaries) | `FakeLLMProvider` |

Selected via `SPEECH_PROVIDER`, `TRANSLATION_PROVIDER`, `LLM_PROVIDER` env vars.

## AI pipeline (turn-based MVP)

**Per customer turn**
1. Officer holds push-to-talk; browser records audio (MediaRecorder) → POSTs the blob.
2. **STT** transcribes + detects language → `original_text`, `original_lang`.
3. **Translate** → the staff's preferred language.
4. **One structured Gemini call** returns
   `{ intent, confidence, sentiment, escalate, suggested_guidance[], required_documents[] }`,
   grounded with the matching `banking_processes` row.
5. Persist the utterance; return everything to the officer's dashboard.

**Per staff turn**
6. Officer types/speaks a reply in their language.
7. Translate → customer language → **TTS** → audio URL; browser plays it.
8. Persist the utterance.

**On session end**
9. Gemini generates a **bilingual summary** + `action_items` + `documents_required`.
10. Upsert `customer_memory` (append key facts, set `last_visit_summary`, bump `visit_count`).

**Returning customer (F8):** when a session starts for a known `customer_id`, the officer is
shown a "Previously: …" card from `customer_memory`.

## Data model

Postgres (Supabase) with Row-Level Security; staff only see their own branch. See
`supabase/migrations/` for the authoritative schema. Tables: `branches`, `staff`,
`customers`, `conversations`, `utterances`, `summaries`, `customer_memory`,
`banking_processes`.

## API contract

FastAPI; Supabase JWT verified in middleware; branch scoping enforced in both the API layer
and Postgres RLS. Endpoints (see `SAHAYATA_AI_BUILD_BRIEF.md` §6):
`POST /conversations`, `POST /conversations/{id}/turn/customer`,
`POST /conversations/{id}/turn/staff`, `POST /conversations/{id}/end`,
`GET /conversations/{id}`, `GET /conversations?branch_id=`,
`GET /customers/{id}/memory`, `GET /banking-processes`, `GET /health`.

## Deployment

- **Frontend** → Vercel (auto-deploy on push to `main`).
- **Backend** → GCP Cloud Run via `deploy-api.yml` (Docker → Artifact Registry → Cloud Run).
- **Database** → Supabase cloud; migrations applied via the Supabase CLI / SQL.
