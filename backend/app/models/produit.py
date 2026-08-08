from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin


class Produit(TimestampMixin, Base):
    """Produit du catalogue.

    Les caractéristiques techniques (couleur, contenance, dimensions...) ne
    sont PAS des colonnes ici : voir `ProduitCaracteristique` (système
    clé/valeur totalement libre, cf. Phase 4).
    """

    __tablename__ = "produits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nom: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False, index=True)

    famille_id: Mapped[int] = mapped_column(ForeignKey("familles.id", ondelete="RESTRICT"), nullable=False)
    famille: Mapped["Famille"] = relationship(back_populates="produits")

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prix: Mapped[float | None] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    marque: Mapped[str | None] = mapped_column(String(120), nullable=True)

    image_principale: Mapped[str | None] = mapped_column(String(500), nullable=True)

    en_vedette: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    en_promotion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    images: Mapped[list["ProduitImage"]] = relationship(
        back_populates="produit", cascade="all, delete-orphan", order_by="ProduitImage.ordre"
    )
    caracteristiques: Mapped[list["ProduitCaracteristique"]] = relationship(
        back_populates="produit", cascade="all, delete-orphan", order_by="ProduitCaracteristique.ordre"
    )

    def __repr__(self) -> str:
        return f"<Produit id={self.id} nom={self.nom!r} ref={self.reference!r}>"
