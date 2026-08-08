import LogoMark from './LogoMark.jsx'
import { FacebookIcon, InstagramIcon, TikTokIcon } from './icons.jsx'
import { BUSINESS } from '../lib/content.js'

const SOCIALS = [
  { href: BUSINESS.facebook, icon: FacebookIcon, label: 'Facebook' },
  { href: BUSINESS.instagram, icon: InstagramIcon, label: 'Instagram' },
  { href: BUSINESS.tiktok, icon: TikTokIcon, label: 'TikTok' },
]

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-stone/20 py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-col sm:flex-row justify-between gap-8">
        <div className="flex items-start gap-3">
          <LogoMark size={38} />
          <div>
            <p className="font-display font-semibold text-paper">{BUSINESS.name}</p>
            <p className="text-sm text-stone mt-1 max-w-xs">{BUSINESS.address}</p>
            <p className="text-sm text-stone mt-1">
              <a href={`tel:${BUSINESS.phoneTel}`} className="hover:text-paper transition-colors">
                {BUSINESS.phoneDisplay}
              </a>
              {' · '}
              <a href={`mailto:${BUSINESS.email}`} className="hover:text-paper transition-colors">
                {BUSINESS.email}
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          {SOCIALS.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-10 h-10 rounded-full border border-stone/30 flex items-center justify-center text-stone hover:text-paper hover:border-paper/50 transition-colors"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-stone/70">
        © {new Date().getFullYear()} {BUSINESS.name} — Ahnif, Bouira, Algérie.
      </p>
    </footer>
  )
}
