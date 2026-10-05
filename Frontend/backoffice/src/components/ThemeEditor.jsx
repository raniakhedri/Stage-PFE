import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { TEMPLATES } from '../data/storeTemplates'

/**
 * Storefront colour settings.
 * `column: true` keys are stored as their own shop columns (older fields, also used by the
 * storefront's base palette); every other key goes into the shop's `theme` JSON.
 */
export const THEME_GROUPS = [
  {
    title: 'Général',
    icon: 'palette',
    fields: [
      { key: 'primaryColor', column: true, label: 'Couleur de marque', help: 'Bandeau, pied de page et éléments forts' },
      { key: 'accentColor', column: true, label: 'Accent', help: 'Petits titres et détails' },
      { key: 'backgroundColor', column: true, label: 'Fond de page' },
      { key: 'textColor', column: true, label: 'Texte' },
      { key: 'headingColor', label: 'Titres de section' },
    ],
  },
  {
    title: 'Bandeau d’annonce',
    icon: 'campaign',
    fields: [
      { key: 'announceBg', label: 'Fond' },
      { key: 'announceText', label: 'Texte' },
    ],
  },
  {
    title: 'Barre de navigation',
    icon: 'menu',
    fields: [
      { key: 'navBg', label: 'Fond', help: 'Sur Bold et Luxury, l’en-tête est transparent au-dessus de la bannière tant que ce fond est vide' },
      { key: 'navText', label: 'Liens et icônes' },
      { key: 'navHover', label: 'Liens au survol' },
    ],
  },
  {
    title: 'Boutons',
    icon: 'smart_button',
    fields: [
      { key: 'buttonColor', column: true, label: 'Fond' },
      { key: 'buttonTextColor', column: true, label: 'Texte' },
      { key: 'buttonHoverBg', label: 'Fond au survol' },
      { key: 'buttonHoverText', label: 'Texte au survol' },
    ],
  },
  {
    title: 'Produits',
    icon: 'sell',
    fields: [
      { key: 'priceColor', label: 'Prix' },
      { key: 'saleColor', label: 'Prix promo' },
      { key: 'badgeBg', label: 'Badge — fond', help: '« Nouveau », « -20 % »…' },
      { key: 'badgeText', label: 'Badge — texte' },
    ],
  },
  {
    title: 'Pied de page',
    icon: 'bottom_navigation',
    fields: [
      { key: 'footerBg', label: 'Fond' },
      { key: 'footerText', label: 'Texte et liens' },
    ],
  },
]

const FIELDS = THEME_GROUPS.flatMap((g) => g.fields)
const COLUMN_KEYS = FIELDS.filter((f) => f.column).map((f) => f.key)
const THEME_KEYS = FIELDS.filter((f) => !f.column).map((f) => f.key)
export const EMPTY_THEME = Object.fromEntries(FIELDS.map((f) => [f.key, '']))

/** A preset: [brand, accent, background, text, button, buttonText] expanded to every field. */
function expand([brand, accent, background, text, button, buttonText]) {
  return {
    primaryColor: brand,
    accentColor: accent,
    backgroundColor: background,
    textColor: text,
    headingColor: text,
    announceBg: brand,
    announceText: background,
    navBg: background,
    navText: text,
    navHover: accent,
    buttonColor: button,
    buttonTextColor: buttonText,
    buttonHoverBg: accent,
    buttonHoverText: buttonText,
    priceColor: text,
    saleColor: '#C62828',
    badgeBg: accent,
    badgeText: '#FFFFFF',
    footerBg: brand,
    footerText: background,
  }
}

const PRESETS = [
  ['Classique', ['#111111', '#8A8A8A', '#FFFFFF', '#111111', '#111111', '#FFFFFF']],
  ['Sable', ['#3E3226', '#B08D57', '#F6F1EA', '#2A2420', '#3E3226', '#F6F1EA']],
  ['Olive', ['#3F4A2E', '#8C8C4E', '#F4F2EA', '#22261B', '#3F4A2E', '#FFFFFF']],
  ['Terracotta', ['#B4532A', '#D9925B', '#FBF5EF', '#2E1D14', '#B4532A', '#FFFFFF']],
  ['Marine', ['#1F2A44', '#C8A96A', '#F5F6F8', '#111827', '#1F2A44', '#FFFFFF']],
  ['Bordeaux', ['#6D1A2A', '#C9A06B', '#FAF6F2', '#2B1016', '#6D1A2A', '#FFFFFF']],
  ['Rose poudré', ['#B76E79', '#D48C95', '#FFF7F5', '#3A2226', '#B76E79', '#FFFFFF']],
  ['Émeraude', ['#0F5132', '#C9A54A', '#F3F7F4', '#0B2A1E', '#0F5132', '#FFFFFF']],
  ['Lavande', ['#4B3F72', '#8E7CC3', '#F7F5FC', '#1F1A33', '#4B3F72', '#FFFFFF']],
  ['Moka', ['#4A3428', '#A47551', '#F8F3EE', '#2B1D16', '#4A3428', '#FFFFFF']],
].map(([name, colors]) => ({ name, colors, values: expand(colors) }))

