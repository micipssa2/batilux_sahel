export function formatPrice(value) {
  if (value === null || value === undefined) return null
  return `${new Intl.NumberFormat('fr-FR').format(value)} DA`
}
