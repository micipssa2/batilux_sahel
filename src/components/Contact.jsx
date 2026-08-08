import { useState } from 'react'
import { motion } from 'framer-motion'
import Eyebrow from './Eyebrow.jsx'
import { WhatsAppIcon, MessengerIcon, PhoneIcon, MailIcon } from './icons.jsx'
import { BUSINESS } from '../lib/content.js'
import { sendContactMessage, emailjsConfigured } from '../lib/emailjs.js'

const QUICK_LINKS = [
  {
    href: BUSINESS.whatsapp,
    icon: WhatsAppIcon,
    label: 'WhatsApp',
    value: BUSINESS.phoneDisplay,
  },
  {
    href: BUSINESS.messenger,
    icon: MessengerIcon,
    label: 'Messenger',
    value: 'Batilux Sahel',
  },
  {
    href: `tel:${BUSINESS.phoneTel}`,
    icon: PhoneIcon,
    label: 'Téléphone',
    value: BUSINESS.phoneDisplay,
  },
  {
    href: `mailto:${BUSINESS.email}`,
    icon: MailIcon,
    label: 'Email',
    value: BUSINESS.email,
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await sendContactMessage(form)
      setStatus('sent')
      setForm({ name: '', contact: '', message: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="cv-auto bg-ink-2 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 grid lg:grid-cols-[1fr_1.1fr] gap-12">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-paper max-w-md">
            Une question, un devis, une couleur à choisir ?
          </h2>
          <p className="mt-4 text-paper/70 max-w-md">
            Le plus rapide reste WhatsApp — réponse directe, photos et devis à l'appui.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map(({ href, icon: Icon, label, value }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 rounded-xl border border-stone/25 bg-ink px-4 py-3.5 hover:border-sage-light/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-sage-light shrink-0" />
                <span>
                  <span className="block text-xs text-stone font-mono uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="text-sm text-paper/90">{value}</span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone/25 bg-ink plaque p-6 sm:p-8 space-y-5"
        >
          <div>
            <label htmlFor="name" className="block text-sm text-stone mb-1.5">
              Nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-stone/30 bg-ink-2 px-4 py-2.5 text-paper placeholder:text-stone/60 focus:border-sage-light outline-none"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm text-stone mb-1.5">
              Téléphone ou email
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              required
              value={form.contact}
              onChange={handleChange}
              className="w-full rounded-lg border border-stone/30 bg-ink-2 px-4 py-2.5 text-paper placeholder:text-stone/60 focus:border-sage-light outline-none"
              placeholder="0770 00 00 00 ou email"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm text-stone mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              value={form.message}
              onChange={handleChange}
              className="w-full rounded-lg border border-stone/30 bg-ink-2 px-4 py-2.5 text-paper placeholder:text-stone/60 focus:border-sage-light outline-none resize-none"
              placeholder="Décrivez votre besoin (produit, quantité, chantier...)"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 font-medium text-paper hover:bg-sage-deep transition-colors disabled:opacity-60"
          >
            {status === 'sending' ? 'Envoi en cours…' : 'Envoyer le message'}
          </button>

          {status === 'sent' && (
            <p className="text-sm text-sage-light">Message envoyé. Nous revenons vers vous rapidement.</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-clay-light">
              Échec de l'envoi — contactez-nous directement sur WhatsApp en attendant.
            </p>
          )}
          {!emailjsConfigured && (
            <p className="text-xs text-stone">
              Formulaire non actif pour l'instant (identifiants EmailJS à renseigner dans .env).
            </p>
          )}
        </motion.form>
      </div>
    </section>
  )
}
