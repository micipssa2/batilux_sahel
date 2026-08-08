from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    admin_user_id: int | None
    admin_email: str | None = None  # peuplé via jointure ; None si admin supprimé ou email inconnu (échec login)
    action: str
    resultat: str
    ip_address: str
    user_agent: str | None
    details: str | None
    created_at: datetime


class PaginatedActivityLogs(BaseModel):
    items: list[ActivityLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
