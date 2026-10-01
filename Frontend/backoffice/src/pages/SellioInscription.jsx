import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { storeSession } from '../lib/sellio'
import AuthShell, { Field, SubmitButton, inputClass } from '../components/sellio/AuthShell'

const API = 'http://localhost:8080/api/v1/auth'
const RESEND_SECONDS = 60

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

/** Merchant sign-up in two steps: the form, then the six-digit code sent to the e-mail address. */
export default function SellioInscription() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [step, setStep] = useState('form') // form | code
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    try {
      await post('/register-merchant', form)
      setStep('code')
      setCooldown(RESEND_SECONDS)
      setInfo('')
    } catch (err) {
      setError(err.message || 'Création impossible.')
    } finally {
      setLoading(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await post('/register-merchant/verify', { email: form.email, code })
      storeSession(data.accessToken, data.refreshToken, data.user)
      window.location.replace('/nouvelle-boutique')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      await post('/register-merchant/resend', { email: form.email })
      setInfo('Un nouveau code vient d’être envoyé.')
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err.message)
    }
  }

  if (step === 'code') {
    return (
      <AuthShell
        eyebrow="// Vérification"
        title="Vérifiez votre e-mail."
        subtitle={`Nous avons envoyé un code à 6 chiffres à ${form.email}. Il expire dans 10 minutes.`}
        footer={<button type="button" onClick={() => { setStep('form'); setCode(''); setError('') }} className="text-white font-medium hover:underline">← Modifier mes informations</button>}
      >
        <form onSubmit={verify} className="space-y-5">
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
          {info && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{info}</p>}
          <Field label="Code de vérification">
            <input
              required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••" className={`${inputClass} tracking-[0.6em] text-center text-2xl font-semibold`}
            />
          </Field>
          <SubmitButton loading={loading} loadingLabel="Vérification…">Créer mon compte</SubmitButton>
          <button
            type="button" onClick={resend} disabled={cooldown > 0}
            className="w-full text-sm text-white/60 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : 'Renvoyer le code'}
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="// Inscription"
      title="Créez votre compte."
      subtitle="Le compte d’abord. Le nom, l’activité et le modèle de votre boutique se choisissent juste après."
      footer={<>Déjà marchand ? <Link to="/login" className="text-white font-medium hover:underline">Se connecter</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <input required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} className={inputClass} />
          </Field>
          <Field label="Nom">
            <input required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} className={inputClass} />
          </Field>
        </div>
        <Field label="E-mail">
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="vous@marque.tn" className={inputClass} />
        </Field>
        <Field label="Mot de passe">
          <input type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="8 caractères minimum" className={inputClass} />
          {form.password && (
            <span className="mt-2 flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i < strength ? (strength > 2 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-white/10'}`} />
              ))}
            </span>
          )}
        </Field>
        <SubmitButton loading={loading} loadingLabel="Envoi du code…">Continuer</SubmitButton>
        <p className="text-xs text-white/35 text-center">Un code de vérification sera envoyé à votre adresse e-mail.</p>
      </form>
    </AuthShell>
  )
}
