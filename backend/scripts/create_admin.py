"""Crée l'unique compte administrateur, ou réinitialise son mot de passe
et/ou sa 2FA en cas de perte.

Volontairement un script à lancer à la main, hors API : il ne doit jamais
exister de route publique de création de compte, et la réinitialisation
d'urgence (perte du téléphone ET des backup codes) nécessite un accès
direct au serveur — jamais accessible depuis Internet.

Usage :
    python -m scripts.create_admin --email admin@batiluxsahel.com
    python -m scripts.create_admin --email admin@batiluxsahel.com --reset-password
    python -m scripts.create_admin --email admin@batiluxsahel.com --reset-2fa

Le mot de passe est demandé de façon masquée (getpass), jamais en argument
en clair (pour ne pas finir dans l'historique du shell).
"""
import argparse
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.db.session import AsyncSessionLocal  # noqa: E402
from app.models.admin_user import AdminUser  # noqa: E402


def _prompt_password() -> str:
    password = getpass.getpass("Mot de passe : ")
    confirm = getpass.getpass("Confirmer le mot de passe : ")
    if password != confirm:
        print("Les mots de passe ne correspondent pas.", file=sys.stderr)
        sys.exit(1)
    if len(password) < 12:
        print("Le mot de passe doit faire au moins 12 caractères.", file=sys.stderr)
        sys.exit(1)
    return password


async def run(email: str, reset_password: bool, reset_2fa: bool) -> None:
    async with AsyncSessionLocal() as db:
        admin = await db.scalar(select(AdminUser).where(AdminUser.email == email))

        if admin is None:
            admin = AdminUser(email=email, password_hash=hash_password(_prompt_password()))
            db.add(admin)
            await db.commit()
            print(f"Admin créé : {email}")
            return

        if not reset_password and not reset_2fa:
            print(f"Un admin existe déjà avec l'email {email!r}.")
            print("Utilisez --reset-password et/ou --reset-2fa pour le modifier.")
            return

        if reset_password:
            admin.password_hash = hash_password(_prompt_password())
            admin.failed_login_attempts = 0
            admin.locked_until = None
            print("Mot de passe réinitialisé.")

        if reset_2fa:
            admin.totp_secret = None
            admin.totp_enabled = False
            print("2FA réinitialisée — une nouvelle configuration (QR code) sera demandée à la prochaine connexion.")

        await db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Gestion du compte administrateur unique.")
    parser.add_argument("--email", required=True, help="Email de connexion de l'admin")
    parser.add_argument("--reset-password", action="store_true", help="Réinitialise le mot de passe")
    parser.add_argument("--reset-2fa", action="store_true", help="Désactive la 2FA (perte du téléphone)")
    args = parser.parse_args()

    asyncio.run(run(args.email, args.reset_password, args.reset_2fa))


if __name__ == "__main__":
    main()
