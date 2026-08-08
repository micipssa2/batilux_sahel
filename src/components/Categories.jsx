import { motion } from 'framer-motion'
import Eyebrow from './Eyebrow.jsx'
import { CATEGORIES } from '../lib/content.js'

const textureClass = {
  brush: 'texture-brush',
  tile: 'texture-tile',
  stucco: 'texture-stucco',
  dot: 'texture-dot',
}

// Slight vertical offset per index gives the row an asymmetric, hand-arranged
// rhythm instead of four identical aligned cards.
const offset = ['lg:mt-0', 'lg:mt-8', 'lg:mt-2', 'lg:mt-10']

export default function Categories() {
  return (
    <section id="categories" className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Eyebrow tone="clay">Le catalogue</Eyebrow>
        <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper max-w-xl">
          Quatre familles de produits, une seule adresse.
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, i) => (
            <motion.article
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.06 }}
              className={`group relative rounded-2xl border border-stone/25 overflow-hidden ${offset[i]}`}
            >
              <div className={`h-36 sm:h-44 ${textureClass[cat.texture]}`} />
              <div className="p-5 bg-ink-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-stone">{cat.ref}</p>
                <h3 className="mt-1.5 font-display font-semibold text-lg text-paper">
                  {cat.label}
                </h3>
                <p className="mt-2 text-sm text-paper/70 leading-relaxed">{cat.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
