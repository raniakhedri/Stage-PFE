// Default storefront copy per sector. Every template reads from here, so no template carries
// text that only makes sense for one kind of shop. Heroes come in three tones; each template
// picks the tone that fits its look (TONE_OF_LAYOUT).

const TONE_OF_LAYOUT = {
  minimal: 'soft',
  tech: 'soft',
  artisan: 'soft',
  bold: 'punchy',
  sport: 'punchy',
  pop: 'punchy',
  luxury: 'premium',
  editorial: 'premium',
}

const SHIPPING = { icon: 'truck', title: 'Livraison rapide', text: 'Expédition sous 24 à 48 h.' }
const PAYMENT = { icon: 'shield', title: 'Paiement sécurisé', text: 'Carte bancaire ou paiement à la livraison.' }

const COPY = {
  COSMETICS: {
    hero: {
      soft: { eyebrow: 'Nouvelle collection', title: 'Des soins essentiels, pensés pour durer.', text: 'Des formules courtes, des textures justes et une routine qui tient en quelques gestes.' },
      punchy: { eyebrow: 'Drop de saison', title: 'Peau nette. Zéro détour.', text: 'Des actifs qui font le travail, sans promesse creuse.' },
      premium: { eyebrow: 'Maison de soin', title: 'L’art du rituel, révélé.', text: 'Des compositions rares, choisies avec exigence, pour un geste qui devient un moment.' },
    },
    cta: 'Découvrir la boutique',
    categoriesTitle: 'Par univers',
    newTitle: 'Nouveautés',
    bestTitle: 'Les incontournables',
    editorial: { eyebrow: 'Notre approche', title: 'Moins d’ingrédients, plus d’efficacité.', text: 'Chaque produit est choisi pour sa composition lisible, sa tolérance et son efficacité réelle. Nous privilégions les formules concentrées et les contenants responsables.', cta: 'Explorer la sélection' },
    statement: ['Formules', 'honnêtes.', 'Résultats', 'visibles.'],
    marquee: ['Formules lisibles', 'Livraison rapide', 'Paiement sécurisé', 'Retours faciles', 'Conseil personnalisé'],
    quote: '« La beauté commence au moment où l’on décide d’être soi-même. »',
    promises: [
      { icon: 'sparkles', title: 'Formules sélectionnées', text: 'Des compositions lisibles et contrôlées.' },
      SHIPPING, PAYMENT,
      { icon: 'refresh', title: 'Retours simplifiés', text: 'Un doute ? Nous vous accompagnons.' },
    ],
    stats: [['100 %', 'formules lisibles'], ['48 h', 'livraison'], ['4,8/5', 'avis clients']],
    footerBlurb: 'Des soins choisis avec exigence, livrés partout en Tunisie.',
    newsletter: { title: 'Restez dans la confidence', text: 'Nouveautés, conseils et offres réservées aux abonnés.' },
    menuFeature: 'Sélection du moment',
  },
  CLOTHES: {
    hero: {
      soft: { eyebrow: 'Nouvelle collection', title: 'Des pièces simples, faites pour être portées.', text: 'Des coupes justes, des matières choisies et une garde-robe qui se combine sans effort.' },
      punchy: { eyebrow: 'Drop de saison', title: 'Porte-le. Assume-le.', text: 'Des silhouettes fortes pour chaque jour de la semaine.' },
      premium: { eyebrow: 'La collection', title: 'L’élégance, sans effort.', text: 'Des matières nobles et des coupes précises, pensées pour traverser les saisons.' },
    },
    cta: 'Voir la collection',
    categoriesTitle: 'Acheter par catégorie',
    newTitle: 'Nouveautés',
    bestTitle: 'Les pièces fortes',
    editorial: { eyebrow: 'Notre approche', title: 'Moins de pièces, mieux choisies.', text: 'Nous sélectionnons des vêtements bien coupés dans des matières durables, pour une garde-robe qui se porte longtemps et se combine facilement.', cta: 'Découvrir la collection' },
    statement: ['Porte', 'ce que', 'tu', 'es.'],
    marquee: ['Nouvelle collection', 'Livraison rapide', 'Essayage virtuel', 'Échanges faciles', 'Paiement sécurisé'],
    quote: '« Le style, c’est une façon de dire qui vous êtes sans avoir à parler. »',
    promises: [
      { icon: 'sparkles', title: 'Matières choisies', text: 'Des pièces confortables et durables.' },
      SHIPPING, PAYMENT,
      { icon: 'refresh', title: 'Échanges faciles', text: 'La taille ne va pas ? On l’échange.' },
    ],
    stats: [['XS–3XL', 'toutes les tailles'], ['48 h', 'livraison'], ['IA', 'essayage virtuel']],
    footerBlurb: 'Des vêtements bien coupés, livrés partout en Tunisie.',
    newsletter: { title: 'Rejoignez le cercle', text: 'Accès anticipé aux collections et ventes privées.' },
    menuFeature: 'La pièce du moment',
  },
  SPORTS: {
    hero: {
      soft: { eyebrow: 'Nouvelle saison', title: 'L’équipement qui suit votre rythme.', text: 'Des tenues techniques et du matériel testés pour l’entraînement comme pour la compétition.' },
      punchy: { eyebrow: 'Prêt à performer', title: 'Plus vite. Plus loin. Plus fort.', text: 'Running, training, outdoor : tout pour repousser vos limites.' },
      premium: { eyebrow: 'Collection performance', title: 'La performance, dans les moindres détails.', text: 'Des matières techniques et des coupes pensées pour l’effort, sans compromis sur le style.' },
    },
    cta: 'Équipez-vous',
    categoriesTitle: 'Par discipline',
    newTitle: 'Nouveautés',
    bestTitle: 'Les favoris des sportifs',
    editorial: { eyebrow: 'Notre engagement', title: 'Testé sur le terrain, pas en vitrine.', text: 'Chaque article est choisi pour sa tenue à l’effort : respirabilité, amorti, résistance. Nous conseillons la bonne taille et le bon niveau pour chaque discipline.', cta: 'Trouver mon équipement' },
    statement: ['Entraîne-toi.', 'Dépasse-toi.', 'Recommence.', 'Gagne.'],
    marquee: ['Running', 'Training', 'Outdoor', 'Livraison 48 h', 'Échanges faciles', 'Conseil taille'],
    quote: '« Le seul mauvais entraînement est celui qu’on n’a pas fait. »',
    promises: [
      { icon: 'sparkles', title: 'Matières techniques', text: 'Respirantes, légères, résistantes.' },
      SHIPPING, PAYMENT,
      { icon: 'refresh', title: 'Échange de taille offert', text: 'Pointure trop juste ? On l’échange.' },
    ],
    stats: [['15+', 'disciplines'], ['48 h', 'livraison'], ['100 %', 'testé à l’effort']],
    footerBlurb: 'L’équipement des sportifs tunisiens, livré partout en Tunisie.',
    newsletter: { title: 'Rejoignez la team', text: 'Conseils d’entraînement, nouveautés et offres membres.' },
    menuFeature: 'Le choix du coach',
  },
  ELECTRONICS: {
    hero: {
      soft: { eyebrow: 'Nouveautés tech', title: 'La technologie qui simplifie le quotidien.', text: 'Smartphones, audio et accessoires sélectionnés, garantis et livrés rapidement.' },
      punchy: { eyebrow: 'Dernière génération', title: 'Plus de puissance. Moins d’attente.', text: 'Les nouveautés high-tech au meilleur prix, en stock en Tunisie.' },
      premium: { eyebrow: 'Sélection premium', title: 'L’excellence technologique, sans compromis.', text: 'Des appareils choisis pour leur qualité de fabrication, leur design et leur durabilité.' },
    },
    cta: 'Voir les nouveautés',
    categoriesTitle: 'Par catégorie',
    newTitle: 'Nouveautés',
    bestTitle: 'Meilleures ventes',
    editorial: { eyebrow: 'Notre engagement', title: 'Des produits authentiques et garantis.', text: 'Tous nos appareils sont neufs, d’origine et couverts par une garantie. Fiche technique détaillée, conseils d’achat et service après-vente local.', cta: 'Comparer les produits' },
    statement: ['Garantie.', 'Authentique.', 'Livré', 'vite.'],
    marquee: ['Produits garantis', 'Livraison 24–48 h', 'Paiement sécurisé', 'SAV local', 'Fiches techniques détaillées'],
    quote: '« La meilleure technologie est celle qu’on oublie parce qu’elle marche. »',
    promises: [
      { icon: 'sparkles', title: 'Produits garantis', text: 'Neufs, d’origine, avec garantie.' },
      SHIPPING, PAYMENT,
      { icon: 'refresh', title: 'SAV local', text: 'Un problème ? Nous le réglons ici.' },
    ],
    stats: [['1–3 ans', 'de garantie'], ['24 h', 'expédition'], ['100 %', 'produits d’origine']],
    footerBlurb: 'High-tech garanti et livré rapidement, partout en Tunisie.',
    newsletter: { title: 'Ne ratez aucune sortie', text: 'Lancements, comparatifs et offres flash.' },
    menuFeature: 'Le produit star',
  },
  HOME: {
    hero: {
      soft: { eyebrow: 'Nouvelle collection', title: 'Un intérieur qui vous ressemble.', text: 'Des objets et du mobilier choisis pour durer, à composer pièce par pièce.' },
      punchy: { eyebrow: 'Coup de neuf', title: 'Changez de décor, pas de maison.', text: 'Du linge aux luminaires, tout pour transformer une pièce en un week-end.' },
      premium: { eyebrow: 'Art de vivre', title: 'La beauté des choses bien faites.', text: 'Des pièces d’artisans et de créateurs, des matières nobles, un intérieur qui raconte une histoire.' },
    },
    cta: 'Découvrir la collection',
    categoriesTitle: 'Par pièce',
    newTitle: 'Nouveautés',
    bestTitle: 'Nos coups de cœur',
    editorial: { eyebrow: 'Notre approche', title: 'Moins d’objets, de plus belles matières.', text: 'Bois massif, céramique, lin lavé : nous sélectionnons des pièces faites pour durer, souvent fabriquées par des artisans tunisiens.', cta: 'Explorer la sélection' },
    statement: ['Votre', 'maison,', 'votre', 'histoire.'],
    marquee: ['Artisanat', 'Matières naturelles', 'Livraison soignée', 'Paiement sécurisé', 'Retours faciles'],
    quote: '« La maison, c’est là où commence l’histoire. »',
    promises: [
      { icon: 'sparkles', title: 'Fait pour durer', text: 'Des matières nobles et solides.' },
      { icon: 'truck', title: 'Livraison soignée', text: 'Emballage renforcé, livraison suivie.' },
      PAYMENT,
      { icon: 'refresh', title: 'Retours faciles', text: 'Ça ne rend pas comme prévu ? On reprend.' },
    ],
    stats: [['100 %', 'matières choisies'], ['48 h', 'livraison'], ['Artisans', 'tunisiens']],
    footerBlurb: 'Décoration et art de vivre, livrés partout en Tunisie.',
    newsletter: { title: 'Inspirations maison', text: 'Idées déco, nouveautés et ventes privées.' },
    menuFeature: 'L’objet du moment',
  },
  FOOD: {
    hero: {
      soft: { eyebrow: 'Épicerie fine', title: 'Le goût des bons produits.', text: 'Huiles, miels, épices et douceurs sélectionnés auprès de producteurs passionnés.' },
      punchy: { eyebrow: 'Du terroir à votre table', title: 'Vrai goût. Vrais producteurs.', text: 'Des produits authentiques, récoltés et préparés comme il faut.' },
      premium: { eyebrow: 'Maison gourmande', title: 'L’exception, à chaque dégustation.', text: 'Des produits rares du terroir tunisien et méditerranéen, pour les tables qui ont du goût.' },
    },
    cta: 'Découvrir l’épicerie',
    categoriesTitle: 'Nos rayons',
    newTitle: 'Nouveautés',
    bestTitle: 'Les incontournables',
    editorial: { eyebrow: 'Nos producteurs', title: 'Nous connaissons chacun de nos producteurs.', text: 'Huile d’olive de Zarzis, dattes de Tozeur, miel du Cap Bon : chaque produit vient d’une exploitation que nous avons visitée, avec des ingrédients clairs et des allergènes indiqués.', cta: 'Rencontrer nos producteurs' },
    statement: ['Du', 'terroir', 'à votre', 'table.'],
    marquee: ['Producteurs locaux', 'Ingrédients clairs', 'Allergènes indiqués', 'Livraison soignée', 'Coffrets cadeaux'],
    quote: '« Bien manger, c’est le début du bonheur. »',
    promises: [
      { icon: 'sparkles', title: 'Producteurs sélectionnés', text: 'Origine claire, qualité contrôlée.' },
      { icon: 'truck', title: 'Livraison soignée', text: 'Emballage adapté aux produits fragiles.' },
      PAYMENT,
      { icon: 'refresh', title: 'Satisfait ou remboursé', text: 'Un produit ne vous plaît pas ? On rembourse.' },
    ],
    stats: [['100 %', 'origine indiquée'], ['48 h', 'livraison'], ['Coffrets', 'cadeaux']],
    footerBlurb: 'Épicerie fine et produits du terroir, livrés partout en Tunisie.',
    newsletter: { title: 'La lettre gourmande', text: 'Recettes, arrivages de saison et offres réservées.' },
    menuFeature: 'L’arrivage du moment',
  },
  JEWELRY: {
    hero: {
      soft: { eyebrow: 'Nouvelle collection', title: 'Des bijoux à porter tous les jours.', text: 'Des pièces délicates en argent et en or, pensées pour se superposer et durer.' },
      punchy: { eyebrow: 'Édition limitée', title: 'Brillez. Sans demander la permission.', text: 'Des pièces fortes pour signer chaque tenue.' },
      premium: { eyebrow: 'Haute joaillerie', title: 'L’éclat qui traverse le temps.', text: 'Métaux précieux, pierres choisies une à une, finitions faites main.' },
    },
    cta: 'Découvrir les bijoux',
    categoriesTitle: 'Par catégorie',
    newTitle: 'Nouveautés',
    bestTitle: 'Les pièces signature',
    editorial: { eyebrow: 'Notre savoir-faire', title: 'Chaque pièce est contrôlée à la main.', text: 'Argent 925, or 18 carats et pierres certifiées : nous indiquons la matière exacte de chaque bijou et proposons un guide des tailles pour choisir sans hésiter.', cta: 'Voir le guide des tailles' },
    statement: ['Brille', 'à ta', 'façon.', '✦'],
    marquee: ['Argent 925', 'Or 18 carats', 'Écrin offert', 'Gravure possible', 'Livraison sécurisée'],
    quote: '« Un bijou ne se porte pas, il se raconte. »',
    promises: [
      { icon: 'sparkles', title: 'Matières certifiées', text: 'Argent 925, or 18 carats, pierres contrôlées.' },
      { icon: 'truck', title: 'Livraison sécurisée', text: 'Écrin offert et colis suivi.' },
      PAYMENT,
      { icon: 'refresh', title: 'Ajustement de taille', text: 'La bague ne va pas ? On l’ajuste.' },
    ],
    stats: [['925', 'argent massif'], ['18 ct', 'or véritable'], ['Écrin', 'offert']],
    footerBlurb: 'Bijoux et accessoires, livrés dans leur écrin partout en Tunisie.',
    newsletter: { title: 'Le cercle privé', text: 'Avant-premières, éditions limitées et ventes privées.' },
    menuFeature: 'La pièce signature',
  },
  KIDS: {
    hero: {
      soft: { eyebrow: 'Nouvelle collection', title: 'Grandir, jouer, découvrir.', text: 'Vêtements doux, jouets d’éveil et accessoires pensés pour les petits et approuvés par les parents.' },
      punchy: { eyebrow: 'C’est l’heure de jouer !', title: 'Des jouets qui font grandir.', text: 'Créativité, motricité, imagination : on joue et on apprend en même temps.' },
      premium: { eyebrow: 'Sélection premium', title: 'Le meilleur pour les plus petits.', text: 'Matières naturelles, normes de sécurité vérifiées et jouets qui durent d’une génération à l’autre.' },
    },
    cta: 'Découvrir la boutique',
    categoriesTitle: 'Par âge et par univers',
    newTitle: 'Nouveautés',
    bestTitle: 'Les préférés des enfants',
    editorial: { eyebrow: 'Notre promesse', title: 'La sécurité d’abord, le plaisir ensuite.', text: 'Tous nos jouets respectent les normes CE et EN 71, avec l’âge conseillé indiqué sur chaque fiche. Les vêtements sont en coton doux, lavables en machine.', cta: 'Voir les jouets' },
    statement: ['Jouer,', 'c’est', 'du', 'sérieux !'],
    marquee: ['Normes CE', 'Âge conseillé', 'Coton doux', 'Livraison 48 h', 'Emballage cadeau'],
    quote: '« Le jeu est la forme la plus élevée de la recherche. »',
    promises: [
      { icon: 'sparkles', title: 'Sécurité vérifiée', text: 'Normes CE et EN 71, âge indiqué.' },
      SHIPPING, PAYMENT,
      { icon: 'refresh', title: 'Échanges faciles', text: 'Trop petit ? On échange la taille.' },
    ],
    stats: [['0–12', 'ans'], ['CE', 'normes vérifiées'], ['48 h', 'livraison']],
    footerBlurb: 'Vêtements, jouets et éveil pour les enfants, livrés partout en Tunisie.',
    newsletter: { title: 'Le club des parents', text: 'Idées cadeaux, nouveautés et offres réservées.' },
    menuFeature: 'Le jouet du moment',
  },
}

/** Copy of a sector; `hero` is keyed by template (hero.minimal, hero.sport…). */
export function copyFor(businessType) {
  const base = COPY[businessType] || COPY.COSMETICS
  const hero = Object.fromEntries(Object.entries(TONE_OF_LAYOUT).map(([layout, tone]) => [layout, base.hero[tone]]))
  return { ...base, kind: String(businessType || 'COSMETICS').toLowerCase(), hero }
}

export function formatPrice(value) {
  const n = Number(value || 0)
  return `${n.toFixed(2)} TND`
}
