"""Journalisation des actions sensibles (connexion, CRUD, import...).

Un seul point d'entrée `log_activity`, appelé par toutes les routes qui
doivent laisser une trace d'audit. Garde `app/api/*` centré sur la logique
métier plutôt que sur le détail de l'écriture en DB.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog


async def log_activity(
    db: AsyncSession,
    *,
    admin_user_id: int | None,
    action: str,
    resultat: str,
    ip_address: str,
    user_agent: str | None,
    details: str | None = None,
    commit: bool = True,
) -> None:
    db.add(
        ActivityLog(
            admin_user_id=admin_user_id,
            action=action,
            resultat=resultat,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
    )
    if commit:
        await db.commit()
