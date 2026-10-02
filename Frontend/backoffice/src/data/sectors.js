// Sectors a Sellio shop can sell in. Same codes as the server (ShopCatalog.BUSINESS_TYPES).
//
// - `form`: 'clothes' and 'cosmetics' keep their dedicated product sheet; 'generic' builds the
//   sheet from attributes (stored as a JSON object on the product).
// - `types`: the kinds of products a generic sector sells (a bague is not a montre). Each type has its own
//   `sizes` (what the customer chooses before adding to the cart; null = nothing to choose) and its own
//   `attributes`, added to the sector's common `attributes`. The chosen type is stored as `attributes.type`.
// - `color`: the product sheet offers the colour picker (stored in couleur / couleurHex).
// - `templates`: storefront templates suggested first for this sector.

import { SIZE_GROUPS } from './catalogOptions'

const sizeGroup = (label) => SIZE_GROUPS.find((g) => g.label === label)

// Reusable fields
const F = {
  genre: { key: 'genre', label: 'Pour', type: 'select', optionKey: 'genre' },
  garantie: { key: 'garantie', label: 'Garantie', type: 'select', optionKey: 'garantie' },
  dimensions: (placeholder = 'Ex : 30 × 20 × 45 cm') => ({ key: 'dimensions', label: 'Dimensions', type: 'text', placeholder }),
  poids: (placeholder = 'Ex : 1,2 kg') => ({ key: 'poids', label: 'Poids', type: 'text', placeholder }),
  specs: (placeholder) => ({ key: 'specs', label: 'Fiche technique', type: 'specs', placeholder }),
  entretien: (placeholder) => ({ key: 'entretien', label: 'Entretien', type: 'textarea', placeholder }),
}

