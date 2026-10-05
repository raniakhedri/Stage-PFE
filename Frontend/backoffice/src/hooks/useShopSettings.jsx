import { useCallback, useEffect, useRef, useState } from 'react'
import { storeSession } from '../lib/sellio'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
export const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3001'

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` }
}

export function parseSettings(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

/** PATCH /auth/my-shop; refreshes the saved profile with the answer. */
export async function patchShop(body) {
  const res = await fetch(`${API}/auth/my-shop`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || data?.message || 'Enregistrement impossible.')
  storeSession(localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'), data)
  return data
}

/**
 * The merchant's shop (GET /auth/my-shop) and its customization settings.
 * `saveSettings(next)` stores the whole settings object; `reload()` reads the shop again.
 */
export function useShopSettings() {
  const [shop, setShop] = useState(null)
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/my-shop`, { headers: headers() })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setShop(data)
      setSettings(parseSettings(data.settings))
      return data
    } catch {
      setError('Impossible de charger la boutique.')
      return null
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const saveSettings = useCallback(async (next, extra = {}) => {
    await patchShop({ ...extra, settings: JSON.stringify(next) })
    return reload()
  }, [reload])

  return { shop, settings, error, reload, saveSettings }
}

/**
 * The shop's real storefront in an iframe. `patch` (store fields: settings, theme, colours, logo…) is sent
 * to the storefront, which shows the unsaved changes immediately.
 */
export function StorefrontPreview({ slug, layout, patch, path = '/', height = 720 }) {
  const frame = useRef(null)
  const [ready, setReady] = useState(false)
  const [device, setDevice] = useState('desktop')
  const origin = new URL(STOREFRONT_URL).origin

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin === origin && event.data?.type === 'sellio:preview-ready') setReady(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [origin])

  useEffect(() => {
    if (!ready || !frame.current?.contentWindow || !patch) return
    frame.current.contentWindow.postMessage({ type: 'sellio:preview', patch }, origin)
  }, [ready, patch, origin])

  const src = `${STOREFRONT_URL}/${slug}${path}${layout ? `?preview=${layout}` : ''}`
  // A new page in the frame announces itself again.
  useEffect(() => setReady(false), [src])

  if (!slug) return null
  const width = device === 'mobile' ? 390 : '100%'
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
        <span className="flex gap-1">{['bg-red-300', 'bg-amber-300', 'bg-emerald-300'].map((c) => <span key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}</span>
        <span className="flex-1 truncate text-[11px] text-slate-400 px-2">{src}</span>
        {[['desktop', 'desktop_windows'], ['mobile', 'smartphone']].map(([id, icon]) => (
          <button key={id} type="button" onClick={() => setDevice(id)} title={id === 'desktop' ? 'Ordinateur' : 'Mobile'}
            className={`material-symbols-outlined text-[18px] px-1 rounded ${device === id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}>{icon}</button>
        ))}
        <a href={`${STOREFRONT_URL}/${slug}${path}`} target="_blank" rel="noreferrer" title="Ouvrir la vitrine" className="material-symbols-outlined text-[18px] text-slate-400 hover:text-slate-700">open_in_new</a>
      </div>
      <div className="bg-slate-100 flex justify-center">
        <iframe ref={frame} title="Aperçu de la vitrine" src={src} style={{ width, height }} className="bg-white border-0 transition-all" />
      </div>
      {!ready && <p className="px-3 py-1.5 text-[11px] text-slate-400 border-t border-slate-100">Chargement de l’aperçu…</p>}
    </div>
  )
}
