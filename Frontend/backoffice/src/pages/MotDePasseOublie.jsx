import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell, { Field, SubmitButton, inputClass } from '../components/sellio/AuthShell'

const API = 'http://localhost:8080/api/v1/auth'

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || 'Une erreur est survenue.')
  return data
}

/** Forgotten password: e-mail → six-digit code → new password. */
export default function MotDePasseOublie() {
  const [step, setStep] = useState('email') // email | code | done
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await post('/forgot-password', { email })
      setInfo(data?.message || '')
      setStep('code')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.')
    setLoading(true)
    try {
      await post('/reset-password', { email, code, password })
      setStep('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="// Mot de passe oublié"
      title={step === 'done' ? 'C’est fait.' : 'Réinitialisation.'}
      subtitle={
        step === 'email' ? 'Indiquez l’e-mail de votre compte Sellio : nous vous envoyons un code à 6 chiffres.'
          : step === 'code' ? `Saisissez le code reçu à ${email} et choisissez un nouveau mot de passe.`
            : 'Votre mot de passe a été modifié. Vous pouvez vous connecter.'
      }
      footer={<><Link to="/login" className="text-white font-medium hover:underline">← Retour à la connexion</Link></>}
    >
      {error && <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {step === 'email' && (
        <form onSubmit={requestCode} className="space-y-5">
          <Field label="E-mail">
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@marque.tn" className={inputClass} />
          </Field>
          <SubmitButton loading={loading} loadingLabel="Envoi…">Recevoir un code</SubmitButton>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={reset} className="space-y-5">
          {info && <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">{info}</p>}
          <Field label="Code à 6 chiffres">
            <input
              required inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••" className={`${inputClass} tracking-[0.6em] text-center text-lg font-semibold`}
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" className={inputClass} />
          </Field>
          <Field label="Confirmer">
            <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </Field>
          <SubmitButton loading={loading} loadingLabel="Enregistrement…">Changer le mot de passe</SubmitButton>
          <button type="button" onClick={requestCode} disabled={loading} className="w-full text-sm text-white/50 hover:text-white">
            Renvoyer un code
          </button>
        </form>
      )}

      {step === 'done' && (
        <Link to="/login" className="block w-full py-3.5 rounded-xl bg-white text-black font-semibold text-sm text-center hover:bg-white/90">
          Se connecter
        </Link>
      )}
    </AuthShell>
  )
}
