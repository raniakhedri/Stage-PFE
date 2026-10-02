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

// ── Sport & fitness ─────────────────────────────────────────────────────────
export const SPORT_DISCIPLINES = ['Running', 'Fitness & musculation', 'Yoga & pilates', 'Football', 'Basketball', 'Tennis', 'Padel', 'Natation', 'Cyclisme', 'Randonnée', 'Trail', 'Boxe & sports de combat', 'Handball', 'Volley-ball', 'Ski', 'Danse', 'Multisport']
export const SPORT_LEVELS = ['Débutant', 'Intermédiaire', 'Confirmé', 'Compétition']
export const SPORT_MATERIALS = ['Polyester respirant', 'Polyamide', 'Élasthanne', 'Coton technique', 'Mesh', 'Néoprène', 'Mérinos', 'Gore-Tex', 'Softshell', 'Cuir synthétique', 'Caoutchouc', 'Mousse EVA']
export const SPORT_TECH = ['Anti-transpiration', 'Séchage rapide', 'Anti-UV', 'Imperméable', 'Coupe-vent', 'Réfléchissant', 'Compression', 'Amorti renforcé', 'Semelle antidérapante', 'Sans couture', 'Anti-odeur']

// ── High-tech ───────────────────────────────────────────────────────────────
export const TECH_CAPACITIES = ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To', '2 To']
export const TECH_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Sony', 'JBL', 'Bose', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'Logitech', 'Anker', 'Canon', 'Nikon', 'LG', 'Philips', 'Marque propre']
export const WARRANTIES = ['Sans garantie', '3 mois', '6 mois', '1 an', '2 ans', '3 ans', '5 ans']
export const CONNECTIVITY = ['Wi-Fi', 'Bluetooth', 'USB-C', 'Lightning', 'USB-A', 'HDMI', 'Jack 3,5 mm', 'NFC', '4G', '5G', 'Ethernet', 'Recharge sans fil']

// ── Maison & déco ───────────────────────────────────────────────────────────
export const HOME_FORMATS = ['Petit', 'Moyen', 'Grand', 'Lot de 2', 'Lot de 4', 'Lot de 6', '1 personne', '2 personnes', '140 × 190 cm', '160 × 200 cm', '180 × 200 cm']
export const HOME_MATERIALS = ['Bois massif', 'Chêne', 'Noyer', 'Bambou', 'Rotin', 'Osier', 'Métal', 'Laiton', 'Verre', 'Céramique', 'Terre cuite', 'Grès', 'Marbre', 'Coton', 'Lin', 'Velours', 'Laine', 'Jute', 'Plastique recyclé']
export const ROOMS = ['Salon', 'Chambre', 'Cuisine', 'Salle à manger', 'Salle de bain', 'Bureau', 'Entrée', 'Chambre d’enfant', 'Extérieur']
export const DECOR_STYLES = ['Scandinave', 'Bohème', 'Industriel', 'Moderne', 'Classique', 'Minimaliste', 'Méditerranéen', 'Oriental', 'Vintage', 'Japandi']

// ── Épicerie fine ───────────────────────────────────────────────────────────
export const FOOD_FORMATS = ['100 g', '200 g', '250 g', '500 g', '1 kg', '25 cl', '50 cl', '75 cl', '1 L', '3 L', '5 L', 'Coffret', 'À l’unité']
export const FOOD_LABELS = ['Bio', 'Artisanal', 'Fait maison', 'Vegan', 'Végétarien', 'Sans gluten', 'Sans sucre ajouté', 'Sans conservateur', 'Halal', 'AOC', 'Commerce équitable']
export const ALLERGENS = ['Gluten', 'Lait', 'Œufs', 'Fruits à coque', 'Arachides', 'Soja', 'Sésame', 'Céleri', 'Moutarde', 'Poisson', 'Crustacés', 'Sulfites', 'Lupin']
export const STORAGE = ['Température ambiante', 'À l’abri de la lumière', 'Au frais (0–4 °C)', 'Congelé (−18 °C)', 'Après ouverture, au réfrigérateur']

