import { Link } from 'react-router-dom'

export const DISPLAY = { fontFamily: '"Space Grotesk", Inter, sans-serif' }
export const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, monospace' }

/** Orange to purple, the Sellio signature gradient (text and accents). */
export const GRADIENT_TEXT = 'bg-gradient-to-r from-flame-400 via-flame-300 to-plum-300 bg-clip-text text-transparent'

/** Sellio mark: a stacked "S" built from two offset bars. */
export function SellioLogo({ to = '/', className = '', light = false }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Sellio">
      <span className="relative w-8 h-8 rounded-lg flex bg-gradient-to-br from-flame-400 via-flame-500 to-plum-500 text-white items-center justify-center overflow-hidden shadow-[0_6px_20px_-6px_rgba(255,106,26,0.7)]">
        <svg viewBox="0 0 24 24" className="relative w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M17 6.5H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H7" />
        </svg>
      </span>
      <span className={`text-lg font-semibold tracking-tight ${light ? 'text-slate-900' : 'text-white'}`} style={DISPLAY}>Sellio</span>
    </Link>
  )
}

/** Fine grid + orange and purple glows used behind every Sellio public page. */
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
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-plum-600/25 blur-[140px]" />
      <div className="absolute top-24 right-[12%] w-[420px] h-[420px] rounded-full bg-flame-500/15 blur-[130px]" />
    </div>
  )
}

const MASCOTS = {
  laptop: '/brand/mascot-laptop.webp',
  idea: '/brand/mascot-idea.webp',
  shop: '/brand/mascot-shop.webp',
  parcel: '/brand/mascot-parcel.webp',
}

/** Sellio's 3D character, on an orange and purple halo. */
export function Mascot({ pose = 'laptop', className = '', glow = true }) {
  // Callers often place it absolutely; only fall back to `relative` when they don't.
  const position = /\b(absolute|fixed)\b/.test(className) ? '' : 'relative'
  return (
    <div aria-hidden className={`${position} pointer-events-none select-none ${className}`}>
      {glow && (
        <>
          <div className="absolute inset-[12%] rounded-full bg-plum-500/35 blur-[70px]" />
          <div className="absolute left-[20%] right-[20%] bottom-[8%] h-1/3 rounded-full bg-flame-500/30 blur-[60px]" />
        </>
      )}
      <img src={MASCOTS[pose]} alt="" draggable="false" className="relative w-full h-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" />
    </div>
  )
}
