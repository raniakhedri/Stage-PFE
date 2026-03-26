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
  const primary = data.primaryColor || '#004D40'
  setColorPair('brand', primary)
  setColorPair('btn', data.buttonColor || primary)
  setColorPair('sidebar', data.sidebarColor || primary)
  setColorPair('badge', data.badgeColor || data.secondaryColor || '#EC5B13')
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

export function applyDarkMode(enabled) {
  if (enabled === undefined || enabled === null) return
  document.documentElement.classList.toggle('dark-mode', !!enabled)
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR LAYOUT — driven by CSS custom properties
   ═══════════════════════════════════════════════════════════════ */

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
