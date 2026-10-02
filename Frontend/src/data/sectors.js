// Storefront side of the sector registry (backoffice: data/sectors.js, server: ShopCatalog).
// `sizes`: the product's `tailles` list is what the customer chooses (cosmetics use variants/contenance).

export const SECTORS = {
  CLOTHES: { id: 'CLOTHES', kind: 'clothes', sizes: true, sizeLabel: 'Taille', tryOn: true },
  COSMETICS: { id: 'COSMETICS', kind: 'cosmetics', sizes: false, sizeLabel: 'Contenance', tryOn: false },
  SPORTS: { id: 'SPORTS', kind: 'generic', sizes: true, sizeLabel: 'Taille', tryOn: true },
  ELECTRONICS: { id: 'ELECTRONICS', kind: 'generic', sizes: true, sizeLabel: 'Capacité', tryOn: false },
  HOME: { id: 'HOME', kind: 'generic', sizes: true, sizeLabel: 'Format', tryOn: false },
  FOOD: { id: 'FOOD', kind: 'generic', sizes: true, sizeLabel: 'Format', tryOn: false },
  JEWELRY: { id: 'JEWELRY', kind: 'generic', sizes: true, sizeLabel: 'Tour de doigt', tryOn: false },
  KIDS: { id: 'KIDS', kind: 'generic', sizes: true, sizeLabel: 'Taille', tryOn: false },
}

/**
 * Product types of the generic sectors (same ids as the backoffice, stored as attributes.type):
 * label shown on the sheet and what the customer chooses (null = sold as a single model).
 */
export const PRODUCT_TYPES = {
  SPORTS: {
    vetement: { label: 'Vêtement de sport', sizeLabel: 'Taille' },
    chaussures: { label: 'Chaussures', sizeLabel: 'Pointure' },
    equipement: { label: 'Équipement', sizeLabel: 'Taille / poids' },
    machine: { label: 'Machine fitness', sizeLabel: null },
    nutrition: { label: 'Nutrition sportive', sizeLabel: 'Format' },
  },
  ELECTRONICS: {
    smartphone: { label: 'Smartphone & tablette', sizeLabel: 'Stockage' },
    ordinateur: { label: 'Ordinateur', sizeLabel: 'Configuration' },
    audio: { label: 'Audio', sizeLabel: null },
    tv: { label: 'TV & image', sizeLabel: 'Taille d’écran' },
    electromenager: { label: 'Électroménager', sizeLabel: null },
    accessoire: { label: 'Accessoire', sizeLabel: null },
  },
  HOME: {
    mobilier: { label: 'Mobilier', sizeLabel: null },
    linge: { label: 'Linge de maison', sizeLabel: 'Dimensions' },
    deco: { label: 'Décoration', sizeLabel: 'Format' },
    cuisine: { label: 'Cuisine & art de la table', sizeLabel: 'Format' },
    luminaire: { label: 'Luminaire', sizeLabel: null },
  },
  FOOD: {
    huiles: { label: 'Huiles & condiments', sizeLabel: 'Format' },
    douceurs: { label: 'Miels, dattes & douceurs', sizeLabel: 'Format' },
    epices: { label: 'Épices & herbes', sizeLabel: 'Format' },
    boissons: { label: 'Thés, cafés & boissons', sizeLabel: 'Format' },
    coffret: { label: 'Coffret', sizeLabel: null },
  },
  JEWELRY: {
    bague: { label: 'Bague', sizeLabel: 'Tour de doigt' },
    collier: { label: 'Collier & pendentif', sizeLabel: 'Longueur' },
    bracelet: { label: 'Bracelet', sizeLabel: 'Tour de poignet' },
    boucles: { label: 'Boucles d’oreilles', sizeLabel: null },
    montre: { label: 'Montre', sizeLabel: null },
    sac: { label: 'Sac & maroquinerie', sizeLabel: null },
    accessoire: { label: 'Accessoire', sizeLabel: 'Taille' },
  },
  KIDS: {
    vetement: { label: 'Vêtement enfant', sizeLabel: 'Taille' },
    chaussures: { label: 'Chaussures enfant', sizeLabel: 'Pointure' },
    jouet: { label: 'Jouet & jeu', sizeLabel: null },
    puericulture: { label: 'Puériculture', sizeLabel: null },
    livre: { label: 'Livres & loisirs créatifs', sizeLabel: null },
  },
}

export function productTypeOf(businessType, product) {
  const type = parseAttributes(product?.attributes).type
  return (PRODUCT_TYPES[businessType] || {})[type] || null
}

/** What the customer chooses on this product: "Pointure" for shoes, "Tour de doigt" for a ring… */
export function sizeLabelOf(businessType, product) {
  return productTypeOf(businessType, product)?.sizeLabel || sectorOf(businessType).sizeLabel
}

export function sectorOf(businessType) {
  return SECTORS[businessType] || SECTORS.COSMETICS
}

