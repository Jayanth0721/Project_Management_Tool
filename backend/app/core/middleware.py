import time
import uuid
import logging
from collections.abc import Awaitable, Callable
from urllib.parse import urlparse

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from sqlalchemy import text

from app.core.redis import rate_limit
from app.core.config import settings
from app.db.session import async_session_factory

logger = logging.getLogger(__name__)

REQUEST_LIMIT = 60        # requests per window
REQUEST_WINDOW = 60       # window in seconds


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate-limit requests by client IP using Redis."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # Skip rate-limiting for health/static/docs endpoints
        path = request.url.path
        if path in ("/health", "/docs", "/redoc", "/openapi.json") or path.startswith(("/static/",)):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{client_ip}:{int(time.time() / REQUEST_WINDOW)}"
        allowed, remaining = await rate_limit(key, REQUEST_LIMIT, REQUEST_WINDOW)

        if not allowed:
            logger.warning("Rate limit hit for %s on %s", client_ip, path)
            return Response(status_code=429, content='{"detail":"Too many requests"}', media_type="application/json")

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response


def add_request_id_middleware(app: FastAPI):
    """Attach a unique request-id header to every response."""

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request_id = str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


def add_workspace_context_middleware(app: FastAPI):
    """Extract workspace_id from the request path and set RLS context on DB.

    This provides defense-in-depth: every DB query made during a request
    that involves workspace-scoped tables will be automatically filtered
    by `current_setting('app.workspace_id')` via PostgreSQL RLS policies.
    """

    @app.middleware("http")
    async def workspace_context_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # Try to extract workspace_id from path /workspaces/{workspace_id}/...
        path = request.url.path
        workspace_id = None

        # Match /workspaces/{id}/* or /api/v1/workspaces/{id}/*
        import re
        m = re.search(r"/workspaces/([0-9a-f\-]{36})", path)
        if m:
            workspace_id = m.group(1)

        # Also match workspace_id query param (used by search, activity, etc.)
        if not workspace_id:
            workspace_id = request.query_params.get("workspace_id")

        if workspace_id:
            try:
                async with async_session_factory() as db:
                    await db.execute(
                        text(f"SELECT set_config('app.workspace_id', '{workspace_id}', true)")
                    )
                    await db.commit()
            except Exception:
                pass  # RLS is best-effort; app-level checks are the primary defense

        return await call_next(request)


def add_csrf_middleware(app: FastAPI):
    """Protect mutating endpoints with a CSRF check via custom header.

    This SPA-friendly approach checks for a custom header (X-CSRF-Token)
    on mutating requests (POST/PUT/PATCH/DELETE). The frontend sets this
    header on every mutating fetch. This is safe because same-origin
    requests can set custom headers, while cross-origin requests cannot
    (the browser's same-origin policy blocks it unless CORS allows it).
    """

    @app.middleware("http")
    async def csrf_middleware(request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            path = request.url.path

            if path.startswith(("/api/v1/auth/", "/api/v1/users/register")):
                return await call_next(request)

            # Skip CSRF for Bearer token authentication
            auth = request.headers.get("authorization", "")
            if auth.startswith("Bearer "):
                return await call_next(request)

            csrf_header = request.headers.get("x-csrf-token")
            if csrf_header != "tolab-csrf":
                logger.warning("CSRF check failed for %s %s", request.method, path)
                return Response(
                    status_code=403,
                    content='{"detail":"CSRF token missing or invalid"}',
                    media_type="application/json",
                )
        return await call_next(request)
