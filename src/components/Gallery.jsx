import { motion } from 'framer-motion'
import Eyebrow from './Eyebrow.jsx'
import { GALLERY_PLACEHOLDERS } from '../lib/content.js'

const toneClass = {
  sage: 'texture-brush',
  clay: 'texture-stucco',
  stone: 'texture-tile',
}

export default function Gallery() {
  return (
    <section id="galerie" className="cv-auto bg-ink-2 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Eyebrow>Réalisations &amp; produits</Eyebrow>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper max-w-xl">
            Un aperçu du magasin et des chantiers.
          </h2>
          <p className="text-sm text-stone max-w-xs">
            Emplacements prêts pour les photos du magasin et des réalisations —
            à remplacer par les visuels réels avant mise en ligne.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {GALLERY_PLACEHOLDERS.map((item, i) => (
            <motion.figure
              key={item.id}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className={`relative rounded-xl overflow-hidden border border-stone/20 ${
                i === 0 ? 'col-span-2 sm:col-span-2 aspect-[16/10]' : 'aspect-square'
              } ${toneClass[item.tone]}`}
            >
              {/* Replace this figure's texture div with a real <img src="..." alt="..." loading="lazy" /> once photos are provided */}
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-4 py-3 text-xs sm:text-sm text-paper/90 font-medium">
                {item.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
