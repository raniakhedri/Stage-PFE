import { Link } from 'react-router-dom'

export const DISPLAY = { fontFamily: '"Space Grotesk", Inter, sans-serif' }
export const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, monospace' }

/** Sellio mark: a stacked "S" built from two offset bars. */
export function SellioLogo({ to = '/', className = '', light = false }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Sellio">
      <span className={`relative w-8 h-8 rounded-lg flex ${light ? 'bg-slate-900 text-white' : 'bg-white text-black'} items-center justify-center overflow-hidden`}>
        {!light && <span className="absolute inset-0 bg-gradient-to-br from-white via-white to-violet-200" />}
        <svg viewBox="0 0 24 24" className="relative w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M17 6.5H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H7" />
        </svg>
      </span>
      <span className={`text-lg font-semibold tracking-tight ${light ? 'text-slate-900' : 'text-white'}`} style={DISPLAY}>Sellio</span>
    </Link>
  )
}

/** Fine grid + glow used behind every Sellio public page. */
export function TechBackdrop({ className = '' }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-violet-600/25 blur-[140px]" />
      <div className="absolute top-20 left-[20%] w-[380px] h-[380px] rounded-full bg-cyan-500/10 blur-[120px]" />
    </div>
  )
}
