import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Categories from './components/Categories.jsx'
import GrosDetail from './components/GrosDetail.jsx'
import Gallery from './components/Gallery.jsx'
import LocationSection from './components/LocationSection.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <main>
        <Hero />
        <About />
        <Categories />
        <GrosDetail />
        <Gallery />
        <LocationSection />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
