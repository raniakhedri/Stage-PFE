import { createContext, useContext, useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const DEFAULTS = {
  brandName: '',
  slogan: '',
  logoMain: '',
  logoLight: '',
  logoNavbar: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  whatsapp: '',
  phone: '',
  email: '',
}

const AppearanceContext = createContext({ ...DEFAULTS, loaded: false })

function applyFoAppearance(data) {
  // Favicon
  if (data.favicon) {
    const existing = document.querySelector("link[rel='icon']")
    if (existing) existing.href = data.favicon
  }

  // Page title from brand name
  if (data.brandName) {
    document.title = data.brandName + (data.slogan ? ` — ${data.slogan}` : '')
  }
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState({ ...DEFAULTS, loaded: false })

  useEffect(() => {
    fetch(`${BASE_URL}/public/appearance/frontoffice`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const merged = { ...DEFAULTS, ...(data || {}), loaded: true }
        setAppearance(merged)
        applyFoAppearance(merged)
      })
      .catch(() => {
        setAppearance(prev => ({ ...prev, loaded: true }))
      })
  }, [])

  return (
    <AppearanceContext.Provider value={appearance}>
      {children}
    </AppearanceContext.Provider>
  )
}

export const useFoAppearance = () => useContext(AppearanceContext)
