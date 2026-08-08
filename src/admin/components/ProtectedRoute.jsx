import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { admin, bootstrapping } = useAuth()

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="font-mono text-sm text-stone">Chargement…</p>
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
