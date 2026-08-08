import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Eyebrow from '../components/Eyebrow.jsx'
import ProductCard from '../components/catalogue/ProductCard.jsx'
import Pagination from '../components/catalogue/Pagination.jsx'
import { SearchIcon, ArrowLeftIcon } from '../components/icons.jsx'
import { getFamille, getProduits } from '../lib/api.js'

const PAGE_SIZE = 12

export default function FamilleProduitsPage() {
  const { familleSlug } = useParams()

  const [famille, setFamille] = useState(null)
  const [familleError, setFamilleError] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [enPromotion, setEnPromotion] = useState(false)
  const [enVedette, setEnVedette] = useState(false)
  const [page, setPage] = useState(1)

  const [result, setResult] = useState(null)

  // Détail de la famille (titre, description) — rechargé à chaque changement de slug.
  useEffect(() => {
    let cancelled = false
    setFamille(null)
    setFamilleError(false)
    getFamille(familleSlug)
      .then((data) => {
        if (!cancelled) setFamille(data)
      })
      .catch(() => {
        if (!cancelled) setFamilleError(true)
      })
    return () => {
      cancelled = true
    }
  }, [familleSlug])

  // Recherche instantanée : on attend une pause de frappe avant d'interroger l'API.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // Réinitialise les filtres/recherche/pagination quand on change de famille.
  useEffect(() => {
    setSearchInput('')
    setSearch('')
    setEnPromotion(false)
    setEnVedette(false)
    setPage(1)
  }, [familleSlug])

  useEffect(() => {
    if (!famille) return
    let cancelled = false
    getProduits({
      famille_id: famille.id,
      page,
      page_size: PAGE_SIZE,
      search: search || undefined,
      en_promotion: enPromotion || undefined,
      en_vedette: enVedette || undefined,
    })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch(() => {
        if (!cancelled) setResult({ items: [], total: 0, page: 1, page_size: PAGE_SIZE, total_pages: 1 })
      })
    return () => {
      cancelled = true
    }
  }, [famille, page, search, enPromotion, enVedette])

  if (familleError) {
    return (
      <section className="pt-28 sm:pt-32 pb-28 min-h-screen">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 text-center">
          <p className="text-paper/70">Cette famille de produits n'existe pas ou n'est plus disponible.</p>
          <Link
            to="/catalogue"
            className="mt-4 inline-flex items-center gap-2 text-sage-light hover:text-paper transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Retour au catalogue
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-ink pt-28 sm:pt-32 pb-20 sm:pb-28 min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 text-sm text-stone hover:text-paper transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Catalogue
        </Link>

        <div className="mt-5">
          <Eyebrow tone="clay">Famille</Eyebrow>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl text-paper max-w-xl">
            {famille ? famille.nom : '…'}
          </h1>
          {famille?.description && <p className="mt-3 text-paper/70 max-w-xl">{famille.description}</p>}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nom, référence, marque…"
              className="w-full rounded-full border border-stone/30 bg-ink-2 pl-10 pr-4 py-2.5 text-sm text-paper placeholder:text-stone focus:outline-none focus:border-sage-light transition-colors"
            />
          </div>

          <div className="flex gap-2 font-mono text-xs uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                setEnVedette((v) => !v)
                setPage(1)
              }}
              className={`rounded-full border px-4 py-2 transition-colors ${
                enVedette ? 'border-sage bg-sage/15 text-sage-light' : 'border-stone/30 text-stone hover:text-paper'
              }`}
            >
              Vedette
            </button>
            <button
              type="button"
              onClick={() => {
                setEnPromotion((v) => !v)
                setPage(1)
              }}
              className={`rounded-full border px-4 py-2 transition-colors ${
                enPromotion ? 'border-clay bg-clay/15 text-clay-light' : 'border-stone/30 text-stone hover:text-paper'
              }`}
            >
              Promotion
            </button>
          </div>
        </div>

        {!result && <p className="mt-12 text-stone">Chargement…</p>}

        {result && result.items.length === 0 && (
          <p className="mt-12 text-stone">Aucun produit ne correspond à votre recherche.</p>
        )}

        {result && result.items.length > 0 && (
          <>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.items.map((p, i) => (
                <ProductCard key={p.id} produit={p} index={i} />
              ))}
            </div>
            <Pagination page={result.page} totalPages={result.total_pages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  )
}
