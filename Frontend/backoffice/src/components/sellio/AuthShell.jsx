import { Link } from 'react-router-dom'
import { SellioLogo, TechBackdrop, DISPLAY, MONO } from './brand'

const POINTS = [
  ['storefront', 'Huit modèles de vitrine, huit secteurs d’activité'],
  ['view_in_ar', 'Essayage virtuel par IA pour la mode'],
  ['insights', 'Tableau de bord et prédiction du churn'],
]

export const inputClass =
  'mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10 transition-all'

export function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-white/70">{label}</span>
      {children}
    </label>
  )
}

export function SubmitButton({ loading, children, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />}
      {loading ? loadingLabel : children}
    </button>
  )
}

/** Split layout for Sellio sign in / sign up: brand panel on the left, form on the right. */
export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-[#07080a] text-white grid lg:grid-cols-[1.05fr_1fr]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <aside className="relative hidden lg:flex flex-col justify-between p-12 border-r border-white/10 overflow-hidden">
        <TechBackdrop />
        <SellioLogo className="relative" />
        <div className="relative">
          <h2 className="text-5xl xl:text-6xl font-semibold tracking-[-0.04em] leading-[0.98]" style={DISPLAY}>
            Construisez la boutique
            <br />
            <span className="bg-gradient-to-r from-white via-violet-300 to-cyan-200 bg-clip-text text-transparent">de votre marque.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {POINTS.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-white/70">
                <span className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center material-symbols-outlined text-lg">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/35" style={MONO}>© {new Date().getFullYear()} Sellio · Plateforme e-commerce</p>
      </aside>

      <main className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <span className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center">←</span>
            Accueil
          </Link>
          <span className="lg:hidden"><SellioLogo /></span>
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80" style={MONO}>{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]" style={DISPLAY}>{title}</h1>
            <p className="mt-3 text-sm text-white/50">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-white/50 text-center">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  )
}
