"""Schemas for the health endpoint."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response body for ``GET /health``."""

    status: Literal["ok"] = "ok"
    service: str = "sahayata-api"
    version: str
    environment: str


class DbHealthResponse(BaseModel):
    """Response body for ``GET /health/db``."""

    database: Literal["connected", "unavailable", "disabled"]
