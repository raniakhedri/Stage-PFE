import { useState } from 'react'
import { Link } from 'react-router-dom'
import { storeSession } from '../lib/sellio'
import AuthShell, { Field, SubmitButton, inputClass } from '../components/sellio/AuthShell'

export default function SellioInscription() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/register-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Création impossible.')
      storeSession(data.accessToken, data.refreshToken, data.user)
      window.location.replace('/nouvelle-boutique')
    } catch (err) {
      setError(err.message || 'Création impossible.')
      setLoading(false)
    }
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
        <SubmitButton loading={loading} loadingLabel="Création…">Créer mon compte</SubmitButton>
        <p className="text-xs text-white/35 text-center">Gratuit · Sans carte bancaire · Une boutique par compte</p>
      </form>
    </AuthShell>
  )
}
