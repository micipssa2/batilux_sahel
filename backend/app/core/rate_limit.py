"""Rate limiting global.

Instance unique du Limiter, importée par main.py (pour l'enregistrement) et
par les routes qui doivent être protégées (via le décorateur @limiter.limit).

En mémoire par défaut : suffisant pour un déploiement mono-instance. Si le
projet passe un jour en multi-instances, remplacer par un backend Redis
(voir doc slowapi) pour que la limite soit partagée entre processus.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