// ── Bijoux ──────────────────────────────────────────────────────────────────
export const RING_SIZES = ['46', '48', '50', '52', '54', '56', '58', '60', '62', '64', 'Réglable', 'Taille unique']
export const JEWEL_MATERIALS = ['Or 18 carats', 'Or 9 carats', 'Plaqué or', 'Argent 925', 'Acier inoxydable', 'Laiton', 'Titane', 'Perles', 'Cuir', 'Résine']
export const STONES = ['Sans pierre', 'Diamant', 'Zircon', 'Perle de culture', 'Rubis', 'Saphir', 'Émeraude', 'Améthyste', 'Quartz rose', 'Turquoise', 'Nacre', 'Corail']
export const FINISHES = ['Poli', 'Brossé', 'Martelé', 'Satiné', 'Vieilli', 'Émaillé']

// ── Enfants ─────────────────────────────────────────────────────────────────
export const KID_AGES = ['0–6 mois', '6–12 mois', '1–2 ans', '2–3 ans', '3–5 ans', '6–8 ans', '9–12 ans', '12 ans et +']
export const KID_MATERIALS = ['Bois', 'Coton bio', 'Coton', 'Silicone alimentaire', 'Plastique sans BPA', 'Tissu', 'Carton', 'Métal']
export const TOY_STANDARDS = ['Norme CE', 'EN 71', 'Sans BPA', 'Peinture non toxique', 'Oeko-Tex', 'Lavable en machine', 'Petites pièces : non']
export const BATTERIES = ['Sans piles', 'Piles incluses', 'Piles non incluses', 'Batterie rechargeable']
export const SKILLS = ['Motricité', 'Créativité', 'Logique', 'Langage', 'Éveil sensoriel', 'Coopération', 'Imagination', 'Sciences']

