# Sahayata AI — Backend (`api/`)

FastAPI service that orchestrates speech, translation, and LLM providers for the bank branch
copilot. Deploys to GCP Cloud Run as a Docker image.

## Local development

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env               # fill in real values
python -m app                      # preferred on Windows (sets a psycopg-compatible loop)
# or: uvicorn app.main:app --reload --port 8000   (Linux/macOS)
```

> **Windows note:** psycopg's async pool cannot use the default ProactorEventLoop. Run the
> backend with `python -m app`, which selects a compatible SelectorEventLoop. On Linux/macOS
> (and Cloud Run) plain `uvicorn` is fine.

- Health check: <http://localhost:8000/health> · DB check: <http://localhost:8000/health/db>
- API docs (dev only): <http://localhost:8000/docs>

## Quality gates

```bash
ruff check .          # lint
ruff format --check . # formatting
bandit -c pyproject.toml -r app   # SAST
pip-audit             # dependency vulnerabilities
pytest                # tests
```

## Layout

```
app/
├── main.py          # app factory: CORS, rate limit, security headers, logging
├── config.py        # pydantic-settings (env-driven, no hardcoded secrets)
├── logging_config.py
├── routers/         # HTTP + WebSocket endpoints
├── services/        # business logic (turn pipeline, summaries, memory, sentiment)
├── providers/       # swappable STT/TTS/translation/LLM adapters (+ mocks)
├── models/          # Pydantic request/response schemas
└── db/              # Supabase client + queries
```

The provider layer keeps vendors (Sarvam, Google, Gemini) swappable via env toggles and
mockable in tests. See `../docs/architecture.md`.
