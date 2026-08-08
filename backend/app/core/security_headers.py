"""En-têtes de sécurité HTTP appliqués à toutes les réponses.

Suit les recommandations OWASP Secure Headers. API pure (pas de HTML rendu
ici) : CSP volontairement très restrictive.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings

settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"  # anti-clickjacking
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), camera=(), microphone=(), payment=(), usb=()"
        )
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        if settings.ENVIRONMENT == "production":
            # HSTS : uniquement en prod (nécessite un vrai certificat HTTPS,
            # sinon on casse l'accès en dev/local).
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"

        return response
