"""Health-check router. This is the only unauthenticated endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.config import get_settings
from app.models.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness/readiness probe used by Cloud Run and the frontend connectivity check."""
    settings = get_settings()
    return HealthResponse(version=__version__, environment=settings.app_env)
