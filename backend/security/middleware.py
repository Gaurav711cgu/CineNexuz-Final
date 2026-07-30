"""
CineNexus Security Headers & Trace ID Middleware Module (PART A)
Implements:
- OWASP Recommended Security Headers
- Request Trace/Correlation ID Middleware (X-Trace-ID)
"""
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds OWASP security hardening headers to every outgoing response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class TraceIDMiddleware(BaseHTTPMiddleware):
    """Binds request correlation trace ID to request context and headers."""

    async def dispatch(self, request: Request, call_next) -> Response:
        trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
        request.state.trace_id = trace_id
        response: Response = await call_next(request)
        response.headers["X-Trace-ID"] = trace_id
        return response