/** Labels of the characteristics stored in `attributes` (same keys as the backoffice form). */
export const ATTRIBUTE_LABELS = {
  discipline: 'Discipline',
  niveau: 'Niveau',
  genre: 'Pour',
  matiere: 'Matière',
  technologies: 'Technologies',
  details: 'Détails techniques',
  marque: 'Marque',
  modele: 'Modèle',
  garantie: 'Garantie',
  connectivite: 'Connectivité',
  compatibilite: 'Compatibilité',
  specs: 'Fiche technique',
  materiau: 'Matériau',
  piece: 'Pièce',
  style: 'Style',
  dimensions: 'Dimensions',
  entretien: 'Entretien',
  origine: 'Origine',
  labels: 'Labels',
  allergenes: 'Allergènes',
  conservation: 'Conservation',
  ingredients: 'Ingrédients',
  nutrition: 'Valeurs nutritionnelles',
  pierre: 'Pierre',
  finition: 'Finition',
  age: 'Âge conseillé',
  normes: 'Normes & sécurité',
  piles: 'Piles',
  competences: 'Ce qu’il développe',
  avertissement: 'Avertissements',
  type: 'Type de produit',
  terrain: 'Terrain',
  amorti: 'Amorti',
  drop: 'Drop',
  poids: 'Poids',
  machine: 'Type de machine',
  poidsMax: 'Poids utilisateur max',
  resistance: 'Résistance / vitesse',
  alimentation: 'Alimentation',
  pliable: 'Pliable',
  gout: 'Goût',
  etat: 'État',
  ecran: 'Écran',
  ram: 'Mémoire vive',
  os: 'Système',
  batterie: 'Batterie',
  photo: 'Appareil photo',
  processeur: 'Processeur',
  graphique: 'Carte graphique',
  audio: 'Type',
  autonomie: 'Autonomie',
  reductionBruit: 'Réduction de bruit',
  resolution: 'Résolution',
  dalle: 'Technologie d’écran',
  smartTv: 'Smart TV',
  puissance: 'Puissance',
  energie: 'Classe énergétique',
  contenance: 'Capacité',
  longueur: 'Longueur',
  montage: 'Montage',
  chargeMax: 'Charge maximale',
  grammage: 'Grammage',
  composition: 'Composition',
  fabrication: 'Fabrication',
  compatible: 'Compatible',
  culot: 'Culot',
  dlc: 'Durée de conservation',
  variete: 'Variété',
  acidite: 'Acidité',
  extraction: 'Extraction',
  forme: 'Forme',
  piquant: 'Piquant',
  preparation: 'Préparation',
  contenu: 'Contenu du coffret',
  largeur: 'Largeur',
  fermoir: 'Fermoir',
  pendentif: 'Pendentif',
  attache: 'Attache',
  mouvement: 'Mouvement',
  boitier: 'Boîtier',
  bracelet: 'Bracelet',
  etancheite: 'Étanchéité',
  verre: 'Verre',
  fermeture: 'Fermeture',
  interieur: 'Intérieur',
  joueurs: 'Joueurs',
  poidsEnfant: 'Poids de l’enfant',
  langue: 'Langue',
  pages: 'Contenu',
}

/** Readable value of a characteristic (the product type id becomes its label). */
export function attributeValue(businessType, key, value) {
  if (key === 'type') return (PRODUCT_TYPES[businessType] || {})[value]?.label || value
  return value
}

/** Long texts get their own tab; "specs" fields are "Nom : valeur" lines shown as a table. */
export const LONG_ATTRIBUTES = ['details', 'specs', 'entretien', 'ingredients', 'nutrition', 'avertissement', 'preparation', 'contenu']
export const TABLE_ATTRIBUTES = ['specs', 'nutrition']

/** Short characteristics shown as chips under the title, per sector. */
const CHIPS = {
  SPORTS: ['discipline', 'machine', 'niveau', 'terrain', 'technologies'],
  ELECTRONICS: ['marque', 'etat', 'garantie', 'connectivite'],
  HOME: ['materiau', 'style', 'fabrication', 'piece'],
  FOOD: ['origine', 'variete', 'labels'],
  JEWELRY: ['matiere', 'pierre', 'mouvement', 'finition'],
  KIDS: ['age', 'normes'],
}

export function parseAttributes(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

/** "Autonomie : 30 h\nPoids : 250 g" → [['Autonomie', '30 h'], ['Poids', '250 g']] */
export function specRows(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      return i > 0 ? [line.slice(0, i).trim(), line.slice(i + 1).trim()] : ['', line]
    })
}

export function attributeChips(businessType, attributes) {
  const list = []
  ;(CHIPS[businessType] || []).forEach((key) => {
    String(attributes[key] || '').split(',').map((v) => v.trim()).filter(Boolean).forEach((v) => list.push(v))
  })
  return list.slice(0, 5)
}

/** One short line under a product name on cards. */
export function productDetail(businessType, product) {
  const sector = sectorOf(businessType)
  if (sector.kind === 'clothes') return [product.tissu, product.couleur].filter(Boolean).join(' · ')
  if (sector.kind === 'cosmetics') return product.latin || product.volume
  const chips = attributeChips(businessType, product.attributes || {})
  return [...chips.slice(0, 2), product.couleur].filter(Boolean).join(' · ')
}
