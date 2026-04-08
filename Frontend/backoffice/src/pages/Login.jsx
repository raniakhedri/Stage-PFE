import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient, { scheduleAutoLogout } from '../api/apiClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'E-mail ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-[20px]">shield</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            GMIR<span className="text-brand">JEWELRY</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Administration</h2>
          <p className="text-sm text-slate-500 mb-6">Connectez-vous pour accéder au back office.</p>

          {error && (
            <div className="mb-4 py-3 px-4 bg-red-50 border-l-2 border-red-500 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin@Antigoneagency.com
"
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-2.5 rounded-xl font-bold text-sm hover:bg-brand-dark transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
