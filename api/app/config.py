"""Application configuration, loaded from environment variables.

All settings are validated by pydantic-settings. Secrets are never hardcoded; they come from
the environment (local ``.env`` in dev, Secret Manager / Cloud Run env in production).
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_env: Literal["development", "production"] = "development"
    log_level: str = "INFO"
    cors_allow_origins: str = "http://localhost:3000"

    # --- Supabase (optional until Phase 2 so the scaffold runs without secrets) ---
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_audience: str = "authenticated"

    # --- Google Cloud / Vertex AI ---
    gcp_project_id: str | None = None
    gcp_location: str = "us-central1"
    gemini_model: str = "gemini-2.0-flash"
    gemini_summary_model: str = "gemini-2.0-pro"

    # --- Sarvam AI ---
    sarvam_api_key: str | None = None

    # --- Provider toggles ---
    speech_provider: Literal["sarvam", "google", "fake"] = "fake"
    translation_provider: Literal["sarvam", "gemini", "google", "fake"] = "fake"
    llm_provider: Literal["gemini", "fake"] = "fake"

    # --- Cost / safety guardrails ---
    max_audio_bytes: int = Field(default=5_242_880, gt=0)
    max_audio_seconds: int = Field(default=30, gt=0)
    rate_limit_turns: str = "20/minute"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origins(self) -> list[str]:
        """CORS origins as a list. A wildcard is rejected in production (see main.py)."""
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
