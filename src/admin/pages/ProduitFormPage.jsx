import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from '../../components/icons.jsx'
import { adminApi } from '../api.js'
import CaracteristiquesEditor from '../components/CaracteristiquesEditor.jsx'
import GalerieUploader from '../components/GalerieUploader.jsx'

const inputClass =
  'w-full rounded-lg border border-stone/30 bg-ink-3 px-3.5 py-2.5 text-sm text-paper placeholder:text-stone focus:outline-none focus:border-sage-light transition-colors'
const labelClass = 'block text-xs font-mono uppercase tracking-wider text-stone mb-1.5'

const emptyForm = {
  nom: '',
  famille_id: '',
  description: '',
  prix: '',
  reference: '',
  marque: '',
  en_vedette: false,
  en_promotion: false,
  actif: true,
  caracteristiques: [],
}

export default function ProduitFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nouveau'

  const [familles, setFamilles] = useState([])
  const [produit, setProduit] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.get('/admin/familles').then(setFamilles).catch(() => {})
  }, [])

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm)
      setProduit(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    adminApi
      .get(`/admin/produits/${id}`)
      .then((data) => {
        if (cancelled) return
        setProduit(data)
        setForm({
          nom: data.nom,
          famille_id: data.famille_id,
          description: data.description ?? '',
          prix: data.prix ?? '',
          reference: data.reference,
          marque: data.marque ?? '',
          en_vedette: data.en_vedette,
          en_promotion: data.en_promotion,
          actif: data.actif,
          caracteristiques: data.caracteristiques.map((c) => ({ nom: c.nom, valeur: c.valeur })),
        })
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        famille_id: Number(form.famille_id),
        description: form.description || null,
        prix: form.prix === '' ? null : Number(form.prix),
        reference: form.reference,
        marque: form.marque || null,
        en_vedette: form.en_vedette,
        en_promotion: form.en_promotion,
        actif: form.actif,
        caracteristiques: form.caracteristiques.filter((c) => c.nom.trim() && c.valeur.trim()),
      }
      if (isNew) {
        const created = await adminApi.post('/admin/produits', payload)
        // Les images ne peuvent être ajoutées qu'une fois le produit créé
        // (l'endpoint d'upload a besoin d'un ID) — on bascule en mode édition.
        navigate(`/admin/produits/${created.id}`, { replace: true })
      } else {
        const updated = await adminApi.put(`/admin/produits/${id}`, payload)
        setProduit(updated)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (notFound) {
    return (
      <div className="px-6 sm:px-10 py-10">
        <p className="text-paper/70">Ce produit n'existe pas.</p>
        <Link
          to="/admin/produits"
          className="mt-3 inline-flex items-center gap-2 text-sage-light hover:text-paper transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Retour à la liste
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-6 sm:px-10 py-10">
        <p className="text-stone">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10 max-w-3xl">
      <Link
        to="/admin/produits"
        className="inline-flex items-center gap-2 text-sm text-stone hover:text-paper transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Produits
      </Link>

      <h1 className="mt-4 font-display font-semibold text-2xl text-paper">
        {isNew ? 'Nouveau produit' : form.nom}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {error && (
          <p className="rounded-lg border border-clay/40 bg-clay/10 px-4 py-2.5 text-sm text-clay-light">{error}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nom</label>
            <input
              required
              value={form.nom}
              onChange={(e) => updateField('nom', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Famille</label>
            <select
              required
              value={form.famille_id}
              onChange={(e) => updateField('famille_id', e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Choisir…
              </option>
              {familles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Référence</label>
            <input
              required
              value={form.reference}
              onChange={(e) => updateField('reference', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Marque</label>
            <input value={form.marque} onChange={(e) => updateField('marque', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prix (DA)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.prix}
              onChange={(e) => updateField('prix', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2.5 text-sm text-paper">
            <input
              type="checkbox"
              checked={form.actif}
              onChange={(e) => updateField('actif', e.target.checked)}
              className="rounded border-stone/40"
            />
            Actif
          </label>
          <label className="flex items-center gap-2.5 text-sm text-paper">
            <input
              type="checkbox"
              checked={form.en_vedette}
              onChange={(e) => updateField('en_vedette', e.target.checked)}
              className="rounded border-stone/40"
            />
            En vedette
          </label>
          <label className="flex items-center gap-2.5 text-sm text-paper">
            <input
              type="checkbox"
              checked={form.en_promotion}
              onChange={(e) => updateField('en_promotion', e.target.checked)}
              className="rounded border-stone/40"
            />
            En promotion
          </label>
        </div>

        <div>
          <label className={labelClass}>Caractéristiques</label>
          <CaracteristiquesEditor
            items={form.caracteristiques}
            onChange={(items) => updateField('caracteristiques', items)}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-paper hover:bg-sage-deep transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : isNew ? 'Créer le produit' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {!isNew && produit && (
        <div className="mt-12 pt-8 border-t border-stone/20">
          <GalerieUploader produit={produit} onChange={setProduit} />
        </div>
      )}
    </div>
  )
}
