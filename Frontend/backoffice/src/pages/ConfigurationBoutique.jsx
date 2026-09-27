import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { TEMPLATES, layoutOf } from '../data/storeTemplates'
import { OPTION_LABELS } from '../data/catalogOptions'
import { readUser, storeSession } from '../lib/sellio'
import { useShopOptions } from '../hooks/useShopOptions'
import { AddCustomOption } from '../components/ui/OptionPickers'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const COLOR_FIELDS = [
  { key: 'primaryColor', label: 'Couleur principale', help: 'Bandeau d’annonce, pied de page, liens actifs' },
  { key: 'accentColor', label: 'Couleur d’accent', help: 'Petits titres, badges, détails' },
  { key: 'backgroundColor', label: 'Fond de page', help: 'Couleur de fond de la vitrine' },
  { key: 'textColor', label: 'Texte', help: 'Titres et textes principaux' },
  { key: 'buttonColor', label: 'Boutons', help: 'Fond des boutons d’action' },
  { key: 'buttonTextColor', label: 'Texte des boutons', help: 'Lisible sur la couleur des boutons' },
]

const PALETTES = [
  { name: 'Classique', colors: ['#111111', '#8A8A8A', '#FFFFFF', '#111111', '#111111', '#FFFFFF'] },
  { name: 'Sable', colors: ['#3E3226', '#B08D57', '#F6F1EA', '#2A2420', '#3E3226', '#F6F1EA'] },
  { name: 'Olive', colors: ['#3F4A2E', '#A3A36B', '#F4F2EA', '#22261B', '#3F4A2E', '#FFFFFF'] },
  { name: 'Terracotta', colors: ['#B4532A', '#D9925B', '#FBF5EF', '#2E1D14', '#B4532A', '#FFFFFF'] },
  { name: 'Marine', colors: ['#1F2A44', '#C8A96A', '#F5F6F8', '#111827', '#1F2A44', '#FFFFFF'] },
  { name: 'Bordeaux', colors: ['#6D1A2A', '#C9A06B', '#FAF6F2', '#2B1016', '#6D1A2A', '#FFFFFF'] },
  { name: 'Rose poudré', colors: ['#B76E79', '#D9A5A5', '#FFF7F5', '#3A2226', '#B76E79', '#FFFFFF'] },
  { name: 'Émeraude', colors: ['#0F5132', '#C9A54A', '#F3F7F4', '#0B2A1E', '#0F5132', '#FFFFFF'] },
  { name: 'Lavande', colors: ['#4B3F72', '#A99BD6', '#F7F5FC', '#1F1A33', '#4B3F72', '#FFFFFF'] },
  { name: 'Contraste', colors: ['#000000', '#E4002B', '#FFFFFF', '#000000', '#E4002B', '#FFFFFF'] },
]

const EMPTY = Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, '']))

