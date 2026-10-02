import { createContext, useContext, useEffect, useState } from 'react'
import { LAYOUTS, layoutOf } from '../data/storeTemplates'
import { sectorOf } from '../data/sectors'

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

// Detailed theme keys (JSON column `theme`) → CSS variable name.
export const THEME_VARS = {
  announceBg: 'announce-bg',
  announceText: 'announce-text',
  navBg: 'nav-bg',
  navText: 'nav-text',
  navHover: 'nav-hover',
  headingColor: 'heading-color',
  buttonHoverBg: 'button-hover-bg',
  buttonHoverText: 'button-hover-text',
  priceColor: 'price-color',
  saleColor: 'sale-color',
  badgeBg: 'badge-bg',
  badgeText: 'badge-text',
  footerBg: 'footer-bg',
  footerText: 'footer-text',
}

function parseTheme(raw) {
  try {
    const value = JSON.parse(raw || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

const hexOk = (v) => /^#[0-9a-f]{6}$/i.test(v || '')

// `?preview=<template>` lets a merchant look at another template without saving it.
function previewLayout() {
  const value = new URLSearchParams(window.location.search).get('preview')
  if (value) sessionStorage.setItem('templatePreview', value)
  const stored = value || sessionStorage.getItem('templatePreview')
  return LAYOUTS.includes(stored) ? stored : null
}

function setFavicon(href) {
  if (!href) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.removeAttribute('type') // the logo may be PNG, JPEG, SVG or WebP
  link.href = href
}

function initialIcon(name, color) {
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?'
  const fill = hexOk(color) ? color : '#111827'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${fill}"/>`
    + `<text x="32" y="44" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${letter.replace(/[<&>"]/g, '')}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Customization saved in the backoffice (Apparence, Page d'accueil): JSON object, empty when unset. */
function parseSettings(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

// The backoffice shows the storefront in an iframe and sends the unsaved changes for a live preview.
const BACKOFFICE_ORIGIN = import.meta.env.VITE_BACKOFFICE_URL || 'http://localhost:3000'

/** Google font loaded on demand when the merchant picks a font. */
function loadFont(family) {
  if (!family) return
  const id = `font-${family.replace(/\W+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

const FONT_OK = /^[A-Za-z0-9 ]{2,40}$/

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
          theme: parseTheme(data.theme),
          settings: parseSettings(data.settings),
          status: data.status || 'ACTIVE',
          ready: true,
          missing: false,
        })
      })
      .catch(() => setStore((prev) => ({ ...prev, ready: true, missing: true })))
  }, [])

  // Live preview from the backoffice editor (only messages from the backoffice origin, only inside its iframe).
  useEffect(() => {
    if (window.parent === window) return undefined
    const onMessage = (event) => {
      if (event.origin !== BACKOFFICE_ORIGIN || event.data?.type !== 'sellio:preview') return
      const patch = event.data.patch || {}
      setStore((prev) => ({
        ...prev,
        ...patch,
        layout: patch.templateKey ? layoutOf(patch.templateKey) : prev.layout,
        theme: patch.theme !== undefined ? parseTheme(patch.theme) : prev.theme,
        settings: patch.settings !== undefined ? parseSettings(patch.settings) : prev.settings,
      }))
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'sellio:preview-ready' }, BACKOFFICE_ORIGIN)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Fonts chosen by the merchant replace the template's fonts.
  useEffect(() => {
    const root = document.documentElement
    const fonts = store.settings?.fonts || {}
    ;[['heading', fonts.heading], ['body', fonts.body]].forEach(([name, family]) => {
      if (family && FONT_OK.test(family)) {
        loadFont(family)
        root.style.setProperty(`--t-font-${name}`, `"${family}"`)
        root.setAttribute(`data-t-font-${name}`, '')
      } else {
        root.style.removeProperty(`--t-font-${name}`)
        root.removeAttribute(`data-t-font-${name}`)
      }
    })
  }, [store.settings])

  // Browser tab icon: the merchant's logo, or the shop's initial on its brand colour when there is no logo.
  useEffect(() => {
    if (!store.ready || store.missing) return
    setFavicon(store.logo || initialIcon(store.storeName, store.primaryColor))
  }, [store.ready, store.missing, store.logo, store.storeName, store.primaryColor])

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
    const theme = store.theme || {}
    Object.entries(THEME_VARS).forEach(([key, name]) => {
      if (hexOk(theme[key])) {
        root.style.setProperty(`--t-${name}`, theme[key])
        root.setAttribute(`data-t-${name}`, '')
      } else {
        root.style.removeProperty(`--t-${name}`)
        root.removeAttribute(`data-t-${name}`)
      }
    })
    // Buttons that normally follow the template (e.g. white CTAs on Bold) switch to the merchant's button colour.
    if (hexOk(store.buttonColor)) root.setAttribute('data-t-button', '')
    else root.removeAttribute('data-t-button')
    // Secondary surfaces follow the chosen background, slightly darker.
    const low = hexChannels(store.backgroundColor, 0.96)
    if (low) root.style.setProperty('--rgb-surface-low', low)
    else root.style.removeProperty('--rgb-surface-low')
  }, [store.templateKey, store.layout, store.businessType, store.storeName, store.primaryColor, store.buttonColor,
    store.buttonTextColor, store.accentColor, store.backgroundColor, store.textColor, store.theme])

  return (
    <StoreContext.Provider
      value={{
        ...store,
        settings: store.settings || {},
        layout: store.layout || layoutOf(store.templateKey),
        sector: sectorOf(store.businessType),
        // The customer picks among the product's sizes/formats (tailles) in every sector except cosmetics.
        hasSizes: sectorOf(store.businessType).sizes,
        isClothes: store.businessType === 'CLOTHES',
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
