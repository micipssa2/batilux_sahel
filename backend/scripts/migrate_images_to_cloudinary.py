"""Migre vers Cloudinary les images encore stockées localement (`/uploads/...`).

Script à lancer UNE FOIS après avoir renseigné les identifiants Cloudinary
dans `.env`, si la base contient déjà des familles/produits dont l'image a
été uploadée avant la bascule (ancien stockage local sur disque).

Les fichiers locaux ont déjà été validés/ré-encodés en WEBP lors de leur
upload initial : on les envoie donc tels quels à Cloudinary, sans repasser
par la validation Pillow (déjà faite).

Usage :
    python -m scripts.migrate_images_to_cloudinary
    python -m scripts.migrate_images_to_cloudinary --dry-run   # liste sans rien modifier
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import cloudinary.uploader  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.db.session import AsyncSessionLocal  # noqa: E402
from app.models.famille import Famille  # noqa: E402
from app.models.produit import Produit  # noqa: E402
from app.models.produit_image import ProduitImage  # noqa: E402
from app.services.upload import CLOUDINARY_ROOT_FOLDER  # noqa: E402

settings = get_settings()


def _upload_local_file(local_url: str, subdir: str) -> str | None:
    """Envoie un fichier déjà présent dans UPLOAD_DIR vers Cloudinary. Retourne la nouvelle URL, ou None si le fichier est introuvable."""
    relative = local_url.removeprefix("/uploads/")
    path = Path(settings.UPLOAD_DIR) / relative
    if not path.is_file():
        print(f"  ! fichier introuvable, ignoré : {path}")
        return None

    public_id = path.stem  # nom déjà en uuid4 hex, pas d'extension
    result = cloudinary.uploader.upload(
        str(path),
        folder=f"{CLOUDINARY_ROOT_FOLDER}/{subdir}",
        public_id=public_id,
        resource_type="image",
        overwrite=True,
        unique_filename=False,
        use_filename=False,
    )
    return result["secure_url"]


async def run(dry_run: bool) -> None:
    if not settings.CLOUDINARY_CLOUD_NAME:
        print("CLOUDINARY_CLOUD_NAME n'est pas configuré dans .env — abandon.", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        migrated = 0

        familles = (await db.scalars(select(Famille).where(Famille.image.like("/uploads/%")))).all()
        for f in familles:
            print(f"Famille #{f.id} ({f.nom}) : {f.image}")
            if dry_run:
                continue
            new_url = _upload_local_file(f.image, subdir=f"familles/{f.id}")
            if new_url:
                f.image = new_url
                migrated += 1
                print(f"  -> {new_url}")

        produits = (await db.scalars(select(Produit).where(Produit.image_principale.like("/uploads/%")))).all()
        for p in produits:
            print(f"Produit #{p.id} ({p.nom}) — image principale : {p.image_principale}")
            if dry_run:
                continue
            new_url = _upload_local_file(p.image_principale, subdir=f"produits/{p.id}")
            if new_url:
                p.image_principale = new_url
                migrated += 1
                print(f"  -> {new_url}")

        galerie = (await db.scalars(select(ProduitImage).where(ProduitImage.url.like("/uploads/%")))).all()
        for img in galerie:
            print(f"Image galerie #{img.id} (produit #{img.produit_id}) : {img.url}")
            if dry_run:
                continue
            new_url = _upload_local_file(img.url, subdir=f"produits/{img.produit_id}")
            if new_url:
                img.url = new_url
                migrated += 1
                print(f"  -> {new_url}")

        if dry_run:
            total = len(familles) + len(produits) + len(galerie)
            print(f"\n[dry-run] {total} image(s) à migrer. Relancer sans --dry-run pour appliquer.")
            return

        await db.commit()
        print(f"\n{migrated} image(s) migrée(s) vers Cloudinary et mise(s) à jour en base.")
        print("Les fichiers locaux dans uploads/ n'ont pas été supprimés (au cas où) — à nettoyer manuellement une fois vérifié.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Migre les images locales existantes vers Cloudinary.")
    parser.add_argument("--dry-run", action="store_true", help="Liste les images concernées sans rien modifier")
    args = parser.parse_args()
    asyncio.run(run(args.dry_run))


if __name__ == "__main__":
    main()
