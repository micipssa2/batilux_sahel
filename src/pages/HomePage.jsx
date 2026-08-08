import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Categories from '../components/Categories.jsx'
import GrosDetail from '../components/GrosDetail.jsx'
import Gallery from '../components/Gallery.jsx'
import LocationSection from '../components/LocationSection.jsx'
import Contact from '../components/Contact.jsx'

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Categories />
      <GrosDetail />
      <Gallery />
      <LocationSection />
      <Contact />
    </>
  )
}
