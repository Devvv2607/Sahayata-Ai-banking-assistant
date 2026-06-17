# Sahayata AI — Security & Privacy

Security and privacy are first-class, designed in from Phase 0 — not bolted on. This document
is the reference for the controls in place and the threat model they address.

## Privacy by design

- **Synthetic data only.** No real customer PII is ever requested or stored. Demo customers
  are seeded; production-grade KYC and core-banking integration are explicitly out of scope.
- **Pseudonymous keys.** Customers are looked up by `phone_hash` (a hashed, synthetic key),
  never by a raw phone number or name.
- **No raw audio retention.** Audio blobs are processed for STT in-memory and discarded;
  only transcripts are persisted (opt-in retention behind an explicit flag only).
- **Tenant isolation.** Postgres Row-Level Security ensures a staff member can only ever read
  or write their own branch's rows — enforced at the database, independent of app logic.

## Input validation (every boundary)

- **Backend:** every request/response is a Pydantic v2 model with strict types and
  `extra="forbid"`; no untyped dict access of client input.
- **Frontend:** zod schemas validate all form input and parse all API responses before they
  enter application state.
- **Audio uploads:** content-type allowlist (`audio/webm`, `audio/wav`, `audio/ogg`),
  max size (~5 MB), max duration (~30 s), and magic-byte verification (not just the declared
  MIME type). Violations are rejected with `413`/`415`.

## Authentication & authorization

- Supabase issues JWTs on staff login. The FastAPI layer verifies each token's signature
  (against Supabase JWKS), expiry, and audience in middleware; only `/health` is public.
- **Branch scoping is enforced twice:** (1) the API derives `branch_id` from the
  authenticated staff record and never trusts a client-supplied branch; (2) Postgres RLS is
  the backstop so even a buggy or compromised API cannot cross branches.
- The Supabase **service-role key** is used only by the backend and is never shipped to the
  browser. The frontend uses the **anon key** only.

## Secrets management

- All secrets come from environment variables / secret managers. `.env.example` files document
  the shape; real `.env` files are git-ignored and never committed.
- Service-account JSON, Supabase keys, and the Sarvam key live in GCP Secret Manager /
  Cloud Run env and GitHub Actions secrets.
- CI runs **gitleaks** to block any secret from being merged; a pre-commit hook does the same
  locally.

## Network & transport

- **CORS** is an explicit allowlist (Vercel domain(s) + localhost dev) — never `*`.
- **Rate limiting** on the AI/turn endpoints (per-staff, per-IP) caps both abuse and cost.
- Security headers (CSP, HSTS, `X-Content-Type-Options`) on frontend responses.

## Supply chain & SAST (CI gates, must be green to merge)

- **Bandit** (Python SAST) and ESLint security rules.
- **pip-audit** (Python deps) and **npm audit** (web deps); Dependabot enabled.
- **gitleaks** secret scanning.

## Cost as a safety control

Runaway model usage is treated as a reliability/abuse risk: Gemini Flash by default, audio
length caps, rate limiting, and token/credit usage logging keep spend within free tiers and
make anomalies visible.

## Reliability / graceful degradation

If a provider fails (e.g. TTS), the app still returns and displays text — the officer is never
fully blocked by a single downstream outage.
