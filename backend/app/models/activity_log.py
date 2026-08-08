from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ActivityLog(Base):
    """Journal d'activité. admin_user_id nullable + ON DELETE SET NULL : les
    entrées d'audit doivent survivre même si le compte lié disparaissait.
    """

    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    admin_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    admin_user: Mapped["AdminUser | None"] = relationship()

    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    resultat: Mapped[str] = mapped_column(String(20), nullable=False)  # "succes" | "echec"
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default="now()")

    def __repr__(self) -> str:
        return f"<ActivityLog action={self.action!r} resultat={self.resultat!r}>"
