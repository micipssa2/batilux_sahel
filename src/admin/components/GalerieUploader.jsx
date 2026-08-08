import { useState } from 'react'
import { CloseIcon } from '../../components/icons.jsx'
import { adminApi } from '../api.js'

const fileInputClass =
  'text-sm text-stone file:mr-3 file:rounded-full file:border-0 file:bg-ink-3 file:px-3 file:py-1.5 file:text-xs file:text-paper file:font-mono file:uppercase file:tracking-wider file:cursor-pointer'

export default function GalerieUploader({ produit, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const data = await adminApi.get(`/admin/produits/${produit.id}`)
    onChange(data)
  }

  async function handlePrincipaleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const updated = await adminApi.postForm(`/admin/produits/${produit.id}/image-principale`, formData)
      onChange(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemovePrincipale() {
    setError('')
    try {
      const updated = await adminApi.delete(`/admin/produits/${produit.id}/image-principale`)
      onChange(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddGalleryImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await adminApi.postForm(`/admin/produits/${produit.id}/images`, formData)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDeleteGalleryImage(imageId) {
    setError('')
    try {
      await adminApi.delete(`/admin/produits/${produit.id}/images/${imageId}`)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function moveGalleryImage(index, direction) {
    const images = produit.images
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= images.length) return
    const a = images[index]
    const b = images[swapIndex]
    setError('')
    try {
      await adminApi.patch(`/admin/produits/${produit.id}/images/reorder`, {
        items: [
          { id: a.id, ordre: b.ordre },
          { id: b.id, ordre: a.ordre },
        ],
      })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p className="rounded-lg border border-clay/40 bg-clay/10 px-4 py-2.5 text-sm text-clay-light">{error}</p>
      )}

      <div>
        <h2 className="font-display font-semibold text-lg text-paper">Image principale</h2>
        <div className="mt-3 flex items-start gap-4">
          <div className="h-32 w-32 shrink-0 rounded-lg overflow-hidden bg-ink-3 texture-dot border border-stone/25">
            {produit.image_principale && (
              <img src={produit.image_principale} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePrincipaleChange}
              disabled={uploading}
              className={fileInputClass}
            />
            {produit.image_principale && (
              <button
                type="button"
                onClick={handleRemovePrincipale}
                className="self-start text-xs font-mono uppercase tracking-wider text-clay-light hover:text-clay transition-colors"
              >
                Retirer l'image
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-paper">Galerie</h2>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {produit.images.map((img, i) => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-stone/25">
              <img src={img.url} alt={img.alt_text ?? ''} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                <div className="flex gap-1 font-mono text-xs">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveGalleryImage(i, -1)}
                    className="p-1 text-paper disabled:opacity-30"
                    aria-label="Précédent"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={i === produit.images.length - 1}
                    onClick={() => moveGalleryImage(i, 1)}
                    className="p-1 text-paper disabled:opacity-30"
                    aria-label="Suivant"
                  >
                    ▶
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryImage(img.id)}
                  className="p-1 text-clay-light hover:text-clay transition-colors"
                  aria-label="Supprimer"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          <label
            className={`flex items-center justify-center aspect-square rounded-lg border-2 border-dashed border-stone/30 text-stone hover:border-stone/50 hover:text-paper transition-colors cursor-pointer ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <span className="text-2xl leading-none">+</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAddGalleryImage}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
