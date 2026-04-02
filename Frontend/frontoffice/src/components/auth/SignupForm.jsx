import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient, { scheduleAutoLogout } from '../../api/apiClient'

export default function SignupForm({ onSwitch }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirm: '',
    conditions: false,
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/register', {
        firstName: form.prenom,
        lastName: form.nom,
        email: form.email,
        password: form.password,
      })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      scheduleAutoLogout()
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Erreur lors de la création du compte."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm w-full mx-auto md:mx-0">
      {/* Header */}
      <header className="mb-10">
        <h2 className="font-headline text-3xl font-black tracking-[-0.03em] uppercase mb-4 text-primary">
          Créer un compte
        </h2>
        <p className="font-body text-sm text-secondary tracking-wide leading-relaxed">
          Rejoignez l'expérience. Accédez à vos commandes, listes de souhaits et offres exclusives.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div className="mb-6 py-3 px-4 bg-red-50 border-l-2 border-red-500 text-red-700 text-sm font-body">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block font-label text-[10px] tracking-[0.1em] uppercase text-outline mb-2 font-bold">
              Prénom
            </label>
            <input
              type="text"
              value={form.prenom}
              onChange={set('prenom')}
              placeholder="Prénom"
              className="auth-input"
              required
            />
          </div>
          <div>
            <label className="block font-label text-[10px] tracking-[0.1em] uppercase text-outline mb-2 font-bold">
              Nom
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={set('nom')}
              placeholder="Nom"
              className="auth-input"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block font-label text-[10px] tracking-[0.1em] uppercase text-outline mb-2 font-bold">
            Adresse e-mail
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="votre@email.com"
            className="auth-input"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block font-label text-[10px] tracking-[0.1em] uppercase text-outline mb-2 font-bold">
            Mot de passe
          </label>
          <div className="relative flex items-center">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              className="auth-input pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-0 text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">
                {showPass ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="block font-label text-[10px] tracking-[0.1em] uppercase text-outline mb-2 font-bold">
            Confirmer le mot de passe
          </label>
          <div className="relative flex items-center">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="••••••••"
              className="auth-input pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-0 text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">
                {showConfirm ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Conditions */}
        <label className="flex items-start gap-3 cursor-pointer group pt-2">
          <input
            type="checkbox"
            checked={form.conditions}
            onChange={set('conditions')}
            className="mt-0.5 w-4 h-4 accent-black cursor-pointer"
            required
          />
          <span className="font-body text-xs text-secondary leading-relaxed group-hover:text-primary transition-colors">
            J'accepte les{' '}
            <a
              href="#"
              className="underline underline-offset-4 font-bold text-primary"
            >
              conditions générales
            </a>{' '}
            et la{' '}
            <a
              href="#"
              className="underline underline-offset-4 font-bold text-primary"
            >
              politique de confidentialité
            </a>
          </span>
        </label>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full fo-btn py-4 font-label text-xs tracking-[0.15em] uppercase font-bold active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-10 text-center md:text-left">
        <p className="font-body text-sm text-secondary">
          Déjà un compte ?{' '}
          <button
            type="button"
            onClick={onSwitch}
            className="text-primary font-bold underline underline-offset-4 ml-1 hover:opacity-70 transition-opacity"
          >
            Se connecter
          </button>
        </p>
      </footer>
    </div>
  )
}
