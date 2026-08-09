import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import LogoMark from './LogoMark.jsx'
import { WhatsAppIcon, MenuIcon, CloseIcon } from './icons.jsx'
import { BUSINESS, NAV_LINKS } from '../lib/content.js'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-ink/95 border-b border-stone/20' : 'bg-transparent'
        }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 flex items-center justify-between h-16 sm:h-20">
        {/* Sur la homepage : comportement d'origine inchangé (ancre #top).
            Ailleurs : ramène simplement à l'accueil. */}
        <a href={isHome ? '#top' : '/'} className="flex items-center gap-3 shrink-0">
          <LogoMark size={40} />
          <span className="font-display font-semibold text-paper text-lg tracking-tight hidden sm:inline">
            Batilux Sahel
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7 font-mono text-xs uppercase tracking-wider text-stone">
          <Link to="/catalogue" className="hover:text-paper transition-colors">
            Catalogue
          </Link>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={isHome ? l.href : `/${l.href}`} className="hover:text-paper transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 text-paper"
          >
            {open ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden bg-ink border-b border-stone/20"
          >
            <div className="px-5 py-4 flex flex-col gap-4 font-mono text-sm uppercase tracking-wider text-stone">
              <Link to="/catalogue" onClick={() => setOpen(false)} className="hover:text-paper">
                Catalogue
              </Link>
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={isHome ? l.href : `/${l.href}`}
                  onClick={() => setOpen(false)}
                  className="hover:text-paper"
                >
                  {l.label}
                </a>
              ))}

            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
