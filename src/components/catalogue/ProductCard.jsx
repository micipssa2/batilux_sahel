import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ImagePlaceholder from '../ImagePlaceholder.jsx'
import { StarIcon, TagIcon } from '../icons.jsx'
import { formatPrice } from '../../lib/format.js'

export default function ProductCard({ produit, index = 0 }) {
  const price = formatPrice(produit.prix)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: (index % 8) * 0.04 }}
      className="group relative rounded-2xl border border-stone/25 overflow-hidden bg-ink-2"
    >
      <Link to={`/produit/${produit.slug}`} className="block">
        <div className="relative h-44 sm:h-48 texture-dot overflow-hidden">
          {produit.image_principale ? (
            <img
              src={produit.image_principale}
              alt={produit.nom}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder />
          )}
          {(produit.en_vedette || produit.en_promotion) && (
            <div className="absolute top-2.5 left-2.5 flex gap-1.5">
              {produit.en_vedette && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-clay-light">
                  <StarIcon className="w-3 h-3" /> Vedette
                </span>
              )}
              {produit.en_promotion && (
                <span className="inline-flex items-center gap-1 rounded-full bg-clay px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink">
                  <TagIcon className="w-3 h-3" /> Promo
                </span>
              )}
            </div>
          )}
        </div>
        <div className="p-4">
          {produit.marque && (
            <p className="font-mono text-[11px] uppercase tracking-wider text-stone">{produit.marque}</p>
          )}
          <h3 className="mt-1 font-display font-semibold text-base text-paper leading-snug line-clamp-2">
            {produit.nom}
          </h3>
          <p className="mt-2 text-sm font-medium text-sage-light">{price ?? 'Prix sur demande'}</p>
        </div>
      </Link>
    </motion.article>
  )
}
