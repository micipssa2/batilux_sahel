import { CloseIcon } from '../../components/icons.jsx'

const fieldClass =
  'rounded-lg border border-stone/30 bg-ink-3 px-3 py-2 text-sm text-paper placeholder:text-stone focus:outline-none focus:border-sage-light transition-colors'

export default function CaracteristiquesEditor({ items, onChange }) {
  function updateItem(index, field, value) {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  function addItem() {
    onChange([...items, { nom: '', valeur: '' }])
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  function move(index, direction) {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= items.length) return
    const next = [...items]
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            placeholder="Nom (ex: Couleur)"
            value={item.nom}
            onChange={(e) => updateItem(i, 'nom', e.target.value)}
            className={`w-2/5 ${fieldClass}`}
          />
          <input
            placeholder="Valeur (ex: Blanc)"
            value={item.valeur}
            onChange={(e) => updateItem(i, 'valeur', e.target.value)}
            className={`flex-1 ${fieldClass}`}
          />
          <div className="flex gap-0.5 font-mono text-xs shrink-0">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              className="p-1 text-stone hover:text-paper disabled:opacity-20 disabled:hover:text-stone transition-colors"
              aria-label="Monter"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={i === items.length - 1}
              onClick={() => move(i, 1)}
              className="p-1 text-stone hover:text-paper disabled:opacity-20 disabled:hover:text-stone transition-colors"
              aria-label="Descendre"
            >
              ▼
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-1.5 text-clay-light hover:text-clay transition-colors shrink-0"
            aria-label="Supprimer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="mt-1 self-start rounded-full border border-stone/30 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-paper hover:border-paper/50 transition-colors"
      >
        + Ajouter une caractéristique
      </button>
    </div>
  )
}
