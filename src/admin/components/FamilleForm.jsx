import { useState } from 'react'
import { adminApi } from '../api.js'

const inputClass =
  'w-full rounded-lg border border-stone/30 bg-ink-3 px-3.5 py-2.5 text-sm text-paper placeholder:text-stone focus:outline-none focus:border-sage-light transition-colors'
const labelClass = 'block text-xs font-mono uppercase tracking-wider text-stone mb-1.5'

export default function FamilleForm({ famille, onSaved, onCancel }) {
  const isEdit = Boolean(famille)
  const [nom, setNom] = useState(famille?.nom ?? '')
  const [description, setDescription] = useState(famille?.description ?? '')
  const [actif, setActif] = useState(famille?.actif ?? true)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(famille?.image ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { nom, description: description || null, actif }
      let saved = isEdit
        ? await adminApi.put(`/admin/familles/${famille.id}`, payload)
        : await adminApi.post('/admin/familles', payload)

      // L'endpoint d'upload a besoin d'un ID existant : pour une création,
      // on crée d'abord la famille, puis on envoie l'image si fournie.
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        saved = await adminApi.postForm(`/admin/familles/${saved.id}/image`, formData)
      }

      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-clay/40 bg-clay/10 px-4 py-2.5 text-sm text-clay-light">{error}</p>
      )}

      <div>
        <label className={labelClass}>Nom</label>
        <input required autoFocus value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Image</label>
        {imagePreview && (
          <img
            src={imagePreview}
            alt=""
            className="mb-2 h-28 w-full object-cover rounded-lg border border-stone/25"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="text-sm text-stone file:mr-3 file:rounded-full file:border-0 file:bg-ink-3 file:px-3 file:py-1.5 file:text-xs file:text-paper file:font-mono file:uppercase file:tracking-wider file:cursor-pointer"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-paper">
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="rounded border-stone/40"
        />
        Famille active (visible sur le site)
      </label>

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-stone/30 px-4 py-2 text-sm text-paper hover:border-paper/50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage px-5 py-2 text-sm font-medium text-paper hover:bg-sage-deep transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  )
}
