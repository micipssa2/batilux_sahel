import { useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import ImagePlaceholder from '../../components/ImagePlaceholder.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FamilleForm from '../components/FamilleForm.jsx'
import Modal from '../components/Modal.jsx'

export default function FamillesPage() {
  const [familles, setFamilles] = useState(null)
  const [error, setError] = useState('')
  const [modalFamille, setModalFamille] = useState(undefined) // undefined = fermé, null = création, objet = édition
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    try {
      const data = await adminApi.get('/admin/familles')
      setFamilles(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleSaved() {
    setModalFamille(undefined)
    load()
  }

  async function handleDelete() {
    setDeleteError('')
    try {
      await adminApi.delete(`/admin/familles/${deleteTarget.id}`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  async function move(famille, direction, sorted) {
    const index = sorted.findIndex((f) => f.id === famille.id)
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= sorted.length) return
    const a = sorted[index]
    const b = sorted[swapIndex]
    try {
      await adminApi.patch('/admin/familles/reorder', {
        items: [
          { id: a.id, ordre: b.ordre },
          { id: b.id, ordre: a.ordre },
        ],
      })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const sorted = familles ? [...familles].sort((a, b) => a.ordre - b.ordre) : []

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-paper">Familles</h1>
          <p className="mt-1 text-sm text-stone">Catégories du catalogue.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalFamille(null)}
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-paper hover:bg-sage-deep transition-colors shrink-0"
        >
          Nouvelle famille
        </button>
      </div>

      {error && <p className="mt-6 text-clay-light">{error}</p>}
      {!familles && !error && <p className="mt-8 text-stone">Chargement…</p>}
      {familles && familles.length === 0 && <p className="mt-8 text-stone">Aucune famille pour l'instant.</p>}

      {familles && familles.length > 0 && (
        <div className="mt-8 rounded-2xl border border-stone/25 bg-ink-2 divide-y divide-stone/15">
          {sorted.map((f, i) => (
            <div key={f.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col gap-0.5 font-mono text-xs shrink-0">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(f, -1, sorted)}
                    className="text-stone hover:text-paper disabled:opacity-20 disabled:hover:text-stone transition-colors"
                    aria-label="Monter"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === sorted.length - 1}
                    onClick={() => move(f, 1, sorted)}
                    className="text-stone hover:text-paper disabled:opacity-20 disabled:hover:text-stone transition-colors"
                    aria-label="Descendre"
                  >
                    ▼
                  </button>
                </div>

                <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-ink-3 texture-dot">
                  {f.image ? <img src={f.image} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-paper truncate">{f.nom}</p>
                    {!f.actif && (
                      <span className="rounded-full bg-ink-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone">
                    {f.nb_produits} produit{f.nb_produits > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 font-mono text-xs uppercase tracking-wider shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setModalFamille(f)}
                  className="rounded-full border border-stone/30 px-3 py-1.5 text-paper hover:border-paper/50 transition-colors"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(f)
                    setDeleteError('')
                  }}
                  className="rounded-full border border-clay/40 px-3 py-1.5 text-clay-light hover:bg-clay/10 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalFamille !== undefined}
        onClose={() => setModalFamille(undefined)}
        title={modalFamille ? 'Modifier la famille' : 'Nouvelle famille'}
      >
        {modalFamille !== undefined && (
          <FamilleForm famille={modalFamille} onSaved={handleSaved} onCancel={() => setModalFamille(undefined)} />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la famille"
        message={`Supprimer « ${deleteTarget?.nom} » ? Cette action est irréversible.`}
        error={deleteError}
        confirmLabel="Supprimer"
      />
    </div>
  )
}
