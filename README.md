# Batilux Sahel — site vitrine

Site vitrine one-page pour Batilux Sahel (Ahnif, wilaya de Bouira), construit avec
React 19 + Vite 8 + Tailwind CSS v4 + Framer Motion.

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production dans dist/
npm run preview    # sert le build de production localement
```

## Système de design

- **Palette** (dérivée du logo) : anthracite `#1A1A16`, vert sauge `#3E6B4E`,
  terre cuite `#C1825B`, blanc cassé `#F3F0E8`, gris pierre `#8C8579`.
  Définie dans `src/index.css` via `@theme` (Tailwind v4).
- **Typographies** : *Bricolage Grotesque* (titres — une grotesque à
  personnalité, chargée via Google Fonts dans `index.html`), *IBM Plex Sans*
  (texte courant), *IBM Plex Mono* (étiquettes, fiches produit, horaires).
- **Signature** : le hero joue sur une texture de mur fraîchement enduit
  (dégradés superposés + grain SVG) avec une animation d'ouverture façon
  « passage de taloche » (`src/components/Hero.jsx`), respectueuse de
  `prefers-reduced-motion`.
- **Catégories produits** : quatre textures de matière différentes (brosse,
  carrelage, crépi, pois décoratif) plutôt que des cartes identiques —
  voir `.texture-*` dans `src/index.css`.

## Assets à remplacer avant mise en ligne

Le design fonctionne déjà avec des remplacements texturés/génériques ; voici
ce qui doit être échangé avec les vrais fichiers du client :

1. **Logo** — `src/components/LogoMark.jsx` est une reconstitution du logo
   décrit dans le brief (cercle, « B » façon toit de maison, vert sauge sur
   fond anthracite texturé bois). Dès que le fichier vectoriel réel est
   disponible, remplacez ce composant par un `<img>`/SVG du vrai logo dans
   `Header.jsx`, `Hero.jsx` et `Footer.jsx`.
2. **Photos** — `src/components/Gallery.jsx` utilise des vignettes texturées
   nommées (ex. « Chantier façade — Bouira »). Remplacez chaque `<figure>`
   par une vraie image (`<img src="..." alt="..." loading="lazy" />`), idéalement
   récupérées et recompressées depuis la page Facebook.
3. **Marques distribuées** — la section catégories ne mentionne pas de marques
   précises (ex. Loggia/Umana) : à ajouter dans `src/lib/content.js` une fois
   la liste confirmée par le client.
4. **Avis clients** — aucun bloc « avis » n'a été inclus (la page Facebook
   n'en a pas encore) ; facile à ajouter en section une fois disponibles.
5. **Image Open Graph** — `og-cover.jpg` référencée dans `index.html` est à
   fournir (1200×630, photo de magasin ou de façade).

## Contact — EmailJS

Le formulaire (`src/components/Contact.jsx`) est câblé sur EmailJS via
`src/lib/emailjs.js`. Pour l'activer :

