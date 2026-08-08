import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { adminApi } from '../api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function ParametresPage() {
  const { admin } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [newCodes, setNewCodes] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setError('')
    setLoading(true)
    try {
      const codes = await adminApi.post('/auth/2fa/backup-codes/regenerate')
      setNewCodes(codes)
      setConfirmOpen(false)
    } catch (err) {
      setError(err.message)
      setConfirmOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10 max-w-xl">
      <h1 className="font-display font-semibold text-2xl text-paper">Paramètres</h1>

      <div className="mt-8 rounded-2xl border border-stone/25 bg-ink-2 p-6">
        <h2 className="font-display font-semibold text-lg text-paper">Compte</h2>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">Email</dt>
            <dd className="text-paper">{admin?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">Double authentification</dt>
            <dd className={admin?.totp_enabled ? 'text-sage-light' : 'text-clay-light'}>
              {admin?.totp_enabled ? 'Activée' : 'Désactivée'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-2xl border border-stone/25 bg-ink-2 p-6">
        <h2 className="font-display font-semibold text-lg text-paper">Codes de secours</h2>
        <p className="mt-2 text-sm text-paper/70">
          En cas de perte du téléphone, ces codes à usage unique permettent de se connecter sans code
          d'authentification. Régénérer invalide immédiatement les anciens codes.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-clay/40 bg-clay/10 px-4 py-2.5 text-sm text-clay-light">
            {error}
          </p>
        )}

        {newCodes && (
          <div className="mt-4 rounded-xl border border-clay/40 bg-clay/10 p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-clay-light mb-2">
              Nouveaux codes — à noter maintenant, affichés une seule fois
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-paper">
              {newCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className="mt-4 rounded-full border border-stone/30 px-5 py-2.5 text-sm text-paper hover:border-paper/50 transition-colors disabled:opacity-50"
        >
          Régénérer les codes de secours
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRegenerate}
        title="Régénérer les codes de secours"
        message="Les anciens codes seront immédiatement invalidés. Continuer ?"
        confirmLabel="Régénérer"
      />
    </div>
  )
}
