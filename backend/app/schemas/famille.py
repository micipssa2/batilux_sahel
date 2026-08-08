from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FamilleBase(BaseModel):
    nom: str = Field(min_length=1, max_length=150)
    description: str | None = None
    image: str | None = Field(default=None, max_length=500)
    ordre: int = 0
    actif: bool = True

    @field_validator("nom")
    @classmethod
    def _nom_non_vide(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Le nom ne peut pas être vide")
        return v


class FamilleCreate(FamilleBase):
    pass


class FamilleUpdate(BaseModel):
    """Tous les champs optionnels : seuls les champs fournis sont modifiés (PATCH-like)."""

    nom: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    image: str | None = Field(default=None, max_length=500)
    ordre: int | None = None
    actif: bool | None = None

    @field_validator("nom")
    @classmethod
    def _nom_non_vide(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("Le nom ne peut pas être vide")
        return v


class FamilleResponse(FamilleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    nb_produits: int | None = None  # renseigné uniquement par les routes admin
    created_at: datetime
    updated_at: datetime


class FamilleReorderItem(BaseModel):
    id: int
    ordre: int


class FamilleReorderRequest(BaseModel):
    items: list[FamilleReorderItem] = Field(min_length=1)
