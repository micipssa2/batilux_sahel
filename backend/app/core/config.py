"""Configuration centralisée de l'application.

Toutes les valeurs sensibles/variables viennent du .env — jamais de valeur
en dur dans le code (12-factor). En Phase 2 on y ajoutera les paramètres
JWT/2FA/rate-limiting.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Application ---
    APP_NAME: str = "Batilux Sahel API"
    ENVIRONMENT: str = "development"  # development | production
    DEBUG: bool = True

    # --- Base de données ---
    DATABASE_URL: str = "postgresql+asyncpg://batilux:batilux@localhost:5432/batilux_sahel"
    # URL synchrone dédiée à Alembic (asyncpg n'est pas supporté par Alembic directement)
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://batilux:batilux@localhost:5432/batilux_sahel"

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # --- Upload (utilisé à partir de la Phase 4) ---
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    # --- Cloudinary (stockage des images familles/produits) ---
    # Récupérables dans le dashboard Cloudinary (cloudinary.com/console).
    # Ne jamais commiter de vraies valeurs : uniquement via .env (gitignored).
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # --- JWT ---
    # ⚠️ Valeur par défaut UNIQUEMENT pour le dev. En prod, générer avec :
    #    python -c "import secrets; print(secrets.token_urlsafe(64))"
    JWT_SECRET_KEY: str = "dev-insecure-secret-change-me-before-prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # --- Anti brute-force ---
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # --- 2FA ---
    TOTP_ISSUER_NAME: str = "Batilux Sahel"


@lru_cache
def get_settings() -> Settings:
    """Instance mise en cache — évite de reparser le .env à chaque appel."""
    return Settings()
