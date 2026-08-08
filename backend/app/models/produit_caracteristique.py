from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProduitCaracteristique(Base):
    """Caractéristique dynamique d'un produit (ex: "Couleur" -> "Blanc").

    Volontairement un simple couple (nom, valeur) sans table de définitions :
    l'admin tape le nom qu'il veut, aucun développement n'est nécessaire pour
    un nouveau type de produit (peinture, carrelage, outillage...).
    """

    __tablename__ = "produit_caracteristiques"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    produit_id: Mapped[int] = mapped_column(
        ForeignKey("produits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    produit: Mapped["Produit"] = relationship(back_populates="caracteristiques")

    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    valeur: Mapped[str] = mapped_column(String(255), nullable=False)
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    def __repr__(self) -> str:
        return f"<ProduitCaracteristique {self.nom!r}={self.valeur!r}>"
