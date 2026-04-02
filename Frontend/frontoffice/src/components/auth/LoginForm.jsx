import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient, { scheduleAutoLogout } from '../../api/apiClient'

export default function LoginForm({ onSwitch }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      scheduleAutoLogout()

      const redirect = params.get('redirect')
      if (redirect === 'backoffice' && data.user.roleName !== 'CLIENT') {
        const callbackUrl = `http://localhost:3000/auth-callback?accessToken=${encodeURIComponent(data.accessToken)}&refreshToken=${encodeURIComponent(data.refreshToken)}&user=${encodeURIComponent(JSON.stringify(data.user))}`
        window.location.href = callbackUrl
      } else {
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'E-mail ou mot de passe incorrect.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm w-full mx-auto md:mx-0">
      {/* Header */}
      <header className="mb-12">
        <h2 className="font-headline text-3xl font-black tracking-[-0.03em] uppercase mb-4 text-primary">
          Se connecter
        </h2>
        <p className="font-body text-sm text-secondary tracking-wide leading-relaxed">
          Accédez à vos commandes et à votre sélection exclusive de la saison.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div className="mb-6 py-3 px-4 bg-red-50 border-l-2 border-red-500 text-red-700 text-sm font-body">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email */}
        <div>
          <label className="block font-label text-[10px] tracking-[0.1em] uppercase text-outline mb-2 font-bold">
            Adresse e-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <div className="flex justify-end mt-3">
            <a
              href="#"
              className="font-label text-[10px] tracking-[0.05em] uppercase text-secondary hover:text-primary transition-colors underline underline-offset-4 decoration-outline-variant/50"
            >
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full fo-btn py-4 font-label text-xs tracking-[0.15em] uppercase font-bold active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-outline-variant/20" />
            <span className="flex-shrink mx-4 font-label text-[10px] text-outline uppercase tracking-widest">
              Ou
            </span>
            <div className="flex-grow border-t border-outline-variant/20" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full bg-transparent border border-outline-variant/50 text-on-surface py-4 font-label text-xs tracking-[0.15em] uppercase font-bold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
            </svg>
            Continuer avec Google
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-12 text-center md:text-left">
        <p className="font-body text-sm text-secondary">
          Nouveau ici ?{' '}
          <button
            type="button"
            onClick={onSwitch}
            className="text-primary font-bold underline underline-offset-4 ml-1 hover:opacity-70 transition-opacity"
          >
            Créer un compte
          </button>
        </p>
      </footer>
    </div>
  )
}
