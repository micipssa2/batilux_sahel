import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Eyebrow from '../components/Eyebrow.jsx'
import ImagePlaceholder from '../components/ImagePlaceholder.jsx'
import { getFamilles } from '../lib/api.js'

export default function CataloguePage() {
  const [familles, setFamilles] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getFamilles()
      .then((data) => {
        if (!cancelled) setFamilles(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="bg-ink pt-28 sm:pt-32 pb-20 sm:pb-28 min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Eyebrow tone="clay">Catalogue</Eyebrow>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-paper max-w-xl">
          Toutes nos familles de produits.
        </h1>
        <p className="mt-4 text-paper/70 max-w-xl">
          Parcourez notre gamme complète, du gros œuvre à la finition.
        </p>

        {error && <p className="mt-12 text-paper/70">Impossible de charger le catalogue pour le moment.</p>}

        {!familles && !error && <p className="mt-12 text-stone">Chargement…</p>}

        {familles && familles.length === 0 && (
          <p className="mt-12 text-stone">Aucune famille de produits disponible pour le moment.</p>
        )}

        {familles && familles.length > 0 && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {familles.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Link
                  to={`/catalogue/${f.slug}`}
                  className="group relative block h-full rounded-2xl border border-stone/25 overflow-hidden bg-ink-2"
                >
                  <div className="h-36 sm:h-44 texture-dot overflow-hidden">
                    {f.image ? (
                      <img
                        src={f.image}
                        alt={f.nom}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImagePlaceholder />
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display font-semibold text-lg text-paper">{f.nom}</h2>
                    {f.description && (
                      <p className="mt-2 text-sm text-paper/70 leading-relaxed line-clamp-2">{f.description}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
