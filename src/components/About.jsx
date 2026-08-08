import { motion } from 'framer-motion'
import Eyebrow from './Eyebrow.jsx'
import { PinIcon, PhoneIcon } from './icons.jsx'
import { BUSINESS } from '../lib/content.js'

export default function About() {
  return (
    <section id="apropos" className="cv-auto bg-ink-2 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <Eyebrow>L'atelier</Eyebrow>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper leading-tight max-w-xl">
            Un point de vente ancré à Ahnif, pensé pour le chantier comme pour la maison.
          </h2>
          <p className="mt-6 text-paper/75 text-base sm:text-lg leading-relaxed max-w-xl">
            Depuis Ahnif centre, dans la wilaya de Bouira, Batilux Sahel approvisionne
            les entreprises du bâtiment en gros volumes et conseille les particuliers
            dans le choix de leurs finitions. Même adresse, même stock — deux façons
            de servir : la palette et le camion pour les uns, le pot et le bon conseil
            pour les autres.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl border border-stone/25 bg-ink plaque p-6 sm:p-7"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-stone mb-5">
            Fiche magasin
          </p>
          <ul className="space-y-4 text-paper/90">
            <li className="flex items-start gap-3">
              <PinIcon className="w-5 h-5 mt-0.5 text-sage-light shrink-0" />
              <span>{BUSINESS.address}</span>
            </li>
            <li className="flex items-start gap-3">
              <PhoneIcon className="w-5 h-5 mt-0.5 text-sage-light shrink-0" />
              <a href={`tel:${BUSINESS.phoneTel}`} className="hover:text-sage-light transition-colors">
                {BUSINESS.phoneDisplay}
              </a>
            </li>
          </ul>
          <div className="mt-6 pt-6 border-t border-stone/20 flex gap-6 text-sm text-stone">
            <div>
              <p className="text-paper font-medium">Gros</p>
              <p>Entreprises &amp; chantiers</p>
            </div>
            <div>
              <p className="text-paper font-medium">Détail</p>
              <p>Particuliers</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
