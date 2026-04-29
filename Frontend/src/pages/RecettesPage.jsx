import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, X, Leaf, FlaskConical, Star, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

const RECIPES = [
  {
    id: 1,
    title: "Sérum Éclat à la Vitamine C",
    level: "Débutant",
    time: "15 min",
    category: "Visage",
    description: "Un sérum léger et efficace pour illuminer le teint et unifier le grain de peau.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIZ576jI-MJLY0NW_byflr0XUpvlG5Bww6wIIoj3PeQVW6gvPefwXulux4Lw_A5fETft1aVqvKlIUryJzBbskQW0cDQ7s6rI4gEoy-JwYM_81copCL3Oo7e115aBxhvfs0Z28OHXYT9K0YImX5-7bWRgKgua678qPjtfDZneRavUUqroZovpiry3wFVV-pXjTLYGN8NpSvpqAaBko93ElHWP3j6EgMKnKoK96QMAS0CyTTaXH780tv7KOdvLerhhgFe64xmeoVTC1",
    ingredients: [
      "50 ml d'hydrolat de rose (base aqueuse)",
      "5 ml d'huile végétale de rose musquée",
      "1 g de poudre de vitamine C (acide ascorbique)",
      "0.5 g de gomme xanthane (épaississant)",
      "10 gouttes d'huile essentielle de néroli",
      "0.5 ml de tocophérol (vitamine E, conservateur)",
    ],
    steps: [
      "Dans un bécher propre, mélangez l'hydrolat de rose avec la gomme xanthane. Laissez hydrater 5 minutes en remuant doucement.",
      "Incorporez la poudre de vitamine C et remuez jusqu'à dissolution complète.",
      "Ajoutez l'huile de rose musquée et la vitamine E. Émulsionnez à l'aide d'un mini-fouet.",
      "Incorporez les gouttes d'huile essentielle de néroli.",
      "Vérifiez le pH (idéalement 3.5–4). Ajustez si nécessaire avec une solution de citrate de sodium.",
      "Transvasez dans un flacon pompe airless de 50 ml préalablement stérilisé à l'alcool.",
    ],
    tips: "Conservez au réfrigérateur et utilisez dans les 4 semaines. Appliquez le matin avant votre crème solaire.",
    rating: 4.8,
    reviews: 42,
  },
  {
    id: 2,
    title: "Crème Visage Apaisante Lavande",
    level: "Intermédiaire",
    time: "45 min",
    category: "Visage",
    description: "Une émulsion riche et apaisante, idéale pour les peaux sensibles et réactives.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXn_grXq17NJx916PCYaC6-LvrM_x5GlirRgq7e0YfF1hQtIGQQSnF1MtSuLMegvfsaZovoRuLxTynyZBkxVa-Y0Cp3hHKOT4T7Nq566KiF7pL8biCklxdcBVdK_5a3ZF1yILdAdpgd8ucm5lrxVJveoe0E58JMVqRYSQOdQ2v69VNOjpZX5dqYmkrNLepdkuWctJUp7RHcrYdv8-iSYPY5TysDmjmx_lSU0MdZbZwPpTtDiN5FqfKmO1tpm5shyAhV78DkHeAbrtC",
    ingredients: [
      "30 ml d'eau distillée",
      "20 ml d'hydrolat de lavande",
      "15 g de beurre de karité brut",
      "10 ml d'huile d'amande douce",
      "5 ml d'huile de jojoba",
      "3 g d'émulsifiant Olivem 1000",
      "20 gouttes d'huile essentielle de lavande vraie",
      "1% de conservateur Cosgard",
    ],
    steps: [
      "Pesez séparément la phase aqueuse (eau + hydrolat) et la phase huileuse (beurres + huiles + émulsifiant).",
      "Chauffez les deux phases séparément à 70°C au bain-marie.",
      "Versez la phase aqueuse en filet sur la phase huileuse en remuant continuellement avec un mini-mixeur.",
      "Émulsifiez pendant 3 à 5 minutes jusqu'à l'obtention d'une texture homogène et crémeuse.",
      "Laissez refroidir à 40°C avant d'ajouter les actifs sensibles (HE lavande, conservateur).",
      "Homogénéisez doucement, conditionnez en pot en verre stérilisé.",
    ],
    tips: "Testez l'émulsion sur votre intérieur de poignet 24h avant la première utilisation. Se conserve 3 mois à l'abri de la chaleur.",
    rating: 4.9,
    reviews: 67,
  },
  {
    id: 3,
    title: "Shampoing Solide Fortifiant",
    level: "Débutant",
    time: "10 min",
    category: "Cheveux",
    description: "Un shampoing solide zéro déchet enrichi en huile de ricin pour fortifier et faire briller les cheveux.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj6TJFBj-nnL6LgZPjGQtZpkS6zfGqB8U1wPAfuQj-mUNjkUSN2jLlnNKtBWWP7Q_mSt9FQ7dSqLkFIRuieLD3OnAjSbN4r3eYCFaAse_wgQHjg-khA7Ue1VMhNvSSC5snQDfXBN3chANTdRAnCT5sIvJL2ywmsZT8n_YCSlDtvlbzANT1YlHWUlPmw64DoE-VlbwCvlyiu39dUR_7ornwa4NU7_GHAK3nT1hLeKfk_u__6LGqxBBZhn7ZiEnAv_NfZ5psJ9VFxUD1",
    ingredients: [
      "80 g de SCS (Sodium Coco Sulfate)",
      "15 g d'acide citrique en poudre",
      "10 ml d'huile de ricin",
      "5 ml d'huile d'argan",
      "20 gouttes d'huile essentielle de romarin à verbénone",
      "10 gouttes d'huile essentielle de citron (pour le parfum)",
    ],
    steps: [
      "Dans un saladier, versez le SCS et l'acide citrique. Mélangez à sec avec une spatule.",
      "Ajoutez les huiles végétales et mélangez jusqu'à l'obtention d'une pâte homogène.",
      "Incorporez les huiles essentielles et mélangez rapidement (les HE accélèrent la prise).",
      "Tassez le mélange dans des moules en silicone ou formez des barres à la main.",
      "Laissez sécher 24h à température ambiante avant démoulage.",
      "Conservez dans un porte-savon permettant l'égouttage.",
    ],
    tips: "Si la pâte prend trop vite, travaillez en gants. Le shampoing solide mousse moins que le liquide — c'est normal !",
    rating: 4.7,
    reviews: 31,
  },
  {
    id: 4,
    title: "Huile Démaquillante 3-en-1",
    level: "Débutant",
    time: "5 min",
    category: "Visage",
    description: "Une huile démaquillante douce et efficace qui emporte maquillage, impuretés et pollutions sans agresser la peau.",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop",
    ingredients: [
      "50 ml d'huile de tournesol bio",
      "30 ml d'huile de sésame",
      "15 ml d'huile de ricin",
      "5 ml d'huile de calophylle (tamanu)",
      "30 gouttes d'huile essentielle de géranium rosat",
    ],
    steps: [
      "Dans un flacon en verre ambré de 100 ml, versez toutes les huiles végétales.",
      "Ajoutez les gouttes d'huile essentielle.",
      "Fermez le flacon et agitez doucement pendant 30 secondes pour bien mélanger.",
      "Étiquetez avec la date de fabrication.",
    ],
    tips: "Appliquez sur le visage sec, massez en cercles, puis émulsionnez avec un peu d'eau tiède avant de rincer. Utilisez dans les 12 mois.",
    rating: 4.6,
    reviews: 25,
  },
  {
    id: 5,
    title: "Masque Capillaire Nourrissant",
    level: "Intermédiaire",
    time: "20 min",
    category: "Cheveux",
    description: "Un masque ultra-nourrissant à base de beurre de karité et d'huile d'avocat pour restaurer les cheveux abîmés.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop",
    ingredients: [
      "40 g de beurre de karité",
      "20 ml d'huile d'avocat",
      "10 ml d'huile de ricin",
      "10 ml d'huile d'argan",
      "5 ml de glycérine végétale",
      "15 gouttes d'huile essentielle de lavande",
      "10 gouttes d'huile essentielle de romarin",
    ],
    steps: [
      "Faites fondre le beurre de karité au bain-marie à feu doux.",
      "Retirez du feu et ajoutez les huiles végétales. Mélangez.",
      "Laissez refroidir jusqu'à 35°C puis incorporez la glycérine et les huiles essentielles.",
      "Fouettez le mélange pour obtenir une texture crémeuse (optionnel : placez 15 min au réfrigérateur).",
      "Conditionnez dans un pot en verre.",
    ],
    tips: "Appliquez sur cheveux secs, longueurs et pointes, laissez poser 30 min sous une charlotte chauffante. Rincez puis shampouinez. 1 fois/semaine.",
    rating: 4.5,
    reviews: 18,
  },
  {
    id: 6,
    title: "Gommage Corps au Café",
    level: "Débutant",
    time: "10 min",
    category: "Corps",
    description: "Un gommage exfoliant et tonifiant à base de marc de café, parfait pour éliminer les cellules mortes et tonifier la peau.",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&auto=format&fit=crop",
    ingredients: [
      "100 g de marc de café séché",
      "50 g de sucre de canne",
      "40 ml d'huile de coco fondue",
      "20 ml d'huile d'olive",
      "10 gouttes d'huile essentielle d'orange douce",
      "5 gouttes d'huile essentielle de cannelle (optional)",
    ],
    steps: [
      "Mélangez le marc de café séché et le sucre dans un bol.",
      "Faites fondre l'huile de coco et ajoutez-la avec l'huile d'olive.",
      "Incorporez les huiles essentielles et mélangez bien.",
      "Conditionnez dans un pot hermétique.",
    ],
    tips: "Utilisez 1 à 2 fois par semaine sur peau humide. Massez en mouvements circulaires ascendants. Rincez abondamment. La douche peut devenir glissante avec l'huile de coco !",
    rating: 4.8,
    reviews: 53,
  },
];

