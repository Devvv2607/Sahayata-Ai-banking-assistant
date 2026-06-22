"""Async Postgres connection pool for the Supabase database.

The pool is opened on app startup (FastAPI lifespan) only when ``SUPABASE_DB_URL`` is set, so
the app and the test suite run fine with no database configured. Feature code acquires
connections via :func:`get_pool`.
"""

from __future__ import annotations

import logging

from psycopg_pool import AsyncConnectionPool

from app.config import get_settings

logger = logging.getLogger(__name__)

_pool: AsyncConnectionPool | None = None


async def open_pool() -> None:
    """Open the global connection pool if a database URL is configured."""
    global _pool
    if _pool is not None:
        return
    settings = get_settings()
    if not settings.supabase_db_url:
        logger.info("SUPABASE_DB_URL not set; database features disabled.")
        return
    _pool = AsyncConnectionPool(
        settings.supabase_db_url, min_size=1, max_size=5, open=False, timeout=15
    )
    # Non-blocking: do not fail/hang startup if the DB is briefly unreachable. Connections
    # are established lazily; /health/db reports the live status.
    await _pool.open(wait=False)
    logger.info("Database connection pool initialized.")


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed.")


def get_pool() -> AsyncConnectionPool:
    """Return the open pool, or raise if the database is not configured."""
    if _pool is None:
        raise RuntimeError("Database pool is not available (SUPABASE_DB_URL not set).")
    return _pool


async def check_connection() -> bool:
    """Lightweight connectivity probe used by the health endpoint."""
    if _pool is None:
        return False
    try:
        async with _pool.connection() as conn:
            await conn.execute("select 1")
        return True
    except Exception:  # noqa: BLE001 - health probe must never raise
        logger.warning("Database connectivity check failed.", exc_info=True)
        return False
