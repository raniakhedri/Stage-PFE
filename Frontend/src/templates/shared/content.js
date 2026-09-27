// Default storefront copy per business type. Every template reads from here,
// so no template carries text that only makes sense for one kind of shop.

const COSMETICS = {
  kind: 'cosmetics',
  hero: {
    minimal: {
      eyebrow: 'Nouvelle collection',
      title: 'Des soins essentiels, pensés pour durer.',
      text: 'Des formules courtes, des textures justes et une routine qui tient en quelques gestes.',
    },
    bold: {
      eyebrow: 'Drop de saison',
      title: 'Peau nette. Zéro détour.',
      text: 'Des actifs qui font le travail, sans promesse creuse.',
    },
    luxury: {
      eyebrow: 'Maison de soin',
      title: 'L’art du rituel, révélé.',
      text: 'Des compositions rares, choisies avec exigence, pour un geste qui devient un moment.',
    },
  },
  cta: 'Découvrir la boutique',
  categoriesTitle: 'Par univers',
  newTitle: 'Nouveautés',
  bestTitle: 'Les incontournables',
  editorial: {
    eyebrow: 'Notre approche',
    title: 'Moins d’ingrédients, plus d’efficacité.',
    text: 'Chaque produit est choisi pour sa composition lisible, sa tolérance et son efficacité réelle. Nous privilégions les formules concentrées et les contenants responsables.',
    cta: 'Explorer la sélection',
  },
  statement: ['Formules', 'honnêtes.', 'Résultats', 'visibles.'],
  marquee: ['Formules lisibles', 'Livraison rapide', 'Paiement sécurisé', 'Retours faciles', 'Conseil personnalisé'],
  quote: '« La beauté commence au moment où l’on décide d’être soi-même. »',
  promises: [
    { icon: 'sparkles', title: 'Formules sélectionnées', text: 'Des compositions lisibles et contrôlées.' },
    { icon: 'truck', title: 'Livraison rapide', text: 'Expédition sous 24 à 48 h.' },
    { icon: 'shield', title: 'Paiement sécurisé', text: 'Carte bancaire ou paiement à la livraison.' },
    { icon: 'refresh', title: 'Retours simplifiés', text: 'Un doute ? Nous vous accompagnons.' },
  ],
  footerBlurb: 'Des soins choisis avec exigence, livrés partout en Tunisie.',
  newsletter: {
    title: 'Restez dans la confidence',
    text: 'Nouveautés, conseils et offres réservées aux abonnés.',
  },
  menuFeature: 'Sélection du moment',
}

const CLOTHES = {
  kind: 'clothes',
  hero: {
    minimal: {
      eyebrow: 'Nouvelle collection',
      title: 'Des pièces simples, faites pour être portées.',
      text: 'Des coupes justes, des matières choisies et une garde-robe qui se combine sans effort.',
    },
    bold: {
      eyebrow: 'Drop de saison',
      title: 'Porte-le. Assume-le.',
      text: 'Des silhouettes fortes pour chaque jour de la semaine.',
    },
    luxury: {
      eyebrow: 'La collection',
      title: 'L’élégance, sans effort.',
      text: 'Des matières nobles et des coupes précises, pensées pour traverser les saisons.',
    },
  },
  cta: 'Voir la collection',
  categoriesTitle: 'Acheter par catégorie',
  newTitle: 'Nouveautés',
  bestTitle: 'Les pièces fortes',
  editorial: {
    eyebrow: 'Notre approche',
    title: 'Moins de pièces, mieux choisies.',
    text: 'Nous sélectionnons des vêtements bien coupés dans des matières durables, pour une garde-robe qui se porte longtemps et se combine facilement.',
    cta: 'Découvrir la collection',
  },
  statement: ['Porte', 'ce que', 'tu', 'es.'],
  marquee: ['Nouvelle collection', 'Livraison rapide', 'Essayage virtuel', 'Échanges faciles', 'Paiement sécurisé'],
  quote: '« Le style, c’est une façon de dire qui vous êtes sans avoir à parler. »',
  promises: [
    { icon: 'sparkles', title: 'Matières choisies', text: 'Des pièces confortables et durables.' },
    { icon: 'truck', title: 'Livraison rapide', text: 'Expédition sous 24 à 48 h.' },
    { icon: 'shield', title: 'Paiement sécurisé', text: 'Carte bancaire ou paiement à la livraison.' },
    { icon: 'refresh', title: 'Échanges faciles', text: 'La taille ne va pas ? On l’échange.' },
  ],
  footerBlurb: 'Des vêtements bien coupés, livrés partout en Tunisie.',
  newsletter: {
    title: 'Rejoignez le cercle',
    text: 'Accès anticipé aux collections et ventes privées.',
  },
  menuFeature: 'La pièce du moment',
}

export function copyFor(businessType) {
  return businessType === 'CLOTHES' ? CLOTHES : COSMETICS
}

export function formatPrice(value) {
  const n = Number(value || 0)
  return `${n.toFixed(2)} TND`
}
