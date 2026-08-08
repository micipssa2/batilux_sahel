"""Importe tous les modèles pour que `Base.metadata` les connaisse.

Sans ce fichier, `alembic revision --autogenerate` ne verrait aucune table :
les modèles ne sont enregistrés sur `Base.metadata` qu'au moment où leur
module Python est importé.
"""
from app.db.base import Base  # noqa: F401
from app.models.activity_log import ActivityLog  # noqa: F401
from app.models.admin_user import AdminUser  # noqa: F401
from app.models.backup_code import BackupCode  # noqa: F401
from app.models.famille import Famille  # noqa: F401
from app.models.produit import Produit  # noqa: F401
from app.models.produit_caracteristique import ProduitCaracteristique  # noqa: F401
from app.models.produit_image import ProduitImage  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
