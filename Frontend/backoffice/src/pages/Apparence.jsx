import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import ThemeEditor from '../components/ThemeEditor'
import { layoutOf } from '../data/storeTemplates'
import { applyAllColors } from '../utils/brandColor'
import { patchShop, StorefrontPreview, useShopSettings } from '../hooks/useShopSettings'

const TABS = [
  { id: 'identity', label: 'Logo & identité', icon: 'badge' },
  { id: 'colors', label: 'Couleurs', icon: 'palette' },
  { id: 'fonts', label: 'Polices', icon: 'text_fields' },
  { id: 'announcement', label: 'Barre d’annonce', icon: 'campaign' },
  { id: 'backoffice', label: 'Back-office', icon: 'dashboard_customize' },
]

// Google Fonts offered for the storefront (loaded on demand by the storefront).
const FONTS = [
  'Inter', 'DM Sans', 'Poppins', 'Montserrat', 'Outfit', 'Space Grotesk', 'Manrope', 'Nunito', 'Raleway', 'Work Sans',
  'Playfair Display', 'Cormorant Garamond', 'Libre Baskerville', 'Fraunces', 'Lora', 'EB Garamond',
  'Anton', 'Bebas Neue', 'Barlow Condensed', 'Oswald', 'Fredoka', 'Pacifico', 'Caveat', 'Amiri', 'Cairo', 'Tajawal',
]

