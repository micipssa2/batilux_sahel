"""Upload sécurisé des images (produits ET familles) — stockage Cloudinary.

Défenses appliquées (inchangées depuis la version stockage local) :
- whitelist stricte de Content-Type déclarés (ne suffit pas seul, cf. ci-dessous)
- le contenu réel doit être décodable comme image par Pillow — bloque un
  fichier exécutable/script simplement renommé en .jpg
- taille maximale (configurable via .env)
- nom de fichier TOUJOURS régénéré (uuid4) : jamais le nom fourni par le client
- ré-encodage complet en WEBP : supprime toute métadonnée EXIF, neutralise un
  contenu malveillant qui exploiterait un parseur d'image, et optimise le poids

Le fichier validé/ré-encodé est ensuite envoyé à Cloudinary (jamais le
fichier brut du client) ; seule l'URL HTTPS sécurisée retournée par
Cloudinary est stockée en base (colonne `image` / `image_principale` / `url`,
déjà de type String — aucune migration nécessaire).
"""
from __future__ import annotations

import io
import logging
import re
import uuid

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_DIMENSION = 1600  # px, côté le plus long — au-delà, redimensionnement automatique

# Racine Cloudinary sous laquelle tout est rangé, pour ne jamais se mélanger
# avec un autre projet éventuellement hébergé sur le même compte.
CLOUDINARY_ROOT_FOLDER = "batilux-sahel"

# Extrait le public_id (chemin de dossier compris) d'une secure_url Cloudinary
# du type https://res.cloudinary.com/<cloud>/image/upload/v169.../folder/name.webp
_CLOUDINARY_URL_RE = re.compile(r"/upload/(?:v\d+/)?(?P<public_id_and_ext>.+)$")


async def save_image(file: UploadFile, subdir: str) -> str:
    """Valide, optimise et envoie une image sur Cloudinary. Retourne l'URL HTTPS sécurisée."""
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

    # Ré-encodage complet (pas une simple copie) : supprime l'EXIF résiduel
    # et neutralise tout contenu malveillant qui viserait un parseur d'image.
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=85, method=6)
    buffer.seek(0)

    public_id = uuid.uuid4().hex
    folder = f"{CLOUDINARY_ROOT_FOLDER}/{subdir}"

    try:
        result = cloudinary.uploader.upload(
            buffer,
            folder=folder,
            public_id=public_id,
            resource_type="image",
            overwrite=True,
            unique_filename=False,
            use_filename=False,
        )
    except CloudinaryError:
        logger.exception("Échec de l'upload Cloudinary (folder=%s)", folder)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "Échec de l'envoi de l'image vers le stockage distant"
        )

    return result["secure_url"]


def _extract_public_id(url: str) -> str | None:
    """Retrouve le public_id (avec dossier) à partir d'une secure_url Cloudinary."""
    match = _CLOUDINARY_URL_RE.search(url)
    if not match:
        return None
    public_id_and_ext = match.group("public_id_and_ext")
    public_id, _, _ext = public_id_and_ext.rpartition(".")
    return public_id or public_id_and_ext


def delete_image(url: str | None) -> None:
    """Supprime l'image Cloudinary correspondant à une secure_url, si possible.

    Best-effort : ne lève jamais d'exception (une image orpheline sur
    Cloudinary n'est jamais pire qu'une erreur 500 côté admin). Les anciennes
    URLs locales (`/uploads/...`, avant migration) sont ignorées silencieusement.
    """
    if not url or "res.cloudinary.com" not in url:
        return

    public_id = _extract_public_id(url)
    if not public_id:
        return

    try:
        cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
    except CloudinaryError:
        logger.exception("Échec de la suppression Cloudinary (public_id=%s)", public_id)
