/**
 * Convert hex color to space-separated RGB values.
 * e.g. "#004D40" → "0 77 64"
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

/**
 * Darken an RGB string by a factor (0–1).
 */
function darkenRgb(rgb, factor = 0.18) {
  const [r, g, b] = rgb.split(' ').map(Number)
  return `${Math.round(r * (1 - factor))} ${Math.round(g * (1 - factor))} ${Math.round(b * (1 - factor))}`
}

function setColorPair(name, hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const rgb = hexToRgb(hex)
  document.documentElement.style.setProperty(`--color-${name}`, rgb)
  document.documentElement.style.setProperty(`--color-${name}-dark`, darkenRgb(rgb))
}

/**
 * Apply all appearance colors from an API response object.
 * Keys: primaryColor (→ brand), buttonColor (→ btn), sidebarColor (→ sidebar), badgeColor (→ badge)
 */
export function applyAllColors(data) {
  if (!data) return
  const primary = data.primaryColor || '#7C3AED'
  setColorPair('brand', primary)
  setColorPair('btn', data.buttonColor || '#FF6A1A')
  setColorPair('sidebar', data.sidebarColor || primary)
  setColorPair('badge', data.badgeColor || data.secondaryColor || '#FF6A1A')
}

/**
 * Apply a single color family by variable name.
 * name: 'brand' | 'btn' | 'sidebar' | 'badge'
 */
export function applyColor(name, hex) {
  setColorPair(name, hex)
}

/* ═══════════════════════════════════════════════════════════════
   TYPOGRAPHY — driven by CSS custom properties
   ═══════════════════════════════════════════════════════════════ */

const FALLBACK = "system-ui, -apple-system, sans-serif"

function setFontVar(name, fontName) {
  if (!fontName) return
  document.documentElement.style.setProperty(`--font-${name}`, `'${fontName}', ${FALLBACK}`)
}

/**
 * Apply all typography from an API response object.
 * Keys: fontPrimary (→ heading + body), fontSidebar, fontButton, fontBadge
 */
export function applyAllFonts(data) {
  if (!data) return
  const primary = data.fontPrimary || 'Public Sans'
  setFontVar('heading', primary)
  setFontVar('body', data.fontSecondary || primary)
  setFontVar('sidebar', data.fontSidebar || primary)
  setFontVar('button', data.fontButton || primary)
  setFontVar('badge', data.fontBadge || primary)
}

/**
 * Apply a single font family by variable name.
 * name: 'heading' | 'body' | 'sidebar' | 'button' | 'badge'
 */
export function applyFont(name, fontName) {
  setFontVar(name, fontName)
}

/* ═══════════════════════════════════════════════════════════════
   ADVANCED — border radius & dark mode
   ═══════════════════════════════════════════════════════════════ */

export function applyBorderRadius(px) {
  if (px === undefined || px === null) return
  document.documentElement.style.setProperty('--border-radius', `${px}px`)
}

/**
 * Apply logo scale (percentage 50–200, default 100).
 * Sets --logo-scale CSS custom property read by Sidebar.
 */
export function applyLogoScale(percent) {
  if (percent === undefined || percent === null) return
  document.documentElement.style.setProperty('--logo-scale', String(percent))
}

/**
 * Apply logo alignment: 'left' or 'center'.
 * Sets --logo-align CSS custom property read by Sidebar.
 */
export function applyLogoAlign(align) {
  if (!align) return
  document.documentElement.style.setProperty('--logo-align', align)
}

export function applyDarkMode(enabled) {
  if (enabled === undefined || enabled === null) return
  const root = document.documentElement
  root.classList.add('dark-transition')
  root.classList.toggle('dark-mode', !!enabled)
  setTimeout(() => root.classList.remove('dark-transition'), 450)
}

/* ═══════════════════════════════════════════════════════════════
   BACKOFFICE THEME — the user's own choice wins over the platform default
   ═══════════════════════════════════════════════════════════════ */

const BACKOFFICE_THEME_KEY = 'backofficeTheme'
const THEME_EVENT = 'backoffice-theme'
let platformDark = false

/** Dark mode for the backoffice: the user's choice, else the platform setting. */
export function readBackofficeDark() {
  try {
    const stored = localStorage.getItem(BACKOFFICE_THEME_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
  } catch {
    // storage blocked: fall back to the platform setting
  }
  return platformDark
}

/** Platform default (Apparence > Back-office), used until the user picks a theme. */
export function setPlatformDarkDefault(enabled) {
  platformDark = !!enabled
  window.dispatchEvent(new Event(THEME_EVENT))
}

/** Remember the user's theme for this browser. */
export function setBackofficeDark(enabled) {
  try {
    localStorage.setItem(BACKOFFICE_THEME_KEY, enabled ? 'dark' : 'light')
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  window.dispatchEvent(new Event(THEME_EVENT))
}

export function onBackofficeThemeChange(listener) {
  window.addEventListener(THEME_EVENT, listener)
  return () => window.removeEventListener(THEME_EVENT, listener)
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR LAYOUT — driven by CSS custom properties
   ═══════════════════════════════════════════════════════════════ */

/**
 * Apply logos as CSS custom properties.
 */
export function applyLogos(data) {
  if (!data) return
  if (data.logoMain) {
    document.documentElement.style.setProperty('--logo-main', `url(${data.logoMain})`)
    document.documentElement.setAttribute('data-logo-main', data.logoMain)
  }
  if (data.logoLight) {
    document.documentElement.style.setProperty('--logo-light', `url(${data.logoLight})`)
    document.documentElement.setAttribute('data-logo-light', data.logoLight)
  }
}

/**
 * Apply sidebar layout toggles (showIcons, showLogo).
 * Sets CSS custom properties that the Sidebar component reads.
 */
export function applySidebarLayout(data) {
  if (!data) return
  if (data.showIcons !== undefined) {
    document.documentElement.style.setProperty('--sidebar-show-icons', data.showIcons ? '1' : '0')
  }
  if (data.showLogo !== undefined) {
    document.documentElement.style.setProperty('--sidebar-show-logo', data.showLogo ? '1' : '0')
  }
}
