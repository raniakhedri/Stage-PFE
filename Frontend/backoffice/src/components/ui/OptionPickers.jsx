import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useShopOptions } from '../../hooks/useShopOptions'
import { BASIC_COLORS, SIZE_GROUPS, sortSizes, splitList } from '../../data/catalogOptions'

const field = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all'

function useClickOutside(open, close) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && close()
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, close])
  return ref
}

/**
 * Searchable dropdown over the presets + merchant options for `optionKey`.
 * Typing a value that is not in the list offers to add it to the shop's list.
 */
export function OptionSelect({ optionKey, value, onChange, placeholder = 'Choisir…', options: fixedOptions, allowAdd = true }) {
  const shop = useShopOptions()
  const options = fixedOptions || shop.options(optionKey)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useClickOutside(open, () => setOpen(false))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  }, [options, query])
  const exact = options.some((o) => o.toLowerCase() === query.trim().toLowerCase())

  const pick = (v) => {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  const add = async () => {
    const v = query.trim()
    try {
      if (!fixedOptions) await shop.addOption(optionKey, v)
      pick(v)
      toast.success(`« ${v} » ajouté à votre liste`)
    } catch {
      toast.error("Impossible d'enregistrer cette option.")
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`${field} flex items-center justify-between text-left`}>
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value || placeholder}</span>
        <span className="flex items-center gap-1">
          {value && (
            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onChange('') }} className="material-symbols-outlined text-base text-slate-300 hover:text-slate-600">close</span>
          )}
          <span className="material-symbols-outlined text-lg text-slate-400">expand_more</span>
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (filtered.length > 0) pick(filtered[0])
                  else if (allowAdd && query.trim()) add()
                }
              }}
              placeholder="Rechercher ou ajouter…"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.map((o) => (
              <li key={o}>
                <button type="button" onClick={() => pick(o)} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${o === value ? 'font-semibold text-brand' : 'text-slate-700'}`}>
                  {o}
                  {o === value && <span className="material-symbols-outlined text-base">check</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && !query.trim() && <li className="px-4 py-2 text-sm text-slate-400">Aucune option</li>}
          </ul>
          {allowAdd && query.trim() && !exact && (
            <button type="button" onClick={add} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-brand border-t border-slate-100 hover:bg-brand/5 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">add</span>
              Ajouter « {query.trim()} »
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Multi-select stored as a comma-separated string (the API format for tailles / certifications).
 * `grouped` shows the size families as quick-pick rows.
 */
export function MultiOptionSelect({ optionKey, value, onChange, grouped = false, groups = SIZE_GROUPS, placeholder = 'Ajouter…' }) {
  const shop = useShopOptions()
  const selected = splitList(value)
  const custom = shop.customFor(optionKey)
  const ordered = optionKey === 'tailles' ? sortSizes(selected) : selected
  const set = (list) => onChange((optionKey === 'tailles' ? sortSizes(list) : list).join(','))
  const toggle = (v) => set(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])

  const chip = (v, active) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand/50'}`

  return (
    <div className="space-y-3">
      {grouped ? (
        <div className="space-y-3">
          {[...groups, ...(custom.length ? [{ label: 'Vos valeurs', values: custom }] : [])].map((g) => (
            <div key={g.label}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
                <button
                  type="button"
                  onClick={() => {
                    const all = g.values.every((v) => selected.includes(v))
                    set(all ? selected.filter((s) => !g.values.includes(s)) : [...new Set([...selected, ...g.values])])
                  }}
                  className="text-[10px] font-semibold text-brand hover:underline"
                >
                  {g.values.every((v) => selected.includes(v)) ? 'Tout retirer' : 'Tout choisir'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.values.map((v) => (
                  <button type="button" key={v} onClick={() => toggle(v)} className={chip(v, selected.includes(v))}>{v}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        ordered.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ordered.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-lg bg-brand/10 text-brand text-xs font-semibold">
                {v}
                <button type="button" onClick={() => toggle(v)} className="material-symbols-outlined text-sm hover:text-red-500">close</button>
              </span>
            ))}
          </div>
        )
      )}
      <OptionSelect
        optionKey={optionKey}
        value=""
        placeholder={grouped ? 'Autre taille…' : placeholder}
        options={shop.options(optionKey).filter((o) => !selected.includes(o))}
        onChange={(v) => v && toggle(v)}
        allowAdd={false}
      />
      <AddCustomOption optionKey={optionKey} onAdded={(v) => !selected.includes(v) && set([...selected, v])} />
      {grouped && ordered.length > 0 && (
        <p className="text-[11px] text-slate-500">Sélection : <span className="font-semibold text-slate-700">{ordered.join(' · ')}</span></p>
      )}
    </div>
  )
}

/** Inline "add a value to my list" control, e.g. a new fabric. */
export function AddCustomOption({ optionKey, onAdded, label = 'Ajouter une valeur à ma liste' }) {
  const { addOption } = useShopOptions()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const submit = async () => {
    const v = text.trim()
    if (!v) return
    try {
      await addOption(optionKey, v)
      onAdded?.(v)
      setText('')
      setOpen(false)
      toast.success(`« ${v} » ajouté à votre liste`)
    } catch {
      toast.error("Impossible d'enregistrer cette option.")
    }
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">add</span>{label}
      </button>
    )
  }
  return (
    <div className="flex gap-2">
      <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } if (e.key === 'Escape') setOpen(false) }} className={field} placeholder="Nouvelle valeur" />
      <button type="button" onClick={submit} className="px-4 rounded-lg bg-brand text-white text-sm font-semibold">Ajouter</button>
      <button type="button" onClick={() => setOpen(false)} className="px-3 rounded-lg border border-slate-200 text-sm text-slate-500">Annuler</button>
    </div>
  )
}

