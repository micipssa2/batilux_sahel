import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import HomePage from './pages/HomePage.jsx'
import CataloguePage from './pages/CataloguePage.jsx'
import FamilleProduitsPage from './pages/FamilleProduitsPage.jsx'
import ProduitDetailPage from './pages/ProduitDetailPage.jsx'
import AdminApp from './admin/AdminApp.jsx'

function PublicSite() {
  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/catalogue/:familleSlug" element={<FamilleProduitsPage />} />
          <Route path="/produit/:slug" element={<ProduitDetailPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </>
  )
}
