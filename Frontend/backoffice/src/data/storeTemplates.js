export const BUSINESSES = [
  {
    id: 'CLOTHES',
    title: 'Vêtements',
    text: 'Pulls, robes, vestes. Essayage en direct sur la fiche produit.',
  },
  {
    id: 'COSMETICS',
    title: 'Cosmétiques',
    text: 'Soins, huiles, parfums. Fiches composition, origine et conseils.',
  },
]

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
    font: 'Outfit, sans-serif',
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
    font: '"Libre Baskerville", Georgia, serif',
    radius: '0px',
    tracking: '0.16em',
    upper: true,
    colors: { primary: '#1c1917', surface: '#f6f1ea', button: '#1c1917', buttonText: '#f6f1ea', muted: '#d6d3d1' },
  },
]

export function templatesFor() {
  return TEMPLATES
}

export function defaultTemplate() {
  return 'minimal'
}

export function layoutOf(templateKey) {
  const key = String(templateKey || '').toLowerCase()
  if (key === 'bold' || key === 'noir' || key === 'marin') return 'bold'
  if (key === 'luxury' || key === 'atelier' || key === 'apothicaire' || key === 'botanique') return 'luxury'
  return 'minimal'
}