1. Créez un compte sur [EmailJS](https://www.emailjs.com/), un service
   d'envoi et un template avec les variables `from_name`, `reply_contact`,
   `message`.
2. Copiez `.env.example` vers `.env` et renseignez `VITE_EMAILJS_SERVICE_ID`,
   `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.
3. Sans ces variables, le formulaire reste visible mais affiche un message
   indiquant qu'il n'est pas encore actif — les boutons WhatsApp/Messenger/
   téléphone restent utilisables dans tous les cas.

## SEO

- Title, meta description et mots-clés ciblés Bouira/Ahnif dans `index.html`.
- Balisage `schema.org` `HomeAndConstructionBusiness` (NAP, horaires, réseaux
  sociaux) en JSON-LD dans `index.html`.
- `<noscript>` avec un résumé statique du contenu pour les robots qui
  n'exécutent pas JavaScript.
- `robots.txt` et `sitemap.xml` dans `public/`.
- Numéro de téléphone et adresse identiques partout (fichier unique
  `src/lib/content.js`), avec lien `tel:` cliquable.

### Pré-rendu statique — ce qui est fait et ce qui reste à faire

Le pré-rendu (`scripts/prerender.mjs`) ne couvre que la page d'accueil `/`
(voir la section Catalogue ci-dessous pour les routes ajoutées en Phase 5).
Deux filets de sécurité sont déjà en place sur `/` : le JSON-LD et le contenu
`<noscript>` dans `index.html`, tous deux visibles sans JavaScript.

Pour un vrai instantané HTML post-rendu (recommandé avant mise en prod),
`scripts/prerender.mjs` est fourni : il lance un navigateur headless contre
`npm run preview` et réécrit `dist/index.html` avec le DOM final. Il
nécessite `npm install --save-dev puppeteer`, qui télécharge un binaire
Chromium — impossible à tester dans cet environnement sandbox (accès réseau
restreint), mais fonctionnera normalement en local ou en CI. Voir les
commentaires en tête du script pour la marche à suivre.

## Interface admin (Phase 7, en cours)

Le menu admin du cahier des charges (Dashboard / Familles / Produits /
Paramètres / Journal d'activité) n'existait pas encore en interface — tout
avait été testé via curl jusqu'ici (Phases 1-4). Construction en cours,
étape par étape :

**Fait :**
- `/admin/login` — connexion en 2 étapes (mot de passe → 2FA), avec
  affichage du QR code + backup codes lors de la toute première connexion
- Token d'accès géré en mémoire uniquement (jamais `localStorage`), refresh
  silencieux via le cookie `HttpOnly` au chargement de l'app, retry
  automatique sur 401
- `/admin` (Dashboard) — nombre de familles, nombre de produits, produits
  récemment ajoutés (cliquables)
- `/admin/familles` — liste, réorganisation (haut/bas), création/édition
  (modal), suppression avec confirmation (message clair si des produits sont
  encore rattachés), upload/suppression d'image
- `/admin/produits` — liste paginée, recherche instantanée, filtres
  (famille, statut) ; `/admin/produits/nouveau` et `/admin/produits/:id` —
  formulaire création/édition (même page pour les deux), éditeur de
  caractéristiques dynamiques (ajout/suppression/réorganisation illimités),
  image principale + galerie (upload/suppression/réorganisation immédiats,
  indépendants de la sauvegarde du formulaire texte)
- `/admin/journal` — journal d'activité paginé, filtrable par action/résultat/dates
- `/admin/parametres` — email, statut 2FA, régénération des codes de secours
- Layout admin protégé (sidebar, déconnexion) — complètement séparé du
  layout public (pas de Header/Footer/WhatsApp sur l'admin)

**Ajout backend (Journal)** : `GET /admin/activity-logs` — n'existait pas
avant (Phase 2 n'avait que l'écriture). Paginé, filtrable, jointure sur
l'email admin (nullable — reste `null` proprement pour les entrées
historiques si le compte admin a depuis été recréé, grâce à la contrainte
`ON DELETE SET NULL` posée en Phase 2).

**Reste à faire (Phase 7)** : aucun — les 7 sous-étapes sont livrées.

## SEO (dernière sous-étape de la Phase 7)

**Le choix stratégique** : WhatsApp, Facebook et la plupart des crawlers
d'aperçu de lien n'exécutent PAS JavaScript — ils lisent le HTML brut. Pour
un catalogue 100% client-side (React), ça veut dire qu'un lien produit
partagé sur WhatsApp n'afficherait aucun aperçu correct sans traitement
spécifique. Deux options possibles :

1. **Rendu complet par page** (Puppeteer, comme `prerender.mjs` pour la
   homepage) — contenu texte intégral visible aux crawlers, mais coûteux en
   temps de build sur un catalogue de plusieurs milliers de produits (~1-2s
   par page).
2. **Templating léger** (pas de navigateur headless, juste substitution de
   texte dans le `index.html` déjà buildé) — couvre le cas le plus important
   (aperçus WhatsApp/Facebook + balises meta correctes dès le premier passage
   de Google) en une fraction du temps, quel que soit le nombre de produits.

**Choix fait : l'option 2**, pour rester rapide à grande échelle. Si le
classement Google sur le contenu texte complet de chaque page produit devient
prioritaire, l'option 1 reste disponible en complément plus tard (elle
n'entre pas en conflit avec ce qui est livré ici).

**Ce qui est fait :**
- `scripts/generate-seo.mjs` (`npm run generate-seo`, à exécuter après
  `npm run build`) : génère `dist/sitemap.xml` (toutes les familles/produits
  actifs, `lastmod` sur les produits) + une page statique par produit/famille
  (`dist/produit/{slug}/index.html`, `dist/catalogue/{slug}/index.html`) avec
  `<title>`, meta description et Open Graph corrects (image = image
  principale du produit si présente, sinon `/og-cover.jpg`)
- `index.html` : bloc SEO délimité par des marqueurs (`<!-- SEO:START/END
  -->`) que le script remplace pour chaque page générée
- Échappement HTML systématique (testé avec un nom de produit contenant
  `" < > &` — rendu correctement échappé, aucun risque d'injection)
- `public/_redirects` (Netlify) + `vercel.json` (Vercel) : fallback SPA —
  **absent jusqu'ici**, ce qui aurait cassé `/catalogue`, `/produit/*` et
  surtout `/admin/*` en accès direct une fois déployé (mes tests locaux avec
  `vite preview` ne l'auraient jamais révélé, son fallback est automatique
  contrairement à un vrai hébergement statique)

**Bug trouvé et corrigé pendant les tests** : `og:image` pointait vers le
domaine du frontend au lieu du backend (les images uploadées sont servies
par l'API, pas le site statique — deux origines différentes).

**Variables d'env pour `generate-seo.mjs`** : `VITE_API_URL` (déjà utilisée
par le site) et `SITE_URL` (URL publique, défaut `https://www.batiluxsahel.com`).
La machine qui build doit pouvoir joindre l'API en HTTP.

**Limite connue** : le sitemap/les pages statiques ne se régénèrent pas
tout seuls quand un produit change dans l'admin — il faut relancer
`npm run build && npm run generate-seo` après chaque changement de
catalogue (à automatiser via un webhook/cron plus tard si besoin).

**Ajouts/corrections backend en cours de route :**
- Upload/suppression d'image famille (`POST`/`DELETE /admin/familles/{id}/image`)
  — n'existait pas en Phase 4 (prévu uniquement pour les produits). Le
  service d'upload a été renommé en générique (`save_image`/`delete_image`,
  plus de préfixe "produit") pour servir les deux.
