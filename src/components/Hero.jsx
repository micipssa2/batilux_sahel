import { motion, useReducedMotion } from 'framer-motion'
import { WhatsAppIcon, MessengerIcon } from './icons.jsx'
import LogoMark from './LogoMark.jsx'
import { BUSINESS } from '../lib/content.js'

const CHIPS = [
  { label: 'Peinture', color: 'bg-sage' },
  { label: 'Sol', color: 'bg-clay' },
  { label: 'Façade', color: 'bg-stone' },
  { label: 'Déco', color: 'bg-sage-light' },
]

export default function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="top"
      className="texture-render texture-grain relative overflow-hidden pt-28 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Trowel-wipe reveal: a single orchestrated load moment, skipped entirely for reduced motion */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          initial={{ clipPath: 'inset(0 0 0 0)' }}
          animate={{ clipPath: 'inset(0 0 0 100%)' }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
          className="absolute inset-0 bg-ink z-20"
        />
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.9 }}
          className="flex items-center gap-3 mb-8"
        >
          <LogoMark size={44} />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-stone">
            Gros &amp; détail — Ahnif, Bouira
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: reduceMotion ? 0 : 1.05 }}
          className="font-display font-semibold text-4xl sm:text-6xl lg:text-7xl leading-[1.03] text-paper max-w-3xl"
        >
          La finition qui tient,{' '}
          <span className="text-sage-light">du gros œuvre</span> à la touche finale.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : 1.2 }}
          className="mt-6 max-w-xl text-base sm:text-lg text-paper/80"
        >
          Peinture technique, revêtement mural et de sol, façade et décoration —
          Batilux Sahel équipe les professionnels du bâtiment et les particuliers
          d'Ahnif et de toute la wilaya de Bouira.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : 1.35 }}
          className="mt-9 flex flex-col sm:flex-row gap-3"
        >
          <a
            href={BUSINESS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-6 py-3.5 font-medium text-paper hover:bg-sage-deep transition-colors"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Écrire sur WhatsApp
          </a>
          <a
            href={BUSINESS.messenger}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-clay/60 px-6 py-3.5 font-medium text-paper hover:bg-clay/15 transition-colors"
          >
            <MessengerIcon className="w-5 h-5" />
            Contacter sur Messenger
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : 1.55 }}
          className="mt-14 inline-flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-stone/25 bg-ink-2/60 plaque px-5 py-3.5 font-mono text-xs uppercase tracking-wider text-stone"
        >
          {CHIPS.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
              {c.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
