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
    id: 'atelier',
    business: 'CLOTHES',
    title: 'Atelier',
    text: 'Beige, serif, magazine de mode.',
    swatch: ['#5c3a21', '#faf6ef', '#c4a574'],
  },
  {
    id: 'noir',
    business: 'CLOTHES',
    title: 'Noir',
    text: 'Noir et blanc, boutique minimaliste.',
    swatch: ['#111111', '#f4f4f4', '#8a8a8a'],
  },
  {
    id: 'botanique',
    business: 'COSMETICS',
    title: 'Botanique',
    text: 'Vert profond et crème, l’identité actuelle.',
    swatch: ['#163328', '#fef8f3', '#7c8b6f'],
  },
  {
    id: 'nude',
    business: 'COSMETICS',
    title: 'Nude',
    text: 'Rose poudré, institut et spa.',
    swatch: ['#8d5348', '#fff7f4', '#c4a094'],
  },
]

export function templatesFor(business) {
  return TEMPLATES.filter((item) => item.business === business)
}

export function defaultTemplate(business) {
  return business === 'CLOTHES' ? 'atelier' : 'botanique'
}
