# Batilux Sahel — Backend (API)

FastAPI + PostgreSQL + SQLAlchemy 2.0 (async) + Alembic.

## Phase 2 — Authentification & sécurité (état actuel)

- Connexion en 2 étapes : email+mot de passe (Argon2id) puis code TOTP à 6 chiffres
- Première connexion : QR code affiché une seule fois (Google/Microsoft Authenticator, Authy) + 8 backup codes à usage unique
- JWT access token (15 min) + refresh token opaque en cookie HttpOnly/Secure/SameSite=Strict (14 jours, **rotation à chaque refresh**, ancien token révoqué)
- Verrouillage 15 min après 5 tentatives échouées (mot de passe OU code 2FA), rate limiting en plus (10 req/min sur les routes sensibles)
- Journal d'activité complet : connexion, déconnexion, setup/vérif 2FA, refresh — avec IP, user-agent, résultat
- Headers de sécurité OWASP sur toutes les réponses (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS en prod)
- `scripts/create_admin.py` : création + reset mot de passe/2FA (toujours hors API)

Testé de bout en bout : login → setup 2FA avec vrai code TOTP → route protégée → rotation refresh token (ancien token rejeté si réutilisé) → verrouillage brute-force après 5 échecs → headers de sécurité.

### Endpoints

| Route | Auth requise | Description |
|---|---|---|
| `POST /api/auth/login` | — | Étape 1 : email + mot de passe |
| `POST /api/auth/2fa/setup` | token `totp_setup` | 1ère config : QR code + backup codes |
| `POST /api/auth/2fa/confirm` | token `totp_setup` | Valide le 1er code → active la 2FA + session |
| `POST /api/auth/2fa/verify` | token `totp_verify` | Code TOTP ou backup code → session |
| `POST /api/auth/refresh` | cookie `refresh_token` | Rotation du refresh token |
| `POST /api/auth/logout` | access token | Révoque le refresh token |
| `GET /api/auth/me` | access token | Infos du compte connecté |
| `POST /api/auth/2fa/backup-codes/regenerate` | access token | Invalide les anciens codes, en émet 8 nouveaux |

## Phase 3 — CRUD Familles (état actuel)

- Routes publiques : `GET /api/familles` (actives, triées), `GET /api/familles/{slug}`
- Routes admin (protégées JWT) : liste complète, création, modification, suppression, réorganisation
- Slug généré automatiquement à partir du nom (gère les accents), unique (suffixe `-2`, `-3`... en cas de collision)
- Suppression bloquée proprement (409, pas de crash) si des produits sont encore rattachés à la famille
- Toutes les actions journalisées (`famille_creation`, `famille_modification`, `famille_suppression`, `famille_reorganisation`)

Testé de bout en bout : création, doublon de nom (409), désactivation (disparaît du catalogue public), réorganisation, suppression bloquée par contrainte FK sur un produit rattaché, suppression réussie sur famille vide.

⚠️ Bug trouvé et corrigé pendant les tests : `main.py` n'importait pas tous
les modèles SQLAlchemy au démarrage, ce qui faisait planter la première
requête touchant `Produit` (relations inter-fichiers non résolues). Fix :
import de `app.db.base_all` dans `main.py`.

### Endpoints (nouveaux)

| Route | Auth requise | Description |
|---|---|---|
| `GET /api/familles` | — | Familles actives, triées par ordre |
| `GET /api/familles/{slug}` | — | Détail d'une famille active |
| `GET /api/admin/familles` | access token | Toutes les familles + nb produits |
| `GET /api/admin/familles/{id}` | access token | Détail (édition) |
| `POST /api/admin/familles` | access token | Création |
| `PUT /api/admin/familles/{id}` | access token | Modification (champs partiels) |
| `DELETE /api/admin/familles/{id}` | access token | Suppression (409 si produits rattachés) |
| `PATCH /api/admin/familles/reorder` | access token | Réorganisation en masse |

## Phase 4 — CRUD Produits + caractéristiques dynamiques + images (état actuel)

