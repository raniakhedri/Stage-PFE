import { SECTORS } from './sectors'

/** Sector cards of the shop wizard (kept under this name for the existing imports). */
export const BUSINESSES = SECTORS.map((s) => ({ id: s.id, title: s.title, text: s.text, icon: s.icon }))

// Storefront templates. Same keys as the server (ShopCatalog.LAYOUTS) and the storefront
// (Frontend/src/data/storeTemplates.js). `colors` are the template defaults the merchant can override.
export const TEMPLATES = [
  {
    id: 'minimal',
    title: 'Minimal',
    text: 'Beaucoup de blanc, comme une vitrine Shopify. Logo à gauche, menu au centre, icônes à droite.',
    swatch: ['#111111', '#ffffff', '#e7e5e4'],
    font: 'Inter, sans-serif',
    radius: '6px',
    tracking: '0.01em',
    upper: false,
    colors: { primary: '#111111', surface: '#ffffff', button: '#111111', buttonText: '#ffffff', muted: '#e7e5e4' },
  },
  {
    id: 'bold',
    title: 'Bold',
    text: 'Grande typographie et images fortes. Le menu s’ouvre en plein écran.',
    swatch: ['#0a0a0a', '#f4f4f5', '#ffffff'],
    font: 'Anton, Impact, sans-serif',
    radius: '0px',
    tracking: '-0.03em',
    upper: true,
    colors: { primary: '#0a0a0a', surface: '#f4f4f5', button: '#0a0a0a', buttonText: '#ffffff', muted: '#d4d4d8' },
  },
  {
    id: 'luxury',
    title: 'Luxury',
    text: 'Éditorial et premium. Logo centré, menu en dessous, en-tête transparent.',
    swatch: ['#1c1917', '#f6f1ea', '#a8a29e'],
    font: '"Cormorant Garamond", Georgia, serif',
    radius: '0px',
    tracking: '0.16em',
    upper: true,
    colors: { primary: '#1c1917', surface: '#f6f1ea', button: '#1c1917', buttonText: '#f6f1ea', muted: '#d6d3d1' },
  },
  {
    id: 'sport',
    title: 'Sport',
    text: 'Énergique : titres italiques condensés, accent fluo, sections en diagonale et chiffres clés.',
    swatch: ['#0b1220', '#c6f432', '#f2f4f7'],
    font: '"Barlow Condensed", Impact, sans-serif',
    radius: '4px',
    tracking: '-0.01em',
    upper: true,
    italic: true,
    colors: { primary: '#0b1220', surface: '#f2f4f7', button: '#c6f432', buttonText: '#0b1220', muted: '#c6f432' },
  },
  {
    id: 'tech',
    title: 'Tech',
    text: 'Net et technique : en-tête sombre, dégradés électriques, fiches avec caractéristiques en avant.',
    swatch: ['#0b0f19', '#3b82f6', '#f5f7fb'],
    font: '"Space Grotesk", Inter, sans-serif',
    radius: '12px',
    tracking: '-0.02em',
    upper: false,
    colors: { primary: '#0b0f19', surface: '#f5f7fb', button: '#2563eb', buttonText: '#ffffff', muted: '#93c5fd' },
  },
  {
    id: 'artisan',
    title: 'Artisan',
    text: 'Chaleureux et fait main : tons terre, coins arrondis, typographie à empattements douce.',
    swatch: ['#7c2d12', '#faf3e8', '#d9a066'],
    font: 'Fraunces, Georgia, serif',
    radius: '14px',
    tracking: '0em',
    upper: false,
    colors: { primary: '#7c2d12', surface: '#faf3e8', button: '#7c2d12', buttonText: '#faf3e8', muted: '#d9a066' },
  },
  {
    id: 'pop',
    title: 'Pop',
    text: 'Ludique et coloré : formes arrondies, aplats vifs, parfait pour les enfants et les marques joyeuses.',
    swatch: ['#5b21b6', '#fffaf0', '#fbbf24'],
    font: 'Fredoka, "Nunito", sans-serif',
    radius: '999px',
    tracking: '0em',
    upper: false,
    colors: { primary: '#5b21b6', surface: '#fffaf0', button: '#f43f5e', buttonText: '#ffffff', muted: '#fbbf24' },
  },
  {
    id: 'editorial',
    title: 'Éditorial',
    text: 'Façon magazine : grille asymétrique, grands titres italiques, sections numérotées.',
    swatch: ['#111111', '#fbfaf7', '#c2410c'],
    font: '"Playfair Display", Georgia, serif',
    radius: '0px',
    tracking: '-0.01em',
    upper: false,
    italic: true,
    colors: { primary: '#111111', surface: '#fbfaf7', button: '#111111', buttonText: '#fbfaf7', muted: '#c2410c' },
  },
]

export const TEMPLATE_LABELS = Object.fromEntries(TEMPLATES.map((t) => [t.id, t.title]))

/** Templates in the order suggested for a sector (recommended ones first). */
export function templatesFor(sectorId) {
  const recommended = SECTORS.find((s) => s.id === sectorId)?.templates || []
  return [...TEMPLATES].sort((a, b) => {
    const ia = recommended.indexOf(a.id)
    const ib = recommended.indexOf(b.id)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
}

export function isRecommended(sectorId, templateId) {
  return (SECTORS.find((s) => s.id === sectorId)?.templates || []).includes(templateId)
}

export function defaultTemplate(sectorId) {
  return SECTORS.find((s) => s.id === sectorId)?.templates?.[0] || 'minimal'
}

export function layoutOf(templateKey) {
  const key = String(templateKey || '').toLowerCase()
  if (TEMPLATES.some((t) => t.id === key)) return key
  if (key === 'noir' || key === 'marin') return 'bold'
  if (key === 'atelier' || key === 'apothicaire' || key === 'botanique') return 'luxury'
  return 'minimal'
}
