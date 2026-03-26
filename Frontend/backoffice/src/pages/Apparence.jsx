import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { appearanceApi } from '../api/appearanceApi'
import { applyAllColors, applyColor, applyAllFonts, applyFont, applySidebarLayout, applyBorderRadius, applyDarkMode } from '../utils/brandColor'
import CustomSelect from '../components/ui/CustomSelect'

/* ── Tiny helpers ─────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? 'bg-brand' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow border border-slate-200 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function Label({ children }) {
  return (
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all ${className}`}
      {...props}
    />
  )
}

function SectionCard({ icon, title, children }) {
  return (
    <section className="bg-white rounded-custom border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-brand">{icon}</span>
        <h3 className="text-lg font-bold text-slate-800 font-heading">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function ColorPicker({ label, sub, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-slate-400">{value}</span>
        <label className="relative cursor-pointer">
          <div className="w-8 h-8 rounded-md border border-slate-200" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  )
}

function LogoUpload({ icon, label, sub, value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 2MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
      {value ? (
        <img src={value} alt={label} className="w-10 h-10 object-contain mb-2" />
      ) : (
        <span className="material-symbols-outlined text-slate-300 text-3xl mb-3 group-hover:text-brand transition-colors">
          {icon}
        </span>
      )}
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="text-[9px] text-slate-400 mt-1">{sub}</p>
      <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </label>
  )
}

function stripNulls(obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) result[k] = v
  }
  return result
}

/* ── Font options ─────────────────────────────────────────── */
const FONT_OPTIONS = [
  'Public Sans', 'Inter', 'Poppins', 'Montserrat', 'DM Sans',
  'Space Grotesk', 'Outfit', 'Plus Jakarta Sans', 'Playfair Display',
]

/* ── Default values ───────────────────────────────────────── */
const DEFAULTS = {
  primaryColor: '#004D40',
  secondaryColor: '#EC5B13',
  buttonColor: '#004D40',
  sidebarColor: '#004D40',
  badgeColor: '#EC5B13',
  fontPrimary: 'Public Sans',
  fontSecondary: 'Public Sans',
  fontSidebar: 'Public Sans',
  fontButton: 'Public Sans',
  fontBadge: 'Public Sans',
  sidebarStyle: 'Étendu',
  showIcons: true,
  showLogo: true,
  borderRadius: 12,
  darkMode: false,
  animations: true,
  brandName: '',
  domain: '',
  phone: '',
  email: '',
  slogan: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  whatsapp: '',
  logoMain: '',
  logoLight: '',
  favicon: '',
  loader: '',
}

