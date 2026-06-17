# Sahayata AI — Build Progress

> Living log of the phased build. Read this at the start of every session.
> Spec / single source of truth: `SAHAYATA_AI_BUILD_BRIEF.md`.

---

## Current status: **Phase 0 — Scaffold & prove deployment** (in progress)

### Locked decisions
- **Repo:** old Vite prototype archived to branch `archive/vite-prototype`; `origin` repointed
  to `Devvv2607/Sahayata-Ai-banking-assistant`; old repo kept as the `legacy` remote.
- **Reasoning LLM:** Google **Gemini** via **Vertex AI** (intent, guidance, summary, sentiment).
- **Speech + translation:** **Sarvam AI** (Saarika STT, Bulbul TTS, Translate), free tier;
  Google STT/TTS wired as a swappable fallback behind the provider interface.
- **Cost posture:** free-tier-first; guardrails = Gemini Flash default, ~30s audio cap,
  rate limiting on AI endpoints, token/credit usage logging.

---

## Phase log

### Phase 0 — Scaffold & prove deployment
**Goal:** end-to-end thin slice — a deployed web page that calls the live backend `/health`
and shows "connected", with schema, CI, and docs in place.

- [x] Archive Vite prototype to `archive/vite-prototype`; repoint `origin` to new repo.
- [x] Salvage demo-script content + banking intents/documents from the old `mockData.js`.
- [x] Root config: `README.md`, `PROGRESS.md`, security-hardened `.gitignore`, `LICENSE`, `docs/`.
- [x] `api/` FastAPI scaffold: `/health`, settings, logging, CORS, Dockerfile, tests. *(verified 2026-06-17: pytest 2 passed, ruff/bandit/pip-audit clean)*
- [x] `web/` Next.js scaffold: landing page calling `/health` → shows connected status. *(present in working tree; `npm run build`/typecheck not yet re-verified — pending)*
- [ ] Supabase migrations (all tables + RLS) + `seed.sql` (7 banking processes, 2 customers).
- [ ] CI (`ci.yml`) + deploy (`deploy-api.yml`) + Dependabot.
- [ ] **PAUSE 1 — collect credentials** (GCP, Supabase, Vercel, Sarvam) then deploy.
- [ ] Acceptance: Vercel URL loads and shows live Cloud Run `/health` "connected".

### Phase 1 — Core voice loop — _not started_
### Phase 2 — Persistence & dashboard — _not started_
### Phase 3 — Banking intelligence (F4 + F10) — _not started_
### Phase 4 — Summaries & customer memory (F7 + F8) — _not started_
### Phase 5 — Sentiment & escalation (F9) + polish — _not started_
### Phase 6 — Hardening, docs, demo — _not started_

---

## Open items / waiting on the human
- **PAUSE 1 (end of Phase 0):** provision GCP project + Vertex AI/Gemini + service-account
  JSON; Supabase project (URL + anon + service-role keys); Sarvam AI API key (free tier);
  Vercel account linked to the repo; GitHub Actions secrets. See `README.md` → Prerequisites.
- **Commit the Phase 0 baseline (blocking):** the entire Sahayata scaffold (`api/`, `web/`,
  `docs/`, `README.md`, `PROGRESS.md`, `LICENSE`, hardened `.gitignore`) is currently
  **untracked** — it is not in any local commit, and `origin`
  (`Sahayata-Ai-banking-assistant`) is **empty**. `main`/HEAD still points at the old Vite
  prototype (`f7d6376`). This work exists only in the working tree and was nearly lost to a
  filesystem sync this session. Decide the git strategy (e.g. reset `main` to a fresh root
  commit, or commit the scaffold on top), commit, and push to `origin` to establish the
  canonical baseline before the next build session.

---

## Session log

### 2026-06-17 — Phase 0 audit & verification (Claude)
- **Did not touch feature code.** Verified the backend scaffold and added project docs.
- Ran the backend test + security suite from `api/`:
  `pytest` → **2 passed**; `ruff check .` → **all checks passed**;
  `bandit -r app` → **no issues**; `pip-audit` → **no known vulnerabilities**.
- Added `CLAUDE.md` (project guide / conventions / security / working agreement).
- Updated this file (Phase 0 checklist + this log).
- **Findings / risks surfaced for the maintainer:**
  - `origin` is an **empty** repo; nothing to sync from. The scaffold is uncommitted (see
    "Commit the Phase 0 baseline" above) — highest priority.
  - The repo lives under `C:\Users\Dev\Downloads` and showed external file churn (the tree
    was transiently wiped and repopulated by a sync mid-session). Recommend moving the repo
    out of `Downloads` and committing early/often.
  - `web/` build + typecheck/lint not yet re-verified this session.
- **Not started (remaining Phase 0 build items, before PAUSE 1):** `supabase/` migrations +
  seed, and `.github/workflows/` (CI + deploy + Dependabot). Deferred until the baseline is
  committed so these land as a clean, reviewable diff.
