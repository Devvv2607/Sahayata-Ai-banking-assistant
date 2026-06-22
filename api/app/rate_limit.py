"""Shared rate limiter instance (slowapi).

Defined in its own module so both the app factory and feature routers can import the same
limiter. The per-route limit string comes from settings (``RATE_LIMIT_TURNS``).
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

limiter = Limiter(key_func=get_remote_address)

# Resolved once at import; applied as a decorator on the AI/turn endpoints.
TURN_RATE_LIMIT = get_settings().rate_limit_turns
