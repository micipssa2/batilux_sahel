import { useEffect, useState } from 'react'
import Pagination from '../../components/catalogue/Pagination.jsx'
import { adminApi } from '../api.js'

const PAGE_SIZE = 30

const ACTION_LABELS = {
  login: 'Connexion',
  login_password: 'Mot de passe validé',
  '2fa_setup': 'Configuration 2FA',
  '2fa_verify': 'Vérification 2FA',
  token_refresh: 'Renouvellement session',
  logout: 'Déconnexion',
  famille_creation: 'Création famille',
  famille_modification: 'Modification famille',
  famille_suppression: 'Suppression famille',
  famille_reorganisation: 'Réorganisation familles',
  produit_creation: 'Création produit',
  produit_modification: 'Modification produit',
  produit_suppression: 'Suppression produit',
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function JournalPage() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [resultat, setResultat] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    adminApi
      .get('/admin/activity-logs', {
        page,
        page_size: PAGE_SIZE,
        action: action || undefined,
        resultat: resultat || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      .then(setResult)
      .catch((err) => setError(err.message))
  }, [page, action, resultat, dateFrom, dateTo])

  const selectClass =
    'rounded-full border border-stone/30 bg-ink-2 px-4 py-2 text-sm text-paper focus:outline-none focus:border-sage-light transition-colors'

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10">
      <h1 className="font-display font-semibold text-2xl text-paper">Journal d'activité</h1>
      <p className="mt-1 text-sm text-stone">{result ? `${result.total} entrée${result.total > 1 ? 's' : ''}` : '…'}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={resultat}
          onChange={(e) => {
            setResultat(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">Tous résultats</option>
          <option value="succes">Succès</option>
          <option value="echec">Échec</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        />
      </div>

      {error && <p className="mt-6 text-clay-light">{error}</p>}
      {!result && !error && <p className="mt-8 text-stone">Chargement…</p>}
      {result && result.items.length === 0 && <p className="mt-8 text-stone">Aucune entrée pour ces filtres.</p>}

      {result && result.items.length > 0 && (
        <>
          <div className="mt-6 rounded-2xl border border-stone/25 bg-ink-2 divide-y divide-stone/15 overflow-hidden">
            {result.items.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 text-sm">
                <span className="w-36 shrink-0 font-mono text-xs text-stone pt-0.5">{formatDate(log.created_at)}</span>
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.resultat === 'succes' ? 'bg-sage-light' : 'bg-clay-light'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-paper">{ACTION_LABELS[log.action] ?? log.action}</p>
                  {log.details && <p className="text-xs text-stone mt-0.5">{log.details}</p>}
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-stone">
                  <p>{log.admin_email ?? '—'}</p>
                  <p>{log.ip_address}</p>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.total_pages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
