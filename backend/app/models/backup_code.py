from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BackupCode(Base):
    """Code de secours 2FA (usage unique, en cas de perte du téléphone).

    Hashé avec le même algorithme que les mots de passe (Argon2) : un code
    de secours a la même valeur qu'un mot de passe côté sécurité.
    """

    __tablename__ = "backup_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    admin_user_id: Mapped[int] = mapped_column(
        ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    admin_user: Mapped["AdminUser"] = relationship()

    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default="now()")

    def __repr__(self) -> str:
        return f"<BackupCode id={self.id} used={self.used_at is not None}>"
