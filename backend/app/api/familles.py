"""CRUD Familles (catégories de produits).

- Routes publiques : familles actives triées par ordre — pour le catalogue
  public (Phase 5).
- Routes admin (`/admin/familles/...`) : CRUD complet + réorganisation,
  protégées par JWT (Depends(get_current_admin)).
"""
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_admin
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.famille import Famille
from app.models.produit import Produit
from app.schemas.famille import (
    FamilleCreate,
    FamilleReorderRequest,
    FamilleResponse,
    FamilleUpdate,
)
from app.services.activity_log import log_activity
from app.services.slugify import generate_unique_slug
from app.services.upload import delete_image, save_image

router = APIRouter(tags=["familles"])


def _to_response(famille: Famille, nb_produits: int | None = None) -> FamilleResponse:
    resp = FamilleResponse.model_validate(famille)
    return resp.model_copy(update={"nb_produits": nb_produits})


async def _counts_by_famille(db: AsyncSession) -> dict[int, int]:
    result = await db.execute(select(Produit.famille_id, func.count(Produit.id)).group_by(Produit.famille_id))
    return dict(result.all())


# --- Public ---

@router.get("/familles", response_model=list[FamilleResponse])
async def list_familles_public(db: AsyncSession = Depends(get_db)):
    """Familles actives, triées par ordre d'affichage."""
    result = await db.scalars(select(Famille).where(Famille.actif.is_(True)).order_by(Famille.ordre, Famille.nom))
    return [_to_response(f) for f in result.all()]


@router.get("/familles/{slug}", response_model=FamilleResponse)
async def get_famille_public(slug: str, db: AsyncSession = Depends(get_db)):
    famille = await db.scalar(select(Famille).where(Famille.slug == slug, Famille.actif.is_(True)))
    if famille is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")
    return _to_response(famille)


# --- Admin ---

@router.get("/admin/familles", response_model=list[FamilleResponse])
async def list_familles_admin(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toutes les familles (actives ET inactives) — pour l'interface d'administration."""
    result = await db.scalars(select(Famille).order_by(Famille.ordre, Famille.nom))
    familles = result.all()
    counts = await _counts_by_famille(db)
    return [_to_response(f, counts.get(f.id, 0)) for f in familles]


@router.get("/admin/familles/{famille_id}", response_model=FamilleResponse)
async def get_famille_admin(
    famille_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    famille = await db.get(Famille, famille_id)
    if famille is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")
    count = await db.scalar(select(func.count(Produit.id)).where(Produit.famille_id == famille_id))
    return _to_response(famille, count or 0)


@router.post("/admin/familles", response_model=FamilleResponse, status_code=status.HTTP_201_CREATED)
async def create_famille(
    payload: FamilleCreate,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    slug = await generate_unique_slug(db, Famille, payload.nom)
    famille = Famille(
        nom=payload.nom,
        slug=slug,
        description=payload.description,
        image=payload.image,
        ordre=payload.ordre,
        actif=payload.actif,
    )
    db.add(famille)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Une famille avec ce nom existe déjà")
    await db.refresh(famille)

    await log_activity(
        db, admin_user_id=admin.id, action="famille_creation", resultat="succes",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"),
        details=f"famille #{famille.id} ({famille.nom})",
    )
    return _to_response(famille, 0)


@router.put("/admin/familles/{famille_id}", response_model=FamilleResponse)
async def update_famille(
    famille_id: int,
    payload: FamilleUpdate,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    famille = await db.get(Famille, famille_id)
    if famille is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")

    data = payload.model_dump(exclude_unset=True)
    if "nom" in data and data["nom"] != famille.nom:
        famille.slug = await generate_unique_slug(db, Famille, data["nom"], exclude_id=famille.id)
    for field, value in data.items():
        setattr(famille, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Une famille avec ce nom existe déjà")
    await db.refresh(famille)

    await log_activity(
        db, admin_user_id=admin.id, action="famille_modification", resultat="succes",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"),
        details=f"famille #{famille.id}",
    )
    count = await db.scalar(select(func.count(Produit.id)).where(Produit.famille_id == famille.id))
    return _to_response(famille, count or 0)


@router.delete("/admin/familles/{famille_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_famille(
    famille_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    famille = await db.get(Famille, famille_id)
    if famille is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")

    count = await db.scalar(select(func.count(Produit.id)).where(Produit.famille_id == famille_id))
    if count:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Impossible de supprimer : {count} produit(s) rattaché(s) à cette famille",
        )

    nom = famille.nom
    delete_image(famille.image)
    await db.delete(famille)
    await db.commit()

    await log_activity(
        db, admin_user_id=admin.id, action="famille_suppression", resultat="succes",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"),
        details=f"famille #{famille_id} ({nom})",
    )


@router.post("/admin/familles/{famille_id}/image", response_model=FamilleResponse)
async def upload_famille_image(
    famille_id: int,
    request: Request,
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    famille = await db.get(Famille, famille_id)
    if famille is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")

    old_url = famille.image
    new_url = await save_image(file, subdir=f"familles/{famille_id}")
    famille.image = new_url
    await db.commit()
    delete_image(old_url)  # après le commit : si le commit échoue, l'ancien fichier reste valide
    await db.refresh(famille)

    await log_activity(
        db, admin_user_id=admin.id, action="famille_modification", resultat="succes",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"),
        details=f"famille #{famille_id} : image mise à jour",
    )
    count = await db.scalar(select(func.count(Produit.id)).where(Produit.famille_id == famille_id))
    return _to_response(famille, count or 0)


@router.delete("/admin/familles/{famille_id}/image", response_model=FamilleResponse)
async def delete_famille_image(
    famille_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    famille = await db.get(Famille, famille_id)
    if famille is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Famille introuvable")

    if famille.image:
        delete_image(famille.image)
        famille.image = None
        await db.commit()
        await db.refresh(famille)

    count = await db.scalar(select(func.count(Produit.id)).where(Produit.famille_id == famille_id))
    return _to_response(famille, count or 0)


@router.patch("/admin/familles/reorder", response_model=list[FamilleResponse])
async def reorder_familles(
    payload: FamilleReorderRequest,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    ids = [item.id for item in payload.items]
    result = await db.scalars(select(Famille).where(Famille.id.in_(ids)))
    by_id = {f.id: f for f in result.all()}

    missing = set(ids) - set(by_id.keys())
    if missing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Famille(s) introuvable(s) : {sorted(missing)}")

    for item in payload.items:
        by_id[item.id].ordre = item.ordre
    await db.commit()

    await log_activity(
        db, admin_user_id=admin.id, action="famille_reorganisation", resultat="succes",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent"),
        details=f"{len(payload.items)} famille(s)",
    )

    result = await db.scalars(select(Famille).order_by(Famille.ordre, Famille.nom))
    familles = result.all()
    counts = await _counts_by_famille(db)
    return [_to_response(f, counts.get(f.id, 0)) for f in familles]
