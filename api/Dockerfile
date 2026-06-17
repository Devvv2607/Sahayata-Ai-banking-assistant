# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Sahayata AI backend — production image for GCP Cloud Run.
# Multi-stage: build deps in a builder, run as a non-root user in a slim image.
# ---------------------------------------------------------------------------

FROM python:3.12-slim AS builder
WORKDIR /app

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY pyproject.toml ./
# Install only runtime dependencies into a venv we copy into the final image.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install .

# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime
WORKDIR /app

# Run as a non-root user.
RUN groupadd --system app && useradd --system --gid app --home /app appuser

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

COPY --from=builder /opt/venv /opt/venv
COPY app ./app

USER appuser
EXPOSE 8080

# Cloud Run sets $PORT; honor it.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
