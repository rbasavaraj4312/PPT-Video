"""A lightweight API host. Models only load in short-lived inference processes."""
import asyncio
from contextlib import asynccontextmanager
import os
import time

from fastapi import FastAPI

from .api import create_router
from .service import NarrationService


class IdleState:
    def __init__(self):
        self.last_activity = time.monotonic()
        self.active_requests = 0

    def expired(self, service, timeout):
        return timeout > 0 and self.active_requests == 0 and not service.busy() and time.monotonic() - self.last_activity >= timeout


class ActivityMiddleware:
    def __init__(self, app, state):
        self.app, self.state = app, state

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] == "/health":
            return await self.app(scope, receive, send)
        self.state.active_requests += 1
        self.state.last_activity = time.monotonic()
        try:
            await self.app(scope, receive, send)
        finally:
            self.state.active_requests -= 1
            self.state.last_activity = time.monotonic()


def create_app(service=None, idle_seconds=None, shutdown=None):
    state = IdleState()
    timeout = float(os.getenv("VOICE_SERVICE_IDLE_SECONDS", "60")) if idle_seconds is None else idle_seconds

    @asynccontextmanager
    async def lifespan(app):
        async def watch_idle():
            while True:
                await asyncio.sleep(min(5, max(.1, timeout / 2)))
                if app.state.narration.busy() or state.active_requests:
                    state.last_activity = time.monotonic()
                    continue
                if state.expired(app.state.narration, timeout):
                    callback = shutdown or getattr(app.state, "request_shutdown", None)
                    if callback:
                        callback()
                        return

        instance = service or NarrationService()
        app.state.narration = instance
        app.include_router(create_router(instance))
        state.last_activity = time.monotonic()
        watcher = asyncio.create_task(watch_idle()) if timeout > 0 else None
        try:
            yield
        finally:
            if watcher:
                watcher.cancel()
                try:
                    await watcher
                except asyncio.CancelledError:
                    pass
            await asyncio.to_thread(instance.close)

    app = FastAPI(title="On-demand Voice API", lifespan=lifespan)
    app.state.idle = state
    app.add_middleware(ActivityMiddleware, state=state)

    @app.get("/health")
    def health():
        instance = getattr(app.state, "narration", None)
        return {"status": "ok", "service": "voice", "busy": bool(state.active_requests or (instance and instance.busy())), "idle_seconds": timeout}

    return app
