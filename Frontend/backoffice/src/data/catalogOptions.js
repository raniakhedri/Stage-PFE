// Preset values for every product attribute that repeats across products.
// Merchants can extend any list from the product form or from "Votre boutique";
// their additions are stored on the shop (customOptions) and merged with these.

export const SIZE_GROUPS = [
  { label: 'Lettres', values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] },
  { label: 'Numériques (FR)', values: ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52'] },
  { label: 'Jeans (W)', values: ['W24', 'W25', 'W26', 'W27', 'W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W36', 'W38'] },
  { label: 'Enfants', values: ['3 mois', '6 mois', '12 mois', '18 mois', '2 ans', '3 ans', '4 ans', '6 ans', '8 ans', '10 ans', '12 ans', '14 ans', '16 ans'] },
  { label: 'Chaussures', values: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
  { label: 'Autre', values: ['Taille unique'] },
]

export const BASIC_COLORS = [
  { name: 'Noir', hex: '#111111' },
  { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Écru', hex: '#F3EEE3' },
  { name: 'Beige', hex: '#D9C7A7' },
  { name: 'Camel', hex: '#B5854B' },
  { name: 'Marron', hex: '#6B4226' },
  { name: 'Gris clair', hex: '#C9C9C9' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Anthracite', hex: '#3A3A3A' },
  { name: 'Bleu marine', hex: '#1F2A44' },
  { name: 'Bleu', hex: '#2F6FDB' },
  { name: 'Bleu ciel', hex: '#9CC7EE' },
  { name: 'Turquoise', hex: '#2BB3B1' },
  { name: 'Vert', hex: '#2E8B57' },
  { name: 'Kaki', hex: '#6B6B3A' },
  { name: 'Vert olive', hex: '#808000' },
  { name: 'Jaune', hex: '#F2C230' },
  { name: 'Moutarde', hex: '#C9A227' },
  { name: 'Orange', hex: '#F08A24' },
  { name: 'Rouge', hex: '#D32F2F' },
  { name: 'Bordeaux', hex: '#6D1A2A' },
  { name: 'Rose', hex: '#F2A7C3' },
  { name: 'Rose poudré', hex: '#E8C4C4' },
  { name: 'Fuchsia', hex: '#D0217C' },
  { name: 'Violet', hex: '#6A3D9A' },
  { name: 'Lilas', hex: '#C8A2C8' },
  { name: 'Doré', hex: '#C9A54A' },
  { name: 'Argenté', hex: '#BFC3C7' },
]

export const FABRICS = [
  // Naturelles végétales
  'Coton', 'Coton bio', 'Coton peigné', 'Lin', 'Chanvre', 'Ramie', 'Jute', 'Bambou',
  // Naturelles animales
  'Laine', 'Laine mérinos', 'Laine d’agneau', 'Cachemire', 'Mohair', 'Alpaga', 'Angora', 'Soie', 'Soie sauvage',
  'Cuir', 'Cuir velours', 'Daim', 'Nubuck',
  // Artificielles
  'Viscose', 'Modal', 'Lyocell (Tencel)', 'Acétate', 'Cupro',
  // Synthétiques
  'Polyester', 'Polyester recyclé', 'Polyamide (Nylon)', 'Acrylique', 'Élasthanne', 'Polyuréthane', 'Simili cuir',
  // Armures et étoffes
  'Denim', 'Jean stretch', 'Velours', 'Velours côtelé', 'Tweed', 'Flanelle', 'Gabardine', 'Satin', 'Mousseline',
  'Crêpe', 'Georgette', 'Taffetas', 'Organza', 'Tulle', 'Dentelle', 'Jersey', 'Maille', 'Molleton', 'Polaire',
  'Popeline', 'Oxford', 'Chambray', 'Piqué', 'Éponge', 'Sergé', 'Toile', 'Canvas', 'Seersucker', 'Néoprène',
  'Fausse fourrure', 'Sherpa', 'Tricot côtelé', 'Broderie anglaise',
]

export const FITS = ['Slim', 'Regular', 'Droite', 'Ajustée', 'Cintrée', 'Oversize', 'Ample', 'Relaxed', 'Skinny', 'Évasée', 'Boyfriend', 'Mom', 'Wide leg', 'Crop', 'Longue']
export const NECKLINES = ['Col rond', 'Col V', 'Col chemise', 'Col montant', 'Col roulé', 'Col polo', 'Col bateau', 'Col carré', 'Col tunisien', 'Col Mao', 'Col châle', 'Col cheminée', 'Capuche', 'Encolure dégagée', 'Sans col']
export const SLEEVES = ['Sans manches', 'Bretelles', 'Manches courtes', 'Manches 3/4', 'Manches longues', 'Manches raglan', 'Manches ballon', 'Manches chauve-souris', 'Manches bouffantes']
export const GENDERS = ['Femme', 'Homme', 'Unisexe', 'Enfant', 'Fille', 'Garçon', 'Bébé']
export const SEASONS = ['Printemps-été', 'Automne-hiver', 'Mi-saison', 'Toutes saisons']
export const CARE = [
  'Lavage en machine à 30 °C', 'Lavage en machine à 40 °C', 'Lavage à la main', 'Nettoyage à sec uniquement',
  'Ne pas utiliser de javel', 'Séchage à plat', 'Ne pas sécher en machine', 'Séchage en machine basse température',
  'Repassage doux', 'Ne pas repasser', 'Laver sur l’envers', 'Laver avec des couleurs similaires',
]

export const VOLUMES = [
  '5 ml', '10 ml', '15 ml', '20 ml', '30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml', '250 ml', '300 ml', '500 ml', '1 L',
  '5 g', '10 g', '25 g', '50 g', '100 g', '150 g', '200 g', '250 g', '500 g', '1 kg',
]
export const CERTIFICATIONS = ['Bio', 'Ecocert', 'Cosmos Organic', 'Cosmos Natural', 'USDA Organic', 'Nature & Progrès', 'Natrue', 'BDIH', 'AB (Agriculture Biologique)', 'Vegan', 'Cruelty Free', 'Halal', 'Slow Cosmétique', 'ISO 16128']
export const ORIGINS = ['Tunisie', 'Maroc', 'Algérie', 'Égypte', 'France', 'Italie', 'Espagne', 'Portugal', 'Grèce', 'Turquie', 'Bulgarie', 'Inde', 'Chine', 'Madagascar', 'Brésil', 'Pérou', 'Australie', 'Canada', 'États-Unis', 'Ghana', 'Burkina Faso', 'Indonésie', 'Sri Lanka']

/** Preset list per attribute key; custom additions are stored under the same key. */
export const PRESETS = {
  tailles: SIZE_GROUPS.flatMap((g) => g.values),
  tissu: FABRICS,
  coupe: FITS,
  col: NECKLINES,
  manches: SLEEVES,
  genre: GENDERS,
  saison: SEASONS,
  entretien: CARE,
  volume: VOLUMES,
  certifications: CERTIFICATIONS,
  origine: ORIGINS,
  couleur: BASIC_COLORS.map((c) => c.name),
}

export const OPTION_LABELS = {
  tailles: 'Tailles',
  tissu: 'Tissus',
  coupe: 'Coupes',
  col: 'Cols',
  manches: 'Manches',
  genre: 'Genres',
  saison: 'Saisons',
  entretien: 'Entretien',
  volume: 'Contenances',
  certifications: 'Certifications',
  origine: 'Origines',
  couleur: 'Couleurs',
}

/** "S, M,L" → ['S','M','L'] */
export function splitList(value) {
  const list = String(value || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
  // Older products typed sizes separated by spaces ("S M L XL").
  if (list.length === 1 && /\s/.test(list[0])) {
    const parts = list[0].split(/\s+/)
    if (parts.every((p) => /^(X{0,4}[SML]?|\d{1,3}|W\d{2})$/i.test(p))) return parts
  }
  return list
}

/** Sorts sizes by their position in the preset groups; unknown values keep their order at the end. */
export function sortSizes(values) {
  const order = PRESETS.tailles
  return [...values].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
  })
}
