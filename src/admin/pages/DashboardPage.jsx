import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api.js'
import { formatPrice } from '../../lib/format.js'

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone/25 bg-ink-2 p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-stone">{label}</p>
      <p className="mt-2 font-display font-semibold text-3xl text-paper">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([adminApi.get('/admin/familles'), adminApi.get('/admin/produits', { page: 1, page_size: 5 })])
      .then(([familles, produits]) => {
        if (cancelled) return
        setStats({
          nbFamilles: familles.length,
          nbProduits: produits.total,
          recents: produits.items,
        })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10 max-w-5xl">
      <h1 className="font-display font-semibold text-2xl text-paper">Dashboard</h1>
      <p className="mt-1 text-sm text-stone">Vue d'ensemble du catalogue.</p>

      {error && <p className="mt-8 text-clay-light">Impossible de charger les statistiques.</p>}

      {!stats && !error && <p className="mt-8 text-stone">Chargement…</p>}

      {stats && (
        <>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <StatCard label="Familles" value={stats.nbFamilles} />
            <StatCard label="Produits" value={stats.nbProduits} />
          </div>

          <div className="mt-10">
            <h2 className="font-display font-semibold text-lg text-paper">Produits récemment ajoutés</h2>
            {stats.recents.length === 0 ? (
              <p className="mt-3 text-sm text-stone">Aucun produit pour le moment.</p>
            ) : (
              <div className="mt-4 rounded-2xl border border-stone/25 bg-ink-2 divide-y divide-stone/15">
                {stats.recents.map((p) => (
                  <Link
                    key={p.id}
                    to={`/admin/produits/${p.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-ink-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-paper truncate">{p.nom}</p>
                      <p className="text-xs text-stone">
                        {p.famille_nom} · Réf. {p.reference}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-sage-light">{formatPrice(p.prix) ?? '—'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