const CATEGORIES = ['Toutes', 'Visage', 'Cheveux', 'Corps'];
const LEVELS = ['Tous niveaux', 'Débutant', 'Intermédiaire', 'Avancé'];

function RecipeModal({ recipe, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative h-56 overflow-hidden rounded-t-2xl">
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
          <button onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-lg">
            <X size={20} className="text-primary" />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-headline font-bold text-white leading-tight">{recipe.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${recipe.level === 'Débutant' ? 'bg-green-500/90 text-white' : recipe.level === 'Intermédiaire' ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                {recipe.level}
              </span>
              <span className="flex items-center gap-1 text-white/90 text-xs"><Clock size={13} />{recipe.time}</span>
              <span className="flex items-center gap-1 text-white/90 text-xs"><Star size={13} className="fill-gold text-gold" />{recipe.rating} ({recipe.reviews} avis)</span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-on-surface-variant leading-relaxed">{recipe.description}</p>

          <div>
            <h3 className="font-headline font-bold text-primary text-lg mb-3 flex items-center gap-2">
              <Leaf size={18} className="text-primary" /> Ingrédients
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-headline font-bold text-primary text-lg mb-3 flex items-center gap-2">
              <FlaskConical size={18} className="text-primary" /> Préparation
            </h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-primary-container/30 rounded-xl p-4 border border-primary/10">
            <p className="text-sm font-bold text-primary mb-1">💡 Conseil</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{recipe.tips}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function RecettesPage() {
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [activeLevel, setActiveLevel] = useState('Tous niveaux');
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const displayed = RECIPES.filter(r => {
    if (activeCategory !== 'Toutes' && r.category !== activeCategory) return false;
    if (activeLevel !== 'Tous niveaux' && r.level !== activeLevel) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-primary-container py-20 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="text-xs font-body uppercase tracking-widest text-on-primary-container/70 font-bold mb-4 block">Atelier Cosmétique</span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-primary-container leading-tight mb-4">
            Nos Formulations DIY
          </h1>
          <p className="text-on-primary-container/80 text-lg leading-relaxed max-w-xl mx-auto">
            Créez vos propres soins naturels avec nos recettes testées et approuvées par nos experts en naturopathie.
          </p>
          <nav className="flex items-center gap-2 text-xs font-body text-on-primary-container/60 justify-center mt-8">
            <Link to="/" className="hover:text-on-primary-container transition-colors">Accueil</Link>
            <ChevronRight size={14} />
            <span className="text-on-primary-container font-medium">Recettes DIY</span>
          </nav>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-surface border-b border-outline-variant/10">
        <div className="px-6 md:px-12 py-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une recette..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/20 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'}`}>
                {cat}
              </button>
            ))}
          </div>
          {/* Level pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {LEVELS.map(lvl => (
              <button key={lvl} onClick={() => setActiveLevel(lvl)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeLevel === lvl ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-primary'}`}>
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {displayed.length === 0 ? (
            <div className="py-24 text-center text-on-surface-variant">
              <p className="text-lg font-medium">Aucune recette ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayed.map(recipe => (
                <div key={recipe.id}
                  className="group bg-surface-container rounded-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-300 cursor-pointer shadow-sm hover:shadow-xl"
                  onClick={() => setSelectedRecipe(recipe)}>
                  <div className="h-52 overflow-hidden relative">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={recipe.image} alt={recipe.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-surface/90 text-primary px-2 py-1 rounded-full uppercase">
                      {recipe.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${recipe.level === 'Débutant' ? 'bg-green-100 text-green-700' : recipe.level === 'Intermédiaire' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {recipe.level}
                      </span>
                      <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                        <Clock size={13} /><span>{recipe.time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant text-xs ml-auto">
                        <Star size={13} className="fill-gold text-gold" /><span>{recipe.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-headline font-bold text-primary mb-2 leading-tight">{recipe.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{recipe.description}</p>
                    <button className="mt-4 flex items-center gap-2 text-primary font-bold text-sm group/btn">
                      Voir la recette
                      <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </>
  );
}
