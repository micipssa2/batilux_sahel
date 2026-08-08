"""Connexion à la base de données (async).

- `engine` : moteur SQLAlchemy async, une seule instance pour toute l'app.
- `AsyncSessionLocal` : fabrique de sessions.
- `get_db` : dépendance FastAPI, à utiliser avec `Depends(get_db)` dans les
  routes. Ferme toujours la session, même en cas d'exception.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # évite les connexions mortes après une inactivité (utile en dev/veille)
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
