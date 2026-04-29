import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Grid3X3, List, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { fetchCategoryBySlug, fetchProductsByCategory } from '../api/apiClient';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState('Tout voir');

  // Filters state
  const [sort, setSort] = useState('pertinence');
  const [filterBio, setFilterBio] = useState(false);
  const [filterBadges, setFilterBadges] = useState([]);
  const [filterSizes, setFilterSizes] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [openSections, setOpenSections] = useState({ prix: true, proprietes: true, certification: true, contenance: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sliderMax, setSliderMax] = useState(200);
  const [sliderVal, setSliderVal] = useState(200);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCategoryBySlug(slug),
      fetchProductsByCategory(slug),
    ]).then(([cat, prods]) => {
      setCategory(cat);
      setProducts(prods);
      setActiveSub('Tout voir');
      setFilterBio(false);
      setFilterBadges([]);
      setFilterSizes([]);
      setSort('pertinence');
      if (prods.length) {
        const max = Math.ceil(Math.max(...prods.map(p => p.price), 50) / 10) * 10 + 20;
        setSliderMax(max);
        setSliderVal(max);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const allSizes = useMemo(() => {
    const s = new Set(products.map(p => p.volume).filter(Boolean));
    return [...s].sort();
  }, [products]);

  const toggleBadge = (b) => setFilterBadges(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleSize = (s) => setFilterSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleSection = (k) => setOpenSections(prev => ({ ...prev, [k]: !prev[k] }));
  const hasActiveFilters = filterBio || filterBadges.length > 0 || filterSizes.length > 0 || sliderVal < sliderMax;
  const clearFilters = () => {
    setFilterBio(false); setFilterBadges([]); setFilterSizes([]);
    setSliderVal(sliderMax); setActiveSub('Tout voir');
  };

  const displayed = useMemo(() => {
    let list = [...products];
    if (activeSub !== 'Tout voir') list = list.filter(p => p.category === activeSub);
    list = list.filter(p => p.price <= sliderVal);
    if (filterBio) list = list.filter(p => p.bio);
    if (filterBadges.length > 0) {
      list = list.filter(p => {
        if (filterBadges.includes('Nouveau') && p.badge === 'Nouveau') return true;
        if (filterBadges.includes('Best-Seller') && p.badge === 'Best-Seller') return true;
        if (filterBadges.includes('Promo') && p.badge && p.badge.includes('%')) return true;
        return false;
      });
    }
    if (filterSizes.length > 0) list = list.filter(p => filterSizes.includes(p.volume));
    switch (sort) {
      case 'prix-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'prix-desc': list.sort((a, b) => b.price - a.price); break;
      case 'nouveautes': list.sort((a, b) => b.id - a.id); break;
      case 'bio': list.sort((a, b) => (b.bio ? 1 : 0) - (a.bio ? 1 : 0)); break;
      default: break;
    }
    return list;
  }, [products, activeSub, sliderVal, filterBio, filterBadges, filterSizes, sort]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center text-on-surface-variant">Chargement...</div>
    </div>
  );

  if (!category) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold text-primary mb-4">Categorie introuvable</h1>
        <Link to="/" className="text-sage font-bold hover:underline">Retour accueil</Link>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline text-lg text-primary font-bold">Filtrer par</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            <X size={12} /> Effacer
          </button>
        )}
      </div>
      <div className="border-b border-outline-variant/20 py-4">
        <button onClick={() => toggleSection('prix')} className="flex justify-between items-center w-full">
          <span className="font-medium text-on-surface text-sm">Prix</span>
          <ChevronDown size={16} className={`text-on-surface-variant transition-transform ${openSections.prix ? 'rotate-180' : ''}`} />
        </button>
        {openSections.prix && (
          <div className="mt-4 px-1">
            <input type="range" min="0" max={sliderMax} value={sliderVal}
              onChange={e => setSliderVal(Number(e.target.value))}
              className="w-full accent-primary h-1.5 rounded-lg appearance-none cursor-pointer" />
            <div className="flex justify-between mt-2 text-xs font-medium text-on-surface-variant">
              <span>0 TND</span><span className="text-primary font-bold">{sliderVal} TND</span>
            </div>
          </div>
        )}
      </div>
      <div className="border-b border-outline-variant/20 py-4">
        <button onClick={() => toggleSection('certification')} className="flex justify-between items-center w-full">
          <span className="font-medium text-on-surface text-sm">Certification</span>
          <ChevronDown size={16} className={`text-on-surface-variant transition-transform ${openSections.certification ? 'rotate-180' : ''}`} />
        </button>
        {openSections.certification && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={filterBio} onChange={e => setFilterBio(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant accent-primary" />
              <span className="text-sm text-on-surface-variant hover:text-primary transition-colors">Bio certifie</span>
            </label>
          </div>
        )}
      </div>
      <div className="border-b border-outline-variant/20 py-4">
        <button onClick={() => toggleSection('proprietes')} className="flex justify-between items-center w-full">
          <span className="font-medium text-on-surface text-sm">Produits</span>
          <ChevronDown size={16} className={`text-on-surface-variant transition-transform ${openSections.proprietes ? 'rotate-180' : ''}`} />
        </button>
        {openSections.proprietes && (
          <div className="mt-3 space-y-2">
            {['Nouveau', 'Best-Seller', 'Promo'].map(b => (
              <label key={b} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={filterBadges.includes(b)} onChange={() => toggleBadge(b)}
                  className="w-4 h-4 rounded border-outline-variant accent-primary" />
                <span className="text-sm text-on-surface-variant hover:text-primary transition-colors">{b}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {allSizes.length > 0 && (
        <div className="border-b border-outline-variant/20 py-4">
          <button onClick={() => toggleSection('contenance')} className="flex justify-between items-center w-full">
            <span className="font-medium text-on-surface text-sm">Contenance</span>
            <ChevronDown size={16} className={`text-on-surface-variant transition-transform ${openSections.contenance ? 'rotate-180' : ''}`} />
          </button>
          {openSections.contenance && (
            <div className="mt-3 flex flex-wrap gap-2">
              {allSizes.map(size => (
                <button key={size} onClick={() => toggleSize(size)}
                  className={`py-1 px-3 border rounded text-xs font-medium transition-all ${filterSizes.includes(size) ? 'border-primary bg-primary text-white' : 'border-outline-variant/30 hover:border-primary text-on-surface-variant'}`}>
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-5 bg-primary-container rounded-xl text-white mt-4">
        <p className="font-headline font-bold text-base mb-2">Conseil Expert</p>
        <p className="text-xs text-on-primary-container leading-relaxed">Besoin d aide pour choisir ? Nos naturopathes sont disponibles en chat direct.</p>
        <button className="mt-4 w-full py-2 bg-gold text-primary font-bold text-sm rounded-lg hover:opacity-90 transition-all">Discuter</button>
      </div>
    </div>
  );

  return (
    <>
      <section className="bg-surface-container-low px-6 md:px-12 py-10">
        <nav className="flex items-center gap-2 text-xs font-body text-on-surface-variant mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
          <ChevronRight size={14} />
          <span className="text-primary font-medium">{category.name}</span>
        </nav>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary font-extrabold tracking-tight mb-4">{category.name}</h1>
            <p className="text-on-surface-variant leading-relaxed text-lg mb-4">{category.description}</p>
            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium">
              {displayed.length} produit{displayed.length !== 1 ? 's' : ''} trouve{displayed.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl shadow-2xl md:rotate-1">
            <img alt={category.name} className="w-full h-full object-cover" src={category.heroImage} />
          </div>
        </div>
      </section>
      <div className="bg-surface sticky top-16 z-40 border-b border-outline-variant/10 py-4 overflow-x-auto hide-scrollbar">
        <div className="px-6 md:px-12 flex gap-3 min-w-max">
          {['Tout voir', ...(category.subcategories || [])].map((sub) => (
            <button key={sub} onClick={() => setActiveSub(sub)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeSub === sub ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'}`}>
              {sub}
            </button>
          ))}
        </div>
      </div>
      <div className="lg:hidden px-6 py-3 border-b border-outline-variant/10 flex items-center justify-between">
        <button onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-sm font-bold text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors">
          <SlidersHorizontal size={16} /> Filtres {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
        </button>
        <span className="text-xs text-on-surface-variant">{displayed.length} produits</span>
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative bg-white w-80 max-w-full h-full overflow-y-auto p-6 shadow-2xl">
            <button onClick={() => setMobileSidebarOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-low"><X size={20} /></button>
            <SidebarContent />
          </div>
        </div>
      )}
      <div className="px-6 md:px-12 py-8 grid lg:grid-cols-[260px_1fr] gap-10">
        <aside className="hidden lg:block"><SidebarContent /></aside>
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-surface-container-low p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-on-surface-variant">Trier par :</span>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="bg-transparent border border-outline-variant/30 rounded-lg text-sm font-bold text-primary focus:ring-1 focus:ring-primary cursor-pointer px-2 py-1 outline-none">
                <option value="pertinence">Pertinence</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix decroissant</option>
                <option value="nouveautes">Nouveautes</option>
                <option value="bio">Bio en premier</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-on-surface-variant hidden sm:block">{displayed.length} resultat{displayed.length !== 1 ? 's' : ''}</span>
              <div className="flex bg-surface-container-highest rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}><Grid3X3 size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}><List size={18} /></button>
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filterBio && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  Bio certifie <button onClick={() => setFilterBio(false)}><X size={12} /></button>
                </span>
              )}
              {filterBadges.map(b => (
                <span key={b} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  {b} <button onClick={() => toggleBadge(b)}><X size={12} /></button>
                </span>
              ))}
              {filterSizes.map(s => (
                <span key={s} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  {s} <button onClick={() => toggleSize(s)}><X size={12} /></button>
                </span>
              ))}
              {sliderVal < sliderMax && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  max {sliderVal} TND <button onClick={() => setSliderVal(sliderMax)}><X size={12} /></button>
                </span>
              )}
            </div>
          )}
          {displayed.length === 0 ? (
            <div className="py-24 text-center text-on-surface-variant">
              <p className="text-lg font-medium mb-2">Aucun produit ne correspond a vos filtres.</p>
              <button onClick={clearFilters} className="text-sm font-bold text-primary underline">Effacer les filtres</button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((product) => (
                <Link key={product.id} to={`/produits/${product.slug}`}
                  className="flex gap-4 bg-white rounded-xl border border-outline-variant/10 p-4 hover:shadow-md transition-all">
                  <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">{product.category}</p>
                    <h3 className="font-headline font-bold text-primary text-lg leading-tight">{product.name}</h3>
                    {product.volume && <p className="text-sm text-on-surface-variant mt-1">{product.volume}</p>}
                    <p className="font-bold text-primary mt-2">{product.price.toFixed(2)} TND</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}