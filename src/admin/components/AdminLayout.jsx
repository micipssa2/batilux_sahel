import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LogoMark from '../../components/LogoMark.jsx'
import { CloseIcon, MenuIcon } from '../../components/icons.jsx'
import { useAuth } from '../AuthContext.jsx'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/familles', label: 'Familles' },
  { to: '/admin/produits', label: 'Produits' },
  { to: '/admin/journal', label: "Journal d'activité" },
  { to: '/admin/parametres', label: 'Paramètres' },
]

function SidebarContent({ admin, onLogout, onNavigate, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2.5 px-5 h-16 border-b border-stone/20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoMark size={30} />
          <span className="font-display font-semibold text-paper text-sm truncate">Batilux Sahel</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="p-1.5 -mr-1.5 text-stone hover:text-paper transition-colors shrink-0"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1 font-mono text-xs uppercase tracking-wider overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? 'bg-sage/15 text-sage-light' : 'text-stone hover:text-paper hover:bg-ink-3'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-stone/20 shrink-0">
        <p className="text-xs text-stone truncate">{admin?.email}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 font-mono text-xs uppercase tracking-wider text-clay-light hover:text-paper transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Ferme le tiroir mobile automatiquement à chaque changement de page.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const currentLabel =
    NAV.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))?.label ??
    'Admin'

  return (
    <div className="min-h-screen bg-ink lg:flex">
      {/* Sidebar desktop : fixe, toujours visible à partir de lg (≥1024px) */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-stone/20 bg-ink-2 flex-col">
        <SidebarContent admin={admin} onLogout={handleLogout} />
      </aside>

      {/* Barre du haut mobile/tablette : remplace la sidebar sous lg */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 border-b border-stone/20 bg-ink-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoMark size={26} />
          <span className="font-display font-semibold text-paper text-sm truncate">{currentLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 -mr-2 text-stone hover:text-paper transition-colors shrink-0"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Tiroir mobile : overlay + panneau glissant, fermé par défaut */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed inset-0 z-[90] bg-ink/80"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="lg:hidden fixed inset-y-0 left-0 z-[100] w-72 max-w-[80vw] bg-ink-2 border-r border-stone/20 flex flex-col"
            >
              <SidebarContent
                admin={admin}
                onLogout={handleLogout}
                onNavigate={() => setMenuOpen(false)}
                onClose={() => setMenuOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
