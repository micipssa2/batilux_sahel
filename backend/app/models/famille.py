from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Famille(TimestampMixin, Base):
    """Famille de produits (ex: Peinture, Revêtement de sol, Façade...).

    Entièrement gérée depuis l'admin — aucune famille n'est codée en dur
    côté backend ou frontend.
    """

    __tablename__ = "familles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nom: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    produits: Mapped[list["Produit"]] = relationship(
        back_populates="famille", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Famille id={self.id} nom={self.nom!r}>"