function hexOk(v) {
  return /^#[0-9A-Fa-f]{6}$/.test(v || '')
}

/** Basic colour swatches plus a custom RGB picker. Writes both the colour name and its hex. */
export function ColorSelect({ name, hex, onChange }) {
  const preset = BASIC_COLORS.find((c) => c.name === name)
  const [custom, setCustom] = useState(Boolean(name) && !preset)
  const rgb = hexOk(hex) ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) : [0, 0, 0]
  const setRgb = (index, val) => {
    const next = [...rgb]
    next[index] = Math.max(0, Math.min(255, Number(val) || 0))
    onChange({ couleur: name, couleurHex: `#${next.map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase() })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BASIC_COLORS.map((c) => {
          const active = !custom && name === c.name
          return (
            <button
              type="button"
              key={c.name}
              title={c.name}
              onClick={() => { setCustom(false); onChange({ couleur: c.name, couleurHex: c.hex }) }}
              className={`w-8 h-8 rounded-full border transition-all ${active ? 'ring-2 ring-offset-2 ring-brand border-transparent' : 'border-slate-300 hover:scale-110'}`}
              style={{ background: c.hex }}
            />
          )
        })}
        <button
          type="button"
          title="Couleur personnalisée"
          onClick={() => { setCustom(true); if (preset) onChange({ couleur: '', couleurHex: hex || '#5B2C6F' }) }}
          className={`w-8 h-8 rounded-full border flex items-center justify-center ${custom ? 'ring-2 ring-offset-2 ring-brand border-transparent' : 'border-slate-300'}`}
          style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
        >
          <span className="material-symbols-outlined text-white text-base drop-shadow">tune</span>
        </button>
      </div>
      {!custom && name && (
        <p className="text-xs text-slate-500">Sélection : <span className="font-semibold text-slate-700">{name}</span> <span className="font-mono">{hex}</span></p>
      )}
      {custom && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center gap-3">
            <input type="color" value={hexOk(hex) ? hex : '#5B2C6F'} onChange={(e) => onChange({ couleur: name, couleurHex: e.target.value.toUpperCase() })} className="h-11 w-14 rounded-lg border border-slate-200 bg-white cursor-pointer" />
            <input value={name} onChange={(e) => onChange({ couleur: e.target.value, couleurHex: hex })} placeholder="Nom de la couleur (ex : Aubergine)" className={field} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['R', 'G', 'B'].map((ch, i) => (
              <label key={ch} className="text-[10px] font-bold text-slate-400">
                {ch}
                <input type="number" min={0} max={255} value={rgb[i]} onChange={(e) => setRgb(i, e.target.value)} className={`${field} !px-2 !py-1.5 mt-1`} />
              </label>
            ))}
            <label className="text-[10px] font-bold text-slate-400">
              HEX
              <input
                value={hex || ''}
                onChange={(e) => onChange({ couleur: name, couleurHex: e.target.value.toUpperCase() })}
                className={`${field} !px-2 !py-1.5 mt-1 font-mono ${hex && !hexOk(hex) ? '!border-red-400' : ''}`}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
