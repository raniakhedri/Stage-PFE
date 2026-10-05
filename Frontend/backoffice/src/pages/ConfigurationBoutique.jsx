import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { TEMPLATES, isRecommended, layoutOf, templatesFor } from '../data/storeTemplates'
import { SECTORS, optionKeysFor, sectorLabel } from '../data/sectors'
import { OPTION_LABELS } from '../data/catalogOptions'
import { readUser, storeSession } from '../lib/sellio'
import { useShopOptions } from '../hooks/useShopOptions'
import { AddCustomOption } from '../components/ui/OptionPickers'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'


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

function CustomLists({ businessType }) {
  const { customFor, removeOption } = useShopOptions()
  const keys = optionKeysFor(businessType).filter((k) => OPTION_LABELS[k])
  const [key, setKey] = useState(keys[0] || 'couleur')
  const values = customFor(key)
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Listes du catalogue</h2>
        <p className="text-sm text-slate-500 mt-1">Les formulaires produit proposent des listes prêtes (tailles, tissus, couleurs…). Ajoutez ici vos propres valeurs.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keys.map((k) => [k, OPTION_LABELS[k]]).map(([k, label]) => (
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
  const [shop, setShop] = useState(null)
  // The saved profile can be older than the shop: the server's answer below is what counts.
  const [business, setBusiness] = useState(user.businessType || null)
  const [pendingBusiness, setPendingBusiness] = useState(null)

  useEffect(() => {
    fetch(`${API}/auth/my-shop`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setShop(data)
        if (data.businessType) setBusiness(data.businessType)
        if (data.templateKey) setLayout(layoutOf(data.templateKey))
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

  const saveBusiness = async () => {
    const id = pendingBusiness
    setPendingBusiness(null)
    try {
      await patchShop({ businessType: id })
      setBusiness(id)
      toast.success(`Activité : ${sectorLabel(id)}. Les fiches produit suivent maintenant ce secteur.`)
    } catch (err) {
      toast.error(err.message)
    }
  }


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
        <div>
          <h2 className="text-lg font-semibold">Modèle de vitrine</h2>
          <p className="text-sm text-slate-500">{TEMPLATES.length} modèles. Les plus adaptés à votre activité apparaissent en premier ; « Prévisualiser » ouvre votre vitrine avec le modèle sans l’enregistrer.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templatesFor(business).map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => saveLayout(item.id)}
              className={`text-left rounded-2xl border p-5 bg-white transition-all ${layout === item.id ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="flex gap-1.5">
                  {item.swatch.map((color) => <span key={color} className="w-4 h-4 rounded-full border border-black/10" style={{ background: color }} />)}
                </span>
                {layout === item.id
                  ? <span className="material-symbols-outlined text-lg">check_circle</span>
                  : isRecommended(business, item.id) && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Recommandé</span>}
              </div>
              <p className="font-semibold" style={{ fontFamily: item.font, fontStyle: item.italic ? 'italic' : 'normal' }}>{item.title}</p>
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

      <section className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Couleurs, logo et page d’accueil</h2>
          <p className="text-sm text-slate-500 mt-1">Ils se règlent dans Apparence et Page d’accueil, avec un aperçu de votre vitrine.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/apparence" className="px-4 py-2 rounded-full border border-slate-300 text-sm font-medium">Apparence</Link>
          <Link to="/page-accueil" className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium">Page d’accueil</Link>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Activité</h2>
          <p className="text-sm text-slate-500 mt-1">Le secteur choisit les champs des fiches produit (tailles, matière, garantie, allergènes…) et les textes par défaut de la vitrine.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SECTORS.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => s.id !== business && setPendingBusiness(s.id)}
              className={`text-left rounded-xl border p-4 transition-all ${business === s.id ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
            >
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
              <p className="font-semibold text-sm mt-1">{s.title}</p>
            </button>
          ))}
        </div>
        {pendingBusiness && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-800">
              Passer à « {sectorLabel(pendingBusiness)} » ? Vos produits restent en ligne ; les champs propres à l’ancienne activité ne s’affichent plus.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPendingBusiness(null)} className="px-4 py-2 rounded-full border border-amber-300 text-sm">Annuler</button>
              <button type="button" onClick={saveBusiness} className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold">Changer d’activité</button>
            </div>
          </div>
        )}
      </section>

      <CustomLists key={business} businessType={business} />

      <dl className="bg-white rounded-2xl border border-slate-200 divide-y">
        <div className="px-5 py-4 flex justify-between"><dt>Nom</dt><dd className="font-medium">{user.shopName || '—'}</dd></div>
        <div className="px-5 py-4 flex justify-between"><dt>Préfixe</dt><dd className="font-medium">/{user.shopSlug || '—'}</dd></div>
        <div className="px-5 py-4 flex justify-between"><dt>Activité</dt><dd className="font-medium">{sectorLabel(business)}</dd></div>
      </dl>
    </div>
  )
}
