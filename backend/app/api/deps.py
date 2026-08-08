"""Dépendances FastAPI réutilisables par toutes les routes protégées."""
from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenPurpose, decode_token
from app.db.session import get_db
from app.models.admin_user import AdminUser

bearer_scheme = HTTPBearer(auto_error=False)


def get_client_ip(request: Request) -> str:
    """IP du client. En prod derrière un reverse-proxy, adapter pour lire
    X-Forwarded-For — mais UNIQUEMENT si la requête vient d'un proxy de
    confiance connu, jamais en faisant confiance à ce header venant
    directement d'un client (trivialement falsifiable).
    """
    if request.client:
        return request.client.host
    return "unknown"


def _require_token(purpose: TokenPurpose):
    """Fabrique une dépendance qui exige un JWT valide avec le `purpose` donné.

    Utilisé pour distinguer un token d'accès complet (ACCESS) d'un token
    intermédiaire de connexion (TOTP_SETUP / TOTP_VERIFY) — un token
    intermédiaire ne doit jamais donner accès aux routes protégées.
    """

    async def dependency(
        credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
        db: AsyncSession = Depends(get_db),
    ) -> AdminUser:
        if credentials is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise")
        try:
            payload = decode_token(credentials.credentials, purpose)
        except jwt.PyJWTError:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalide ou expiré")

        admin = await db.get(AdminUser, int(payload["sub"]))
        if admin is None or not admin.actif:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Compte inexistant ou désactivé")
        return admin

    return dependency


get_current_admin = _require_token(TokenPurpose.ACCESS)
require_totp_setup = _require_token(TokenPurpose.TOTP_SETUP)
require_totp_verify = _require_token(TokenPurpose.TOTP_VERIFY)
