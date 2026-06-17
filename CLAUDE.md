# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

**Sahayata AI** — a staff-facing, multilingual **voice copilot for Indian bank
branch officers**. A customer speaks a regional language; the officer's screen
shows a live translated transcript, the detected **banking intent**, step-by-step
**process guidance**, **required documents**, and a **sentiment / escalation**
flag. The officer replies in their own language; the reply is translated and
**spoken back** to the customer. Sessions are summarized bilingually and stored,
and returning customers are recognized from saved memory.

> **Primary user:** the branch officer (operates the app).
> **Secondary beneficiary:** the customer (speaks/listens; never touches the UI).

This is a **demo / portfolio product**, not a production banking system. It uses
**only synthetic, seed data — never real PII** — but is built with privacy and
security as first-class concerns (see [`docs/security.md`](docs/security.md)).

The repo root still contains an **archived Vite prototype** (`src/`, `index.html`,
`package.json`, `vite.config.js`) preserved on the `archive/vite-prototype`
branch / commit `ff30ea6`. It is **not** part of Sahayata AI — do not build on it.

## Monorepo layout

```
api/                  # FastAPI backend (Python)      → GCP Cloud Run (Docker)
  app/{routers,services,providers,models,db}/
  tests/              # pytest
web/                  # Next.js (App Router, TS)       → Vercel
  app/  lib/
supabase/             # SQL migrations + seed data      (NOT YET CREATED)
.github/workflows/    # CI + deploy pipelines           (NOT YET CREATED)
docs/                 # architecture · security · demo-script
PROGRESS.md           # phase-by-phase build log — READ FIRST each session
README.md
```

## Tech stack

- **Backend:** Python ≥3.12, FastAPI, Pydantic v2 / pydantic-settings, slowapi
  (rate limiting), python-json-logger, httpx. Packaged via `pyproject.toml`
  (`sahayata-api`).
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4,
  zod for input validation.
- **Managed services:** Supabase (Postgres + Auth + RLS), Google **Gemini** via
  Vertex AI (reasoning), **Sarvam AI** (STT/TTS/translation; Google STT/TTS as a
  swappable fallback).
- **Provider abstraction:** all speech / translation / LLM calls go through
  interfaces in `api/app/providers/` (`SpeechProvider`, `TranslationProvider`,
  `LLMProvider`), swappable via `SPEECH_PROVIDER` / `TRANSLATION_PROVIDER` /
  `LLM_PROVIDER` env vars and mockable in tests. **Keep vendor SDK calls behind
  these interfaces — never call a vendor directly from a router.**

## Commands

### Backend (`api/`)
```bash
cd api
python -m venv .venv && .venv\Scripts\activate    # Windows; POSIX: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000          # http://localhost:8000/health
pytest -q                                          # tests
ruff check .                                       # lint (rules: E,F,I,B,UP,S,C4,SIM)
bandit -r app                                      # SAST
pip-audit                                          # dependency CVEs
mypy app                                           # strict type check
```

### Frontend (`web/`)
```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm run typecheck    # tsc --noEmit
```

**"Verify" before handing off a phase:** backend `pytest` + `ruff` + `bandit` +
`pip-audit` all clean; frontend `npm run build` + `typecheck` + `lint` clean.

## Conventions

- Backend code targets py3.12, `line-length = 100`, ruff with security (`S`)
  rules on, `mypy --strict`. Use `from __future__ import annotations`.
- Pydantic v2 models validate **all** inputs; audio uploads are size/type/
  duration-capped. Frontend validates with zod.
- Secrets come **only** from environment variables — never hard-code or commit a
  secret. Each app has a `.env.example`; real `.env*` files are gitignored.
- New endpoints: add a router under `api/app/routers/`, keep business logic in
  `services/`, vendor calls in `providers/`, and add pytest coverage with the
  fake providers.
- Frontend: server components by default; mark client components with
  `"use client"`. API calls go through `web/lib/api.ts`; env access through
  `web/lib/env.ts`.

## Security (read `docs/security.md` before touching auth/network/data code)

- Synthetic data only; pseudonymous customer keys (`phone_hash`), never real PII.
- Supabase **Row-Level Security** isolates each branch's data; branch scoping is
  enforced in **both** the API layer and Postgres RLS.
- Supabase JWT is verified in FastAPI middleware. CORS is a strict allowlist
  (`CORS_ALLOW_ORIGINS`); the app **fails fast** if a wildcard is set in
  production. Baseline security headers + rate limiting are applied in
  `api/app/main.py`. The global exception handler never leaks internals.
- Raw audio is **not** persisted by default — only transcripts.
- Run `pip-audit` (Python) and `npm audit` (web) after any dependency change.

## Working agreement for this repo

- **One phase per session.** Implement a single phase from `PROGRESS.md`, stop at
  its acceptance criteria, and let the maintainer review / test / deploy /
  commit. **Do not commit or push unless asked.**
- Update `PROGRESS.md` at the end of each phase (status, what changed, notes).
- Phases include explicit **PAUSE** points where the human must provision
  credentials (GCP/Vertex, Supabase, Sarvam, Vercel) before continuing. Stop and
  ask at those points.
- **Environment caution:** this repo currently lives under `C:\Users\Dev\Downloads`
  and has shown external file churn (the working tree was wiped and repopulated
  by a sync during a session). Treat **git as the source of truth**, avoid leaving
  important work uncommitted, and re-verify the tree state at the start of a
  session.
