import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { setRefreshFn, setToken as setStoreToken } from './tokenStore.js'

const AuthContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const setAccessToken = useCallback((token) => {
    setStoreToken(token)
    setAccessTokenState(token)
  }, [])

  const fetchMe = useCallback(async (token) => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('unauthorized')
    return res.json()
  }, [])

  // Rotation : demande un nouveau access_token via le cookie HttpOnly.
  // Mise à jour SYNCHRONE du tokenStore (avant le setState React) pour que
  // le client API puisse relire le token à jour immédiatement après, sans
  // attendre un re-render.
  const refresh = useCallback(async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!res.ok) {
      setAccessToken(null)
      setAdmin(null)
      throw new Error('refresh failed')
    }
    const data = await res.json()
    setAccessToken(data.access_token)
    return data.access_token
  }, [setAccessToken])

  useEffect(() => {
    setRefreshFn(refresh)
  }, [refresh])

  // Au chargement de l'app : tente une session existante (cookie refresh_token).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await refresh()
        const me = await fetchMe(token)
        if (!cancelled) setAdmin(me)
      } catch {
        // pas de session valide — reste déconnecté, c'est un état normal
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    (token, me) => {
      setAccessToken(token)
      setAdmin(me)
    },
    [setAccessToken]
  )

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
    } catch {
      // best effort — on déconnecte localement même si l'appel échoue
    }
    setAccessToken(null)
    setAdmin(null)
  }, [accessToken, setAccessToken])

  return (
    <AuthContext.Provider value={{ accessToken, admin, bootstrapping, login, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
