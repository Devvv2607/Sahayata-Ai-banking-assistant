# Sahayata AI — Execution Plan (Day plan: 2026-06-22)

> **Objective for today:** push Sahayata AI as far as possible toward a **fully deployed,
> end-to-end product** — no skipped features. "Fast" here means *no wasted motion and tight
> feedback loops*, **not** cutting scope. Every step ends green (tests + security gates) and
> is committed in clean, conventional units to
> `github.com/Devvv2607/Sahayata-Ai-banking-assistant`.
>
> Phase detail & acceptance criteria live in `PROGRESS.md` and `SAHAYATA_AI_BUILD_BRIEF.md`.
> This file is the **ordered, do-it-now checklist**.

---

## Where we are
Phase 0 scaffold is **complete, validated, and pushed** (`origin/main` @ `d96652e`). The only
thing standing between us and a live thin-slice deploy is **credentials (PAUSE 1)**.

## Strategy: two tracks in parallel
To avoid idle time while you click through dashboards, we run two tracks:
- **Track A (you):** provision the 4 services, easiest-first. I give exact steps and wait.
- **Track B (me):** build feature code against **mock providers** (no secrets needed), so the
  moment a real key lands we flip a single env toggle and it's live.

---

## STEP-BY-STEP FLOW

### ▶ Step 1 — Credentials (PAUSE 1) — _Track A, you_
Set up in this order (easiest → most involved). Tell me as each is ready; secrets go in
`.env` / GitHub Secrets, **never** in chat.
- [ ] **1a. Supabase** — new project → copy `Project URL`, `anon key`, `service_role key`.
- [ ] **1b. Sarvam AI** — sign up → create free-tier `API key` (STT/TTS/translation).
- [ ] **1c. Vercel** — sign up → link to the GitHub repo (frontend auto-deploy).
- [ ] **1d. GCP / Vertex AI** — project + billing/credits → enable Vertex AI, Artifact
      Registry, Cloud Run → set up Workload Identity Federation for CI deploys.
      *(If billing gives pause, we temporarily use a Gemini AI Studio free key and add Vertex later.)*

### ▶ Step 2 — Phase 1 core voice loop (code) — _Track B, me, starts now_
Buildable entirely on mocks; wired to Sarvam once 1b lands.
- [ ] Provider interfaces: `SpeechProvider`, `TranslationProvider`, `LLMProvider` + `Fake*` mocks.
- [ ] `POST /conversations/{id}/turn/customer` — audio validation (type/size/duration/magic
      bytes) → STT + lang detect → translate → structured response.
- [ ] `POST /conversations/{id}/turn/staff` — translate → TTS → audio URL.
- [ ] `web/`: push-to-talk capture (MediaRecorder, keyboard-accessible) + live transcript UI.
- [ ] Sarvam adapters (`SarvamSpeechProvider`, `SarvamTranslationProvider`); flip env toggle.
- [ ] Tests for audio validation + turn pipeline (mock providers). **Verify green → commit.**

### ▶ Step 3 — Deploy the thin slice (Phase 0 acceptance) — _needs 1a, 1c, 1d_
- [ ] Apply Supabase migrations + seed to the hosted project.
- [ ] Deploy backend to Cloud Run; deploy frontend to Vercel; set all env vars.
- [ ] **Acceptance:** Vercel URL shows live Cloud Run `/health` "connected".

### ▶ Step 4 — Phase 2 persistence & dashboard — _needs 1a_
- [ ] Persist conversations + utterances each turn; Supabase Auth (staff login) + JWT verify
      + branch scoping + RLS live.
- [ ] Dashboard: list conversations, open one, full bilingual transcript.
- [ ] **Acceptance:** conversation re-openable after refresh; cross-branch access blocked.

### ▶ Step 5 — Phase 3 banking intelligence (F4+F10) — _needs 1d (or AI Studio key)_
- [ ] One structured Gemini call → intent + guidance + required docs, grounded in
      `banking_processes`. Intent badge + guidance panel + document checklist in UI.
- [ ] **Acceptance:** "open a savings account" → `account_opening` + correct checklist; tests
      cover JSON parsing with mocked LLM.

### ▶ Step 6 — Phase 4 summaries & memory (F7+F8)
- [ ] `POST /conversations/{id}/end` → bilingual summary + action items + docs persisted;
      upsert `customer_memory`; "Previously: …" card for returning customers.

### ▶ Step 7 — Phase 5 sentiment & escalation (F9) + polish
- [ ] Per-utterance sentiment; conversation escalation flag + visible alert; loading/error/
      empty states; mobile-responsive, large-text, high-contrast officer view.

### ▶ Step 8 — Phase 6 hardening, docs, demo, final deploy
- [ ] Service tests + frontend smoke test; cost guardrails verified; finalize
      `docs/demo-script.md`; README architecture diagram; final deploy runs the 3-min demo.

---

## Definition of done (whole project)
F1–F10 implemented, deployed, demoable on public URLs · CI green · backend service tests pass ·
README + PROGRESS + demo-script current · synthetic seed supports a 3-min demo across ≥3 Indian
languages · no secrets in repo · `.env.example` complete.

## Guardrails (every step)
Run the verify suite before every commit (backend: pytest+ruff+ruff format+bandit+mypy+pip-audit;
web: build+typecheck+lint). Conventional commits, push after each green step. Git/origin is the
source of truth (this tree lives under `Downloads` and has shown sync churn — commit early/often).