// Product types (data/sectors.js)
export const YES_NO = ['Oui', 'Non']
export const POWER_SUPPLY = ['Sans alimentation', 'Secteur 220 V', 'Batterie rechargeable', 'Piles', 'USB', 'Solaire']
export const SPORT_GEAR_SIZES = ['Taille unique', 'S', 'M', 'L', 'XL', 'Taille 3', 'Taille 4', 'Taille 5', '1 kg', '2 kg', '5 kg', '10 kg', '20 kg']
export const SPORT_TERRAINS = ['Route', 'Trail', 'Salle', 'Gazon naturel', 'Gazon synthétique', 'Terre battue', 'Toutes surfaces']
export const CUSHIONING = ['Léger', 'Modéré', 'Maximal']
export const FITNESS_MACHINES = ['Tapis de course', 'Vélo d’appartement', 'Vélo elliptique', 'Rameur', 'Vélo de biking', 'Banc de musculation', 'Station de musculation', 'Presse à cuisses', 'Appareil abdominaux', 'Stepper']
export const USER_WEIGHTS = ['100 kg', '120 kg', '130 kg', '150 kg', '180 kg', '200 kg']
export const NUTRITION_FLAVOURS = ['Neutre', 'Chocolat', 'Vanille', 'Fraise', 'Cookies & cream', 'Banane', 'Fruits rouges', 'Caramel', 'Citron']
export const PRODUCT_CONDITIONS = ['Neuf', 'Reconditionné — très bon état', 'Reconditionné — bon état', 'Occasion']
export const RAM_SIZES = ['2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go', '16 Go', '32 Go', '64 Go']
export const OPERATING_SYSTEMS = ['Android', 'iOS', 'iPadOS', 'HarmonyOS', 'Windows 11', 'macOS', 'ChromeOS', 'Linux', 'Sans système']
export const AUDIO_TYPES = ['Écouteurs sans fil', 'Écouteurs filaires', 'Casque', 'Enceinte portable', 'Barre de son', 'Chaîne hi-fi']
export const SCREEN_SIZES = ['24 pouces', '32 pouces', '40 pouces', '43 pouces', '50 pouces', '55 pouces', '65 pouces', '75 pouces', '85 pouces']
export const RESOLUTIONS = ['HD', 'Full HD', '4K UHD', '8K']
export const PANELS = ['LED', 'QLED', 'OLED', 'Mini-LED', 'Neo QLED']
export const ENERGY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
export const ASSEMBLY = ['Livré monté', 'À monter soi-même', 'Montage inclus']
export const LINEN_SIZES = ['50 × 70 cm', '65 × 65 cm', '140 × 190 cm', '160 × 200 cm', '180 × 200 cm', '200 × 200 cm', '240 × 260 cm', '1 personne', '2 personnes']
export const CRAFT = ['Fait main', 'Artisanat tunisien', 'Fabrication industrielle', 'Pièce unique', 'Édition limitée']
export const KITCHEN_COMPAT = ['Lave-vaisselle', 'Micro-ondes', 'Four', 'Induction', 'Congélateur', 'Contact alimentaire']
export const LAMP_BASES = ['E27', 'E14', 'GU10', 'G9', 'LED intégrée']
export const OIL_EXTRACTION = ['Première pression à froid', 'Extraction à froid', 'Pressée à chaud', 'Raffinée']
export const SPICE_FORMS = ['Entière', 'Moulue', 'Concassée', 'Mélange', 'Pâte']
export const HEAT_LEVELS = ['Doux', 'Moyen', 'Fort', 'Très fort']
export const NECKLACE_LENGTHS = ['38 cm', '40 cm', '42 cm', '45 cm', '50 cm', '55 cm', '60 cm', '70 cm', '80 cm', 'Réglable']
export const WRIST_SIZES = ['15 cm', '16 cm', '17 cm', '18 cm', '19 cm', '20 cm', '21 cm', 'S', 'M', 'L', 'Réglable']
export const CLASPS = ['Mousqueton', 'Anneau ressort', 'Fermoir magnétique', 'Baïonnette', 'Fermoir boîte', 'Coulissant', 'Sans fermoir']
export const EARRING_BACKS = ['Poussette', 'Crochet', 'Clip', 'Créole', 'Dormeuse', 'Puce']
export const MOVEMENTS = ['Quartz', 'Automatique', 'Mécanique à remontage manuel', 'Solaire', 'Connectée']
export const WATCH_STRAPS = ['Cuir', 'Acier inoxydable', 'Milanais', 'Silicone', 'Tissu / NATO', 'Céramique', 'Titane']
export const WATER_RESISTANCE = ['Non étanche', '3 ATM', '5 ATM', '10 ATM', '20 ATM']
export const WATCH_GLASS = ['Minéral', 'Saphir', 'Acrylique']
export const BAG_CLOSURES = ['Zip', 'Aimant', 'Bouton pression', 'Cordon', 'Rabat', 'Ouvert']
export const ACCESSORY_SIZES = ['Taille unique', 'S', 'M', 'L', 'XL', '85 cm', '90 cm', '95 cm', '100 cm', '105 cm', '110 cm']
export const KID_SHOE_SIZES = ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35']
export const SHOE_CLOSURES = ['Scratch', 'Lacets', 'Zip', 'Élastique', 'Sans fermeture']
export const LANGUAGES = ['Français', 'Arabe', 'Anglais', 'Bilingue français-arabe', 'Sans texte']

