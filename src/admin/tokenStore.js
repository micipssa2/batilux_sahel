// Le token d'accès vit en mémoire (jamais localStorage — évite l'exposition
// XSS d'un token volable par du JS injecté). AuthContext.jsx est la source
// de vérité pour le rendu React ; ce module miroir permet à api.js (client
// HTTP, hors arbre React) de toujours lire le token courant sans avoir à le
// prop-driller partout.

let currentToken = null
let refreshFn = async () => {
  throw new Error('AuthProvider non monté')
}

export function setToken(token) {
  currentToken = token
}

export function getToken() {
  return currentToken
}

export function setRefreshFn(fn) {
  refreshFn = fn
}

export function getRefreshFn() {
  return refreshFn
}
