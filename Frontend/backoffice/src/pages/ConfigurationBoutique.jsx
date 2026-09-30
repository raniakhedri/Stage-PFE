import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { TEMPLATES, layoutOf } from '../data/storeTemplates'
import { OPTION_LABELS } from '../data/catalogOptions'
import { readUser, storeSession } from '../lib/sellio'
import { useShopOptions } from '../hooks/useShopOptions'
import { AddCustomOption } from '../components/ui/OptionPickers'
import ThemeEditor from '../components/ThemeEditor'

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
  const [shop, setShop] = useState(null)

  useEffect(() => {
    fetch(`${API}/auth/my-shop`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setShop(data))
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

  // Saves colours, then re-reads the shop so the editor shows what the storefront will use.
  const saveTheme = async (payload) => {
    await patchShop(payload)
    const fresh = await fetch(`${API}/auth/my-shop`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null))
    if (fresh) setShop(fresh)
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

      <ThemeEditor shop={shop} layout={layout} shopName={user.shopName} onSave={saveTheme} />

      <CustomLists />

      <dl className="bg-white rounded-2xl border border-slate-200 divide-y">
        <div className="px-5 py-4 flex justify-between"><dt>Nom</dt><dd className="font-medium">{user.shopName || '—'}</dd></div>
        <div className="px-5 py-4 flex justify-between"><dt>Préfixe</dt><dd className="font-medium">/{user.shopSlug || '—'}</dd></div>
        <div className="px-5 py-4 flex justify-between"><dt>Activité</dt><dd className="font-medium">{user.businessType === 'CLOTHES' ? 'Vêtements' : 'Cosmétiques'}</dd></div>
      </dl>
    </div>
  )
}
