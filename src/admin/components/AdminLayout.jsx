import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import LogoMark from '../../components/LogoMark.jsx'
import { useAuth } from '../AuthContext.jsx'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/familles', label: 'Familles' },
  { to: '/admin/produits', label: 'Produits' },
  { to: '/admin/journal', label: "Journal d'activité" },
  { to: '/admin/parametres', label: 'Paramètres' },
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink flex">
      <aside className="w-60 shrink-0 border-r border-stone/20 bg-ink-2 flex flex-col">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-stone/20">
          <LogoMark size={30} />
          <span className="font-display font-semibold text-paper text-sm">Batilux Sahel</span>
        </div>

        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 font-mono text-xs uppercase tracking-wider">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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

        <div className="px-5 py-4 border-t border-stone/20">
          <p className="text-xs text-stone truncate">{admin?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 font-mono text-xs uppercase tracking-wider text-clay-light hover:text-paper transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
