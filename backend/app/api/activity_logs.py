"""Lecture du journal d'activité (écrit par toutes les autres routes admin
via app/services/activity_log.py). Lecture seule — jamais de modification ni
de suppression d'une entrée d'audit depuis l'API.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.activity_log import ActivityLog
from app.models.admin_user import AdminUser
from app.schemas.activity_log import ActivityLogResponse, PaginatedActivityLogs

router = APIRouter(tags=["activity-logs"])


@router.get("/admin/activity-logs", response_model=PaginatedActivityLogs)
async def list_activity_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
    action: str | None = None,
    resultat: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    conditions = []
    if action:
        conditions.append(ActivityLog.action == action)
    if resultat:
        conditions.append(ActivityLog.resultat == resultat)
    if date_from:
        conditions.append(ActivityLog.created_at >= date_from)
    if date_to:
        conditions.append(ActivityLog.created_at <= date_to)

    base = select(ActivityLog, AdminUser.email).outerjoin(AdminUser, AdminUser.id == ActivityLog.admin_user_id)
    if conditions:
        base = base.where(*conditions)

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0

    stmt = base.order_by(ActivityLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).all()

    items = []
    for log, email in rows:
        resp = ActivityLogResponse.model_validate(log)
        items.append(resp.model_copy(update={"admin_email": email}))

    total_pages = max(1, -(-total // page_size))
    return PaginatedActivityLogs(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)