const SOCIAL_FIELDS = [
  ['instagram', 'Instagram', 'https://instagram.com/votre-boutique'],
  ['facebook', 'Facebook', 'https://facebook.com/votre-boutique'],
  ['tiktok', 'TikTok', 'https://tiktok.com/@votre-boutique'],
  ['youtube', 'YouTube', 'https://youtube.com/@votre-boutique'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/company/votre-boutique'],
]

const BACKOFFICE_COLORS = [
  ['primaryColor', 'Couleur principale', 'Liens, onglets, éléments actifs'],
  ['sidebarColor', 'Menu latéral', 'Élément sélectionné du menu'],
  ['buttonColor', 'Boutons', 'Boutons d’action'],
  ['badgeColor', 'Badges', 'Étiquettes et statuts'],
]

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand'
const hexOk = (v) => /^#[0-9A-Fa-f]{6}$/.test(v || '')

function Field({ label, help, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {help && <span className="block text-[11px] text-slate-400 mt-1">{help}</span>}
    </label>
  )
}

function Card({ title, text, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {text && <p className="text-sm text-slate-500 mt-1">{text}</p>}
      </div>
      {children}
    </section>
  )
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Everything that changes how the shop looks: logo, identity, colours, fonts, announcement bar, backoffice colours. */
export default function Apparence() {
  const { shop, settings, error, reload, saveSettings } = useShopSettings()
  const [tab, setTab] = useState('identity')
  const [draft, setDraft] = useState(null)
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [themePreview, setThemePreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!shop || !settings) return
    setDraft(settings)
    setName(shop.name || '')
    setLogo(shop.logo || '')
  }, [shop, settings])

  const onThemePreview = useCallback((payload) => setThemePreview(payload), [])

  const set = (path, value) => setDraft((prev) => {
    const next = { ...prev }
    const keys = path.split('.')
    let node = next
    keys.slice(0, -1).forEach((k) => {
      node[k] = { ...(node[k] || {}) }
      node = node[k]
    })
    node[keys[keys.length - 1]] = value
    return next
  })

  const patch = useMemo(() => (draft ? { storeName: name, logo, settings: JSON.stringify(draft), ...(themePreview || {}) } : null),
    [draft, name, logo, themePreview])

  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (!shop || !draft) return <p className="p-6 text-slate-500">Chargement…</p>

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings) || name !== (shop.name || '') || logo !== (shop.logo || '')
  const layout = layoutOf(shop.templateKey)
  const identity = draft.identity || {}
  const logoHeight = Number(draft.logo?.height) || 0
  const bo = draft.backoffice || {}
  const bar = draft.announcement || {}

  const save = async () => {
    const badLink = SOCIAL_FIELDS.find(([key]) => identity[key] && !/^https?:\/\/\S+$/i.test(identity[key]))
    if (badLink) return toast.error(`Le lien ${badLink[1]} doit commencer par https://`)
    if (!name.trim()) return toast.error('Le nom de la boutique est obligatoire.')
    setSaving(true)
    try {
      await saveSettings(draft, { name: name.trim(), logo: logo || '' })
      if (Object.values(draft.backoffice || {}).some(hexOk)) applyAllColors({ ...draft.backoffice })
      toast.success('Apparence enregistrée : elle est en ligne sur votre vitrine.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Choisissez une image (PNG, JPG, SVG ou WebP).')
    if (file.size > 1.5 * 1024 * 1024) return toast.error('Image trop lourde : 1,5 Mo maximum.')
    setLogo(await readFile(file))
  }

  return (
    <div className="max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Apparence</h1>
          <p className="text-slate-500">Logo, couleurs, polices et informations de votre boutique. L’aperçu montre votre vraie vitrine.</p>
        </div>
        {tab !== 'colors' && (
          <div className="flex items-center gap-2">
            {dirty && <button type="button" onClick={() => { setDraft(settings); setName(shop.name || ''); setLogo(shop.logo || '') }} className="px-4 py-2.5 rounded-full text-sm text-slate-600 hover:bg-slate-100">Annuler</button>}
            <button type="button" disabled={!dirty || saving} onClick={save} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">
              {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
            <span className="material-symbols-outlined text-lg">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {tab === 'identity' && (
            <>
              <Card title="Logo" text="Affiché dans l’en-tête de la vitrine et utilisé comme icône de l’onglet du navigateur.">
                <div className="flex items-center gap-5">
                  <div className="w-28 h-28 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" /> : <span className="material-symbols-outlined text-3xl text-slate-300">image</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium cursor-pointer">
                      <span className="material-symbols-outlined text-lg">upload</span>{logo ? 'Changer le logo' : 'Ajouter un logo'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                    </label>
                    {logo && <button type="button" onClick={() => setLogo('')} className="block text-sm text-red-600 hover:underline">Retirer le logo (afficher le nom)</button>}
                    <p className="text-[11px] text-slate-400">PNG transparent ou SVG conseillé, 1,5 Mo maximum.</p>
                  </div>
                </div>
                <Field label={`Taille du logo : ${logoHeight ? `${logoHeight} px de haut` : 'taille du modèle'}`} help="Hauteur du logo dans l’en-tête. Remettez à « taille du modèle » pour revenir au réglage d’origine.">
                  <div className="flex items-center gap-3">
                    <input type="range" min="16" max="120" step="2" value={logoHeight || 32} onChange={(e) => set('logo.height', Number(e.target.value))} className="flex-1 accent-brand" />
                    <button type="button" disabled={!logoHeight} onClick={() => set('logo.height', null)} className="text-xs px-3 py-1.5 rounded-full border border-slate-300 disabled:opacity-40">Taille du modèle</button>
                  </div>
                </Field>
              </Card>

              <Card title="Identité">
                <Field label="Nom de la boutique"><input className={input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Texte de présentation (pied de page)" help="Laissez vide pour garder le texte proposé pour votre secteur.">
                  <textarea rows={2} className={`${input} resize-none`} value={draft.home?.texts?.footerBlurb || ''} onChange={(e) => set('home.texts.footerBlurb', e.target.value)} />
                </Field>
              </Card>

              <Card title="Contact" text="Affichés dans le pied de page de la vitrine.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Téléphone"><input className={input} value={identity.phone || ''} onChange={(e) => set('identity.phone', e.target.value)} placeholder="+216 20 000 000" /></Field>
                  <Field label="E-mail"><input type="email" className={input} value={identity.email || ''} onChange={(e) => set('identity.email', e.target.value)} placeholder="contact@maboutique.tn" /></Field>
                  <Field label="WhatsApp" help="Numéro avec indicatif : ouvre une conversation."><input className={input} value={identity.whatsapp || ''} onChange={(e) => set('identity.whatsapp', e.target.value)} placeholder="+216 20 000 000" /></Field>
                  <Field label="Adresse"><input className={input} value={identity.address || ''} onChange={(e) => set('identity.address', e.target.value)} placeholder="Rue, ville" /></Field>
                </div>
              </Card>

              <Card title="Réseaux sociaux" text="Icônes cliquables dans le pied de page. Un champ vide n’est pas affiché.">
                <div className="grid sm:grid-cols-2 gap-4">
                  {SOCIAL_FIELDS.map(([key, label, placeholder]) => {
                    const value = identity[key] || ''
                    const bad = value && !/^https?:\/\/\S+$/i.test(value)
                    return (
                      <Field key={key} label={label}>
                        <input className={`${input} ${bad ? 'border-red-400' : ''}`} value={value} onChange={(e) => set(`identity.${key}`, e.target.value.trim())} placeholder={placeholder} />
                      </Field>
                    )
                  })}
                </div>
              </Card>
            </>
          )}

          {tab === 'colors' && (
            <ThemeEditor
              shop={shop}
              layout={layout}
              shopName={name}
              showPreview={false}
              onPreview={onThemePreview}
              onSave={async (payload) => { await patchShop(payload); await reload() }}
            />
          )}

          {tab === 'fonts' && (
            <Card title="Polices de la vitrine" text="Par défaut, chaque modèle a ses propres polices. Choisissez-en d’autres si vous le souhaitez.">
              {[['heading', 'Titres'], ['body', 'Texte courant']].map(([key, label]) => (
                <Field key={key} label={label}>
                  <select className={input} value={draft.fonts?.[key] || ''} onChange={(e) => set(`fonts.${key}`, e.target.value || null)}>
                    <option value="">Police du modèle</option>
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              ))}
              <p className="text-xs text-slate-400">Les polices arabes (Amiri, Cairo, Tajawal) affichent aussi le texte latin.</p>
            </Card>
          )}

          {tab === 'announcement' && (
            <Card title="Barre d’annonce" text="Le bandeau tout en haut de la vitrine.">
              <div className="space-y-2">
                {[
                  ['auto', 'Automatique', 'Votre meilleur code promo actif, sinon le seuil de livraison gratuite.'],
                  ['custom', 'Mon texte', 'Le message de votre choix.'],
                  ['off', 'Masquée', 'Pas de bandeau.'],
                ].map(([value, label, help]) => (
                  <label key={value} className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer ${(bar.mode || 'auto') === value ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'}`}>
                    <input type="radio" name="bar" className="mt-1" checked={(bar.mode || 'auto') === value} onChange={() => set('announcement.mode', value)} />
                    <span><span className="text-sm font-medium">{label}</span><span className="block text-xs text-slate-500">{help}</span></span>
                  </label>
                ))}
              </div>
              {bar.mode === 'custom' && (
                <Field label="Texte du bandeau"><input className={input} maxLength={140} value={bar.text || ''} onChange={(e) => set('announcement.text', e.target.value)} placeholder="Soldes d’été : -20 % sur tout le site" /></Field>
              )}
              <p className="text-xs text-slate-400">Les couleurs du bandeau se règlent dans l’onglet Couleurs.</p>
            </Card>
          )}

          {tab === 'backoffice' && (
            <Card title="Couleurs de votre back-office" text="Seulement pour votre équipe et vous : la vitrine n’est pas concernée.">
              <div className="grid sm:grid-cols-2 gap-4">
                {BACKOFFICE_COLORS.map(([key, label, help]) => (
                  <Field key={key} label={label} help={help}>
                    <div className="flex items-center gap-2">
                      <input type="color" value={hexOk(bo[key]) ? bo[key] : '#004D40'} onChange={(e) => set(`backoffice.${key}`, e.target.value.toUpperCase())} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                      <input className={input} value={bo[key] || ''} placeholder="Par défaut" onChange={(e) => set(`backoffice.${key}`, e.target.value.trim())} />
                    </div>
                  </Field>
                ))}
              </div>
              <button type="button" onClick={() => set('backoffice', {})} className="text-sm text-slate-600 hover:underline">Revenir aux couleurs Sellio</button>
            </Card>
          )}
        </div>

        {tab !== 'backoffice' && (
          <div className="xl:sticky xl:top-6 min-w-0">
            <StorefrontPreview slug={shop.slug} layout={layout} patch={patch} height={760} />
          </div>
        )}
      </div>
    </div>
  )
}
