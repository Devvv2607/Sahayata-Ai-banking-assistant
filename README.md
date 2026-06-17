<div align="center">

# 🪔 Sahayata AI

### An AI-powered, multilingual voice copilot for Indian bank branch desks

*Breaking the language barrier between rural customers and frontline banking officers.*

[![CI](https://github.com/Devvv2607/Sahayata-Ai-banking-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/Devvv2607/Sahayata-Ai-banking-assistant/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-Phase%200%20%E2%80%94%20scaffold-orange)

</div>

---

## The problem

At Indian public-sector bank branches, customers frequently speak a regional language the
frontline officer does not. This causes delays, errors, and the exclusion of rural,
less-literate, and differently-abled customers. Generic translation tools fail because they
do not understand banking terminology, processes, or required documents.

## The product

A **staff-facing web copilot** that sits on the branch officer's screen:

- The **customer speaks** in their language (Hindi, Marathi, Tamil, Gujarati, …).
- The officer sees a **live translated transcript**, the customer's detected **banking intent**
  (account opening, loan enquiry, complaint, …), **step-by-step process guidance**, the
  **required documents**, and a **sentiment / escalation flag**.
- The officer **replies** in their own language; the reply is translated and **spoken back**
  to the customer.
- Every interaction is **summarized bilingually** and stored, and **returning customers** are
  recognized with a memory of past visits.

> **Primary user:** the branch officer (operates the app).
> **Secondary beneficiary:** the customer (speaks/listens; never touches the UI).

This is a **demo / portfolio product**, not a production banking system. It uses **only
synthetic, seed data** — never real PII — but is architected with privacy and security as
first-class concerns (see [`docs/security.md`](docs/security.md)).

---

## Architecture

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js (App Router) · React · TypeScript · Tailwind | Vercel |
| Backend / AI orchestration | Python · FastAPI | GCP Cloud Run |
| Database · Auth · RLS | Supabase (Postgres) | Supabase Cloud |
| Reasoning LLM (intent, guidance, summary, sentiment) | Google **Gemini** via Vertex AI | GCP |
| Speech-to-text · Text-to-speech · Translation | **Sarvam AI** (Saarika / Bulbul / Translate) — Google STT/TTS as swappable fallback | Sarvam / GCP |
| CI/CD | GitHub Actions | GitHub |

All speech / translation / LLM calls go through a **provider interface**
(`SpeechProvider`, `TranslationProvider`, `LLMProvider`) so vendors are swappable without
touching feature code, and are mockable in tests.

```
sahayata-ai/
├── web/                  # Next.js frontend            → Vercel
├── api/                  # FastAPI backend (Docker)    → GCP Cloud Run
│   └── app/{routers,services,providers,models,db}/
├── supabase/             # SQL migrations + seed data
├── .github/workflows/    # CI + deploy pipelines
├── docs/                 # architecture · security · demo-script
├── PROGRESS.md           # phase-by-phase build log
└── README.md
```

See [`docs/architecture.md`](docs/architecture.md) for the full design and AI pipeline.

---

## Run locally

> Prerequisites: Node 20+, Python 3.12+, Docker, and a Supabase project. See
> [Prerequisites & secrets](#prerequisites--secrets) for the accounts/keys you must provide.

### Backend (`api/`)

```bash
cd api
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env               # fill in real values
uvicorn app.main:app --reload --port 8000
# health check: http://localhost:8000/health
```

### Frontend (`web/`)

```bash
cd web
npm install
cp .env.example .env.local         # fill in real values
npm run dev
# app: http://localhost:3000
```

---

## Prerequisites & secrets

You (the human) must provision these accounts/keys. The app reads **everything** from
environment variables — **no secret is ever committed**. See each app's `.env.example`.

| Service | What you provide | Used by |
|---|---|---|
| **Supabase** | Project URL, anon key, service-role key | web + api |
| **GCP** | Project ID + service-account JSON; enable Vertex AI / Gemini (and Cloud STT/TTS as fallback) | api |
| **Sarvam AI** | API key (free tier) for STT / TTS / translation | api |
| **Vercel** | Account linked to this GitHub repo | frontend deploy |
| **GitHub Actions** | Secrets mirroring the backend set, for CI/deploy | CI/CD |

---

## Privacy & security at a glance

- Synthetic data only; pseudonymous customer keys (`phone_hash`), never real PII.
- Row-Level Security isolates each branch's data in Postgres.
- Raw audio is **not** persisted by default — only transcripts.
- All input validated (Pydantic v2 on the backend, zod on the frontend); audio uploads are
  size/type/duration-capped.
- Secrets live only in environment / secret managers; CI runs secret-scanning and SAST.

Full details: [`docs/security.md`](docs/security.md).

---

## Project status

Built phase-by-phase — see [`PROGRESS.md`](PROGRESS.md) for the current state.

## License

MIT — see [`LICENSE`](LICENSE).
