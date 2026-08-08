// Génère automatiquement, après `npm run build` :
//   - dist/sitemap.xml (toutes les familles + tous les produits actifs)
//   - une page statique par produit/famille (dist/produit/{slug}/index.html,
//     dist/catalogue/{slug}/index.html) avec les bonnes balises <title>,
//     meta description et Open Graph.
//
// Pourquoi une page statique par produit plutôt que de tout laisser au JS
// client (comme le reste du catalogue) : WhatsApp, Facebook et la plupart
// des crawlers de prévisualisation de lien n'exécutent PAS JavaScript — ils
// lisent le HTML brut. Sans ça, partager un lien produit sur WhatsApp (très
// utilisé par la clientèle algérienne) n'afficherait aucun aperçu correct.
//
// Volontairement PAS de rendu de page complet (pas de Puppeteer, contrairement
// à scripts/prerender.mjs pour la homepage) : juste du templating de texte sur
// le index.html déjà buildé. Bien plus rapide, tient la charge même sur un
// catalogue de plusieurs milliers de produits (templating pur, pas de
// navigateur headless à lancer par page).
//
// Usage :
//   npm run build
//   node scripts/generate-seo.mjs
//
// Variables d'env (optionnelles, valeurs par défaut ci-dessous) :
//   VITE_API_URL   URL de l'API — doit être joignable depuis la machine qui build.
//   SITE_URL       URL publique du site (sans slash final).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const API_BASE = process.env.VITE_API_URL || 'http://localhost:8000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '') // les images uploadées sont servies par le BACKEND, pas le frontend
const SITE_URL = (process.env.SITE_URL || 'https://www.batiluxsahel.com').replace(/\/$/, '')
const DIST_DIR = path.resolve('dist')

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return res.json()
}

async function fetchAllProduits() {
  const items = []
  let page = 1
  // Boucle sur la pagination existante (page_size max autorisé par l'API : 100)
  // jusqu'à épuisement — fonctionne quel que soit le nombre de produits.
  for (;;) {
    const data = await fetchJson(`${API_BASE}/produits?page=${page}&page_size=100`)
    items.push(...data.items)
    if (page >= data.total_pages) break
    page += 1
  }
  return items
}

function escapeHtml(str) {
  return String(str ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

// Les images produits/familles sont uploadées vers le BACKEND (/uploads/...),
// pas le frontend statique — origine différente, donc fonction séparée.
function absoluteImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${API_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

function buildSeoBlock({ title, description, url, image, type = 'website' }) {
  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(description)
  return `<title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph -->
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="fr_DZ" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}`
}

async function writeSeoPage(template, relativePath, seoBlock) {
  const html = template.replace(
    /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/,
    `<!-- SEO:START -->\n    ${seoBlock}\n    <!-- SEO:END -->`
  )
  const outPath = path.join(DIST_DIR, relativePath, 'index.html')
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, html, 'utf-8')
}

function produitDescription(p) {
  const parts = [p.nom]
  if (p.marque) parts.push(p.marque)
  if (p.famille_nom) parts.push(p.famille_nom)
  const prix = p.prix ? ` — ${new Intl.NumberFormat('fr-FR').format(p.prix)} DA` : ''
  return `${parts.join(' — ')}${prix}. Disponible chez Batilux Sahel, Ahnif (Bouira).`
}

function xmlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${loc}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function main() {
  console.log(`API   : ${API_BASE}`)
  console.log(`Site  : ${SITE_URL}`)

  const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf-8')
  if (!template.includes('<!-- SEO:START -->')) {
    throw new Error(
      "index.html buildé sans les marqueurs <!-- SEO:START/END -->. Vérifier index.html à la racine du projet."
    )
  }

  const [familles, produits] = await Promise.all([fetchJson(`${API_BASE}/familles`), fetchAllProduits()])
  console.log(`${familles.length} famille(s) active(s), ${produits.length} produit(s) actif(s)`)

  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/catalogue`, changefreq: 'weekly', priority: '0.9' },
  ]

  for (const f of familles) {
    const url = `${SITE_URL}/catalogue/${f.slug}`
    urls.push({ loc: url, changefreq: 'weekly', priority: '0.8' })
    await writeSeoPage(
      template,
      `catalogue/${f.slug}`,
      buildSeoBlock({
        title: `${f.nom} — Batilux Sahel`,
        description: f.description || `Découvrez notre gamme ${f.nom} chez Batilux Sahel, Ahnif (Bouira).`,
        url,
        image: absoluteImageUrl(f.image) ?? absoluteUrl('/og-cover.jpg'),
      })
    )
  }

  for (const p of produits) {
    const url = `${SITE_URL}/produit/${p.slug}`
    urls.push({
      loc: url,
      lastmod: p.updated_at ? p.updated_at.slice(0, 10) : undefined,
      changefreq: 'monthly',
      priority: '0.6',
    })
    await writeSeoPage(
      template,
      `produit/${p.slug}`,
      buildSeoBlock({
        title: `${p.nom} — Batilux Sahel`,
        description: produitDescription(p),
        url,
        image: absoluteImageUrl(p.image_principale) ?? absoluteUrl('/og-cover.jpg'),
        type: 'product',
      })
    )
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(xmlEntry)
    .join('\n')}\n</urlset>\n`
  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf-8')

  console.log(`\nOK — sitemap.xml (${urls.length} URLs) + ${familles.length + produits.length} pages statiques générées.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
