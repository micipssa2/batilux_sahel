"""Génération de slugs uniques.

Utilisé par les familles (Phase 3) et les produits (Phase 4) : une seule
implémentation, pas de duplication de logique entre les deux CRUD.
"""
from __future__ import annotations

import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def slugify(value: str) -> str:
    """"Revêtement de Sol" -> "revetement-de-sol". Gère les accents français."""
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value or "item"


async def generate_unique_slug(db: AsyncSession, model, source: str, exclude_id: int | None = None) -> str:
    """Ajoute un suffixe -2, -3... si le slug de base est déjà pris.

    `model` doit exposer des colonnes `id` et `slug`. `exclude_id` sert lors
    d'une modification : on ignore la ligne elle-même dans la recherche de
    doublon.
    """
    base = slugify(source)
    slug = base
    suffix = 2
    while True:
        query = select(model.id).where(model.slug == slug)
        if exclude_id is not None:
            query = query.where(model.id != exclude_id)
        if await db.scalar(query) is None:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1
