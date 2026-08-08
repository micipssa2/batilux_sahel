from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import activity_logs, auth, familles, health, produits
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.security_headers import SecurityHeadersMiddleware
from app.db import base_all  # noqa: F401  — importe TOUS les modèles avant toute requête,
# indispensable pour que SQLAlchemy résolve les relations inter-fichiers
# (ex: Produit -> "ProduitImage") au moment de leur première utilisation.

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Ordre : CORS d'abord (doit voir toutes les requêtes, y compris préflight
# OPTIONS), puis les headers de sécurité sur la réponse finale.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,  # requis pour que le cookie refresh_token soit envoyé
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(familles.router, prefix="/api")
app.include_router(produits.router, prefix="/api")
app.include_router(activity_logs.router, prefix="/api")

# Fichiers uploadés (images produits) — servis tels quels, jamais exécutés.
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Les routers des phases suivantes (import Excel...) viendront s'ajouter ici
# au fur et à mesure — un router par domaine métier.
