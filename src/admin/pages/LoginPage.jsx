import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoMark from '../../components/LogoMark.jsx'
import { useAuth } from '../AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function post(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || 'Une erreur est survenue')
  return data
}

const inputClass =
  'w-full rounded-xl border border-stone/30 bg-ink-2 px-4 py-3 text-sm text-paper placeholder:text-stone focus:outline-none focus:border-sage-light transition-colors'
const buttonClass =
  'w-full rounded-full bg-sage px-6 py-3 font-medium text-paper hover:bg-sage-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [step, setStep] = useState('credentials') // credentials | setup-2fa | verify-2fa
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [preAuthToken, setPreAuthToken] = useState(null)
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function completeSession(token) {
    const me = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
      r.json()
    )
    login(token, me)
    navigate('/admin', { replace: true })
  }

  async function handleCredentials(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await post('/auth/login', { email, password })
      setPreAuthToken(data.pre_auth_token)
      if (data.requires_totp_setup) {
        const setup = await post('/auth/2fa/setup', {}, data.pre_auth_token)
        setSetupData(setup)
        setStep('setup-2fa')
      } else {
        setStep('verify-2fa')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm2fa(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await post('/auth/2fa/confirm', { code }, preAuthToken)
      await completeSession(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify2fa(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = useBackupCode ? { backup_code: code } : { code }
      const data = await post('/auth/2fa/verify', body, preAuthToken)
      await completeSession(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <LogoMark size={48} />
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-stone">Administration</p>
        </div>

        <div className="rounded-2xl border border-stone/25 bg-ink-2 p-6 sm:p-8">
          {error && (
            <p className="mb-4 rounded-lg border border-clay/40 bg-clay/10 px-4 py-2.5 text-sm text-clay-light">
              {error}
            </p>
          )}

          {step === 'credentials' && (
            <form onSubmit={handleCredentials} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Connexion…' : 'Continuer'}
              </button>
            </form>
          )}

          {step === 'setup-2fa' && setupData && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm text-paper/80">
                  Première connexion — configure la double authentification. Scanne ce QR code avec Google
                  Authenticator, Microsoft Authenticator ou Authy.
                </p>
                <div className="mt-4 flex justify-center rounded-xl bg-paper p-4">
                  <img src={setupData.qr_code_data_uri} alt="QR code 2FA" className="w-48 h-48" />
                </div>
                <p className="mt-2 text-center font-mono text-[11px] text-stone break-all">{setupData.secret}</p>
              </div>

              <div className="rounded-xl border border-clay/40 bg-clay/10 p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-clay-light mb-2">
                  Codes de secours — à noter maintenant, affichés une seule fois
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-paper">
                  {setupData.backup_codes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleConfirm2fa} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone mb-1.5">
                    Code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} text-center tracking-[0.4em] font-mono text-lg`}
                  />
                </div>
                <button type="submit" disabled={loading || code.length !== 6} className={buttonClass}>
                  {loading ? 'Vérification…' : 'Activer la 2FA'}
                </button>
              </form>
            </div>
          )}

          {step === 'verify-2fa' && (
            <form onSubmit={handleVerify2fa} className="flex flex-col gap-4">
              <p className="text-sm text-paper/80">
                {useBackupCode
                  ? 'Entre un de tes codes de secours à usage unique.'
                  : "Entre le code à 6 chiffres de ton application d'authentification."}
              </p>
              <input
                type="text"
                inputMode={useBackupCode ? 'text' : 'numeric'}
                maxLength={useBackupCode ? 20 : 6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(useBackupCode ? e.target.value : e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} text-center tracking-[0.3em] font-mono text-lg`}
              />
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Vérification…' : 'Se connecter'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode((v) => !v)
                  setCode('')
                  setError('')
                }}
                className="text-xs font-mono uppercase tracking-wider text-stone hover:text-paper transition-colors"
              >
                {useBackupCode ? 'Utiliser le code de l’application' : 'Utiliser un code de secours'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
