"""Flux d'authentification.

Connexion en 2 étapes, jamais de session émise avant que les DEUX facteurs
soient validés :

  1. POST /login          email + mot de passe -> pre_auth_token
  2. POST /2fa/setup      (1ère fois seulement) affiche QR + backup codes
     POST /2fa/confirm    valide le 1er code TOTP -> active la 2FA + session
     OU
     POST /2fa/verify     code TOTP (ou backup code) -> session

Le refresh token est un cookie HttpOnly (jamais accessible en JS), avec
rotation à chaque utilisation : l'ancien est révoqué, un nouveau est émis.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_admin, require_totp_setup, require_totp_verify
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_totp_setup_token,
    create_totp_verify_token,
    generate_backup_codes,
    generate_qr_code_data_uri,
    generate_refresh_token,
    generate_totp_secret,
    hash_password,
    hash_refresh_token,
    totp_provisioning_uri,
    verify_password,
    verify_totp_code,
)
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.backup_code import BackupCode
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    LoginRequest,
    LoginStepResponse,
    MeResponse,
    TOTPConfirmRequest,
    TOTPSetupResponse,
    TOTPVerifyRequest,
    TokenResponse,
)
from app.services.activity_log import log_activity

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",  # exige HTTPS en prod
        samesite="strict",  # protection CSRF de base : le cookie ne part jamais en cross-site
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path=REFRESH_COOKIE_PATH,
    )


def _is_locked(admin: AdminUser) -> bool:
    return admin.locked_until is not None and admin.locked_until > datetime.now(timezone.utc)


async def _register_failure(db: AsyncSession, admin: AdminUser) -> None:
    admin.failed_login_attempts += 1
    if admin.failed_login_attempts >= settings.LOGIN_MAX_ATTEMPTS:
        admin.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    await db.commit()


async def _register_success(db: AsyncSession, admin: AdminUser) -> None:
    admin.failed_login_attempts = 0
    admin.locked_until = None
    await db.commit()


async def _issue_session(db: AsyncSession, admin: AdminUser, request: Request, response: Response) -> TokenResponse:
    raw_refresh = generate_refresh_token()
    db.add(
        RefreshToken(
            admin_user_id=admin.id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    )
    await db.commit()

    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(
        access_token=create_access_token(admin.id),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def _replace_backup_codes(db: AsyncSession, admin_id: int) -> list[str]:
    plain_codes = generate_backup_codes()
    await db.execute(delete(BackupCode).where(BackupCode.admin_user_id == admin_id))
    for code in plain_codes:
        db.add(BackupCode(admin_user_id=admin_id, code_hash=hash_password(code)))
    await db.commit()
    return plain_codes


@router.post("/login", response_model=LoginStepResponse)
@limiter.limit("10/minute")
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    generic_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Identifiants invalides")

    admin = await db.scalar(select(AdminUser).where(AdminUser.email == payload.email))

    if admin is None:
        # Message générique volontaire : ne jamais révéler si l'email existe.
        await log_activity(
            db, admin_user_id=None, action="login", resultat="echec",
            ip_address=ip, user_agent=ua, details="email inconnu",
        )
        raise generic_error

    if not admin.actif:
        await log_activity(db, admin_user_id=admin.id, action="login", resultat="echec",
                            ip_address=ip, user_agent=ua, details="compte désactivé")
        raise generic_error

    if _is_locked(admin):
        await log_activity(db, admin_user_id=admin.id, action="login", resultat="echec",
                            ip_address=ip, user_agent=ua, details="compte verrouillé")
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                             "Compte temporairement verrouillé suite à trop de tentatives")

    if not verify_password(payload.password, admin.password_hash):
        await _register_failure(db, admin)
        await log_activity(db, admin_user_id=admin.id, action="login", resultat="echec",
                            ip_address=ip, user_agent=ua, details="mot de passe incorrect")
        raise generic_error

    # Mot de passe correct : le compteur d'échecs n'est remis à zéro qu'une
    # fois le 2e facteur validé (sinon un mot de passe volé suffirait à
    # repousser indéfiniment le verrouillage).
    await log_activity(db, admin_user_id=admin.id, action="login_password", resultat="succes",
                        ip_address=ip, user_agent=ua)

    if not admin.totp_enabled:
        return LoginStepResponse(requires_totp_setup=True, pre_auth_token=create_totp_setup_token(admin.id))
    return LoginStepResponse(requires_totp_setup=False, pre_auth_token=create_totp_verify_token(admin.id))


@router.post("/2fa/setup", response_model=TOTPSetupResponse)
async def totp_setup(admin: AdminUser = Depends(require_totp_setup), db: AsyncSession = Depends(get_db)):
    if admin.totp_enabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La 2FA est déjà activée")

    # Régénérer un secret à chaque appel est volontaire : permet de relancer
    # le scan si le 1er a échoué, sans rester bloqué avec un secret perdu.
    secret = generate_totp_secret()
    admin.totp_secret = secret
    await db.commit()

    qr = generate_qr_code_data_uri(totp_provisioning_uri(secret, admin.email))
    backup_codes = await _replace_backup_codes(db, admin.id)

    return TOTPSetupResponse(secret=secret, qr_code_data_uri=qr, backup_codes=backup_codes)


@router.post("/2fa/confirm", response_model=TokenResponse)
@limiter.limit("10/minute")
async def totp_confirm(
    payload: TOTPConfirmRequest,
    request: Request,
    response: Response,
    admin: AdminUser = Depends(require_totp_setup),
    db: AsyncSession = Depends(get_db),
):
    ip, ua = get_client_ip(request), request.headers.get("user-agent")

    if not admin.totp_secret or not verify_totp_code(admin.totp_secret, payload.code):
        await log_activity(db, admin_user_id=admin.id, action="2fa_setup", resultat="echec",
                            ip_address=ip, user_agent=ua)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Code invalide")

    admin.totp_enabled = True
    await _register_success(db, admin)
    await log_activity(db, admin_user_id=admin.id, action="2fa_setup", resultat="succes",
                        ip_address=ip, user_agent=ua)

    return await _issue_session(db, admin, request, response)


@router.post("/2fa/verify", response_model=TokenResponse)
@limiter.limit("10/minute")
async def totp_verify(
    payload: TOTPVerifyRequest,
    request: Request,
    response: Response,
    admin: AdminUser = Depends(require_totp_verify),
    db: AsyncSession = Depends(get_db),
):
    ip, ua = get_client_ip(request), request.headers.get("user-agent")

    if _is_locked(admin):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                             "Compte temporairement verrouillé suite à trop de tentatives")

    ok, used_backup = False, False

    if payload.code and admin.totp_secret and verify_totp_code(admin.totp_secret, payload.code):
        ok = True
    elif payload.backup_code:
        candidates = await db.scalars(
            select(BackupCode).where(BackupCode.admin_user_id == admin.id, BackupCode.used_at.is_(None))
        )
        for candidate in candidates:
            if verify_password(payload.backup_code, candidate.code_hash):
                candidate.used_at = datetime.now(timezone.utc)
                ok, used_backup = True, True
                break

    if not ok:
        await _register_failure(db, admin)
        await log_activity(db, admin_user_id=admin.id, action="2fa_verify", resultat="echec",
                            ip_address=ip, user_agent=ua)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Code invalide")

    await _register_success(db, admin)
    await log_activity(db, admin_user_id=admin.id, action="2fa_verify", resultat="succes",
                        ip_address=ip, user_agent=ua,
                        details="via backup code" if used_backup else None, commit=False)
    await log_activity(db, admin_user_id=admin.id, action="login", resultat="succes",
                        ip_address=ip, user_agent=ua)

    return await _issue_session(db, admin, request, response)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    ip, ua = get_client_ip(request), request.headers.get("user-agent")
    invalid = HTTPException(status.HTTP_401_UNAUTHORIZED, "Session invalide, reconnectez-vous")

    if not refresh_token:
        raise invalid

    row = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(refresh_token)))

    if row is None or row.revoked_at is not None or row.expires_at < datetime.now(timezone.utc):
        # Un refresh token révoqué/inconnu réutilisé = signal de vol possible.
        await log_activity(db, admin_user_id=row.admin_user_id if row else None, action="token_refresh",
                            resultat="echec", ip_address=ip, user_agent=ua)
        response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
        raise invalid

    admin = await db.get(AdminUser, row.admin_user_id)
    if admin is None or not admin.actif:
        raise invalid

    # Rotation : l'ancien token est révoqué, un nouveau est émis.
    row.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    await log_activity(db, admin_user_id=admin.id, action="token_refresh", resultat="succes",
                        ip_address=ip, user_agent=ua)

    return await _issue_session(db, admin, request, response)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        row = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(refresh_token)))
        if row is not None:
            row.revoked_at = datetime.now(timezone.utc)
            await db.commit()

    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
    await log_activity(db, admin_user_id=admin.id, action="logout", resultat="succes",
                        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"))
    return {"detail": "Déconnecté"}


@router.get("/me", response_model=MeResponse)
async def me(admin: AdminUser = Depends(get_current_admin)):
    return MeResponse(id=admin.id, email=admin.email, totp_enabled=admin.totp_enabled)


@router.post("/2fa/backup-codes/regenerate", response_model=list[str])
async def regenerate_backup_codes(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    """Invalide tous les anciens codes de secours et en émet 8 nouveaux."""
    return await _replace_backup_codes(db, admin.id)