function hexOk(v) {
  return /^#[0-9A-Fa-f]{6}$/.test(v || '')
}

/** Shop response → editor state. */
export function themeFromShop(shop) {
  let theme = {}
  try { theme = JSON.parse(shop?.theme || '{}') || {} } catch { theme = {} }
  return Object.fromEntries(FIELDS.map((f) => [f.key, (f.column ? shop?.[f.key] : theme[f.key]) || '']))
}

/** Editor state → PATCH /my-shop body (empty string resets a colour to the template default). */
export function themePayload(values) {
  const theme = Object.fromEntries(THEME_KEYS.filter((k) => hexOk(values[k])).map((k) => [k, values[k].toUpperCase()]))
  return {
    ...Object.fromEntries(COLUMN_KEYS.map((k) => [k, values[k] || ''])),
    theme: JSON.stringify(theme),
  }
}

function ColorField({ field, value, fallback, onChange }) {
  const invalid = value && !hexOk(value)
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{field.label}</span>
      {field.help && <span className="block text-[11px] text-slate-400 leading-snug">{field.help}</span>}
      <span className={`mt-1.5 flex items-center gap-2 bg-slate-50 border rounded-lg px-2 py-1.5 ${invalid ? 'border-red-400' : 'border-slate-200'}`}>
        <input
          type="color"
          value={hexOk(value) ? value : fallback}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="w-8 h-8 rounded cursor-pointer bg-transparent"
        />
        <input value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder="Par défaut" className="w-full bg-transparent font-mono text-xs outline-none" />
        {value && (
          <button type="button" title="Revenir à la couleur du modèle" onClick={() => onChange('')} className="material-symbols-outlined text-base text-slate-400 hover:text-slate-700">restart_alt</button>
        )}
      </span>
    </label>
  )
}

/** Mini storefront that renders every setting, hover states included. */
function Preview({ values, layout, name }) {
  // Lets the page show the unsaved colours on the real storefront.
  useEffect(() => {
    if (onPreview) onPreview(themePayload(values))
  }, [values, onPreview])

  const template = TEMPLATES.find((t) => t.id === layout) || TEMPLATES[0]
  const [hoverLink, setHoverLink] = useState(null)
  const [hoverBtn, setHoverBtn] = useState(false)
  const v = (key, fallback) => (hexOk(values[key]) ? values[key] : fallback)
  const brand = v('primaryColor', template.colors.primary)
  const bg = v('backgroundColor', template.colors.surface)
  const text = v('textColor', template.colors.primary)
  const accent = v('accentColor', template.colors.muted)
  const button = v('buttonColor', brand)
  const buttonText = v('buttonTextColor', template.colors.buttonText)
  const radius = template.radius
  const serif = { fontFamily: template.font, textTransform: template.upper ? 'uppercase' : 'none', letterSpacing: template.tracking }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm text-[11px]" style={{ background: bg, color: text }}>
      <div className="text-[9px] tracking-[0.2em] uppercase text-center py-1.5" style={{ background: v('announceBg', brand), color: v('announceText', bg) }}>Livraison offerte dès 200 TND</div>
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ background: v('navBg', bg), color: v('navText', text), borderColor: `${text}1A` }}>
        <span className="text-sm font-semibold" style={serif}>{name || 'Votre boutique'}</span>
        <span className="flex gap-3">
          {['Nouveautés', 'Collection'].map((label) => (
            <span
              key={label}
              onMouseEnter={() => setHoverLink(label)}
              onMouseLeave={() => setHoverLink(null)}
              className="cursor-pointer transition-colors"
              style={{ color: hoverLink === label ? v('navHover', v('navText', text)) : v('navText', text) }}
            >
              {label}
            </span>
          ))}
        </span>
      </div>
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: accent }}>Nouvelle collection</p>
        <p className="text-lg mt-1 leading-tight" style={{ ...serif, color: v('headingColor', text) }}>La sélection de saison</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[['Pièce 01', null], ['Pièce 02', '-20%']].map(([label, promo]) => (
            <div key={label}>
              <div className="h-16 relative" style={{ background: `${text}12`, borderRadius: radius }}>
                <span className="absolute top-1.5 left-1.5 text-[8px] px-1.5 py-0.5" style={{ background: v('badgeBg', accent), color: v('badgeText', '#FFFFFF'), borderRadius: radius }}>
                  {promo || 'Nouveau'}
                </span>
              </div>
              <p className="mt-1.5">{label}</p>
              <p className="font-semibold">
                {promo ? (
                  <>
                    <span className="line-through opacity-50 mr-1">89.00</span>
                    <span style={{ color: v('saleColor', '#DC2626') }}>71.20 TND</span>
                  </>
                ) : (
                  <span style={{ color: v('priceColor', text) }}>89.00 TND</span>
                )}
              </p>
            </div>
          ))}
        </div>
        <div
          onMouseEnter={() => setHoverBtn(true)}
          onMouseLeave={() => setHoverBtn(false)}
          className="mt-4 py-2 text-center text-xs font-semibold cursor-pointer transition-colors"
          style={{
            background: hoverBtn ? v('buttonHoverBg', button) : button,
            color: hoverBtn ? v('buttonHoverText', buttonText) : buttonText,
            borderRadius: radius,
          }}
        >
          Ajouter au panier
        </div>
        <p className="text-[9px] text-center mt-1.5 opacity-50">Survolez le menu et le bouton</p>
      </div>
      <div className="px-4 py-3 flex justify-between text-[10px]" style={{ background: v('footerBg', brand), color: v('footerText', bg) }}>
        <span>© {name || 'Boutique'}</span>
        <span>Contact · Livraison</span>
      </div>
    </div>
  )
}

