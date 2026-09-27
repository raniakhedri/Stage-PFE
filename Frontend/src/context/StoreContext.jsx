import { createContext, useContext, useEffect, useState } from 'react'
import { layoutOf } from '../data/storeTemplates'

const StoreContext = createContext({
  businessType: 'COSMETICS',
  templateKey: 'botanique',
  storeName: '',
  slug: '',
  logo: '',
  isClothes: false,
  ready: false,
  missing: false,
})

function hexChannels(value, shade = 1) {
  const match = /^#([0-9a-f]{6})$/i.exec(value || '')
  if (!match) return ''
  const n = parseInt(match[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c * shade)).join(' ')
}

// Merchant palette → CSS variables read by the Tailwind tokens (primary, accent, surface, ink, button).
const PALETTE_VARS = [
  ['primaryColor', '--rgb-primary'],
  ['accentColor', '--rgb-accent'],
  ['backgroundColor', '--rgb-surface'],
  ['textColor', '--rgb-ink'],
  ['buttonColor', '--rgb-button'],
  ['buttonTextColor', '--rgb-button-text'],
]

// `?preview=minimal|bold|luxury` lets a merchant look at another template without saving it.
function previewLayout() {
  const value = new URLSearchParams(window.location.search).get('preview')
  if (value) sessionStorage.setItem('templatePreview', value)
  const stored = value || sessionStorage.getItem('templatePreview')
  return ['minimal', 'bold', 'luxury'].includes(stored) ? stored : null
}

function shopSlug() {
  return window.location.pathname.split('/').filter(Boolean)[0] || ''
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState({
    businessType: 'COSMETICS',
    templateKey: 'botanique',
    storeName: '',
    slug: shopSlug(),
    ready: false,
    missing: false,
  })

  useEffect(() => {
    const slug = shopSlug()
    if (!slug) {
      setStore((prev) => ({ ...prev, ready: true, missing: true }))
      return
    }
    fetch(`http://localhost:8080/api/v1/public/shops/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setStore((prev) => ({ ...prev, slug, ready: true, missing: true }))
          return
        }
        setStore({
          businessType: data.businessType || 'COSMETICS',
          templateKey: data.templateKey || 'minimal',
          layout: previewLayout() || layoutOf(data.templateKey),
          storeName: data.name || '',
          slug: data.slug || slug,
          logo: data.logo || '',
          primaryColor: data.primaryColor || '',
          buttonColor: data.buttonColor || '',
          buttonTextColor: data.buttonTextColor || '',
          accentColor: data.accentColor || '',
          backgroundColor: data.backgroundColor || '',
          textColor: data.textColor || '',
          ready: true,
          missing: false,
        })
      })
      .catch(() => setStore((prev) => ({ ...prev, ready: true, missing: true })))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const layout = store.layout || layoutOf(store.templateKey)
    root.dataset.template = layout
    root.dataset.layout = layout
    root.dataset.business = store.businessType || 'COSMETICS'
    if (store.storeName) document.title = store.storeName
    PALETTE_VARS.forEach(([key, cssVar]) => {
      const channels = hexChannels(store[key])
      if (channels) root.style.setProperty(cssVar, channels)
      else root.style.removeProperty(cssVar)
    })
    // Secondary surfaces follow the chosen background, slightly darker.
    const low = hexChannels(store.backgroundColor, 0.96)
    if (low) root.style.setProperty('--rgb-surface-low', low)
    else root.style.removeProperty('--rgb-surface-low')
  }, [store.templateKey, store.layout, store.businessType, store.storeName, store.primaryColor, store.buttonColor,
    store.buttonTextColor, store.accentColor, store.backgroundColor, store.textColor])

  return (
    <StoreContext.Provider value={{ ...store, layout: store.layout || layoutOf(store.templateKey), isClothes: store.businessType === 'CLOTHES' }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
