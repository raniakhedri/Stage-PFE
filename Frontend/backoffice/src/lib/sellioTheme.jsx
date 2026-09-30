import { useEffect, useState } from 'react'

const KEY = 'sellioTheme'

/** Class tokens for the Sellio platform pages (console, shop creation, verification). */
const DARK = {
  page: 'bg-[#07080a] text-white',
  header: 'bg-[#07080a]/85 border-white/10',
  card: 'bg-white/[0.03] border border-white/10',
  cardSolid: 'bg-[#0d0e12] border border-white/10',
  muted: 'text-white/55',
  faint: 'text-white/35',
  divider: 'border-white/10',
  hover: 'hover:bg-white/[0.04]',
  input: 'bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10',
  primaryBtn: 'bg-white text-black hover:bg-white/90',
  secondaryBtn: 'border border-white/15 text-white hover:bg-white/[0.06]',
  selected: 'border-violet-400/70 bg-violet-500/10 ring-1 ring-violet-400/40',
  unselected: 'border-white/10 hover:border-white/25',
  tableHead: 'text-white/40',
  row: 'border-white/[0.06] hover:bg-white/[0.03]',
  drawer: 'bg-[#0b0c0f] border-l border-white/10',
  chip: 'bg-white/[0.06] text-white/80',
  overlay: 'bg-black/60',
  stripeText: '#ffffff',
  stripePlaceholder: 'rgba(255,255,255,0.35)',
}

const LIGHT = {
  page: 'bg-[#f6f5f2] text-slate-900',
  header: 'bg-white/85 border-slate-200',
  card: 'bg-white border border-slate-200',
  cardSolid: 'bg-white border border-slate-200',
  muted: 'text-slate-500',
  faint: 'text-slate-400',
  divider: 'border-slate-200',
  hover: 'hover:bg-slate-50',
  input: 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10',
  primaryBtn: 'bg-slate-900 text-white hover:bg-slate-800',
  secondaryBtn: 'border border-slate-300 text-slate-800 hover:bg-slate-50',
  selected: 'border-violet-500 bg-violet-50 ring-1 ring-violet-500/30',
  unselected: 'border-slate-200 hover:border-slate-400',
  tableHead: 'text-slate-400',
  row: 'border-slate-100 hover:bg-slate-50',
  drawer: 'bg-[#f6f5f2] border-l border-slate-200',
  chip: 'bg-slate-100 text-slate-700',
  overlay: 'bg-black/30',
  stripeText: '#0f172a',
  stripePlaceholder: '#94a3b8',
}

function read() {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Dark by default; the choice is remembered per browser and shared by every Sellio page. */
export function useSellioTheme() {
  const [mode, setMode] = useState(read)

  useEffect(() => {
    const sync = (e) => e.key === KEY && setMode(read())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(KEY, next) } catch { /* ignore */ }
    setMode(next)
  }

  return { mode, dark: mode === 'dark', toggle, t: mode === 'dark' ? DARK : LIGHT }
}

export function ThemeToggle({ theme, className = '' }) {
  return (
    <button
      type="button"
      onClick={theme.toggle}
      title={theme.dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${theme.t.secondaryBtn} ${className}`}
    >
      <span className="material-symbols-outlined text-[19px]">{theme.dark ? 'light_mode' : 'dark_mode'}</span>
    </button>
  )
}

/** Accessible on/off switch (replaces the bare checkboxes). */
export function Switch({ checked, onChange, label, description, theme }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className={`block text-xs mt-0.5 ${theme.t.muted}`}>{description}</span>}
      </span>
      <span className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? 'bg-violet-500' : theme.dark ? 'bg-white/15' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}