- **Bug trouvé et corrigé** : la suppression d'une famille ne nettoyait pas
  son fichier image sur le disque — corrigé.
- Toutes les routes produits (CRUD, caractéristiques, galerie, réorganisation,
  doublon de référence → 409) re-testées de bout en bout en rejouant les
  appels exacts que fait l'interface admin.

**Fichiers ajoutés :** `src/admin/` (AuthContext, tokenStore, client API,
AdminApp, layout, pages).

**Point d'attention déploiement** : le cookie `refresh_token` est en
`SameSite=Strict` (Phase 2, volontaire pour la sécurité). Ça fonctionne en
local (`localhost:5173` ↔ `localhost:8000`, considérés same-site), et ça
fonctionnera en prod SI le backend est déployé sur un sous-domaine du même
domaine que le frontend (ex. `api.batiluxsahel.com` pour un frontend sur
`batiluxsahel.com` — les sous-domaines d'un même domaine sont same-site). Si
le backend finit sur un domaine complètement différent (Railway/Render
génériques, par exemple), le refresh silencieux ne fonctionnera pas et il
faudra revoir `SameSite` sur ce cookie.

## Catalogue dynamique (Phase 5)

En plus de la page d'accueil (one-page, inchangée), le site a maintenant des
routes côté client (`react-router-dom`, `BrowserRouter`) branchées sur l'API
du backend (`backend/`, voir son propre README pour les phases 1-4) :

| Route | Contenu |
|---|---|
| `/` | Homepage inchangée (Hero, About, Categories, GrosDetail, Gallery, LocationSection, Contact) |
| `/catalogue` | Grille des familles de produits actives |
| `/catalogue/:familleSlug` | Produits d'une famille — recherche instantanée (debounce 350ms), filtres vedette/promotion, pagination |
| `/produit/:slug` | Détail produit — galerie zoomable (lightbox), caractéristiques dynamiques, produits similaires |

**Fichiers ajoutés :**
- `src/lib/api.js` — client fetch minimal vers l'API (`VITE_API_URL`, défaut `http://localhost:8000/api`)
- `src/lib/format.js` — formatage des prix (DA)
- `src/pages/{HomePage,CataloguePage,FamilleProduitsPage,ProduitDetailPage}.jsx`
- `src/components/catalogue/{ProductCard,Pagination,Lightbox}.jsx`
- `src/components/ScrollToTop.jsx`

**Header** : les ancres de navigation homepage (`#categories`, etc.) restent
strictement identiques quand on est sur `/`. Sur les autres pages, elles
redirigent vers `/#ancre` (retour à l'accueil + scroll natif du navigateur).
Un nouveau lien « Catalogue » a été ajouté ; la section Categories de la
homepage a aussi gagné un bouton « Voir tout le catalogue » — le contenu
existant de ces deux composants n'a pas été modifié, seulement complété.

**Limite connue (documentée dans `scripts/prerender.mjs`)** : le pré-rendu
statique ne couvre que `/`. Un crawler qui visite `/catalogue/...` ou
`/produit/...` sans exécuter JS verrait actuellement le snapshot de la
homepage. Le SEO par produit (URL propre — déjà le cas via les slugs —, meta
title/description, Open Graph, sitemap) est prévu en Phase 7 et adressera ce
point proprement plutôt que de rajouter des snapshots ici.

**Variables d'environnement** : `VITE_API_URL` ajoutée à `.env.example`.

## Déploiement

Le build (`npm run build`) produit un dossier `dist/` statique.

⚠️ **Depuis les Phases 5 et 7, le site a des routes côté client**
(`/catalogue`, `/produit/:slug`, `/admin/...`) — un simple hébergement
statique sans redirection ne fonctionne plus : un accès direct (F5, lien
partagé) sur ces routes renverrait une 404. Nécessaire :

- **Netlify** : `public/_redirects` (déjà présent) — copié tel quel dans `dist/`.
- **Vercel** : `vercel.json` (déjà présent) à la racine.
- **GitHub Pages** : ne supporte pas nativement les rewrites côté serveur ;
  éviter pour ce projet, ou passer par une solution de contournement
  (404.html qui redirige en JS — moins fiable).

Ces fichiers font passer un fallback SPA (`/* → /index.html`) en priorité
basse : les vrais fichiers statiques (assets, `robots.txt`, `sitemap.xml`,
pages produit pré-générées le cas échéant) restent servis normalement,
seules les routes inconnues tombent sur `index.html` pour que React Router
prenne le relais.

Pensez à exécuter `scripts/prerender.mjs` juste avant de déployer `dist/`
si vous activez le pré-rendu de la homepage.
