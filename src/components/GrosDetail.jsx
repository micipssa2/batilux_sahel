import { motion } from 'framer-motion'
import { BUSINESS } from '../lib/content.js'
import { WhatsAppIcon } from './icons.jsx'

export default function GrosDetail() {
  return (
    <section id="gros-detail" className="relative bg-ink">
      <div
        aria-hidden
        className="hidden lg:block absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-sage via-clay to-sage -translate-x-1/2 rotate-1 z-10"
      />
      <div className="grid lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="bg-ink-3 px-5 sm:px-10 lg:px-14 py-16 sm:py-20"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-sage-light">01 — Gros</p>
          <h3 className="mt-3 font-display font-semibold text-2xl sm:text-3xl text-paper">
            Pour les professionnels du bâtiment
          </h3>
          <ul className="mt-6 space-y-3 text-paper/75">
            <li className="flex gap-3">
              <span className="text-sage-light">—</span> Tarifs adaptés aux volumes de chantier
            </li>
            <li className="flex gap-3">
              <span className="text-sage-light">—</span> Conseil technique sur les produits et finitions
            </li>
            <li className="flex gap-3">
              <span className="text-sage-light">—</span> Contact direct pour devis, par téléphone ou WhatsApp
            </li>
          </ul>
          <a
            href={BUSINESS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sage-light font-medium hover:text-paper transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" /> Demander un devis pro
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="bg-paper text-ink px-5 sm:px-10 lg:px-14 py-16 sm:py-20"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-clay-deep">02 — Détail</p>
          <h3 className="mt-3 font-display font-semibold text-2xl sm:text-3xl text-ink">
            Pour les particuliers
          </h3>
          <ul className="mt-6 space-y-3 text-ink/75">
            <li className="flex gap-3">
              <span className="text-clay-deep">—</span> Petites quantités disponibles
            </li>
            <li className="flex gap-3">
              <span className="text-clay-deep">—</span> Conseil couleur et finition en magasin
            </li>
            <li className="flex gap-3">
              <span className="text-clay-deep">—</span> Retrait directement à Ahnif centre
            </li>
          </ul>
          <a
            href={BUSINESS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-clay-deep font-medium hover:text-ink transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" /> Demander conseil
          </a>
        </motion.div>
      </div>
    </section>
  )
}
