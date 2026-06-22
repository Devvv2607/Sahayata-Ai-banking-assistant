"""Health-check router. These are the only unauthenticated endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.config import get_settings
from app.db import database
from app.models.health import DbHealthResponse, HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness/readiness probe used by Cloud Run and the frontend connectivity check."""
    settings = get_settings()
    return HealthResponse(version=__version__, environment=settings.app_env)


@router.get("/health/db", response_model=DbHealthResponse)
async def health_db() -> DbHealthResponse:
    """Database connectivity probe. Reports 'connected', 'unavailable', or 'disabled'."""
    settings = get_settings()
    if not settings.supabase_db_url:
        return DbHealthResponse(database="disabled")
    connected = await database.check_connection()
    return DbHealthResponse(database="connected" if connected else "unavailable")