/** Preset list per attribute key; custom additions are stored under the same key. */
export const PRESETS = {
  discipline: SPORT_DISCIPLINES,
  niveau: SPORT_LEVELS,
  matiereSport: SPORT_MATERIALS,
  technoSport: SPORT_TECH,
  capacite: TECH_CAPACITIES,
  marque: TECH_BRANDS,
  garantie: WARRANTIES,
  connectivite: CONNECTIVITY,
  formatMaison: HOME_FORMATS,
  materiauMaison: HOME_MATERIALS,
  piece: ROOMS,
  styleDeco: DECOR_STYLES,
  formatAlimentaire: FOOD_FORMATS,
  labelsAlimentaires: FOOD_LABELS,
  allergenes: ALLERGENS,
  conservation: STORAGE,
  tourDeDoigt: RING_SIZES,
  matiereBijou: JEWEL_MATERIALS,
  pierre: STONES,
  finition: FINISHES,
  ageConseille: KID_AGES,
  matiereEnfant: KID_MATERIALS,
  normesJouet: TOY_STANDARDS,
  piles: BATTERIES,
  competences: SKILLS,
  ouiNon: YES_NO,
  alimentation: POWER_SUPPLY,
  tailleEquipement: SPORT_GEAR_SIZES,
  terrainSport: SPORT_TERRAINS,
  amorti: CUSHIONING,
  machineFitness: FITNESS_MACHINES,
  poidsUtilisateur: USER_WEIGHTS,
  goutNutrition: NUTRITION_FLAVOURS,
  etatProduit: PRODUCT_CONDITIONS,
  ram: RAM_SIZES,
  systeme: OPERATING_SYSTEMS,
  typeAudio: AUDIO_TYPES,
  tailleEcran: SCREEN_SIZES,
  resolution: RESOLUTIONS,
  dalle: PANELS,
  classeEnergie: ENERGY_CLASSES,
  montage: ASSEMBLY,
  tailleLinge: LINEN_SIZES,
  fabrication: CRAFT,
  compatibleCuisine: KITCHEN_COMPAT,
  culot: LAMP_BASES,
  extraction: OIL_EXTRACTION,
  formeEpice: SPICE_FORMS,
  piquant: HEAT_LEVELS,
  longueurCollier: NECKLACE_LENGTHS,
  tourPoignet: WRIST_SIZES,
  fermoir: CLASPS,
  attacheBoucle: EARRING_BACKS,
  mouvement: MOVEMENTS,
  braceletMontre: WATCH_STRAPS,
  etancheite: WATER_RESISTANCE,
  verre: WATCH_GLASS,
  fermetureSac: BAG_CLOSURES,
  tailleAccessoire: ACCESSORY_SIZES,
  pointureEnfant: KID_SHOE_SIZES,
  fermetureChaussure: SHOE_CLOSURES,
  langue: LANGUAGES,
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
  discipline: 'Disciplines',
  niveau: 'Niveaux',
  matiereSport: 'Matières (sport)',
  technoSport: 'Technologies (sport)',
  capacite: 'Capacités',
  marque: 'Marques',
  garantie: 'Garanties',
  connectivite: 'Connectivité',
  formatMaison: 'Formats (maison)',
  materiauMaison: 'Matériaux',
  piece: 'Pièces',
  styleDeco: 'Styles',
  formatAlimentaire: 'Formats (épicerie)',
  labelsAlimentaires: 'Labels',
  allergenes: 'Allergènes',
  conservation: 'Conservation',
  tourDeDoigt: 'Tours de doigt',
  matiereBijou: 'Matières (bijoux)',
  pierre: 'Pierres',
  finition: 'Finitions',
  ageConseille: 'Âges conseillés',
  matiereEnfant: 'Matières (enfants)',
  normesJouet: 'Normes',
  piles: 'Piles',
  competences: 'Compétences',
  ouiNon: 'Oui / non',
  alimentation: 'Alimentations',
  tailleEquipement: 'Tailles (équipement)',
  terrainSport: 'Terrains',
  amorti: 'Amortis',
  machineFitness: 'Machines fitness',
  poidsUtilisateur: 'Poids utilisateur max',
  goutNutrition: 'Goûts',
  etatProduit: 'États',
  ram: 'Mémoire vive',
  systeme: 'Systèmes',
  typeAudio: 'Types audio',
  tailleEcran: 'Tailles d’écran',
  resolution: 'Résolutions',
  dalle: 'Technologies d’écran',
  classeEnergie: 'Classes énergétiques',
  montage: 'Montage',
  tailleLinge: 'Dimensions (linge)',
  fabrication: 'Fabrication',
  compatibleCuisine: 'Compatibilités',
  culot: 'Culots',
  extraction: 'Extraction',
  formeEpice: 'Formes',
  piquant: 'Piquant',
  longueurCollier: 'Longueurs de collier',
  tourPoignet: 'Tours de poignet',
  fermoir: 'Fermoirs',
  attacheBoucle: 'Attaches',
  mouvement: 'Mouvements',
  braceletMontre: 'Bracelets de montre',
  etancheite: 'Étanchéité',
  verre: 'Verres',
  fermetureSac: 'Fermetures (sacs)',
  tailleAccessoire: 'Tailles (accessoires)',
  pointureEnfant: 'Pointures enfant',
  fermetureChaussure: 'Fermetures (chaussures)',
  langue: 'Langues',
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
