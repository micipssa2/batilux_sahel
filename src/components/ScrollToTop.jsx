import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return // laisse le navigateur gérer le scroll vers l'ancre
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
