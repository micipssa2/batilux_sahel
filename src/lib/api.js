// Client API minimal pour le catalogue public. Pas de librairie externe
// (fetch natif suffit) — même esprit que emailjs.js : un module focalisé,
// pas de sur-ingénierie.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, params) {
  let query = ''
  if (params) {
    const usable = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
    if (usable.length > 0) {
      query = '?' + new URLSearchParams(usable).toString()
    }
  }

  const res = await fetch(`${API_BASE}${path}${query}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Erreur ${res.status}`)
  }
  return res.json()
}

export function getFamilles() {
  return request('/familles')
}

export function getFamille(slug) {
  return request(`/familles/${encodeURIComponent(slug)}`)
}

export function getProduits(params) {
  return request('/produits', params)
}

export function getProduit(slug) {
  return request(`/produits/${encodeURIComponent(slug)}`)
}