const SCOPE_TABS = [
  { key: 'backoffice', label: 'Back Office', icon: 'admin_panel_settings' },
  { key: 'frontoffice', label: 'Front Office', icon: 'storefront' },
]

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Apparence() {
  const [activeScope, setActiveScope] = useState('backoffice')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [boSettings, setBoSettings] = useState({ ...DEFAULTS })
  const [foSettings, setFoSettings] = useState({ ...DEFAULTS, fontPrimary: 'Poppins' })

  const current = activeScope === 'backoffice' ? boSettings : foSettings
  const setCurrent = activeScope === 'backoffice' ? setBoSettings : setFoSettings

  /* ── Load from API ────────────────────────────────────────── */
  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const [bo, fo] = await Promise.all([
        appearanceApi.get('backoffice'),
        appearanceApi.get('frontoffice'),
      ])
      setBoSettings(prev => ({ ...prev, ...stripNulls(bo) }))
      setFoSettings(prev => ({ ...prev, ...stripNulls(fo) }))
      // Apply sidebar layout from loaded settings
      const merged = { ...DEFAULTS, ...stripNulls(bo) }
      applySidebarLayout(merged)
      applyBorderRadius(merged.borderRadius)
      applyDarkMode(merged.darkMode)
    } catch {
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  /* ── Save ─────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true)
    try {
      const data = activeScope === 'backoffice' ? boSettings : foSettings
      const res = await appearanceApi.update(activeScope, data)
      if (activeScope === 'backoffice') {
        const d = res || data
        applyAllColors(d)
        applyAllFonts(d)
        applySidebarLayout(d)
        applyBorderRadius(d.borderRadius)
        applyDarkMode(d.darkMode)
      }
      toast.success(`Apparence ${activeScope === 'backoffice' ? 'Back Office' : 'Front Office'} enregistrée`)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  /* ── Reset ────────────────────────────────────────────────── */
  const handleReset = async () => {
    try {
      const res = await appearanceApi.reset(activeScope)
      if (activeScope === 'backoffice') {
        const resetData = { ...DEFAULTS, ...stripNulls(res) }
        setBoSettings(resetData)
        applyAllColors(resetData)
        applyAllFonts(resetData)
        applySidebarLayout(resetData)
        applyBorderRadius(resetData.borderRadius)
        applyDarkMode(resetData.darkMode)
      } else {
        setFoSettings({ ...DEFAULTS, fontPrimary: 'Poppins', ...stripNulls(res) })
      }
      toast.success('Paramètres réinitialisés')
    } catch {
      toast.error('Erreur lors de la réinitialisation')
    }
  }

  /* ── Field updater ────────────────────────────────────────── */
  const COLOR_FIELD_MAP = { buttonColor: 'btn', sidebarColor: 'sidebar', badgeColor: 'badge', primaryColor: 'brand' }
  const FONT_FIELD_MAP = { fontPrimary: 'heading', fontSecondary: 'body', fontSidebar: 'sidebar', fontButton: 'button', fontBadge: 'badge' }
  const LAYOUT_FIELDS = new Set(['showIcons', 'showLogo'])
  const set = (field) => (valOrEvent) => {
    const value = valOrEvent?.target ? valOrEvent.target.value : valOrEvent
    setCurrent(prev => ({ ...prev, [field]: value }))
    // Live preview: apply color instantly when picking any color field
    if (activeScope === 'backoffice' && COLOR_FIELD_MAP[field]) {
      applyColor(COLOR_FIELD_MAP[field], value)
    }
    // Live preview: apply font instantly when picking any font field
    if (activeScope === 'backoffice' && FONT_FIELD_MAP[field]) {
      applyFont(FONT_FIELD_MAP[field], value)
    }
    // Live preview: apply sidebar layout toggles instantly
    if (activeScope === 'backoffice' && LAYOUT_FIELDS.has(field)) {
      applySidebarLayout({ [field]: value })
    }
    // Live preview: border radius
    if (activeScope === 'backoffice' && field === 'borderRadius') {
      applyBorderRadius(value)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-8 pb-28">
        <div className="max-w-[1400px] mx-auto">

          {/* ── Page Header ─────────────────────────────────── */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Personnalisation visuelle</h2>
            <p className="text-slate-500 text-sm mt-1">
              Configurez l'identité visuelle de votre espace administrateur et de votre boutique en ligne.
            </p>
          </div>

          {/* ── Scope Tabs (Backoffice / Frontoffice) ───────── */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 w-fit">
            {SCOPE_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveScope(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeScope === tab.key
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-8 items-start">

            {/* ════════════ LEFT COLUMN ════════════ */}
            <div className="col-span-12 lg:col-span-8 space-y-8">

              {/* ── Couleurs ──────────────────────── */}
              <SectionCard icon="palette" title="Couleurs">
                <div className="space-y-6">
                  {/* — Row 1: Boutons + Sidebar — */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Boutons"
                      sub="Boutons d'action principaux"
                      value={current.buttonColor}
                      onChange={set('buttonColor')}
                    />
                    <ColorPicker
                      label="Sidebar"
                      sub="Menu latéral, icônes actives"
                      value={current.sidebarColor}
                      onChange={set('sidebarColor')}
                    />
                  </div>
                  {/* — Row 2: Badges + Général — */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Badges &amp; Étiquettes"
                      sub="Tags, collections, statuts"
                      value={current.badgeColor}
                      onChange={set('badgeColor')}
                    />
                    <ColorPicker
                      label="Accent général"
                      sub="Focus, liens, divers"
                      value={current.primaryColor}
                      onChange={set('primaryColor')}
                    />
                  </div>
                  {/* — Live mini-preview — */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Aperçu</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm"
                        style={{ backgroundColor: current.buttonColor }}
                      >
                        Bouton
                      </button>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: current.sidebarColor + '1A', color: current.sidebarColor }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: current.sidebarColor }} />
                        Menu actif
                      </div>
                      <span className="px-3 py-1 text-[10px] font-bold rounded-full uppercase"
                        style={{ backgroundColor: current.badgeColor + '1A', color: current.badgeColor }}>
                        Summer 2026
                      </span>
                      <span className="px-3 py-1 text-[10px] font-bold rounded-full uppercase"
                        style={{ backgroundColor: current.badgeColor + '1A', color: current.badgeColor }}>
                        Best Sellers
                      </span>
                      <span className="text-xs font-semibold underline" style={{ color: current.primaryColor }}>
                        Lien accent
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ── Typographie ────────────────────── */}
              <SectionCard icon="text_fields" title="Typographie">
                <div className="space-y-6">
                  {/* — Row 1: Titres + Corps de texte — */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-brand text-base">title</span>
                        <p className="text-sm font-bold text-slate-800">Titres &amp; En-têtes</p>
                      </div>
                      <p className="text-[11px] text-slate-500">Pages, sections, tableaux</p>
                      <CustomSelect
                        value={current.fontPrimary}
                        onChange={set('fontPrimary')}
                        options={FONT_OPTIONS}
                      />
                      <p className="text-lg font-bold text-slate-800 truncate" style={{ fontFamily: current.fontPrimary }}>
                        Tableau de bord
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-brand text-base">article</span>
                        <p className="text-sm font-bold text-slate-800">Corps de texte</p>
                      </div>
                      <p className="text-[11px] text-slate-500">Descriptions, paragraphes, labels</p>
                      <CustomSelect
                        value={current.fontSecondary}
                        onChange={set('fontSecondary')}
                        options={FONT_OPTIONS}
                      />
                      <p className="text-sm text-slate-600 truncate" style={{ fontFamily: current.fontSecondary }}>
                        Un texte de description courant.
                      </p>
                    </div>
                  </div>
                  {/* — Row 2: Sidebar + Boutons — */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-brand text-base">menu</span>
                        <p className="text-sm font-bold text-slate-800">Sidebar &amp; Navigation</p>
                      </div>
                      <p className="text-[11px] text-slate-500">Menu latéral, liens de navigation</p>
                      <CustomSelect
                        value={current.fontSidebar}
                        onChange={set('fontSidebar')}
                        options={FONT_OPTIONS}
                      />
                      <div className="flex items-center gap-2 text-sm text-slate-700" style={{ fontFamily: current.fontSidebar }}>
                        <span className="material-symbols-outlined text-base text-brand">dashboard</span>
                        Dashboard
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-brand text-base">smart_button</span>
                        <p className="text-sm font-bold text-slate-800">Boutons</p>
                      </div>
                      <p className="text-[11px] text-slate-500">Boutons d'action principaux</p>
                      <CustomSelect
                        value={current.fontButton}
                        onChange={set('fontButton')}
                        options={FONT_OPTIONS}
                      />
                      <div className="flex gap-2">
                        <span className="px-4 py-1.5 text-xs font-bold text-white rounded-lg" style={{ fontFamily: current.fontButton, backgroundColor: current.buttonColor }}>
                          Enregistrer
                        </span>
                        <span className="px-4 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg" style={{ fontFamily: current.fontButton }}>
                          Annuler
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* — Row 3: Badges & Tags — */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-brand text-base">label</span>
                        <p className="text-sm font-bold text-slate-800">Badges, Tags &amp; Statuts</p>
                      </div>
                      <p className="text-[11px] text-slate-500">Étiquettes, collections, statuts</p>
                      <CustomSelect
                        value={current.fontBadge}
                        onChange={set('fontBadge')}
                        options={FONT_OPTIONS}
                      />
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full" style={{ fontFamily: current.fontBadge, backgroundColor: current.badgeColor + '1A', color: current.badgeColor }}>
                          Summer 2026
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-700" style={{ fontFamily: current.fontBadge }}>
                          ACTIF
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-700" style={{ fontFamily: current.fontBadge }}>
                          EN ATTENTE
                        </span>
                      </div>
                    </div>
                    {/* — Live combined preview — */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Aperçu combiné</p>
                      <p className="font-bold text-slate-900" style={{ fontFamily: current.fontPrimary }}>
                        Commandes récentes
                      </p>
                      <p className="text-xs text-slate-500" style={{ fontFamily: current.fontSecondary }}>
                        Gérez et suivez les commandes de vos clients.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-[10px] font-bold text-white rounded-lg" style={{ fontFamily: current.fontButton, backgroundColor: current.buttonColor }}>
                          Ajouter
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full" style={{ fontFamily: current.fontBadge, backgroundColor: current.badgeColor + '1A', color: current.badgeColor }}>
                          Best Sellers
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600" style={{ fontFamily: current.fontSidebar }}>
                        <span className="material-symbols-outlined text-sm text-brand">storefront</span>
                        Menu boutique
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ── Logos ──────────────────────────── */}
              <SectionCard icon="image" title="Logos &amp; Iconographie">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { field: 'logoMain', icon: 'cloud_upload',    label: 'Logo Principal', sub: 'SVG, PNG (max 2MB)' },
                    { field: 'logoLight', icon: 'brightness_high', label: 'Logo Clair',    sub: 'Pour fond sombre' },
                    { field: 'favicon', icon: 'bookmark',         label: 'Favicon',       sub: '32x32px .ico' },
                    { field: 'loader', icon: 'rotate_right',      label: 'Loader',        sub: 'GIF ou SVG animé' },
                  ].map((item) => (
                    <LogoUpload
                      key={item.field}
                      icon={item.icon}
                      label={item.label}
                      sub={item.sub}
                      value={current[item.field]}
                      onChange={(base64) => setCurrent(prev => ({ ...prev, [item.field]: base64 }))}
                    />
                  ))}
                </div>
              </SectionCard>

              {/* ── Identité de la Marque (FRONTOFFICE ONLY) ── */}
              {activeScope === 'frontoffice' && (
                <SectionCard icon="verified_user" title="Identité de la Marque">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label>Nom de la marque</Label>
                      <Input value={current.brandName || ''} onChange={set('brandName')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Domaine</Label>
                      <Input value={current.domain || ''} onChange={set('domain')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Téléphone support</Label>
                      <Input value={current.phone || ''} onChange={set('phone')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Email contact</Label>
                      <Input type="email" value={current.email || ''} onChange={set('email')} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label>Slogan de l'entreprise</Label>
                      <Input value={current.slogan || ''} onChange={set('slogan')} />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* ── Réseaux Sociaux (FRONTOFFICE ONLY) ──────── */}
              {activeScope === 'frontoffice' && (
                <SectionCard icon="share" title="Réseaux Sociaux">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { field: 'instagram', icon: 'camera',            bg: 'bg-pink-100',  text: 'text-pink-600',  label: 'Instagram' },
                      { field: 'facebook',  icon: 'social_leaderboard', bg: 'bg-blue-100',  text: 'text-blue-600',  label: 'Facebook' },
                      { field: 'linkedin',  icon: 'alternate_email',    bg: 'bg-sky-100',   text: 'text-sky-600',   label: 'LinkedIn' },
                      { field: 'whatsapp',  icon: 'chat',               bg: 'bg-green-100', text: 'text-green-600', label: 'WhatsApp' },
                    ].map((s) => (
                      <div key={s.field} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.text} flex items-center justify-center flex-shrink-0`}>
                          <span className="material-symbols-outlined text-xl">{s.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{s.label}</p>
                          <input
                            className="w-full bg-transparent border-none text-sm font-semibold p-0 focus:ring-0 outline-none"
                            placeholder={`Lien ${s.label}`}
                            value={current[s.field] || ''}
                            onChange={set(s.field)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* ── Réglages Menu (backoffice only) ─ */}
              {activeScope === 'backoffice' && (
                <section className="bg-white rounded-custom border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold mb-5 uppercase text-slate-400 tracking-widest">
                    Réglages Menu
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Afficher Icônes</span>
                      <Toggle checked={current.showIcons} onChange={set('showIcons')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Logo Sidebar</span>
                      <Toggle checked={current.showLogo} onChange={set('showLogo')} />
                    </div>
                  </div>
                </section>
              )}

              {/* ── Avancé ───────────────────────── */}
              <section className="bg-white rounded-custom border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold mb-5 uppercase text-slate-400 tracking-widest">
                  Avancé
                </h3>
                <div className="space-y-6">
                  <div>
                    <Label>Rayon des bordures</Label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={current.borderRadius}
                      onChange={(e) => { const v = Number(e.target.value); set('borderRadius')(v) }}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                      <span>Carré</span>
                      <span className="text-brand">{current.borderRadius}px</span>
                      <span>Arrondi</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold text-slate-700">Mode Sombre</span>
                    <div className="bg-slate-100 p-1 rounded-full flex gap-1">
                      <button
                        onClick={() => { setCurrent(prev => ({ ...prev, darkMode: false })); if (activeScope === 'backoffice') applyDarkMode(false) }}
                        className={`p-1.5 rounded-full transition-all ${!current.darkMode ? 'bg-white shadow-sm text-brand' : 'text-slate-400'}`}
                      >
                        <span className="material-symbols-outlined text-sm leading-none block">light_mode</span>
                      </button>
                      <button
                        onClick={() => { setCurrent(prev => ({ ...prev, darkMode: true })); if (activeScope === 'backoffice') applyDarkMode(true) }}
                        className={`p-1.5 rounded-full transition-all ${current.darkMode ? 'bg-white shadow-sm text-brand' : 'text-slate-400'}`}
                      >
                        <span className="material-symbols-outlined text-sm leading-none block">dark_mode</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* ════════════ RIGHT COLUMN ════════════ */}
            <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start">

                {/* ── Live Preview ──────────────────── */}
                <section className="bg-white rounded-custom border border-slate-200 p-1 shadow-xl overflow-hidden ring-1 ring-slate-100">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Aperçu en direct — {activeScope === 'backoffice' ? 'Back Office' : 'Front Office'}
                    </h4>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
                    </div>
                  </div>

                  <div className="p-5 space-y-5 bg-slate-50">
                    {/* Sample Card */}
                    <div className="bg-white border border-slate-200 shadow-sm p-4 space-y-3" style={{ borderRadius: `${current.borderRadius}px` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 font-heading">Carte exemple</span>
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 font-badge"
                          style={{
                            borderRadius: `${Math.max(current.borderRadius * 0.6, 3)}px`,
                            backgroundColor: `${current.badgeColor || current.secondaryColor || '#EC5B13'}20`,
                            color: current.badgeColor || current.secondaryColor || '#EC5B13',
                          }}
                        >
                          BADGE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-body">Cet aperçu reflète vos réglages en temps réel.</p>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 text-xs font-bold text-white font-button"
                          style={{
                            borderRadius: `${current.borderRadius}px`,
                            backgroundColor: current.buttonColor || current.primaryColor,
                          }}
                        >
                          Bouton principal
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs font-bold border font-button"
                          style={{
                            borderRadius: `${current.borderRadius}px`,
                            borderColor: current.primaryColor,
                            color: current.primaryColor,
                          }}
                        >
                          Secondaire
                        </button>
                      </div>
                    </div>

                    {/* Sample Input */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Champ de saisie</span>
                      <div
                        className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 font-body"
                        style={{ borderRadius: `${current.borderRadius}px` }}
                      >
                        Exemple de texte...
                      </div>
                    </div>

                    {/* Sample Table Row */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ligne de tableau</span>
                      <div
                        className="bg-white border border-slate-200 overflow-hidden"
                        style={{ borderRadius: `${current.borderRadius}px` }}
                      >
                        <div className="flex items-center px-3 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50">
                          <span className="w-1/3">Produit</span>
                          <span className="w-1/3 text-center">Statut</span>
                          <span className="w-1/3 text-right">Prix</span>
                        </div>
                        <div className="flex items-center px-3 py-2.5">
                          <span className="w-1/3 text-xs font-semibold text-slate-700 font-body">Article A</span>
                          <span className="w-1/3 flex justify-center">
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 font-badge"
                              style={{
                                borderRadius: `${Math.max(current.borderRadius * 0.5, 3)}px`,
                                backgroundColor: '#10b98120',
                                color: '#10b981',
                              }}
                            >
                              ACTIF
                            </span>
                          </span>
                          <span className="w-1/3 text-xs font-bold text-right font-body" style={{ color: current.primaryColor }}>
                            89,00 €
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar mini preview */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sidebar</span>
                      <div
                        className="bg-white border border-slate-200 p-3 flex items-center gap-3"
                        style={{ borderRadius: `${current.borderRadius}px` }}
                      >
                        {current.showLogo !== false && (
                          <div
                            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                            style={{
                              borderRadius: `${Math.max(current.borderRadius * 0.6, 3)}px`,
                              backgroundColor: current.sidebarColor || current.primaryColor,
                            }}
                          >
                            <span className="material-symbols-outlined text-white text-[14px]">shield</span>
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2">
                              {current.showIcons !== false && (
                                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[10px] text-slate-400">
                                    {i === 1 ? 'dashboard' : i === 2 ? 'inventory_2' : 'group'}
                                  </span>
                                </div>
                              )}
                              <div className={`h-1.5 rounded ${i === 2 ? '' : 'bg-slate-100'}`} style={i === 2 ? { backgroundColor: (current.sidebarColor || current.primaryColor) + '22', width: '60%' } : { width: '70%' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Footer ────────────────────────────────── */}
      <footer className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-slate-200 flex items-center justify-between px-8 py-4 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500 font-medium italic">
            {activeScope === 'backoffice' ? 'Back Office' : 'Front Office'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors font-button"
          >
            Réinitialiser
          </button>
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 text-xs font-bold text-white bg-btn hover:bg-btn-dark rounded-xl shadow-lg shadow-btn/20 transition-all disabled:opacity-50 font-button"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </footer>
    </div>
  )
}
