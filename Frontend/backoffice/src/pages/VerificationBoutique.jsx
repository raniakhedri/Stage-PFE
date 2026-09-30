import { useCallback, useEffect, useState } from 'react'
import { readUser, storeSession } from '../lib/sellio'
import { useSellioTheme, ThemeToggle } from '../lib/sellioTheme'
import { SellioLogo, DISPLAY, MONO } from '../components/sellio/brand'
import IdentityStep, { emptyIdentity, identityError } from '../components/sellio/IdentityStep'
import CardStep, { cardComplete } from '../components/sellio/CardStep'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

function authFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`, ...(options.headers || {}) },
  })
}

function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.replace('/')
}

/** Where a merchant waits while Sellio reviews their identity file. */
export default function VerificationBoutique() {
  const user = readUser()
  const theme = useSellioTheme()
  const { t } = theme
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [resubmitting, setResubmitting] = useState(false)
  const [identity, setIdentity] = useState(emptyIdentity)
  const [card, setCard] = useState(null)
  const [sending, setSending] = useState(false)

  const refresh = useCallback(async () => {
    const res = await authFetch('/auth/my-shop/verification')
    if (res.status === 401 || res.status === 403) {
      logout()
      return
    }
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      // No shop yet: the merchant still has to fill in the creation wizard.
      window.location.replace('/nouvelle-boutique')
      return
    }
    setStatus(data)
    if (data.shopStatus === 'ACTIVE') {
      const me = await authFetch('/auth/me').then((r) => (r.ok ? r.json() : null)).catch(() => null)
      if (me) storeSession(localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'), me)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(() => { if (!resubmitting) refresh() }, 15000)
    return () => clearInterval(id)
  }, [refresh, resubmitting])

  const resubmit = async () => {
    const message = identityError(identity) || (!cardComplete(card) ? 'Vérifiez une carte bancaire.' : '')
    if (message) {
      setError(message)
      return
    }
    setError('')
    setSending(true)
    try {
      const res = await authFetch('/auth/my-shop/verification', { method: 'PUT', body: JSON.stringify({ ...identity, ...card }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Envoi impossible.')
      setStatus(data)
      setResubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const shopStatus = status?.shopStatus
  const views = {
    PENDING: {
      icon: 'hourglass_top', tone: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Dossier en cours de vérification',
      text: 'Notre équipe vérifie votre pièce d’identité, votre selfie et votre carte. Vous recevrez l’accès à votre backoffice dès la validation — généralement sous 24 h. Cette page se met à jour toute seule.',
    },
    ACTIVE: {
      icon: 'verified', tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Boutique validée 🎉',
      text: 'Votre identité a été vérifiée. Votre backoffice est prêt et votre vitrine est en ligne.',
    },
    REJECTED: {
      icon: 'error', tone: 'text-red-400 bg-red-500/10 border-red-500/30',
      title: 'Dossier refusé',
      text: 'Votre dossier n’a pas pu être validé. Corrigez les éléments indiqués ci-dessous et renvoyez-le.',
    },
    SUSPENDED: {
      icon: 'block', tone: 'text-red-400 bg-red-500/10 border-red-500/30',
      title: 'Boutique suspendue',
      text: 'Votre boutique a été suspendue par l’équipe Sellio. Contactez le support pour en savoir plus.',
    },
  }
  const view = views[shopStatus]

  return (
    <div className={`min-h-screen ${t.page}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className={`border-b ${t.header}`}>
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <SellioLogo to="/" light={!theme.dark} />
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} />
            <button type="button" onClick={logout} className={`px-3 py-2 rounded-lg text-sm ${t.secondaryBtn}`}>Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-violet-400" style={MONO}>// {status?.shopName || user.shopName || 'Votre boutique'}</p>
        {!status && <p className={`mt-6 ${t.muted}`}>Chargement…</p>}

        {view && (
          <div className="mt-5 space-y-8">
            <div className="flex items-start gap-4">
              <span className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${view.tone}`}>
                <span className="material-symbols-outlined">{view.icon}</span>
              </span>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={DISPLAY}>{view.title}</h1>
                <p className={`mt-3 leading-relaxed ${t.muted}`}>{view.text}</p>
              </div>
            </div>

            {shopStatus === 'PENDING' && (
              <ol className={`rounded-2xl p-6 space-y-5 ${t.card}`}>
                {[
                  ['Compte créé', true],
                  ['Boutique configurée', true],
                  ['Dossier envoyé', true, status.submittedAt && new Date(status.submittedAt).toLocaleString('fr-FR')],
                  ['Vérification par l’équipe Sellio', false],
                  ['Ouverture du backoffice', false],
                ].map(([label, done, detail], i) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${done ? 'bg-violet-500 text-white' : i === 3 ? 'border-2 border-violet-400 animate-pulse' : theme.dark ? 'border border-white/20' : 'border border-slate-300'}`}>
                      {done ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                    </span>
                    <span className={done ? '' : t.muted}>{label}</span>
                    {detail && <span className={`ml-auto text-xs ${t.faint}`}>{detail}</span>}
                  </li>
                ))}
              </ol>
            )}

            {shopStatus === 'ACTIVE' && (
              <div className="flex flex-wrap gap-3">
                <a href={`/${status.shopSlug}/dashboard`} className={`px-6 py-3 rounded-xl text-sm font-semibold ${t.primaryBtn}`}>Ouvrir mon backoffice →</a>
                <a href={`http://localhost:3001/${status.shopSlug}`} target="_blank" rel="noreferrer" className={`px-6 py-3 rounded-xl text-sm ${t.secondaryBtn}`}>Voir ma vitrine</a>
              </div>
            )}

            {shopStatus === 'REJECTED' && (
              <div className="space-y-6">
                {status.rejectionReason && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                    <p className="text-xs uppercase tracking-wider text-red-400 font-semibold">Motif</p>
                    <p className="mt-2 text-sm">{status.rejectionReason}</p>
                  </div>
                )}
                {!resubmitting ? (
                  <button type="button" onClick={() => setResubmitting(true)} className={`px-6 py-3 rounded-xl text-sm font-semibold ${t.primaryBtn}`}>Envoyer un nouveau dossier</button>
                ) : (
                  <div className="space-y-6">
                    {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
                    <section className={`rounded-2xl p-6 ${t.card}`}>
                      <h2 className="text-lg font-semibold mb-5">Pièce d’identité et selfie</h2>
                      <IdentityStep value={identity} onChange={setIdentity} onError={setError} theme={theme} />
                    </section>
                    <section className={`rounded-2xl p-6 ${t.card}`}>
                      <h2 className="text-lg font-semibold mb-5">Carte bancaire</h2>
                      <CardStep value={card} onChange={setCard} theme={theme} />
                    </section>
                    <div className="flex gap-3">
                      <button type="button" disabled={sending} onClick={resubmit} className="px-6 py-3 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50">
                        {sending ? 'Envoi…' : 'Renvoyer mon dossier'}
                      </button>
                      <button type="button" onClick={() => setResubmitting(false)} className={`px-5 py-3 rounded-xl text-sm ${t.secondaryBtn}`}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
