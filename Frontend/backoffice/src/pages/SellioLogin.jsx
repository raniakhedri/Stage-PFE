import { useState } from 'react'
import { Link } from 'react-router-dom'
import { openMerchantHome, storeSession } from '../lib/sellio'
import AuthShell, { Field, SubmitButton, inputClass } from '../components/sellio/AuthShell'

export default function SellioLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'E-mail ou mot de passe incorrect.')
      if (data.user?.roleName === 'CLIENT') {
        setError('Cet espace est réservé aux marchands Sellio. Vos clients se connectent sur leur boutique.')
        setLoading(false)
        return
      }
      storeSession(data.accessToken, data.refreshToken, data.user)
      openMerchantHome(data.user)
    } catch (err) {
      setError(err.message || 'Connexion impossible.')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="// Connexion"
      title="Bon retour."
      subtitle="Connectez-vous pour retrouver le backoffice de votre boutique."
      footer={<>Pas encore de compte ? <Link to="/inscription" className="text-white font-medium hover:underline">Créer ma boutique</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        <Field label="E-mail">
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@marque.tn" className={inputClass} />
        </Field>
        <Field label={<span className="flex items-center justify-between">Mot de passe<Link to="/mot-de-passe-oublie" className="text-xs text-white/50 hover:text-white">Mot de passe oublié ?</Link></span>}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-12`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-[40%] material-symbols-outlined text-lg text-white/40 hover:text-white" aria-label="Afficher le mot de passe">
              {showPassword ? 'visibility_off' : 'visibility'}
            </button>
          </div>
        </Field>
        <SubmitButton loading={loading} loadingLabel="Connexion…">Se connecter</SubmitButton>
      </form>
    </AuthShell>
  )
}
