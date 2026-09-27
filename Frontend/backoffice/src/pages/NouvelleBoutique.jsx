import { useState } from 'react'
import { BUSINESSES, TEMPLATES } from '../data/storeTemplates'
import { readUser, storeSession } from '../lib/sellio'

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
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ background: surface }}>
      {template?.id === 'luxury' ? (
        <div style={{ background: surface, color: primary }}>
          <div className="px-4 pt-4 text-center">
            <span style={{ fontFamily: template.font, letterSpacing: template.tracking }} className="text-sm">
              {logo ? <img src={logo} alt="" className="h-6 mx-auto object-contain" /> : title}
            </span>
          </div>
          <div className="flex justify-center gap-4 px-4 py-2 text-[9px] tracking-[0.16em] uppercase opacity-70">
            <span>Boutique</span><span>Lookbook</span><span>Contact</span>
          </div>
        </div>
      ) : template?.id === 'bold' ? (
        <div className="px-4 py-4 flex items-center justify-between" style={{ background: primary, color: buttonText }}>
          <span className="text-lg leading-none">☰</span>
          <span style={{ fontFamily: template.font, letterSpacing: '-0.04em' }} className="text-lg font-semibold uppercase">
            {logo ? <img src={logo} alt="" className="h-6 object-contain" /> : title}
          </span>
          <span className="text-[10px]">Panier</span>
        </div>
      ) : (
        <div className="px-4 py-3 grid grid-cols-3 items-center bg-white" style={{ color: primary }}>
          <span style={{ fontFamily: template?.font }} className="text-xs font-semibold">
            {logo ? <img src={logo} alt="" className="h-5 object-contain" /> : title}
          </span>
          <span className="text-[9px] text-center tracking-wide opacity-60">Nouveautés · Robes · Manteaux</span>
          <span className="text-[10px] text-right">♡  Sac</span>
        </div>
      )}
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: muted }}>Nouvelle collection</p>
        <p
          className="text-lg mt-1"
          style={{
            color: primary,
            fontFamily: template?.font,
            letterSpacing: template?.tracking,
            textTransform: template?.upper ? 'uppercase' : 'none',
          }}
        >
          {title}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {['Pull lin', 'Veste'].map((label) => (
            <div key={label} className="bg-white/80 p-2" style={{ borderRadius: template?.radius === '0px' ? 0 : 12 }}>
              <div className="h-14 mb-2" style={{ background: muted, borderRadius: template?.radius === '0px' ? 0 : 8 }} />
              <p className="text-[11px]" style={{ color: primary }}>{label}</p>
              <p className="text-[11px] font-semibold" style={{ color: primary }}>89 DT</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 w-full py-2 text-xs font-semibold"
          style={{ background: button, color: buttonText, borderRadius: template?.radius || '999px' }}
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}

export default function NouvelleBoutique() {
  const user = readUser()
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('COSMETICS')
  const [template, setTemplate] = useState('minimal')
  const [logo, setLogo] = useState('')
  const [customColors, setCustomColors] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#163328')
  const [buttonColor, setButtonColor] = useState('#163328')
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = TEMPLATES.find((item) => item.id === template) || TEMPLATES[0]

  // Leaving before the shop exists: drop the session so the sign-up page does not bounce back here.
  const backToSignup = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.replace('/inscription')
  }

  const pickBusiness = (id) => setBusiness(id)

  const pickTemplate = (item) => {
    setTemplate(item.id)
    if (!customColors) {
      setPrimaryColor(item.colors.primary)
      setButtonColor(item.colors.button)
      setButtonTextColor(item.colors.buttonText)
    }
  }

  const onLogo = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Le logo doit être une image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Le logo est trop volumineux (max 2 Mo).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setError('')
      setLogo(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/my-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify({
          name,
          businessType: business,
          templateKey: template,
          logo: logo || null,
          primaryColor: customColors ? primaryColor : null,
          buttonColor: customColors ? buttonColor : null,
          buttonTextColor: customColors ? buttonTextColor : null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || data?.message || 'Enregistrement impossible.')
      storeSession(localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'), data)
      window.location.replace(`/${data.shopSlug}/dashboard`)
    } catch (err) {
      setError(err.message || 'Enregistrement impossible.')
      setLoading(false)
    }
  }

  const previewColors = customColors
    ? { primary: hexOk(primaryColor) ? primaryColor : selected.colors.primary, button: hexOk(buttonColor) ? buttonColor : selected.colors.button, buttonText: hexOk(buttonTextColor) ? buttonTextColor : selected.colors.buttonText }
    : {}

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-slate-900 px-6 py-12">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-8">
          <button
            type="button"
            onClick={backToSignup}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <span className="w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center text-lg leading-none">←</span>
            Retour à l’inscription
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Première connexion</p>
            <h1 className="text-3xl font-semibold mt-2">Ouvrir votre boutique</h1>
            <p className="text-slate-500 mt-2">Bonjour {user.firstName || ''}. Un compte Sellio possède une seule boutique.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <label className="block">
            <span className="text-sm font-medium">Nom de la boutique</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maison Rania"
              className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 bg-white"
            />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            {BUSINESSES.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => pickBusiness(item.id)}
                className={`text-left rounded-2xl border p-5 bg-white ${business === item.id ? 'border-slate-900' : 'border-slate-200'}`}
              >
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-slate-500 mt-1">{item.text}</p>
              </button>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Modèle de vitrine</p>
            <div className="grid md:grid-cols-3 gap-4">
              {TEMPLATES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => pickTemplate(item)}
                  className={`text-left rounded-2xl border p-5 bg-white ${template === item.id ? 'border-slate-900' : 'border-slate-200'}`}
                >
                  <div className="flex gap-2 mb-3">
                    {item.swatch.map((color) => (
                      <span key={color} className="w-6 h-6 rounded-full border border-black/10" style={{ background: color }} />
                    ))}
                  </div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.text}</p>
                </button>
              ))}
            </div>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Personnalisation visuelle</h2>
              <p className="text-sm text-slate-500 mt-1">Logo et, si vous le souhaitez, vos propres couleurs de marque et de boutons.</p>
            </div>
            <div>
              <span className="text-sm font-medium">Logo</span>
              <div className="mt-2 flex items-center gap-4">
                {logo
                  ? <img src={logo} alt="Logo" className="h-12 w-auto max-w-[180px] object-contain bg-slate-50 border border-slate-200 rounded-lg px-2" />
                  : <div className="h-12 w-28 rounded-lg border border-dashed border-slate-300 bg-slate-50" />}
                <label className="px-3 py-2 text-sm rounded-full border border-slate-300 cursor-pointer">
                  Choisir une image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                </label>
                {logo && (
                  <button type="button" onClick={() => setLogo('')} className="text-sm text-red-600">Retirer</button>
                )}
              </div>
            </div>
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Personnaliser les couleurs</span>
                <span className="block text-xs text-slate-500">Sinon le modèle garde ses couleurs d’origine.</span>
              </span>
              <input type="checkbox" checked={customColors} onChange={(e) => setCustomColors(e.target.checked)} />
            </label>
            {customColors && (
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  ['Couleur principale', primaryColor, setPrimaryColor],
                  ['Couleur des boutons', buttonColor, setButtonColor],
                  ['Texte des boutons', buttonTextColor, setButtonTextColor],
                ].map(([label, value, setValue]) => (
                  <label key={label} className="text-xs font-medium text-slate-600">
                    {label}
                    <span className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                      <input type="color" value={hexOk(value) ? value : '#000000'} onChange={(e) => setValue(e.target.value)} />
                      <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-transparent font-mono text-xs outline-none" />
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <button type="submit" disabled={loading} className="px-6 py-3 rounded-full bg-slate-900 text-white font-semibold disabled:opacity-50">
            {loading ? 'Création…' : 'Ouvrir le backoffice'}
          </button>
        </div>
        <aside className="lg:sticky lg:top-8 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Aperçu vitrine</p>
          <StorePreview name={name} template={selected} logo={logo} colors={previewColors} />
          <p className="text-xs text-slate-500">Modèle {selected.title}. L’aperçu reprend le logo, la typographie et les boutons.</p>
        </aside>
      </form>
    </div>
  )
}
