from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


# --- Caractéristiques dynamiques ---
# Volontairement pas de champ `ordre` en entrée : l'ordre est déterminé par
# la position dans la liste envoyée (plus simple côté frontend qu'un champ à
# gérer manuellement).

class ProduitCaracteristiqueIn(BaseModel):
    nom: str = Field(min_length=1, max_length=100)
    valeur: str = Field(min_length=1, max_length=255)

    @field_validator("nom", "valeur")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Ce champ ne peut pas être vide")
        return v


class ProduitCaracteristiqueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nom: str
    valeur: str
    ordre: int


# --- Images ---

class ProduitImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    alt_text: str | None = None
    ordre: int


class ImageReorderItem(BaseModel):
    id: int
    ordre: int


class ImageReorderRequest(BaseModel):
    items: list[ImageReorderItem] = Field(min_length=1)


# --- Produit ---

class ProduitBase(BaseModel):
    nom: str = Field(min_length=1, max_length=200)
    description: str | None = None
    prix: float | None = Field(default=None, ge=0)
    reference: str = Field(min_length=1, max_length=100)
    marque: str | None = Field(default=None, max_length=120)
    en_vedette: bool = False
    en_promotion: bool = False
    actif: bool = True

    @field_validator("nom", "reference")
    @classmethod
    def _strip_required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Ce champ ne peut pas être vide")
        return v


class ProduitCreate(ProduitBase):
    famille_id: int
    caracteristiques: list[ProduitCaracteristiqueIn] = Field(default_factory=list)


class ProduitUpdate(BaseModel):
    """Tous les champs optionnels. `caracteristiques`, si fourni, REMPLACE
    entièrement la liste existante (pas de fusion partielle)."""

    nom: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    prix: float | None = Field(default=None, ge=0)
    reference: str | None = Field(default=None, min_length=1, max_length=100)
    marque: str | None = Field(default=None, max_length=120)
    famille_id: int | None = None
    en_vedette: bool | None = None
    en_promotion: bool | None = None
    actif: bool | None = None
    caracteristiques: list[ProduitCaracteristiqueIn] | None = None

    @field_validator("nom", "reference")
    @classmethod
    def _strip_optional(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("Ce champ ne peut pas être vide")
        return v


class ProduitResponse(ProduitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    famille_id: int
    famille_nom: str | None = None
    famille_slug: str | None = None
    image_principale: str | None = None
    images: list[ProduitImageResponse] = Field(default_factory=list)
    caracteristiques: list[ProduitCaracteristiqueResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ProduitListItem(BaseModel):
    """Version allégée pour les listes paginées (pas de galerie/caractéristiques,
    pas de description) — évite de sur-charger la requête sur un catalogue de
    plusieurs milliers de produits.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    slug: str
    reference: str
    marque: str | None
    prix: float | None
    image_principale: str | None
    en_vedette: bool
    en_promotion: bool
    actif: bool
    famille_id: int
    famille_nom: str | None = None
    updated_at: datetime


class PaginatedProduits(BaseModel):
    items: list[ProduitListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
