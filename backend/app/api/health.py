from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """Ping simple — ne touche pas la DB, pour un check de liveness rapide."""
    return {"status": "ok"}


@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)) -> dict:
    """Vérifie que la connexion à PostgreSQL fonctionne réellement."""
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
