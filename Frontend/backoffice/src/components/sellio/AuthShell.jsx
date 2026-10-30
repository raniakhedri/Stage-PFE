import { Link } from 'react-router-dom'
import { SellioLogo, TechBackdrop, Mascot, DISPLAY, MONO, GRADIENT_TEXT } from './brand'

const POINTS = [
  ['storefront', 'Huit modèles de vitrine, huit secteurs d’activité'],
  ['view_in_ar', 'Essayage virtuel par IA pour la mode'],
  ['insights', 'Tableau de bord et prédiction du churn'],
]

export const inputClass =
  'mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-flame-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-flame-500/10 transition-all'

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
      className="w-full py-3.5 rounded-xl bg-flame-500 text-white font-semibold text-sm hover:bg-flame-400 shadow-[0_12px_32px_-12px_rgba(255,106,26,0.85)] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
      {loading ? loadingLabel : children}
    </button>
  )
}

/** Split layout for Sellio sign in / sign up: brand panel on the left, form on the right. */
export default function AuthShell({ eyebrow, title, subtitle, children, footer, mascot = 'idea' }) {
  return (
    <div className="min-h-screen bg-ink-950 text-white grid lg:grid-cols-[1.05fr_1fr]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <aside className="relative hidden lg:flex flex-col justify-between p-12 border-r border-white/10 overflow-hidden">
        <TechBackdrop />
        <SellioLogo className="relative" />
        <Mascot pose={mascot} className="absolute right-4 bottom-10 w-[38%] h-[52%] xl:right-8" />
        <div className="relative max-w-[56%]">
          <h2 className="text-4xl xl:text-[54px] font-semibold tracking-[-0.04em] leading-[1.02]" style={DISPLAY}>
            Construisez la boutique
            <br />
            <span className={GRADIENT_TEXT}>de votre marque.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {POINTS.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-white/70">
                <span className="w-9 h-9 rounded-lg border border-flame-400/20 bg-gradient-to-br from-flame-500/20 to-plum-500/20 text-flame-300 flex items-center justify-center material-symbols-outlined text-lg">{icon}</span>
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
            <p className="text-xs uppercase tracking-[0.3em] text-flame-400" style={MONO}>{eyebrow}</p>
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