export const SECTORS = [
  {
    id: 'CLOTHES',
    title: 'Mode & vêtements',
    short: 'Vêtements',
    icon: 'checkroom',
    text: 'Pulls, robes, vestes. Essayage virtuel en direct sur la fiche produit.',
    form: 'clothes',
    sizes: { optionKey: 'tailles', label: 'Taille', groups: SIZE_GROUPS },
    color: true,
    tryOn: true,
    example: 'Ex : Pull uni cachemire',
    templates: ['minimal', 'editorial', 'bold'],
  },
  {
    id: 'COSMETICS',
    title: 'Beauté & cosmétiques',
    short: 'Cosmétiques',
    icon: 'spa',
    text: 'Soins, huiles, parfums. Fiches composition INCI, origine et conseils.',
    form: 'cosmetics',
    sizes: { optionKey: 'volume', label: 'Contenance' },
    color: false,
    example: 'Ex : Huile essentielle de lavande',
    templates: ['luxury', 'minimal', 'artisan'],
  },
  {
    id: 'SPORTS',
    title: 'Sport & fitness',
    short: 'Sport',
    icon: 'fitness_center',
    text: 'Tenues, chaussures, équipement et machines. Tailles, pointures et fiches techniques.',
    form: 'generic',
    color: true,
    tryOn: true,
    example: 'Ex : Brassière de running respirante',
    templates: ['sport', 'bold', 'tech'],
    attributes: [
      { key: 'discipline', label: 'Discipline', type: 'select', optionKey: 'discipline' },
    ],
    types: [
      {
        id: 'vetement', label: 'Vêtement de sport', icon: 'apparel', example: 'Ex : Legging de running',
        sizes: { optionKey: 'tailles', label: 'Taille', groups: [sizeGroup('Lettres'), sizeGroup('Numériques (FR)'), sizeGroup('Autre')].filter(Boolean) },
        attributes: [
          F.genre,
          { key: 'niveau', label: 'Niveau', type: 'select', optionKey: 'niveau' },
          { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereSport' },
          { key: 'technologies', label: 'Technologies', type: 'multi', optionKey: 'technoSport' },
          F.entretien('Ex : Lavage 30 °C, pas de sèche-linge'),
        ],
      },
      {
        id: 'chaussures', label: 'Chaussures', icon: 'steps', example: 'Ex : Chaussure de trail Vortex',
        sizes: { optionKey: 'tailles', label: 'Pointure', groups: [sizeGroup('Chaussures')].filter(Boolean) },
        attributes: [
          F.genre,
          { key: 'terrain', label: 'Terrain', type: 'select', optionKey: 'terrainSport' },
          { key: 'amorti', label: 'Amorti', type: 'select', optionKey: 'amorti' },
          { key: 'drop', label: 'Drop', type: 'text', placeholder: 'Ex : 8 mm' },
          F.poids('Ex : 260 g (pointure 42)'),
          { key: 'technologies', label: 'Technologies', type: 'multi', optionKey: 'technoSport' },
        ],
      },
      {
        id: 'equipement', label: 'Équipement & accessoires', icon: 'sports_tennis', example: 'Ex : Haltères réglables 20 kg',
        sizes: { optionKey: 'tailleEquipement', label: 'Taille / poids' },
        attributes: [
          { key: 'niveau', label: 'Niveau', type: 'select', optionKey: 'niveau' },
          { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereSport' },
          F.poids(),
          F.dimensions('Ex : 183 × 61 cm, épaisseur 6 mm'),
        ],
      },
      {
        id: 'machine', label: 'Machine & appareil fitness', icon: 'directions_bike', example: 'Ex : Tapis de course pliable T900',
        sizes: null,
        attributes: [
          { key: 'machine', label: 'Type de machine', type: 'select', optionKey: 'machineFitness' },
          { key: 'poidsMax', label: 'Poids utilisateur max', type: 'select', optionKey: 'poidsUtilisateur' },
          { key: 'resistance', label: 'Résistance / vitesse', type: 'text', placeholder: 'Ex : 16 niveaux magnétiques, 1–18 km/h' },
          { key: 'alimentation', label: 'Alimentation', type: 'select', optionKey: 'alimentation' },
          { key: 'pliable', label: 'Pliable', type: 'select', optionKey: 'ouiNon' },
          F.dimensions('Ex : déplié 180 × 80 × 135 cm, plié 95 × 80 × 145 cm'),
          F.poids('Ex : 65 kg'),
          F.garantie,
          F.specs('Une caractéristique par ligne :\nMoteur : 3 CV\nSurface de course : 140 × 50 cm\nProgrammes : 12'),
        ],
      },
      {
        id: 'nutrition', label: 'Nutrition sportive', icon: 'nutrition', example: 'Ex : Whey protéine chocolat 1 kg',
        sizes: { optionKey: 'formatAlimentaire', label: 'Format' },
        attributes: [
          { key: 'gout', label: 'Goût', type: 'select', optionKey: 'goutNutrition' },
          { key: 'labels', label: 'Labels & régimes', type: 'multi', optionKey: 'labelsAlimentaires' },
          { key: 'allergenes', label: 'Allergènes', type: 'multi', optionKey: 'allergenes' },
          { key: 'ingredients', label: 'Ingrédients', type: 'textarea', placeholder: 'Liste des ingrédients' },
          { key: 'nutrition', label: 'Valeurs nutritionnelles', type: 'specs', placeholder: 'Pour 30 g :\nProtéines : 24 g\nGlucides : 2 g' },
        ],
      },
    ],
  },
  {
    id: 'ELECTRONICS',
    title: 'High-tech & électronique',
    short: 'High-tech',
    icon: 'devices',
    text: 'Téléphones, ordinateurs, audio, TV. Marque, garantie et fiche technique.',
    form: 'generic',
    color: true,
    example: 'Ex : Écouteurs sans fil à réduction de bruit',
    templates: ['tech', 'minimal', 'bold'],
    attributes: [
      { key: 'marque', label: 'Marque', type: 'select', optionKey: 'marque' },
      { key: 'modele', label: 'Modèle / référence fabricant', type: 'text', placeholder: 'Ex : WH-1000XM5' },
      { key: 'etat', label: 'État', type: 'select', optionKey: 'etatProduit' },
      F.garantie,
    ],
    types: [
      {
        id: 'smartphone', label: 'Smartphone & tablette', icon: 'smartphone', example: 'Ex : Galaxy A55 5G',
        sizes: { optionKey: 'capacite', label: 'Stockage' },
        attributes: [
          { key: 'ecran', label: 'Écran', type: 'text', placeholder: 'Ex : 6,6 pouces AMOLED 120 Hz' },
          { key: 'ram', label: 'Mémoire vive (RAM)', type: 'select', optionKey: 'ram' },
          { key: 'os', label: 'Système', type: 'select', optionKey: 'systeme' },
          { key: 'batterie', label: 'Batterie', type: 'text', placeholder: 'Ex : 5000 mAh, charge 25 W' },
          { key: 'photo', label: 'Appareil photo', type: 'text', placeholder: 'Ex : 50 Mpx + 12 Mpx' },
          { key: 'connectivite', label: 'Connectivité', type: 'multi', optionKey: 'connectivite' },
          F.specs('Une caractéristique par ligne :\nProcesseur : Exynos 1480\nDAS : 0,9 W/kg'),
        ],
      },
      {
        id: 'ordinateur', label: 'Ordinateur', icon: 'laptop', example: 'Ex : ThinkPad E14 Gen 5',
        sizes: { optionKey: 'capacite', label: 'Configuration' },
        attributes: [
          { key: 'processeur', label: 'Processeur', type: 'text', placeholder: 'Ex : Intel Core i5-1335U' },
          { key: 'ram', label: 'Mémoire vive (RAM)', type: 'select', optionKey: 'ram' },
          { key: 'ecran', label: 'Écran', type: 'text', placeholder: 'Ex : 14 pouces Full HD IPS' },
          { key: 'graphique', label: 'Carte graphique', type: 'text', placeholder: 'Ex : Intel Iris Xe' },
          { key: 'os', label: 'Système', type: 'select', optionKey: 'systeme' },
          { key: 'connectivite', label: 'Connectivité', type: 'multi', optionKey: 'connectivite' },
          F.specs('Une caractéristique par ligne :\nAutonomie : 10 h\nPoids : 1,4 kg'),
        ],
      },
      {
        id: 'audio', label: 'Audio & casques', icon: 'headphones', example: 'Ex : Enceinte Bluetooth étanche',
        sizes: null,
        attributes: [
          { key: 'audio', label: 'Type', type: 'select', optionKey: 'typeAudio' },
          { key: 'autonomie', label: 'Autonomie', type: 'text', placeholder: 'Ex : 30 h' },
          { key: 'reductionBruit', label: 'Réduction de bruit', type: 'select', optionKey: 'ouiNon' },
          { key: 'connectivite', label: 'Connectivité', type: 'multi', optionKey: 'connectivite' },
          { key: 'compatibilite', label: 'Compatibilité', type: 'text', placeholder: 'Ex : iOS, Android, Windows' },
          F.specs('Une caractéristique par ligne :\nPuissance : 20 W\nÉtanchéité : IP67'),
        ],
      },
      {
        id: 'tv', label: 'TV & image', icon: 'tv', example: 'Ex : TV 55 pouces 4K QLED',
        sizes: { optionKey: 'tailleEcran', label: 'Taille d’écran' },
        attributes: [
          { key: 'resolution', label: 'Résolution', type: 'select', optionKey: 'resolution' },
          { key: 'dalle', label: 'Technologie d’écran', type: 'select', optionKey: 'dalle' },
          { key: 'smartTv', label: 'Smart TV', type: 'select', optionKey: 'ouiNon' },
          { key: 'connectivite', label: 'Connectivité', type: 'multi', optionKey: 'connectivite' },
          F.specs('Une caractéristique par ligne :\nHDMI : 4 ports\nFréquence : 120 Hz'),
        ],
      },
      {
        id: 'electromenager', label: 'Électroménager', icon: 'kitchen', example: 'Ex : Robot pâtissier 1200 W',
        sizes: null,
        attributes: [
          { key: 'puissance', label: 'Puissance', type: 'text', placeholder: 'Ex : 1200 W' },
          { key: 'energie', label: 'Classe énergétique', type: 'select', optionKey: 'classeEnergie' },
          { key: 'contenance', label: 'Capacité', type: 'text', placeholder: 'Ex : 5 L, 8 kg de linge' },
          F.dimensions(),
          F.specs('Une caractéristique par ligne :\nNiveau sonore : 52 dB\nProgrammes : 14'),
        ],
      },
      {
        id: 'accessoire', label: 'Accessoire', icon: 'cable', example: 'Ex : Chargeur USB-C 65 W',
        sizes: null,
        attributes: [
          { key: 'compatibilite', label: 'Compatibilité', type: 'text', placeholder: 'Ex : iPhone 15, Galaxy S24' },
          { key: 'connectivite', label: 'Connectique', type: 'multi', optionKey: 'connectivite' },
          { key: 'longueur', label: 'Longueur / taille', type: 'text', placeholder: 'Ex : câble 1 m' },
          F.specs('Une caractéristique par ligne :\nPuissance : 65 W'),
        ],
      },
    ],
  },
  {
    id: 'HOME',
    title: 'Maison & décoration',
    short: 'Maison',
    icon: 'chair',
    text: 'Mobilier, linge, déco, cuisine et luminaires. Matériaux, dimensions et style.',
    form: 'generic',
    color: true,
    example: 'Ex : Vase en céramique émaillée',
    templates: ['artisan', 'minimal', 'editorial'],
    attributes: [
      { key: 'materiau', label: 'Matériau', type: 'select', optionKey: 'materiauMaison' },
      { key: 'style', label: 'Style', type: 'select', optionKey: 'styleDeco' },
      { key: 'piece', label: 'Pièce', type: 'multi', optionKey: 'piece' },
    ],
    types: [
      {
        id: 'mobilier', label: 'Mobilier', icon: 'chair', example: 'Ex : Table basse en chêne massif',
        sizes: null,
        attributes: [
          F.dimensions('Ex : L 120 × l 60 × H 45 cm'),
          { key: 'montage', label: 'Montage', type: 'select', optionKey: 'montage' },
          { key: 'chargeMax', label: 'Charge maximale', type: 'text', placeholder: 'Ex : 30 kg' },
          F.entretien('Ex : Chiffon sec, éviter les produits abrasifs'),
        ],
      },
      {
        id: 'linge', label: 'Linge de maison', icon: 'bed', example: 'Ex : Parure de lit en lin lavé',
        sizes: { optionKey: 'tailleLinge', label: 'Dimensions' },
        attributes: [
          { key: 'grammage', label: 'Grammage / densité', type: 'text', placeholder: 'Ex : 160 g/m²' },
          { key: 'composition', label: 'Composition', type: 'text', placeholder: 'Ex : 100 % lin lavé' },
          F.entretien('Ex : Lavage 40 °C, séchage à basse température'),
        ],
      },
      {
        id: 'deco', label: 'Décoration', icon: 'filter_vintage', example: 'Ex : Vase en céramique émaillée',
        sizes: { optionKey: 'formatMaison', label: 'Format' },
        attributes: [
          F.dimensions('Ex : Ø 18 cm, H 32 cm'),
          { key: 'fabrication', label: 'Fabrication', type: 'select', optionKey: 'fabrication' },
          F.entretien('Ex : Nettoyer avec un chiffon humide'),
        ],
      },
      {
        id: 'cuisine', label: 'Cuisine & art de la table', icon: 'restaurant', example: 'Ex : Service de 6 assiettes en grès',
        sizes: { optionKey: 'formatMaison', label: 'Format' },
        attributes: [
          { key: 'contenance', label: 'Contenance / pièces', type: 'text', placeholder: 'Ex : 6 assiettes Ø 27 cm' },
          { key: 'compatible', label: 'Compatible', type: 'multi', optionKey: 'compatibleCuisine' },
          F.dimensions('Ex : Ø 27 cm'),
          F.entretien('Ex : Lavage à la main conseillé'),
        ],
      },
      {
        id: 'luminaire', label: 'Luminaire', icon: 'light', example: 'Ex : Suspension en rotin',
        sizes: null,
        attributes: [
          { key: 'culot', label: 'Culot / ampoule', type: 'select', optionKey: 'culot' },
          { key: 'puissance', label: 'Puissance max', type: 'text', placeholder: 'Ex : 60 W (LED 9 W conseillée)' },
          { key: 'alimentation', label: 'Alimentation', type: 'select', optionKey: 'alimentation' },
          F.dimensions('Ex : Ø 45 cm, câble 1,2 m'),
        ],
      },
    ],
  },
  {
    id: 'FOOD',
    title: 'Épicerie fine & gourmet',
    short: 'Épicerie',
    icon: 'restaurant',
    text: 'Huiles, miels, dattes, épices. Ingrédients, allergènes et conservation.',
    form: 'generic',
    color: false,
    example: 'Ex : Huile d’olive extra vierge de Zarzis',
    templates: ['artisan', 'luxury', 'minimal'],
    attributes: [
      { key: 'origine', label: 'Origine', type: 'select', optionKey: 'origine' },
      { key: 'labels', label: 'Labels & régimes', type: 'multi', optionKey: 'labelsAlimentaires' },
      { key: 'allergenes', label: 'Allergènes', type: 'multi', optionKey: 'allergenes' },
      { key: 'conservation', label: 'Conservation', type: 'select', optionKey: 'conservation' },
      { key: 'dlc', label: 'Durée de conservation', type: 'text', placeholder: 'Ex : 18 mois, 3 semaines après ouverture' },
      { key: 'ingredients', label: 'Ingrédients', type: 'textarea', placeholder: 'Liste des ingrédients' },
      { key: 'nutrition', label: 'Valeurs nutritionnelles', type: 'specs', placeholder: 'Pour 100 g :\nÉnergie : 884 kcal\nMatières grasses : 100 g' },
    ],
    types: [
      {
        id: 'huiles', label: 'Huiles & condiments', icon: 'water_drop', example: 'Ex : Huile d’olive extra vierge de Zarzis',
        sizes: { optionKey: 'formatAlimentaire', label: 'Format' },
        attributes: [
          { key: 'variete', label: 'Variété', type: 'text', placeholder: 'Ex : Chemlali' },
          { key: 'acidite', label: 'Acidité', type: 'text', placeholder: 'Ex : < 0,3 %' },
          { key: 'extraction', label: 'Extraction', type: 'select', optionKey: 'extraction' },
        ],
      },
      {
        id: 'douceurs', label: 'Miels, dattes & douceurs', icon: 'cake', example: 'Ex : Miel de thym 500 g',
        sizes: { optionKey: 'formatAlimentaire', label: 'Format' },
        attributes: [
          { key: 'variete', label: 'Variété', type: 'text', placeholder: 'Ex : Deglet Nour, miel de thym' },
        ],
      },
      {
        id: 'epices', label: 'Épices & herbes', icon: 'grass', example: 'Ex : Harissa artisanale du Cap Bon',
        sizes: { optionKey: 'formatAlimentaire', label: 'Format' },
        attributes: [
          { key: 'forme', label: 'Forme', type: 'select', optionKey: 'formeEpice' },
          { key: 'piquant', label: 'Piquant', type: 'select', optionKey: 'piquant' },
        ],
      },
      {
        id: 'boissons', label: 'Thés, cafés & boissons', icon: 'local_cafe', example: 'Ex : Thé vert à la menthe',
        sizes: { optionKey: 'formatAlimentaire', label: 'Format' },
        attributes: [
          { key: 'preparation', label: 'Préparation', type: 'textarea', placeholder: 'Ex : 2 g pour 20 cl, infuser 3 min à 80 °C' },
        ],
      },
      {
        id: 'coffret', label: 'Coffrets & paniers', icon: 'redeem', example: 'Ex : Coffret découverte du terroir',
        sizes: null,
        attributes: [
          { key: 'contenu', label: 'Contenu du coffret', type: 'textarea', placeholder: 'Un produit par ligne' },
        ],
      },
    ],
  },
  {
    id: 'JEWELRY',
    title: 'Bijoux & accessoires',
    short: 'Bijoux',
    icon: 'diamond',
    text: 'Bagues, colliers, bracelets, montres, sacs. Matière, pierre et taille.',
    form: 'generic',
    color: true,
    example: 'Ex : Bague jonc en argent 925',
    templates: ['luxury', 'editorial', 'minimal'],
    attributes: [
      F.genre,
      { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereBijou' },
    ],
    types: [
      {
        id: 'bague', label: 'Bague', icon: 'diamond', example: 'Ex : Bague jonc en argent 925',
        sizes: { optionKey: 'tourDeDoigt', label: 'Tour de doigt' },
        attributes: [
          { key: 'pierre', label: 'Pierre', type: 'select', optionKey: 'pierre' },
          { key: 'finition', label: 'Finition', type: 'select', optionKey: 'finition' },
          { key: 'largeur', label: 'Largeur de l’anneau', type: 'text', placeholder: 'Ex : 3 mm' },
          F.poids('Ex : 4,2 g'),
          F.entretien('Ex : Éviter le contact avec le parfum et l’eau de mer'),
        ],
      },
      {
        id: 'collier', label: 'Collier & pendentif', icon: 'blur_circular', example: 'Ex : Collier perle de culture',
        sizes: { optionKey: 'longueurCollier', label: 'Longueur' },
        attributes: [
          { key: 'pierre', label: 'Pierre', type: 'select', optionKey: 'pierre' },
          { key: 'finition', label: 'Finition', type: 'select', optionKey: 'finition' },
          { key: 'fermoir', label: 'Fermoir', type: 'select', optionKey: 'fermoir' },
          { key: 'pendentif', label: 'Pendentif', type: 'text', placeholder: 'Ex : 12 × 8 mm' },
          F.entretien('Ex : Ranger à plat dans sa pochette'),
        ],
      },
      {
        id: 'bracelet', label: 'Bracelet', icon: 'radio_button_unchecked', example: 'Ex : Jonc martelé plaqué or',
        sizes: { optionKey: 'tourPoignet', label: 'Tour de poignet' },
        attributes: [
          { key: 'pierre', label: 'Pierre', type: 'select', optionKey: 'pierre' },
          { key: 'finition', label: 'Finition', type: 'select', optionKey: 'finition' },
          { key: 'fermoir', label: 'Fermoir', type: 'select', optionKey: 'fermoir' },
          F.entretien('Ex : Retirer avant la douche'),
        ],
      },
      {
        id: 'boucles', label: 'Boucles d’oreilles', icon: 'earbuds', example: 'Ex : Créoles fines en or 18 carats',
        sizes: null,
        attributes: [
          { key: 'pierre', label: 'Pierre', type: 'select', optionKey: 'pierre' },
          { key: 'finition', label: 'Finition', type: 'select', optionKey: 'finition' },
          { key: 'attache', label: 'Attache', type: 'select', optionKey: 'attacheBoucle' },
          F.dimensions('Ex : Ø 15 mm'),
          F.entretien('Ex : Nettoyer avec un chiffon doux'),
        ],
      },
      {
        id: 'montre', label: 'Montre', icon: 'watch', example: 'Ex : Montre automatique cadran bleu',
        sizes: null,
        attributes: [
          { key: 'mouvement', label: 'Mouvement', type: 'select', optionKey: 'mouvement' },
          { key: 'boitier', label: 'Diamètre du boîtier', type: 'text', placeholder: 'Ex : 40 mm' },
          { key: 'bracelet', label: 'Bracelet', type: 'select', optionKey: 'braceletMontre' },
          { key: 'etancheite', label: 'Étanchéité', type: 'select', optionKey: 'etancheite' },
          { key: 'verre', label: 'Verre', type: 'select', optionKey: 'verre' },
          F.garantie,
        ],
      },
      {
        id: 'sac', label: 'Sac & maroquinerie', icon: 'shopping_bag', example: 'Ex : Sac cabas en cuir grainé',
        sizes: null,
        attributes: [
          F.dimensions('Ex : 35 × 28 × 12 cm'),
          { key: 'fermeture', label: 'Fermeture', type: 'select', optionKey: 'fermetureSac' },
          { key: 'interieur', label: 'Intérieur', type: 'text', placeholder: 'Ex : 1 poche zippée, 2 poches plates' },
          F.entretien('Ex : Nourrir le cuir deux fois par an'),
        ],
      },
      {
        id: 'accessoire', label: 'Accessoire (lunettes, ceinture…)', icon: 'eyeglasses', example: 'Ex : Ceinture en cuir tressé',
        sizes: { optionKey: 'tailleAccessoire', label: 'Taille' },
        attributes: [
          F.dimensions('Ex : largeur 3,5 cm'),
          F.entretien(),
        ],
      },
    ],
  },
  {
    id: 'KIDS',
    title: 'Enfants & jouets',
    short: 'Enfants',
    icon: 'toys',
    text: 'Vêtements, chaussures, jouets et puériculture. Âge conseillé et normes de sécurité.',
    form: 'generic',
    color: true,
    tryOn: false,
    example: 'Ex : Jeu de construction en bois',
    templates: ['pop', 'minimal', 'artisan'],
    attributes: [
      { key: 'age', label: 'Âge conseillé', type: 'select', optionKey: 'ageConseille' },
    ],
    types: [
      {
        id: 'vetement', label: 'Vêtement enfant', icon: 'child_care', example: 'Ex : Pyjama en coton bio',
        sizes: { optionKey: 'tailles', label: 'Taille', groups: [sizeGroup('Enfants'), sizeGroup('Autre')].filter(Boolean) },
        attributes: [
          F.genre,
          { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereEnfant' },
          { key: 'normes', label: 'Normes & labels', type: 'multi', optionKey: 'normesJouet' },
          F.entretien('Ex : Lavage 40 °C'),
        ],
      },
      {
        id: 'chaussures', label: 'Chaussures enfant', icon: 'steps', example: 'Ex : Baskets à scratch',
        sizes: { optionKey: 'pointureEnfant', label: 'Pointure' },
        attributes: [
          F.genre,
          { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereEnfant' },
          { key: 'fermeture', label: 'Fermeture', type: 'select', optionKey: 'fermetureChaussure' },
        ],
      },
      {
        id: 'jouet', label: 'Jouet & jeu', icon: 'toys', example: 'Ex : Jeu de construction en bois',
        sizes: null,
        attributes: [
          { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereEnfant' },
          { key: 'normes', label: 'Normes & sécurité', type: 'multi', optionKey: 'normesJouet' },
          { key: 'piles', label: 'Piles', type: 'select', optionKey: 'piles' },
          { key: 'joueurs', label: 'Nombre de joueurs', type: 'text', placeholder: 'Ex : 2 à 4 joueurs' },
          { key: 'competences', label: 'Ce qu’il développe', type: 'multi', optionKey: 'competences' },
          { key: 'avertissement', label: 'Avertissements', type: 'textarea', placeholder: 'Ex : Ne convient pas aux enfants de moins de 3 ans' },
        ],
      },
      {
        id: 'puericulture', label: 'Puériculture', icon: 'stroller', example: 'Ex : Poussette compacte',
        sizes: null,
        attributes: [
          { key: 'matiere', label: 'Matière', type: 'select', optionKey: 'matiereEnfant' },
          { key: 'poidsEnfant', label: 'Poids de l’enfant', type: 'text', placeholder: 'Ex : de 0 à 22 kg' },
          { key: 'pliable', label: 'Pliable', type: 'select', optionKey: 'ouiNon' },
          { key: 'normes', label: 'Normes & sécurité', type: 'multi', optionKey: 'normesJouet' },
          F.dimensions('Ex : plié 54 × 44 × 20 cm'),
          F.poids('Ex : 6,8 kg'),
        ],
      },
      {
        id: 'livre', label: 'Livres & loisirs créatifs', icon: 'menu_book', example: 'Ex : Coffret peinture à l’eau',
        sizes: null,
        attributes: [
          { key: 'langue', label: 'Langue', type: 'select', optionKey: 'langue' },
          { key: 'pages', label: 'Pages / contenu', type: 'text', placeholder: 'Ex : 32 pages, 12 pinceaux' },
          { key: 'competences', label: 'Ce qu’il développe', type: 'multi', optionKey: 'competences' },
        ],
      },
    ],
  },
]

/** The shop's sector; `null` while it is unknown (never guess: a wrong guess shows another sector's sheet). */
export function sectorOf(id) {
  return SECTORS.find((s) => s.id === id) || null
}

export function sectorLabel(id) {
  return SECTORS.find((s) => s.id === id)?.short || id || '—'
}

/** Product type of a generic sector (first type when none is stored yet). */
export function typeOf(sector, typeId) {
  if (!sector?.types?.length) return null
  return sector.types.find((t) => t.id === typeId) || sector.types[0]
}

/** What the customer chooses for this product: the type's sizes, else the sector's. */
export function sizesOf(sector, typeId) {
  const type = typeOf(sector, typeId)
  return type ? type.sizes : sector?.sizes || null
}

/** Common fields of the sector followed by the fields of the product type (no duplicates). */
export function fieldsOf(sector, typeId) {
  const type = typeOf(sector, typeId)
  const seen = new Set()
  return [...(sector?.attributes || []), ...(type?.attributes || [])].filter((f) => !seen.has(f.key) && seen.add(f.key))
}

/** Values of the generic sheet ↔ the JSON string stored on the product. */
export function parseAttributes(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

/** Keeps the product type and the fields of that type only, so switching type leaves nothing stale behind. */
export function attributesPayload(values, sector) {
  const allowed = sector ? new Set(['type', ...fieldsOf(sector, values?.type).map((f) => f.key)]) : null
  const clean = Object.fromEntries(
    Object.entries(values || {})
      .filter(([k]) => !allowed || allowed.has(k))
      .map(([k, v]) => [k, String(v ?? '').trim()])
      .filter(([, v]) => v),
  )
  return Object.keys(clean).length ? JSON.stringify(clean) : null
}

/** Option lists a sector's product sheet uses (for "Listes du catalogue"). */
export function optionKeysFor(sectorId) {
  const sector = sectorOf(sectorId)
  if (!sector) return []
  if (sector.form === 'clothes') return ['tailles', 'couleur', 'tissu', 'coupe', 'col', 'manches', 'genre', 'saison', 'entretien']
  if (sector.form === 'cosmetics') return ['volume', 'origine', 'certifications']
  const fields = [...(sector.attributes || []), ...(sector.types || []).flatMap((t) => t.attributes || [])]
  const sizes = (sector.types || []).map((t) => t.sizes?.optionKey)
  const keys = [...sizes, sector.color ? 'couleur' : null, ...fields.map((a) => a.optionKey)]
  return [...new Set(keys.filter(Boolean))]
}
