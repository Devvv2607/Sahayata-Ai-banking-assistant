"""Local development entrypoint: ``python -m app``.

Sets a psycopg-compatible event loop policy on Windows *before* the server creates its loop,
then launches uvicorn. In production (Cloud Run / Linux) the Dockerfile invokes uvicorn
directly — this module is only for local convenience.
"""

from __future__ import annotations

import asyncio
import os
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn  # noqa: E402  (must follow the event-loop policy set above)


def main() -> None:
    # Drive the server inside our own loop. uvicorn.run()/Server.run() would call
    # setup_event_loop() and reset the Windows policy back to Proactor, which psycopg
    # cannot use; running serve() directly keeps the SelectorEventLoop chosen above.
    config = uvicorn.Config(
        "app.main:app",
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "8000")),
        loop="asyncio",
    )
    server = uvicorn.Server(config)
    asyncio.run(server.serve())


if __name__ == "__main__":
    main()
