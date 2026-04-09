import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'E-mail ou mot de passe incorrect.');
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      const role = data.user?.roleName;
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        // Redirect to backoffice — it has its own login, pass token via URL
        window.location.replace('http://localhost:3000/auth-callback?accessToken=' + encodeURIComponent(data.accessToken) + '&refreshToken=' + encodeURIComponent(data.refreshToken) + '&user=' + encodeURIComponent(JSON.stringify(data.user)));
        return;
      }
      window.location.replace('/');
    } catch (err) {
      setError(err.message || 'E-mail ou mot de passe incorrect.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: '#fef8f3' }}>
      {/* Left — Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #163328 0%, #2D4A3E 50%, #546349 100%)' }}>
        {/* Organic shapes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #99b9a9, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #d8e8c7, transparent)' }} />
        <div className="absolute top-1/4 right-10 w-48 h-48 rounded-full opacity-5 bg-white" />

        <div className="relative z-10 text-center px-12 max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center"
               style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Leaf size={40} className="text-white/90" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-white mb-4 tracking-tight">
            NATUR<span style={{ color: '#d8e8c7' }}>ESSENCE</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            L'éveil botanique — Découvrez notre univers d'huiles essentielles, beurres végétaux et actifs cosmétiques naturels.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-white/40 text-xs uppercase tracking-widest">
            <span>Bio</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Naturel</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Artisanal</span>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ backgroundColor: '#163328' }}>
              <Leaf size={20} className="text-white" />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight"
                  style={{ color: '#1d1b19' }}>
              NATUR<span style={{ color: '#163328' }}>ESSENCE</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8"
               style={{ border: '1px solid #e6e2dd' }}>
            <h2 className="text-xl font-headline font-bold mb-1" style={{ color: '#1d1b19' }}>
              Mon Compte
            </h2>
            <p className="text-sm mb-6" style={{ color: '#727974' }}>
              Connectez-vous pour accéder à votre espace.
            </p>

            {error && (
              <div className="mb-4 py-3 px-4 rounded-lg text-sm"
                   style={{ backgroundColor: '#fef2f2', borderLeft: '3px solid #ba1a1a', color: '#ba1a1a' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                       style={{ color: '#424844' }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
                  style={{
                    border: '1px solid #c1c8c3',
                    backgroundColor: '#f8f3ee',
                    color: '#1d1b19',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2D4A3E';
                    e.target.style.boxShadow = '0 0 0 3px rgba(45,74,62,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#c1c8c3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                       style={{ color: '#424844' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl outline-none transition-all"
                    style={{
                      border: '1px solid #c1c8c3',
                      backgroundColor: '#f8f3ee',
                      color: '#1d1b19',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2D4A3E';
                      e.target.style.boxShadow = '0 0 0 3px rgba(45,74,62,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#c1c8c3';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#727974' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#424844' }}>
                  <input type="checkbox" className="rounded accent-[#2D4A3E]" />
                  Se souvenir de moi
                </label>
                <a href="#" className="font-medium hover:underline" style={{ color: '#2D4A3E' }}>
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:shadow-md disabled:opacity-50"
                style={{ backgroundColor: '#163328' }}
                onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#2D4A3E'; }}
                onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#163328'; }}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs" style={{ color: '#727974' }}>
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="font-semibold hover:underline" style={{ color: '#2D4A3E' }}>
                Créer un compte
              </Link>
            </div>
          </div>

          {/* Back to store link */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-xs hover:underline" style={{ color: '#727974' }}>
              ← Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
