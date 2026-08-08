import { getRefreshFn, getToken } from './tokenStore.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, { method = 'GET', body, isFormData = false, params, retry = true } = {}) {
  let query = ''
  if (params) {
    const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    if (usable.length > 0) query = '?' + new URLSearchParams(usable).toString()
  }

  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}${query}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (res.status === 401 && retry) {
    try {
      await getRefreshFn()()
      return request(path, { method, body, isFormData, params, retry: false })
    } catch {
      // le refresh a échoué : on laisse remonter le 401 d'origine ci-dessous
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.detail || `Erreur ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const adminApi = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
}
