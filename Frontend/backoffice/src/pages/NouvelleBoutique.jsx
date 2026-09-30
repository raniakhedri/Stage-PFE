import { useEffect, useRef, useState } from 'react'
import { BUSINESSES, TEMPLATES } from '../data/storeTemplates'
import { readUser, storeSession } from '../lib/sellio'
import { useSellioTheme, ThemeToggle, Switch } from '../lib/sellioTheme'
import { SellioLogo } from '../components/sellio/brand'
import IdentityStep, { emptyIdentity, identityError, compressImage } from '../components/sellio/IdentityStep'
import CardStep, { cardComplete } from '../components/sellio/CardStep'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const STEPS = [
  { id: 'shop', label: 'Boutique', icon: 'storefront' },
  { id: 'brand', label: 'Identité visuelle', icon: 'palette' },
  { id: 'identity', label: 'Vérification', icon: 'badge' },
  { id: 'card', label: 'Carte bancaire', icon: 'credit_card' },
  { id: 'review', label: 'Envoi', icon: 'task_alt' },
]

const QUICK_PALETTES = [
  ['#111111', '#111111', '#FFFFFF'],
  ['#3E3226', '#3E3226', '#F6F1EA'],
  ['#1F2A44', '#1F2A44', '#FFFFFF'],
  ['#6D1A2A', '#6D1A2A', '#FFFFFF'],
  ['#0F5132', '#0F5132', '#FFFFFF'],
  ['#B76E79', '#B76E79', '#FFFFFF'],
]

function hexOk(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || '')
}

function StorePreview({ name, template, logo, colors }) {
  const look = template?.colors || {}
  const primary = colors.primary || look.primary || '#163328'
  const surface = look.surface || '#fef8f3'
  const button = colors.button || look.button || primary
  const buttonText = colors.buttonText || look.buttonText || '#ffffff'
  const muted = look.muted || '#c4a574'
  const title = name.trim() || 'Votre boutique'
  const radius = template?.radius === '0px' ? 0 : 10
  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 shadow-2xl" style={{ background: surface }}>
      <div className="text-[9px] tracking-[0.18em] uppercase text-center py-1.5" style={{ background: primary, color: surface }}>Livraison offerte dès 200 TND</div>
      {template?.id === 'luxury' ? (
        <div className="text-center py-3 border-b border-black/5" style={{ color: primary }}>
          <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '0.18em' }} className="text-base uppercase">
            {logo ? <img src={logo} alt="" className="h-6 mx-auto object-contain" /> : title}
          </span>
          <div className="flex justify-center gap-4 mt-1.5 text-[8px] tracking-[0.2em] uppercase opacity-70"><span>Collection</span><span>Nouveautés</span><span>Maison</span></div>
        </div>
      ) : template?.id === 'bold' ? (
        <div className="px-4 py-3 flex items-center justify-between bg-black text-white">
          <span className="text-[9px] font-bold uppercase">☰ Menu</span>
          <span className="text-lg uppercase leading-none" style={{ fontFamily: 'Anton, Impact, sans-serif' }}>
            {logo ? <img src={logo} alt="" className="h-6 object-contain" /> : title}
          </span>
          <span className="text-[9px] font-bold uppercase">Panier (2)</span>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-black/5" style={{ color: primary }}>
          <span className="text-sm font-semibold">{logo ? <img src={logo} alt="" className="h-5 object-contain" /> : title}</span>
          <span className="text-[9px] opacity-60">Nouveautés · Robes · Soins</span>
          <span className="text-[10px]">♡ ◫</span>
        </div>
      )}
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: muted }}>Nouvelle collection</p>
        <p className="text-lg mt-1" style={{ color: primary, fontFamily: template?.font, textTransform: template?.upper ? 'uppercase' : 'none' }}>{title}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['Pièce 01', 'Pièce 02'].map((label) => (
            <div key={label}>
              <div className="h-16" style={{ background: `${primary}14`, borderRadius: radius }} />
              <p className="text-[11px] mt-1" style={{ color: primary }}>{label}</p>
              <p className="text-[11px] font-semibold" style={{ color: primary }}>89 TND</p>
            </div>
          ))}
        </div>
        <div className="mt-4 py-2 text-center text-xs font-semibold" style={{ background: button, color: buttonText, borderRadius: radius }}>Ajouter au panier</div>
      </div>
    </div>
  )
}