function hexOk(v) {
  return /^#[0-9A-Fa-f]{6}$/.test(v || '')
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` }
}

async function patchShop(body) {
  const res = await fetch(`${API}/auth/my-shop`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || data?.message || 'Enregistrement impossible.')
  storeSession(localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'), data)
  return data
}

function Preview({ colors, layout, name }) {
  const template = TEMPLATES.find((t) => t.id === layout) || TEMPLATES[0]
  const c = {
    primary: colors.primaryColor || template.colors.primary,
    accent: colors.accentColor || template.colors.muted,
    bg: colors.backgroundColor || template.colors.surface,
    text: colors.textColor || template.colors.primary,
    button: colors.buttonColor || colors.primaryColor || template.colors.button,
    buttonText: colors.buttonTextColor || template.colors.buttonText,
  }
  const radius = template.radius
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ background: c.bg, color: c.text }}>
      <div className="text-[9px] tracking-[0.2em] uppercase text-center py-1.5" style={{ background: c.primary, color: c.bg }}>Livraison offerte dès 200 TND</div>
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: `${c.text}1A` }}>
        <span className="text-sm font-semibold" style={{ fontFamily: template.font, letterSpacing: template.tracking, textTransform: template.upper ? 'uppercase' : 'none' }}>{name || 'Votre boutique'}</span>
        <span className="text-[10px] opacity-70">Panier (2)</span>
      </div>
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: c.accent }}>Nouvelle collection</p>
        <p className="text-lg mt-1 leading-tight" style={{ fontFamily: template.font, textTransform: template.upper ? 'uppercase' : 'none' }}>La sélection de saison</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {['Pièce 01', 'Pièce 02'].map((label) => (
            <div key={label}>
              <div className="h-16 relative" style={{ background: `${c.text}12`, borderRadius: radius }}>
                <span className="absolute top-1.5 left-1.5 text-[8px] px-1.5 py-0.5" style={{ background: c.accent, color: c.bg, borderRadius: radius }}>Nouveau</span>
              </div>
              <p className="text-[11px] mt-1.5">{label}</p>
              <p className="text-[11px] font-semibold">89.00 TND</p>
            </div>
          ))}
        </div>
        <div className="mt-4 py-2 text-center text-xs font-semibold" style={{ background: c.button, color: c.buttonText, borderRadius: radius }}>Ajouter au panier</div>
      </div>
      <div className="px-4 py-3 text-[10px]" style={{ background: c.primary, color: c.bg }}>© {name || 'Boutique'}</div>
    </div>
  )
}

function CustomLists() {
  const { customFor, removeOption } = useShopOptions()
  const [key, setKey] = useState('tissu')
  const values = customFor(key)
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Listes du catalogue</h2>
        <p className="text-sm text-slate-500 mt-1">Les formulaires produit proposent des listes prêtes (tailles, tissus, couleurs…). Ajoutez ici vos propres valeurs.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(OPTION_LABELS).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKey(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${key === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
            {label}
            {customFor(k).length > 0 && <span className="ml-1.5 opacity-60">{customFor(k).length}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {values.length === 0 && <p className="text-sm text-slate-400 italic">Aucune valeur personnalisée pour « {OPTION_LABELS[key]} ».</p>}
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-lg bg-slate-100 text-sm">
            {v}
            <button type="button" onClick={() => removeOption(key, v).catch(() => toast.error('Suppression impossible.'))} className="material-symbols-outlined text-base text-slate-400 hover:text-red-500">close</button>
          </span>
        ))}
      </div>
      <AddCustomOption key={key} optionKey={key} label={`Ajouter une valeur à « ${OPTION_LABELS[key]} »`} />
    </section>
  )
}

export default function ConfigurationBoutique() {
  const user = readUser()
  const [layout, setLayout] = useState(layoutOf(user.templateKey))
  const [colors, setColors] = useState(EMPTY)
  const [saved, setSaved] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/auth/my-shop`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((shop) => {
        if (!shop) return
        const current = Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, shop[f.key] || '']))
        setColors(current)
        setSaved(current)
      })
      .catch(() => {})
  }, [])

  const saveLayout = async (id) => {
    const previous = layout
    setLayout(id)
    try {
      await patchShop({ templateKey: id })
      toast.success('Modèle enregistré')
    } catch (err) {
      setLayout(previous)
      toast.error(err.message)
    }
  }

  const invalid = COLOR_FIELDS.filter((f) => colors[f.key] && !hexOk(colors[f.key]))
  const dirty = COLOR_FIELDS.some((f) => colors[f.key] !== saved[f.key])

  const saveColors = async (next = colors) => {
    setSaving(true)
    try {
      // An empty string clears the colour so the template default applies again.
      await patchShop(Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, next[f.key] || ''])))
      setSaved(next)
      toast.success('Palette enregistrée — rechargez la vitrine pour la voir')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const applyPalette = (palette) => setColors(Object.fromEntries(COLOR_FIELDS.map((f, i) => [f.key, palette.colors[i]])))
  const activePalette = PALETTES.find((p) => COLOR_FIELDS.every((f, i) => (colors[f.key] || '').toUpperCase() === p.colors[i]))

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Votre boutique</h1>
          <p className="text-slate-500">Modèle, couleurs et listes de votre catalogue.</p>
        </div>
        {user.shopSlug && (
          <a href={`http://localhost:3001/${user.shopSlug}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full border border-slate-300 text-sm font-medium hover:bg-slate-50">
            Ouvrir la vitrine ↗
          </a>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Modèle de vitrine</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TEMPLATES.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => saveLayout(item.id)}
              className={`text-left rounded-2xl border p-5 bg-white transition-all ${layout === item.id ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{item.title}</p>
                {layout === item.id && <span className="material-symbols-outlined text-lg">check_circle</span>}
              </div>
              <p className="text-sm text-slate-500 mt-1">{item.text}</p>
              {user.shopSlug && (
                <a
                  href={`http://localhost:3001/${user.shopSlug}/?preview=${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block mt-3 text-xs font-semibold underline text-slate-600"
                >
                  Prévisualiser
                </a>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Palette de couleurs</h2>
              <p className="text-sm text-slate-500 mt-1">Choisissez une palette prête puis ajustez chaque couleur si besoin.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PALETTES.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => applyPalette(p)}
                  className={`rounded-xl border p-2 text-left transition-all ${activePalette === p ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
                >
                  <div className="flex h-7 rounded-md overflow-hidden border border-black/5">
                    {[p.colors[2], p.colors[0], p.colors[1], p.colors[3]].map((col, i) => <span key={i} className="flex-1" style={{ background: col }} />)}
                  </div>
                  <p className="text-xs font-medium mt-1.5">{p.name}</p>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {COLOR_FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                  <span className="block text-[11px] text-slate-400">{f.help}</span>
                  <span className={`mt-1.5 flex items-center gap-2 bg-slate-50 border rounded-lg px-2 py-1.5 ${colors[f.key] && !hexOk(colors[f.key]) ? 'border-red-400' : 'border-slate-200'}`}>
                    <input
                      type="color"
                      value={hexOk(colors[f.key]) ? colors[f.key] : '#000000'}
                      onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value.toUpperCase() }))}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      value={colors[f.key]}
                      onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value.toUpperCase() }))}
                      placeholder="Par défaut"
                      className="w-full bg-transparent font-mono text-xs outline-none"
                    />
                    {colors[f.key] && (
                      <button type="button" title="Couleur du modèle" onClick={() => setColors((c) => ({ ...c, [f.key]: '' }))} className="material-symbols-outlined text-base text-slate-400 hover:text-slate-700">restart_alt</button>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={saving || !dirty || invalid.length > 0} onClick={() => saveColors()} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">
                {saving ? 'Enregistrement…' : 'Enregistrer la palette'}
              </button>
              <button type="button" disabled={saving} onClick={() => { setColors(EMPTY); saveColors(EMPTY) }} className="px-5 py-2.5 rounded-full border border-slate-300 text-sm font-medium">
                Revenir aux couleurs du modèle
              </button>
              {invalid.length > 0 && <p className="text-sm text-red-600 self-center">Format attendu : #RRGGBB</p>}
            </div>
          </div>
          <aside className="space-y-2 lg:sticky lg:top-6 self-start">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Aperçu</p>
            <Preview colors={colors} layout={layout} name={user.shopName} />
          </aside>
        </div>
      </section>

      <CustomLists />

      <dl className="bg-white rounded-2xl border border-slate-200 divide-y">
        <div className="px-5 py-4 flex justify-between"><dt>Nom</dt><dd className="font-medium">{user.shopName || '—'}</dd></div>
        <div className="px-5 py-4 flex justify-between"><dt>Préfixe</dt><dd className="font-medium">/{user.shopSlug || '—'}</dd></div>
        <div className="px-5 py-4 flex justify-between"><dt>Activité</dt><dd className="font-medium">{user.businessType === 'CLOTHES' ? 'Vêtements' : 'Cosmétiques'}</dd></div>
      </dl>
    </div>
  )
}
