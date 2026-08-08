import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Eyebrow from '../components/Eyebrow.jsx'
import ImagePlaceholder from '../components/ImagePlaceholder.jsx'
import Lightbox from '../components/catalogue/Lightbox.jsx'
import ProductCard from '../components/catalogue/ProductCard.jsx'
import { ArrowLeftIcon, StarIcon, TagIcon, ZoomIcon } from '../components/icons.jsx'
import { getProduit, getProduits } from '../lib/api.js'
import { formatPrice } from '../lib/format.js'

export default function ProduitDetailPage() {
  const { slug } = useParams()

  const [produit, setProduit] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [similaires, setSimilaires] = useState([])

  useEffect(() => {
    let cancelled = false
    setProduit(null)
    setNotFound(false)
    setActiveImage(0)
    setSimilaires([])
    getProduit(slug)
      .then((data) => {
        if (!cancelled) setProduit(data)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!produit) return
    let cancelled = false
    getProduits({ famille_id: produit.famille_id, page_size: 5 })
      .then((data) => {
        if (cancelled) return
        setSimilaires(data.items.filter((p) => p.slug !== produit.slug).slice(0, 4))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [produit])

  if (notFound) {
    return (
      <section className="pt-28 sm:pt-32 pb-28 min-h-screen">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 text-center">
          <p className="text-paper/70">Ce produit n'existe pas ou n'est plus disponible.</p>
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

  if (!produit) {
    return (
      <section className="pt-28 sm:pt-32 pb-28 min-h-screen">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-stone">Chargement…</p>
        </div>
      </section>
    )
  }

  const gallery = [...(produit.image_principale ? [produit.image_principale] : []), ...produit.images.map((img) => img.url)]
  const price = formatPrice(produit.prix)

  return (
    <section className="bg-ink pt-28 sm:pt-32 pb-20 sm:pb-28 min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Link
          to={produit.famille_slug ? `/catalogue/${produit.famille_slug}` : '/catalogue'}
          className="inline-flex items-center gap-2 text-sm text-stone hover:text-paper transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> {produit.famille_nom || 'Catalogue'}
        </Link>

        <div className="mt-6 grid lg:grid-cols-2 gap-10">
          {/* Galerie */}
          <div>
            <button
              type="button"
              onClick={() => gallery.length > 0 && setLightboxIndex(activeImage)}
              className="group relative block w-full aspect-square rounded-2xl overflow-hidden border border-stone/25 texture-dot"
            >
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={produit.nom} className="h-full w-full object-cover" />
              ) : (
                <ImagePlaceholder />
              )}
              {gallery.length > 0 && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-xs text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIcon className="w-3.5 h-3.5" /> Zoomer
                </span>
              )}
            </button>

            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2.5">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border transition-colors ${
                      i === activeImage ? 'border-sage-light' : 'border-stone/25 hover:border-stone/50'
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos */}
          <div>
            {produit.marque && <p className="font-mono text-xs uppercase tracking-wider text-stone">{produit.marque}</p>}
            <h1 className="mt-2 font-display font-semibold text-3xl sm:text-4xl text-paper">{produit.nom}</h1>

            {(produit.en_vedette || produit.en_promotion) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {produit.en_vedette && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-2 border border-stone/25 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-clay-light">
                    <StarIcon className="w-3.5 h-3.5" /> Vedette
                  </span>
                )}
                {produit.en_promotion && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-clay px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-ink">
                    <TagIcon className="w-3.5 h-3.5" /> Promotion
                  </span>
                )}
              </div>
            )}

            <p className="mt-5 font-display font-semibold text-2xl text-sage-light">{price ?? 'Prix sur demande'}</p>

            {produit.description && (
              <p className="mt-5 text-paper/75 leading-relaxed whitespace-pre-line">{produit.description}</p>
            )}

            {produit.caracteristiques.length > 0 && (
              <div className="mt-8">
                <Eyebrow>Caractéristiques</Eyebrow>
                <dl className="divide-y divide-stone/15 border-t border-stone/15">
                  {produit.caracteristiques.map((c) => (
                    <div key={c.id} className="flex justify-between gap-4 py-2.5 text-sm">
                      <dt className="text-stone">{c.nom}</dt>
                      <dd className="text-paper text-right">{c.valeur}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <p className="mt-8 font-mono text-xs text-stone">Réf. {produit.reference}</p>
          </div>
        </div>

        {similaires.length > 0 && (
          <div className="mt-20">
            <Eyebrow tone="clay">Produits similaires</Eyebrow>
            <h2 className="font-display font-semibold text-2xl text-paper">Dans la même famille</h2>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similaires.map((p, i) => (
                <ProductCard key={p.id} produit={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Lightbox
        images={gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(delta) => setLightboxIndex((i) => (i === null ? null : (i + delta + gallery.length) % gallery.length))}
      />
    </section>
  )
}
