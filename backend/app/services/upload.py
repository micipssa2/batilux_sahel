"""Upload sécurisé des images (produits ET familles).

Défenses appliquées :
- whitelist stricte de Content-Type déclarés (ne suffit pas seul, cf. ci-dessous)
- le contenu réel doit être décodable comme image par Pillow — bloque un
  fichier exécutable/script simplement renommé en .jpg
- taille maximale (configurable via .env)
- nom de fichier TOUJOURS régénéré (uuid4) : jamais le nom fourni par le client
- ré-encodage complet en WEBP : supprime toute métadonnée EXIF, neutralise un
  contenu malveillant qui exploiterait un parseur d'image, et optimise le poids
- suppression protégée contre la traversée de chemin (path traversal)
"""
from __future__ import annotations

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_DIMENSION = 1600  # px, côté le plus long — au-delà, redimensionnement automatique


async def save_image(file: UploadFile, subdir: str) -> str:
    """Valide, optimise et sauvegarde une image. Retourne l'URL publique (/uploads/...)."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Type de fichier non autorisé (JPEG, PNG ou WEBP uniquement)"
        )

    raw = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Fichier trop volumineux (max {settings.MAX_UPLOAD_SIZE_MB} Mo)"
        )
    if len(raw) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Fichier vide")

    # Ne JAMAIS faire confiance au seul Content-Type déclaré par le client :
    # on vérifie que le contenu est réellement décodable comme une image.
    try:
        image = Image.open(io.BytesIO(raw))
        image.verify()
        image = Image.open(io.BytesIO(raw))  # verify() épuise le buffer, on rouvre pour le traitement
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Fichier image invalide ou corrompu")

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")

    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    filename = f"{uuid.uuid4().hex}.webp"
    upload_root = Path(settings.UPLOAD_DIR) / subdir
    upload_root.mkdir(parents=True, exist_ok=True)
    destination = upload_root / filename

    # Ré-encodage complet (pas une simple copie) : supprime l'EXIF résiduel
    # et neutralise tout contenu malveillant qui viserait un parseur d'image.
    image.save(destination, format="WEBP", quality=85, method=6)

    return f"/uploads/{subdir}/{filename}"


def delete_image(url: str | None) -> None:
    """Supprime le fichier correspondant à une URL /uploads/... si présent."""
    if not url or not url.startswith("/uploads/"):
        return

    relative = url.removeprefix("/uploads/")
    upload_root = Path(settings.UPLOAD_DIR).resolve()
    target = (upload_root / relative).resolve()

    # Défense en profondeur : même si l'URL stockée était corrompue, on
    # refuse de supprimer quoi que ce soit hors du dossier uploads.
    if not target.is_relative_to(upload_root):
        return
    target.unlink(missing_ok=True)
