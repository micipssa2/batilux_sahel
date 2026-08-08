import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/catalogue/Pagination.jsx'
import ImagePlaceholder from '../../components/ImagePlaceholder.jsx'
import { formatPrice } from '../../lib/format.js'
import { adminApi } from '../api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const PAGE_SIZE = 20

export default function ProduitsPage() {
  const [familles, setFamilles] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [familleId, setFamilleId] = useState('')
  const [actif, setActif] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    adminApi.get('/admin/familles').then(setFamilles).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  async function load() {
    try {
      const data = await adminApi.get('/admin/produits', {
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        famille_id: familleId || undefined,
        actif: actif === '' ? undefined : actif,
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, familleId, actif])

  async function handleDelete() {
    setDeleteError('')
    try {
      await adminApi.delete(`/admin/produits/${deleteTarget.id}`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  const selectClass =
    'rounded-full border border-stone/30 bg-ink-2 px-4 py-2 text-sm text-paper focus:outline-none focus:border-sage-light transition-colors'

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-paper">Produits</h1>
          <p className="mt-1 text-sm text-stone">
            {result ? `${result.total} produit${result.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <Link
          to="/admin/produits/nouveau"
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-paper hover:bg-sage-deep transition-colors shrink-0"
        >
          Nouveau produit
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nom, référence, marque…"
          className="rounded-full border border-stone/30 bg-ink-2 px-4 py-2 text-sm text-paper placeholder:text-stone focus:outline-none focus:border-sage-light transition-colors min-w-[220px]"
        />
        <select
          value={familleId}
          onChange={(e) => {
            setFamilleId(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">Toutes les familles</option>
          {familles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        <select
          value={actif}
          onChange={(e) => {
            setActif(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">Tous statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      {error && <p className="mt-6 text-clay-light">{error}</p>}
      {!result && !error && <p className="mt-8 text-stone">Chargement…</p>}
      {result && result.items.length === 0 && <p className="mt-8 text-stone">Aucun produit ne correspond.</p>}

      {result && result.items.length > 0 && (
        <>
          <div className="mt-6 rounded-2xl border border-stone/25 bg-ink-2 divide-y divide-stone/15">
            {result.items.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-ink-3 texture-dot">
                  {p.image_principale ? (
                    <img src={p.image_principale} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-paper truncate">{p.nom}</p>
                    {!p.actif && (
                      <span className="rounded-full bg-ink-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone">
                        Inactif
                      </span>
                    )}
                    {p.en_vedette && (
                      <span className="rounded-full bg-ink-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-clay-light">
                        Vedette
                      </span>
                    )}
                    {p.en_promotion && (
                      <span className="rounded-full bg-clay/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-clay-light">
                        Promo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone">
                    {p.famille_nom} · Réf. {p.reference}
                    {p.marque ? ` · ${p.marque}` : ''}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-sage-light">{formatPrice(p.prix) ?? '—'}</p>
                <div className="flex gap-2 font-mono text-xs uppercase tracking-wider shrink-0">
                  <Link
                    to={`/admin/produits/${p.id}`}
                    className="rounded-full border border-stone/30 px-3 py-1.5 text-paper hover:border-paper/50 transition-colors"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(p)
                      setDeleteError('')
                    }}
                    className="rounded-full border border-clay/40 px-3 py-1.5 text-clay-light hover:bg-clay/10 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.total_pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le produit"
        message={`Supprimer « ${deleteTarget?.nom} » ? Cette action est irréversible et supprime aussi ses images.`}
        error={deleteError}
        confirmLabel="Supprimer"
      />
    </div>
  )
}
