import { motion } from 'framer-motion'
import Eyebrow from './Eyebrow.jsx'
import { ClockIcon, PinIcon } from './icons.jsx'
import { BUSINESS } from '../lib/content.js'

export default function LocationSection() {
  return (
    <section id="localisation" className="cv-auto bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <Eyebrow tone="clay">Où nous trouver</Eyebrow>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper">
            Ahnif centre, wilaya de Bouira.
          </h2>

          <div className="mt-8 rounded-2xl border border-stone/25 bg-ink-2 plaque p-6">
            <div className="flex items-start gap-3">
              <PinIcon className="w-5 h-5 mt-0.5 text-sage-light shrink-0" />
              <p className="text-paper/90">{BUSINESS.address}</p>
            </div>
            <div className="mt-5 pt-5 border-t border-stone/20 space-y-2">
              <div className="flex items-center gap-3 text-stone font-mono text-xs uppercase tracking-wider mb-2">
                <ClockIcon className="w-4 h-4" /> Horaires
              </div>
              {BUSINESS.hours.map((h) => (
                <div key={h.days} className="flex justify-between text-sm text-paper/85">
                  <span>{h.days}</span>
                  <span className="text-stone">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="rounded-2xl overflow-hidden border border-stone/25 h-80 sm:h-full min-h-80"
        >
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3213.9234529391533!2d4.260303111651456!3d36.33840499347916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128c5bfd1d3d24a3%3A0x12bfb3d1f748887d!2sBATILUX%20SAHEL!5e0!3m2!1sfr!2sdz!4v1786266509857!5m2!1sfr!2sdz"
            width="600" height="450" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </motion.div>
      </div>
    </section>
  )
}
