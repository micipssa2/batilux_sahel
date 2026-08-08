"""CRUD Produits.

- Routes publiques : liste paginée/filtrée (actifs uniquement) + détail par slug.
- Routes admin (`/admin/produits/...`) : CRUD complet, caractéristiques
  dynamiques (remplacées en bloc à chaque update), galerie d'images.

La liste (publique ET admin) utilise un SELECT ciblé (pas l'ORM complet) pour
rester rapide même avec plusieurs milliers de produits : on ne charge jamais
la galerie/caractéristiques pour un simple listing.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_client_ip, get_current_admin
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.famille import Famille
from app.models.produit import Produit
from app.models.produit_caracteristique import ProduitCaracteristique
from app.models.produit_image import ProduitImage
from app.schemas.produit import (
    ImageReorderRequest,
    PaginatedProduits,
    ProduitCreate,
    ProduitImageResponse,
    ProduitListItem,
    ProduitResponse,
    ProduitUpdate,
)
from app.services.activity_log import log_activity
from app.services.slugify import generate_unique_slug
from app.services.upload import delete_image, save_image

router = APIRouter(tags=["produits"])


# --- Helpers partagés ---

def _build_filters(
    *,
    famille_id: int | None,
    marque: str | None,
    search: str | None,
    en_vedette: bool | None,
    en_promotion: bool | None,
    min_prix: float | None,
    max_prix: float | None,
) -> list:
    conditions = []
    if famille_id is not None:
        conditions.append(Produit.famille_id == famille_id)
    if marque:
        conditions.append(Produit.marque.ilike(f"%{marque}%"))
    if en_vedette is not None:
        conditions.append(Produit.en_vedette.is_(en_vedette))
    if en_promotion is not None:
        conditions.append(Produit.en_promotion.is_(en_promotion))
    if min_prix is not None:
        conditions.append(Produit.prix >= min_prix)
    if max_prix is not None:
        conditions.append(Produit.prix <= max_prix)
    if search:
        like = f"%{search}%"
        conditions.append(or_(Produit.nom.ilike(like), Produit.reference.ilike(like), Produit.marque.ilike(like)))
    return conditions


async def _paginated_list(db: AsyncSession, conditions: list, page: int, page_size: int) -> PaginatedProduits:
    base = select(
        Produit.id, Produit.nom, Produit.slug, Produit.reference, Produit.marque,
        Produit.prix, Produit.image_principale, Produit.en_vedette, Produit.en_promotion,
        Produit.actif, Produit.famille_id, Famille.nom.label("famille_nom"), Produit.updated_at,
    ).join(Famille, Famille.id == Produit.famille_id)
    if conditions:
        base = base.where(*conditions)

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0

    stmt = base.order_by(Produit.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).all()
    items = [ProduitListItem.model_validate(row._mapping) for row in rows]

    total_pages = max(1, -(-total // page_size))  # division entière arrondie au-dessus
    return PaginatedProduits(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


async def _get_produit_or_404(db: AsyncSession, produit_id: int) -> Produit:
    produit = await db.scalar(
        select(Produit)
        .options(selectinload(Produit.famille), selectinload(Produit.images), selectinload(Produit.caracteristiques))
        .where(Produit.id == produit_id)
    )
    if produit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produit introuvable")
    return produit


def _to_detail(produit: Produit) -> ProduitResponse:
    resp = ProduitResponse.model_validate(produit)
    return resp.model_copy(
        update={
            "famille_nom": produit.famille.nom if produit.famille else None,
            "famille_slug": produit.famille.slug if produit.famille else None,
        }
    )


async def _log(db, admin, request, action, details):
    await log_activity(
        db, admin_user_id=admin.id, action=action, resultat="succes",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"), details=details,
    )


# --- Public ---

@router.get("/produits", response_model=PaginatedProduits)
async def list_produits_public(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    famille_id: int | None = None,
    marque: str | None = None,
    search: str | None = None,
    en_vedette: bool | None = None,
    en_promotion: bool | None = None,
    min_prix: float | None = Query(default=None, ge=0),
    max_prix: float | None = Query(default=None, ge=0),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Produit.actif.is_(True)] + _build_filters(
        famille_id=famille_id, marque=marque, search=search, en_vedette=en_vedette,
        en_promotion=en_promotion, min_prix=min_prix, max_prix=max_prix,
    )
    return await _paginated_list(db, conditions, page, page_size)


@router.get("/produits/{slug}", response_model=ProduitResponse)
async def get_produit_public(slug: str, db: AsyncSession = Depends(get_db)):
    produit = await db.scalar(
        select(Produit)
        .options(selectinload(Produit.famille), selectinload(Produit.images), selectinload(Produit.caracteristiques))
        .where(Produit.slug == slug, Produit.actif.is_(True))
    )
    if produit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produit introuvable")
    return _to_detail(produit)


# --- Admin : CRUD ---

@router.get("/admin/produits", response_model=PaginatedProduits)
async def list_produits_admin(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    famille_id: int | None = None,
    marque: str | None = None,
    search: str | None = None,
    en_vedette: bool | None = None,
    en_promotion: bool | None = None,
    actif: bool | None = None,
    min_prix: float | None = Query(default=None, ge=0),
    max_prix: float | None = Query(default=None, ge=0),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    conditions = _build_filters(
        famille_id=famille_id, marque=marque, search=search, en_vedette=en_vedette,
        en_promotion=en_promotion, min_prix=min_prix, max_prix=max_prix,
    )
    if actif is not None:
        conditions.append(Produit.actif.is_(actif))
    return await _paginated_list(db, conditions, page, page_size)


@router.get("/admin/produits/{produit_id}", response_model=ProduitResponse)
async def get_produit_admin(
    produit_id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)
):
    return _to_detail(await _get_produit_or_404(db, produit_id))


@router.post("/admin/produits", response_model=ProduitResponse, status_code=status.HTTP_201_CREATED)
async def create_produit(
    payload: ProduitCreate,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if await db.get(Famille, payload.famille_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")

    slug = await generate_unique_slug(db, Produit, payload.nom)
    produit = Produit(
        nom=payload.nom, slug=slug, famille_id=payload.famille_id, description=payload.description,
        prix=payload.prix, reference=payload.reference, marque=payload.marque,
        en_vedette=payload.en_vedette, en_promotion=payload.en_promotion, actif=payload.actif,
        caracteristiques=[
            ProduitCaracteristique(nom=c.nom, valeur=c.valeur, ordre=i)
            for i, c in enumerate(payload.caracteristiques)
        ],
    )
    db.add(produit)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Une référence identique existe déjà")

    produit = await _get_produit_or_404(db, produit.id)
    await _log(db, admin, request, "produit_creation", f"produit #{produit.id} ({produit.nom})")
    return _to_detail(produit)


@router.put("/admin/produits/{produit_id}", response_model=ProduitResponse)
async def update_produit(
    produit_id: int,
    payload: ProduitUpdate,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    produit = await _get_produit_or_404(db, produit_id)

    data = payload.model_dump(exclude_unset=True, exclude={"caracteristiques"})
    if "famille_id" in data and await db.get(Famille, data["famille_id"]) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")
    if "nom" in data and data["nom"] != produit.nom:
        produit.slug = await generate_unique_slug(db, Produit, data["nom"], exclude_id=produit.id)
    for field, value in data.items():
        setattr(produit, field, value)

    if payload.caracteristiques is not None:
        produit.caracteristiques.clear()
        for i, c in enumerate(payload.caracteristiques):
            produit.caracteristiques.append(ProduitCaracteristique(nom=c.nom, valeur=c.valeur, ordre=i))

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Une référence identique existe déjà")

    produit = await _get_produit_or_404(db, produit_id)
    await _log(db, admin, request, "produit_modification", f"produit #{produit.id}")
    return _to_detail(produit)


@router.delete("/admin/produits/{produit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_produit(
    produit_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    produit = await _get_produit_or_404(db, produit_id)

    delete_image(produit.image_principale)
    for img in produit.images:
        delete_image(img.url)

    nom = produit.nom
    await db.delete(produit)
    await db.commit()
    await _log(db, admin, request, "produit_suppression", f"produit #{produit_id} ({nom})")


# --- Admin : images ---

@router.post("/admin/produits/{produit_id}/image-principale", response_model=ProduitResponse)
async def upload_image_principale(
    produit_id: int,
    request: Request,
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    produit = await _get_produit_or_404(db, produit_id)
    old_url = produit.image_principale

    new_url = await save_image(file, subdir=f"produits/{produit_id}")
    produit.image_principale = new_url
    await db.commit()
    delete_image(old_url)  # après le commit : si le commit échoue, l'ancien fichier reste valide

    produit = await _get_produit_or_404(db, produit_id)
    await _log(db, admin, request, "produit_modification", f"produit #{produit_id} : image principale mise à jour")
    return _to_detail(produit)


@router.delete("/admin/produits/{produit_id}/image-principale", response_model=ProduitResponse)
async def delete_image_principale(
    produit_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    produit = await _get_produit_or_404(db, produit_id)
    if produit.image_principale:
        delete_image(produit.image_principale)
        produit.image_principale = None
        await db.commit()
        produit = await _get_produit_or_404(db, produit_id)
    return _to_detail(produit)


@router.post(
    "/admin/produits/{produit_id}/images", response_model=ProduitImageResponse, status_code=status.HTTP_201_CREATED
)
async def add_gallery_image(
    produit_id: int,
    request: Request,
    file: UploadFile = File(...),
    alt_text: str | None = Form(default=None),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    produit = await _get_produit_or_404(db, produit_id)
    url = await save_image(file, subdir=f"produits/{produit_id}")

    max_ordre = max((img.ordre for img in produit.images), default=-1)
    image = ProduitImage(produit_id=produit_id, url=url, alt_text=alt_text, ordre=max_ordre + 1)
    db.add(image)
    await db.commit()
    await db.refresh(image)

    await _log(db, admin, request, "produit_modification", f"produit #{produit_id} : image galerie ajoutée")
    return ProduitImageResponse.model_validate(image)


@router.delete("/admin/produits/{produit_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_image(
    produit_id: int,
    image_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    image = await db.scalar(select(ProduitImage).where(ProduitImage.id == image_id, ProduitImage.produit_id == produit_id))
    if image is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image introuvable")
    delete_image(image.url)
    await db.delete(image)
    await db.commit()


@router.patch("/admin/produits/{produit_id}/images/reorder", response_model=list[ProduitImageResponse])
async def reorder_gallery_images(
    produit_id: int,
    payload: ImageReorderRequest,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    ids = [item.id for item in payload.items]
    result = await db.scalars(
        select(ProduitImage).where(ProduitImage.id.in_(ids), ProduitImage.produit_id == produit_id)
    )
    by_id = {img.id: img for img in result.all()}

    missing = set(ids) - set(by_id.keys())
    if missing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Image(s) introuvable(s) : {sorted(missing)}")

    for item in payload.items:
        by_id[item.id].ordre = item.ordre
    await db.commit()

    result = await db.scalars(
        select(ProduitImage).where(ProduitImage.produit_id == produit_id).order_by(ProduitImage.ordre)
    )
    return [ProduitImageResponse.model_validate(img) for img in result.all()]
