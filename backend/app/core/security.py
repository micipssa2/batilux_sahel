"""Primitives cryptographiques de l'application.

Tout ce qui touche mots de passe / JWT / TOTP passe par ce module unique —
un seul endroit à auditer, aucune logique de sécurité dupliquée ailleurs.
"""
from __future__ import annotations

import base64
import hashlib
import io
import secrets
from datetime import datetime, timedelta, timezone
from enum import StrEnum

import jwt
import pyotp
import qrcode
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerifyMismatchError

from app.core.config import get_settings

settings = get_settings()
_password_hasher = PasswordHasher()


# --- Mots de passe & codes de secours (Argon2) ---
# Un code de secours a la même valeur qu'un mot de passe : même algorithme.

def hash_password(value: str) -> str:
    return _password_hasher.hash(value)


def verify_password(value: str, value_hash: str) -> bool:
    try:
        return _password_hasher.verify(value_hash, value)
    except (VerifyMismatchError, InvalidHash):
        return False


# --- JWT ---

class TokenPurpose(StrEnum):
    """Empêche qu'un token émis pour une étape (ex: setup 2FA) soit
    réutilisable pour une autre (ex: accès API) : le `purpose` est vérifié
    à chaque décodage.
    """

    ACCESS = "access"
    TOTP_SETUP = "totp_setup"
    TOTP_VERIFY = "totp_verify"


def _create_token(admin_id: int, purpose: TokenPurpose, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(admin_id),
        "purpose": purpose.value,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(admin_id: int) -> str:
    return _create_token(admin_id, TokenPurpose.ACCESS, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_totp_setup_token(admin_id: int) -> str:
    """Token intermédiaire : mot de passe validé, 2FA pas encore configurée."""
    return _create_token(admin_id, TokenPurpose.TOTP_SETUP, timedelta(minutes=10))


def create_totp_verify_token(admin_id: int) -> str:
    """Token intermédiaire : mot de passe validé, code TOTP/backup attendu."""
    return _create_token(admin_id, TokenPurpose.TOTP_VERIFY, timedelta(minutes=5))


def decode_token(token: str, expected_purpose: TokenPurpose) -> dict:
    """Décode et valide un JWT. Lève jwt.PyJWTError si invalide/expiré/mauvais purpose."""
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if payload.get("purpose") != expected_purpose.value:
        raise jwt.InvalidTokenError("Purpose de token invalide")
    return payload


# --- Refresh tokens ---
# Opaques (pas des JWT) : un JWT signé ne peut pas être révoqué individuellement
# sans registre côté serveur. Ici on stocke un hash SHA-256 en DB — la valeur
# brute a assez d'entropie (512 bits) pour ne pas nécessiter Argon2.

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# --- TOTP (RFC 6238) ---

def generate_totp_secret() -> str:
    return pyotp.random_base32()


def totp_provisioning_uri(secret: str, email: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name=settings.TOTP_ISSUER_NAME)


def verify_totp_code(secret: str, code: str) -> bool:
    # valid_window=1 tolère un décalage d'horloge de +/- 30s (usage réel des
    # authenticator apps), sans élargir la fenêtre au point de faciliter le brute-force.
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def generate_qr_code_data_uri(otpauth_uri: str) -> str:
    """Génère le QR code en mémoire, jamais écrit sur disque."""
    img = qrcode.make(otpauth_uri)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


# --- Codes de secours ---

def generate_backup_codes(count: int = 8) -> list[str]:
    return [f"{secrets.token_hex(4)}-{secrets.token_hex(4)}" for _ in range(count)]
