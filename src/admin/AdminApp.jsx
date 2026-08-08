import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import FamillesPage from './pages/FamillesPage.jsx'
import JournalPage from './pages/JournalPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ParametresPage from './pages/ParametresPage.jsx'
import ProduitFormPage from './pages/ProduitFormPage.jsx'
import ProduitsPage from './pages/ProduitsPage.jsx'

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="familles" element={<FamillesPage />} />
          <Route path="produits" element={<ProduitsPage />} />
          <Route path="produits/:id" element={<ProduitFormPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="parametres" element={<ParametresPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
