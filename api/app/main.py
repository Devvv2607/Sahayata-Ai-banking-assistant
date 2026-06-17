"""FastAPI application factory for Sahayata AI.

Wires up structured logging, a strict CORS allowlist, rate limiting, security headers, and
the health router. Feature routers (conversations, turns, memory, banking processes) are added
in later phases.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app import __version__
from app.config import Settings, get_settings
from app.logging_config import configure_logging
from app.routers import health

logger = logging.getLogger(__name__)

# Security headers applied to every response.
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach baseline security headers to all responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        for key, value in SECURITY_HEADERS.items():
            response.headers.setdefault(key, value)
        return response


def _validate_runtime_config(settings: Settings) -> None:
    """Fail fast on insecure production configuration."""
    if settings.is_production and "*" in settings.cors_origins:
        raise RuntimeError(
            "CORS wildcard '*' is not allowed in production. Set CORS_ALLOW_ORIGINS."
        )


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    _validate_runtime_config(settings)

    limiter = Limiter(key_func=get_remote_address)

    app = FastAPI(
        title="Sahayata AI API",
        version=__version__,
        description="AI orchestration backend for the bank branch voice copilot.",
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(health.router)

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        # Never leak internals to the client; log the detail server-side.
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    logger.info("Sahayata API started", extra={"environment": settings.app_env})
    return app


app = create_app()