export default function ThemeEditor({ shop, layout, shopName, onSave, onPreview, showPreview = true }) {
  const [values, setValues] = useState(EMPTY_THEME)
  const [saved, setSaved] = useState(EMPTY_THEME)
  const [saving, setSaving] = useState(false)
  const [openGroup, setOpenGroup] = useState(0)

  useEffect(() => {
    if (!shop) return
    const current = themeFromShop(shop)
    setValues(current)
    setSaved(current)
  }, [shop])

  const template = TEMPLATES.find((t) => t.id === layout) || TEMPLATES[0]
  const invalid = Object.values(values).some((v) => v && !hexOk(v))
  const dirty = Object.keys(values).some((k) => values[k] !== saved[k])
  const set = (key) => (value) => setValues((prev) => ({ ...prev, [key]: value }))
  const activePreset = PRESETS.find((p) => Object.entries(p.values).every(([k, v]) => (values[k] || '').toUpperCase() === v))

  const save = async (next = values) => {
    setSaving(true)
    try {
      await onSave(themePayload(next))
      setSaved(next)
      toast.success('Couleurs enregistrées : elles sont en ligne sur votre vitrine.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className={showPreview ? 'grid lg:grid-cols-[1fr_320px] gap-8' : ''}>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Personnalisation de la vitrine</h2>
            <p className="text-sm text-slate-500 mt-1">Partez d’une palette puis réglez chaque élément. Un champ vide garde la couleur du modèle.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.name}
                onClick={() => setValues(p.values)}
                className={`rounded-xl border p-2 text-left transition-all ${activePreset === p ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
              >
                <div className="flex h-7 rounded-md overflow-hidden border border-black/5">
                  {[p.colors[2], p.colors[0], p.colors[1], p.colors[3]].map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
                </div>
                <p className="text-xs font-medium mt-1.5">{p.name}</p>
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {THEME_GROUPS.map((group, i) => {
              const count = group.fields.filter((f) => values[f.key]).length
              return (
                <div key={group.title}>
                  <button type="button" onClick={() => setOpenGroup(openGroup === i ? -1 : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50">
                    <span className="material-symbols-outlined text-lg text-slate-500">{group.icon}</span>
                    <span className="font-medium text-sm flex-1">{group.title}</span>
                    <span className="flex -space-x-1.5">
                      {group.fields.filter((f) => hexOk(values[f.key])).slice(0, 4).map((f) => (
                        <span key={f.key} className="w-4 h-4 rounded-full border-2 border-white" style={{ background: values[f.key] }} />
                      ))}
                    </span>
                    <span className="text-xs text-slate-400 w-20 text-right">{count ? `${count}/${group.fields.length} réglé${count > 1 ? 's' : ''}` : 'Par défaut'}</span>
                    <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${openGroup === i ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  {openGroup === i && (
                    <div className="px-4 pb-5 pt-1 grid sm:grid-cols-2 gap-4">
                      {group.fields.map((f) => (
                        <ColorField key={f.key} field={f} value={values[f.key]} fallback={template.colors.primary} onChange={set(f.key)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={saving || !dirty || invalid} onClick={() => save()} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {dirty && <button type="button" onClick={() => setValues(saved)} className="px-4 py-2.5 rounded-full text-sm text-slate-600 hover:bg-slate-100">Annuler les changements</button>}
            <button type="button" disabled={saving} onClick={() => { setValues(EMPTY_THEME); save(EMPTY_THEME) }} className="px-4 py-2.5 rounded-full border border-slate-300 text-sm font-medium">
              Tout réinitialiser
            </button>
            {invalid && <p className="text-sm text-red-600">Format attendu : #RRGGBB</p>}
          </div>
        </div>

        {showPreview && (
          <aside className="space-y-2 lg:sticky lg:top-6 self-start">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Aperçu en direct</p>
            <Preview values={values} layout={layout} name={shopName} />
          </aside>
        )}
      </div>
    </section>
  )
}
