import { useState } from 'react'
import { clearSession, openMerchantHome, readUser, storeSession } from '../lib/sellio'
import AuthShell, { Field, SubmitButton, inputClass } from '../components/sellio/AuthShell'

/**
 * Password change. Mandatory after signing in with the temporary password received by e-mail
 * (accounts created from the backoffice); also reachable by any signed-in merchant.
 */
export default function ChangerMotDePasse() {
  const user = readUser()
  const token = localStorage.getItem('accessToken')
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    window.location.replace('/login')
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: password }),
      })
      const data = await res.json().catch(() => null)
      if (res.status === 401) {
        clearSession()
        window.location.replace('/login')
        return
      }
      if (!res.ok) throw new Error(data?.message || 'Modification impossible.')
      storeSession(data.accessToken, data.refreshToken, data.user)
      openMerchantHome(data.user)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const forced = user?.mustChangePassword
  return (
    <AuthShell
      eyebrow="// Sécurité"
      title={forced ? 'Choisissez votre mot de passe.' : 'Changer le mot de passe.'}
      subtitle={forced
        ? 'Vous vous êtes connecté avec le mot de passe temporaire reçu par e-mail. Il ne sert qu’une fois : choisissez maintenant le vôtre.'
        : 'Saisissez votre mot de passe actuel puis le nouveau.'}
      footer={<button type="button" onClick={() => { clearSession(); window.location.replace('/login') }} className="text-white/60 hover:text-white">Se déconnecter</button>}
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        <Field label={forced ? 'Mot de passe temporaire' : 'Mot de passe actuel'}>
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Nouveau mot de passe">
          <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" className={inputClass} />
        </Field>
        <Field label="Confirmer">
          <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </Field>
        <SubmitButton loading={loading} loadingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </form>
    </AuthShell>
  )
}
