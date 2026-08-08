"""Base déclarative partagée par tous les modèles SQLAlchemy.

Un seul point d'entrée : chaque modèle hérite de `Base`. Alembic importe ce
module (via app/db/base_all.py) pour connaître tous les modèles au moment
de générer une migration.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
