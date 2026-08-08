from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProduitImage(Base):
    """Image de la galerie secondaire d'un produit (réorganisable)."""

    __tablename__ = "produit_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    produit_id: Mapped[int] = mapped_column(
        ForeignKey("produits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    produit: Mapped["Produit"] = relationship(back_populates="images")

    url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    def __repr__(self) -> str:
        return f"<ProduitImage id={self.id} produit_id={self.produit_id}>"