function LogoDrop({ logo, onChange, onError, theme }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  const take = async (file) => {
    if (!file) return
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = () => onChange(String(reader.result))
      reader.readAsDataURL(file)
      return
    }
    try {
      // PNG keeps transparent backgrounds; downsize so the logo stays under the 2 MB limit.
      const img = await compressImage(file, 800)
      onChange(file.type === 'image/png' ? await pngFrom(file) : img)
    } catch (err) {
      onError(err.message)
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]) }}
      className={`relative rounded-xl border-2 border-dashed p-5 flex items-center gap-5 cursor-pointer transition-colors ${
        drag ? 'border-violet-400 bg-violet-500/10' : theme.dark ? 'border-white/15 hover:border-white/30' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className={`w-24 h-16 rounded-lg flex items-center justify-center shrink-0 ${theme.dark ? 'bg-white' : 'bg-slate-100'}`}>
        {logo ? <img src={logo} alt="Logo" className="max-h-12 max-w-[80px] object-contain" /> : <span className="material-symbols-outlined text-slate-400">image</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{logo ? 'Logo ajouté' : 'Ajouter votre logo'}</p>
        <p className={`text-xs mt-0.5 ${theme.t.muted}`}>PNG transparent ou SVG conseillé · glissez-déposez ou cliquez</p>
      </div>
      {logo && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onChange('') }} className="text-sm text-red-400 hover:text-red-300 shrink-0">Retirer</button>
      )}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}

function pngFrom(file, maxSide = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du logo impossible.'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Logo illisible.'))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function NouvelleBoutique() {
  const user = readUser()
  const theme = useSellioTheme()
  const { t } = theme
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('COSMETICS')
  const [template, setTemplate] = useState('minimal')
  const [logo, setLogo] = useState('')
  const [customColors, setCustomColors] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#163328')
  const [buttonColor, setButtonColor] = useState('#163328')
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff')
  const [identity, setIdentity] = useState(emptyIdentity)
  const [card, setCard] = useState(null)
  const [certify, setCertify] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = TEMPLATES.find((item) => item.id === template) || TEMPLATES[0]

  // One shop per account: someone who already created theirs follows its review instead.
  useEffect(() => {
    if (user.shopSlug) window.location.replace('/verification')
  }, [user.shopSlug])

  const pickTemplate = (item) => {
    setTemplate(item.id)
    if (!customColors) {
      setPrimaryColor(item.colors.primary)
      setButtonColor(item.colors.button)
      setButtonTextColor(item.colors.buttonText)
    }
  }

  const backToSignup = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.replace('/inscription')
  }

  const stepError = (index) => {
    if (index === 0 && name.trim().length < 2) return 'Donnez un nom à votre boutique.'
    if (index === 1 && customColors && ![primaryColor, buttonColor, buttonTextColor].every(hexOk)) return 'Les couleurs doivent être au format #RRGGBB.'
    if (index === 2) return identityError(identity)
    if (index === 3 && !cardComplete(card)) return 'Vérifiez une carte bancaire pour continuer.'
    if (index === 4 && !certify) return 'Cochez la déclaration sur l’honneur.'
    return ''
  }

  const goTo = (index) => {
    // Moving forward requires every step before the target to be valid.
    for (let i = 0; i < index; i++) {
      const message = stepError(i)
      if (message) {
        setStep(i)
        setError(message)
        return
      }
    }
    setError('')
    setStep(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    const message = [0, 1, 2, 3, 4].map(stepError).find(Boolean)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/my-shop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
        body: JSON.stringify({
          name,
          businessType: business,
          templateKey: template,
          logo: logo || null,
          primaryColor: customColors ? primaryColor : null,
          buttonColor: customColors ? buttonColor : null,
          buttonTextColor: customColors ? buttonTextColor : null,
          verification: { ...identity, ...card },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || data?.message || 'Enregistrement impossible.')
      storeSession(localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'), data)
      window.location.replace('/verification')
    } catch (err) {
      setError(err.message || 'Enregistrement impossible.')
      setLoading(false)
    }
  }

  const previewColors = customColors
    ? { primary: hexOk(primaryColor) ? primaryColor : selected.colors.primary, button: hexOk(buttonColor) ? buttonColor : selected.colors.button, buttonText: hexOk(buttonTextColor) ? buttonTextColor : selected.colors.buttonText }
    : {}

  const card_ = `rounded-2xl p-6 ${t.card}`
  const option = (active) => `text-left rounded-2xl border p-5 transition-all ${active ? t.selected : t.unselected}`

  return (
    <div className={`min-h-screen ${t.page}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${t.header}`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={backToSignup} title="Retour à l’inscription" className={`w-9 h-9 rounded-full flex items-center justify-center ${t.secondaryBtn}`}>←</button>
            <SellioLogo to="/" light={!theme.dark} />
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:block text-sm ${t.muted}`}>{user.email}</span>
            <ThemeToggle theme={theme} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-violet-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>// Ouverture de boutique</p>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}>
          Bonjour {user.firstName || ''}, créons votre boutique.
        </h1>
        <p className={`mt-2 ${t.muted}`}>Un compte Sellio possède une seule boutique. Elle ouvre après la validation de votre identité par notre équipe.</p>

        <ol className="mt-8 grid grid-cols-5 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => goTo(i)} className="w-full text-left group">
                <span className={`block h-1 rounded-full transition-colors ${i <= step ? 'bg-violet-500' : theme.dark ? 'bg-white/10' : 'bg-slate-200'}`} />
                <span className={`mt-2 hidden sm:flex items-center gap-1.5 text-xs ${i === step ? '' : t.muted}`}>
                  <span className="material-symbols-outlined text-sm">{i < step ? 'check_circle' : s.icon}</span>
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-6">
            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

            {step === 0 && (
              <>
                <section className={card_}>
                  <label className="block">
                    <span className="text-sm font-medium">Nom de la boutique</span>
                    <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Maison Rania" className={`mt-2 w-full rounded-xl px-4 py-3 outline-none transition-all ${t.input}`} />
                  </label>
                </section>
                <section className="space-y-3">
                  <p className="text-sm font-medium">Activité</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {BUSINESSES.map((item) => (
                      <button type="button" key={item.id} onClick={() => setBusiness(item.id)} className={option(business === item.id)}>
                        <span className="material-symbols-outlined text-2xl">{item.id === 'CLOTHES' ? 'checkroom' : 'spa'}</span>
                        <p className="font-semibold mt-2">{item.title}</p>
                        <p className={`text-sm mt-1 ${t.muted}`}>{item.text}</p>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="space-y-3">
                  <p className="text-sm font-medium">Modèle de vitrine</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {TEMPLATES.map((item) => (
                      <button type="button" key={item.id} onClick={() => pickTemplate(item)} className={option(template === item.id)}>
                        <div className="flex gap-1.5 mb-3">
                          {item.swatch.map((color) => <span key={color} className="w-5 h-5 rounded-full border border-black/10" style={{ background: color }} />)}
                        </div>
                        <p className="font-semibold">{item.title}</p>
                        <p className={`text-sm mt-1 ${t.muted}`}>{item.text}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {step === 1 && (
              <section className={`${card_} space-y-6`}>
                <div>
                  <h2 className="text-lg font-semibold">Logo</h2>
                  <p className={`text-sm mt-1 ${t.muted}`}>Affiché dans l’en-tête et le pied de page de la vitrine.</p>
                </div>
                <LogoDrop logo={logo} onChange={setLogo} onError={setError} theme={theme} />
                <div className={`border-t pt-6 ${t.divider}`}>
                  <Switch
                    theme={theme}
                    checked={customColors}
                    onChange={setCustomColors}
                    label="Personnaliser les couleurs"
                    description="Sinon, le modèle garde ses couleurs d’origine. Tous les détails se règlent ensuite dans « Votre boutique »."
                  />
                </div>
                {customColors && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PALETTES.map((p) => (
                        <button
                          type="button"
                          key={p.join()}
                          onClick={() => { setPrimaryColor(p[0]); setButtonColor(p[1]); setButtonTextColor(p[2]) }}
                          className={`flex rounded-lg overflow-hidden border ${t.unselected}`}
                          title="Palette rapide"
                        >
                          <span className="w-7 h-7" style={{ background: p[0] }} />
                          <span className="w-7 h-7" style={{ background: p[2] }} />
                        </button>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        ['Couleur principale', primaryColor, setPrimaryColor],
                        ['Boutons', buttonColor, setButtonColor],
                        ['Texte des boutons', buttonTextColor, setButtonTextColor],
                      ].map(([label, value, setValue]) => (
                        <label key={label} className="block text-xs font-medium">
                          <span className={t.muted}>{label}</span>
                          <span className={`mt-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 ${t.input} ${hexOk(value) ? '' : '!border-red-400'}`}>
                            <input type="color" value={hexOk(value) ? value : '#000000'} onChange={(e) => setValue(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
                            <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-transparent font-mono text-xs outline-none" />
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section className={`${card_} space-y-2`}>
                <h2 className="text-lg font-semibold">Vérification d’identité</h2>
                <p className={`text-sm ${t.muted}`}>Obligatoire pour protéger vos clients. Votre dossier est examiné par l’équipe Sellio, généralement sous 24 h.</p>
                <div className="pt-4">
                  <IdentityStep value={identity} onChange={setIdentity} onError={setError} theme={theme} />
                </div>
              </section>
            )}

            {step === 3 && (
              <section className={`${card_} space-y-2`}>
                <h2 className="text-lg font-semibold">Carte bancaire</h2>
                <p className={`text-sm ${t.muted}`}>La carte est rattachée à votre compte marchand pour l’abonnement Sellio.</p>
                <div className="pt-4">
                  <CardStep value={card} onChange={setCard} theme={theme} />
                </div>
              </section>
            )}

            {step === 4 && (
              <section className={`${card_} space-y-6`}>
                <h2 className="text-lg font-semibold">Récapitulatif</h2>
                <dl className={`divide-y ${theme.dark ? 'divide-white/10' : 'divide-slate-200'} text-sm`}>
                  {[
                    ['Boutique', name],
                    ['Activité', BUSINESSES.find((b) => b.id === business)?.title],
                    ['Modèle', selected.title],
                    ['Logo', logo ? 'Ajouté' : 'Aucun'],
                    ['Pièce d’identité', `${identity.documentType === 'CIN' ? 'CIN' : 'Passeport'} · ${identity.documentNumber}`],
                    ['Selfie', identity.selfie ? 'Ajouté' : 'Manquant'],
                    ['Carte', card ? `${card.cardBrand?.toUpperCase()} •••• ${card.cardLast4}` : 'Manquante'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-3">
                      <dt className={t.muted}>{label}</dt>
                      <dd className="font-medium text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
                <button type="button" onClick={() => setCertify((v) => !v)} className="flex items-start gap-3 text-left">
                  <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${certify ? 'bg-violet-500 border-violet-500 text-white' : theme.dark ? 'border-white/30' : 'border-slate-400'}`}>
                    {certify && <span className="material-symbols-outlined text-sm">check</span>}
                  </span>
                  <span className={`text-sm ${t.muted}`}>Je certifie sur l’honneur que les informations et documents fournis sont exacts et m’appartiennent.</span>
                </button>
              </section>
            )}

            <div className="flex items-center justify-between gap-3">
              <button type="button" disabled={step === 0} onClick={() => goTo(step - 1)} className={`px-5 py-3 rounded-xl text-sm disabled:opacity-0 ${t.secondaryBtn}`}>
                ← Précédent
              </button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => goTo(step + 1)} className={`px-6 py-3 rounded-xl text-sm font-semibold ${t.primaryBtn}`}>
                  Continuer →
                </button>
              ) : (
                <button type="button" disabled={loading} onClick={submit} className="px-6 py-3 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50">
                  {loading ? 'Envoi…' : 'Envoyer mon dossier'}
                </button>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-3">
            <p className={`text-[11px] uppercase tracking-[0.22em] ${t.faint}`}>Aperçu vitrine</p>
            <StorePreview name={name} template={selected} logo={logo} colors={previewColors} />
            <p className={`text-xs ${t.muted}`}>Modèle {selected.title}. L’aperçu reprend le logo, la typographie et les boutons.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}
