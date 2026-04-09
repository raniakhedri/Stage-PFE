import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Grid3X3, List, ChevronDown } from 'lucide-react';
import { fetchCategoryBySlug, fetchProductsByCategory } from '../api/apiClient';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState('Tout voir');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCategoryBySlug(slug),
      fetchProductsByCategory(slug),
    ]).then(([cat, prods]) => {
      setCategory(cat);
      setProducts(prods);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-on-surface-variant">Chargement...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold text-primary mb-4">Catégorie introuvable</h1>
          <Link to="/" className="text-sage font-bold hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section & Breadcrumb */}
      <section className="bg-surface-container-low px-6 md:px-12 py-10">
        <nav className="flex items-center gap-2 text-xs font-body text-on-surface-variant mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
          <ChevronRight size={14} />
          <span className="text-primary font-medium">{category.name}</span>
        </nav>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary font-extrabold tracking-tight mb-4">
              {category.name}
            </h1>
            <p className="text-on-surface-variant leading-relaxed text-lg mb-4">
              {category.description}
            </p>
            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium">
              {category.productCount} produits trouvés
            </span>
          </div>
          <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl shadow-2xl transform md:rotate-1">
            <img
              alt={category.name}
              className="w-full h-full object-cover"
              src={category.heroImage}
            />
          </div>
        </div>
      </section>

      {/* Subcategories Bar */}
      <div className="bg-surface sticky top-16 z-40 border-b border-outline-variant/10 py-4 overflow-x-auto hide-scrollbar">
        <div className="px-6 md:px-12 flex gap-3 min-w-max">
          {['Tout voir', ...category.subcategories].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSub(sub)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeSub === sub
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-12 py-8 grid lg:grid-cols-[280px_1fr] gap-10">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block space-y-8">
          <div>
            <h3 className="font-headline text-lg text-primary font-bold mb-4">Filtrer par</h3>

            {/* Prix */}
            <div className="border-b border-outline-variant/20 py-4">
              <button className="flex justify-between items-center w-full group">
                <span className="font-medium text-on-surface">Prix</span>
                <ChevronDown size={18} className="text-on-surface-variant group-hover:text-primary" />
              </button>
              <div className="mt-4 px-2">
                <input type="range" min="0" max="100" className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between mt-2 text-xs font-medium text-on-surface-variant">
                  <span>0 TND</span><span>100 TND+</span>
                </div>
              </div>
            </div>

            {/* Propriétés */}
            <div className="border-b border-outline-variant/20 py-4">
              <button className="flex justify-between items-center w-full group">
                <span className="font-medium text-on-surface">Propriétés</span>
                <ChevronDown size={18} className="text-on-surface-variant group-hover:text-primary" />
              </button>
              <div className="mt-4 space-y-2">
                {['Apaisant', 'Tonifiant', 'Purifiant', 'Hydratant', 'Anti-âge'].map((prop) => (
                  <label key={prop} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors">{prop}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Certification */}
            <div className="border-b border-outline-variant/20 py-4">
              <button className="flex justify-between items-center w-full group">
                <span className="font-medium text-on-surface">Certification</span>
                <ChevronDown size={18} className="text-on-surface-variant group-hover:text-primary" />
              </button>
              <div className="mt-4 space-y-2">
                {['Bio (AB)', 'Écocert', 'Cosmos', 'Vegan'].map((cert) => (
                  <label key={cert} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                    <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors">{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Contenance */}
            <div className="border-b border-outline-variant/20 py-4">
              <button className="flex justify-between items-center w-full group">
                <span className="font-medium text-on-surface">Contenance</span>
                <ChevronDown size={18} className="text-on-surface-variant group-hover:text-primary" />
              </button>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['10ml', '30ml', '50ml', '100ml', '200ml', '250g'].map((size) => (
                  <button key={size} className="py-1 px-3 border border-outline-variant/30 rounded text-xs hover:border-primary transition-all">
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conseil Expert */}
          <div className="p-6 bg-primary-container rounded-xl text-white">
            <p className="font-headline font-bold text-lg mb-2">Conseil Expert</p>
            <p className="text-sm text-on-primary-container leading-relaxed">
              Besoin d'aide pour choisir ? Nos naturopathes sont disponibles en chat direct.
            </p>
            <button className="mt-4 w-full py-2 bg-gold text-primary font-bold text-sm rounded-lg hover:opacity-90 transition-all">
              Discuter
            </button>
          </div>
        </aside>

        {/* Product Listing */}
        <section>
          {/* Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-surface-container-low p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-on-surface-variant">Trier par :</span>
              <select className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer p-0">
                <option>Pertinence</option>
                <option>Prix croissant</option>
                <option>Prix décroissant</option>
                <option>Nouveautés</option>
                <option>Mieux notés</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-surface-container-highest rounded-lg p-1">
                <button className="p-1.5 bg-white shadow-sm rounded-md text-primary"><Grid3X3 size={18} /></button>
                <button className="p-1.5 text-on-surface-variant"><List size={18} /></button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-16 flex items-center justify-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all">
              <ChevronLeft size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold shadow-md">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all">3</button>
            <span className="px-2 text-on-surface-variant">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
