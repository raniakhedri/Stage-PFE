import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Sélectionner…',
  className = '',
  size = 'md',
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  const selected = normalized.find((o) => o.value === value) ?? normalized[0] ?? null

  // Compute fixed position relative to viewport
  const updateCoords = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 6, left: r.left, width: r.width })
    }
  }, [])

  const handleOpen = () => {
    updateCoords()
    setOpen((v) => !v)
  }

  // Close on outside click + close on scroll
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    const handleScroll = () => setOpen(false)
    document.addEventListener('mousedown', handleClickOutside)
    // Listen for scroll on the main-scroll container and the window
    const scrollEl = document.getElementById('main-scroll')
    if (scrollEl) scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (scrollEl) scrollEl.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [open])

  const handleSelect = (opt) => {
    onChange(opt.value)
    setOpen(false)
  }

  const isSm = size === 'sm'

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 bg-white border rounded-custom text-slate-700 font-medium cursor-pointer transition-all shadow-sm hover:border-slate-300 select-none ${
          isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
        } ${open ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200'}`}
      >
        <span className={selected ? 'text-slate-700' : 'text-slate-400'}>
          {selected?.label ?? placeholder}
        </span>
        <span
          className={`material-symbols-outlined flex-shrink-0 text-slate-400 transition-transform duration-200 ${
            isSm ? 'text-[16px]' : 'text-[18px]'
          } ${open ? 'rotate-180 text-brand' : ''}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown via portal — escapes any overflow:hidden ancestor */}
      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: Math.max(coords.width, 160), zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-custom shadow-xl overflow-hidden"
        >
          <div className="max-h-56 overflow-y-auto">
            {normalized.map((opt) => {
              const isActive = opt.value === selected?.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left flex items-center gap-2 transition-colors ${
                    isSm ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
                  } ${
                    isActive
                      ? 'bg-brand text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-brand'
                  }`}
                >
                  {isActive && (
                    <span className="material-symbols-outlined text-[14px] flex-shrink-0">check</span>
                  )}
                  <span className={isActive ? '' : 'ml-[22px]'}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
