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

Le site étant une page unique, le principal risque SEO est qu'un robot qui
n'exécute pas JavaScript ne voie que la coquille HTML. Deux filets de
sécurité sont déjà en place : le JSON-LD et le contenu `<noscript>` dans
`index.html`, tous deux visibles sans JavaScript.

Pour un vrai instantané HTML post-rendu (recommandé avant mise en prod),
`scripts/prerender.mjs` est fourni : il lance un navigateur headless contre
`npm run preview` et réécrit `dist/index.html` avec le DOM final. Il
nécessite `npm install --save-dev puppeteer`, qui télécharge un binaire
Chromium — impossible à tester dans cet environnement sandbox (accès réseau
restreint), mais fonctionnera normalement en local ou en CI. Voir les
commentaires en tête du script pour la marche à suivre.

## Déploiement

Le build (`npm run build`) produit un dossier `dist/` statique, déployable
tel quel sur Netlify, Vercel, GitHub Pages ou tout hébergement statique.
Pensez à exécuter `scripts/prerender.mjs` juste avant de déployer `dist/`
si vous activez le pré-rendu.
"# batilux" 
"# batilux_sahel" 
"# batilux_sahel" 