- Routes publiques : liste paginée/filtrée/cherchable (actifs uniquement) + détail par slug
- Routes admin : CRUD complet, caractéristiques 100% dynamiques (clé/valeur libre, aucun schéma fixe), galerie d'images
- Pagination : `page` / `page_size` (max 100), `total_pages` calculé
- Filtres : `famille_id`, `marque`, `en_vedette`, `en_promotion`, `min_prix`, `max_prix`
- Recherche : `search` sur nom / référence / marque
- Liste optimisée : SELECT ciblé avec JOIN (pas l'ORM complet) — reste rapide même avec des milliers de produits, ne charge jamais la galerie/caractéristiques pour un simple listing
- Upload sécurisé : whitelist de type, **contenu réellement décodé par Pillow** (bloque un exécutable renommé en `.jpg`), taille max, nom de fichier toujours régénéré (uuid), ré-encodage complet en WEBP (supprime l'EXIF, optimise le poids)
- Suppression (produit, image individuelle, remplacement d'image principale) : nettoie systématiquement les fichiers physiques correspondants
- Images servies via `/uploads/...` (StaticFiles — protection native contre le path traversal)

Testé de bout en bout : CRUD produit, caractéristiques dynamiques (création + remplacement complet), doublon de référence (409), famille inexistante (404), pagination, recherche, filtres, upload valide (converti en WEBP), **upload d'un script shell renommé `.jpg` rejeté**, fichier trop volumineux rejeté, galerie (ajout/réorganisation/suppression), remplacement d'image principale (ancien fichier supprimé), path traversal sur `/uploads/../...` bloqué (404), suppression de produit nettoyant tous les fichiers disque.

### Endpoints (nouveaux)

| Route | Auth requise | Description |
|---|---|---|
| `GET /api/produits` | — | Liste paginée/filtrée/cherchable, actifs uniquement |
| `GET /api/produits/{slug}` | — | Détail (galerie + caractéristiques) |
| `GET /api/admin/produits` | access token | Liste paginée, tous statuts, filtre `actif` en plus |
| `GET /api/admin/produits/{id}` | access token | Détail (édition) |
| `POST /api/admin/produits` | access token | Création (+ caractéristiques imbriquées) |
| `PUT /api/admin/produits/{id}` | access token | Modification (`caracteristiques` fourni = remplacement complet) |
| `DELETE /api/admin/produits/{id}` | access token | Suppression + nettoyage fichiers |
| `POST /api/admin/produits/{id}/image-principale` | access token | Upload/remplace (multipart) |
| `DELETE /api/admin/produits/{id}/image-principale` | access token | Retire l'image principale |
| `POST /api/admin/produits/{id}/images` | access token | Ajoute une image galerie (multipart, `alt_text` optionnel) |
| `DELETE /api/admin/produits/{id}/images/{image_id}` | access token | Supprime une image galerie |
| `PATCH /api/admin/produits/{id}/images/reorder` | access token | Réorganise la galerie |

## Démarrage local (Windows)

### 1. Base de données

Le plus simple : Docker Desktop.

```bash
cd backend
docker compose up -d
```

Sans Docker : installer PostgreSQL 16 localement, puis créer manuellement
l'utilisateur/la base avec les identifiants du `.env.example`.

### 2. Environnement Python

Dans **PowerShell**, hors de l'environnement conda `bioinfo` (projet séparé) :

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

⚠️ **Avant tout déploiement en prod**, générer une vraie clé JWT et la mettre
dans `.env` :

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 3. Migrations

```powershell
alembic upgrade head
```

### 4. Créer l'admin

```powershell
python -m scripts.create_admin --email admin@batiluxsahel.com
```

En cas de perte du téléphone (2FA) et des backup codes :

```powershell
python -m scripts.create_admin --email admin@batiluxsahel.com --reset-2fa
```

### 5. Lancer l'API

```powershell
uvicorn app.main:app --reload --port 8000
```

Swagger dispo sur `http://localhost:8000/api/docs` (uniquement si `DEBUG=true`).

## Architecture

```
app/
  core/
    config.py            # settings (.env)
    security.py           # Argon2, JWT, TOTP, QR code, backup codes
    security_headers.py   # middleware headers OWASP
    rate_limit.py          # limiter slowapi partagé
  db/                    # engine, session, base, mixins
  models/                # SQLAlchemy : Famille, Produit, ProduitImage,
                          # ProduitCaracteristique, AdminUser, RefreshToken,
                          # BackupCode, ActivityLog
  services/
    activity_log.py       # helper de journalisation réutilisé par toutes les phases
    slugify.py             # génération de slug unique (familles + produits)
    upload.py               # validation/optimisation/suppression sécurisée des images
  api/
    deps.py               # dépendances FastAPI (admin courant, IP client)
    health.py
    auth.py               # routes d'authentification
    familles.py            # CRUD familles (public + admin)
    produits.py             # CRUD produits + caractéristiques + images (public + admin)
  main.py                 # point d'entrée FastAPI (+ montage /uploads)
alembic/                  # migrations
scripts/create_admin.py   # création/reset admin hors API
uploads/                  # fichiers uploadés (créé au démarrage, non versionné)
```

Un router = un domaine métier. Le prochain router (`import_excel`) vient
s'ajouter dans `app/api/` et s'enregistre dans `main.py`.

## Prochaines phases

6. Import Excel
7. Dashboard & finitions (SEO, performance, durcissement sécurité)

*(Phase 5 — Catalogue public frontend : voir le README à la racine du projet, `../README.md`, section "Catalogue dynamique".)*

