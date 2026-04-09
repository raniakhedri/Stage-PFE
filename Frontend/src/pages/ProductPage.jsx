import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Heart, ShoppingBag, Truck, ShieldCheck, Star, Minus, Plus, Wind, Droplets, ArrowRight } from 'lucide-react';
import { fetchProductBySlug, fetchProductsByCategory } from '../api/apiClient';
import ProductCard from '../components/ProductCard';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        setSelectedSize(p.volume || (p.variants?.[0]?.label) || '10ml');
        // Fetch related products — use category slug
        if (p.categorySlug) {
          fetchProductsByCategory(p.categorySlug)
            .then((prods) => setRelatedProducts(prods.filter(rp => rp.id !== p.id).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-on-surface-variant">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold text-primary mb-4">Produit introuvable</h1>
          <Link to="/" className="text-sage font-bold hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const categoryName = product.category || 'Produits';
  const categorySlug = product.categorySlug || '';

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={16} className={i <= Math.floor(rating) ? 'fill-gold text-gold' : 'text-outline-variant'} />
      );
    }
    return stars;
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'usage', label: "Conseils d'utilisation" },
    { id: 'composition', label: 'Composition / INCI' },
    { id: 'reviews', label: 'Avis clients' },
  ];

  return (
    <div className="pb-12 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 pt-8 text-xs font-medium text-on-surface-variant tracking-wider uppercase">
        <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
        <ChevronRight size={14} />
        <Link to={`/categories/${categorySlug}`} className="hover:text-primary transition-colors">{categoryName}</Link>
        <ChevronRight size={14} />
        <span className="text-primary">{product.name}</span>
      </nav>

      {/* Product Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
        {/* Left: Gallery */}
        <div className="md:col-span-7 flex flex-col md:flex-row-reverse gap-4">
          <div className="flex-1 bg-surface-container-low rounded-xl overflow-hidden group relative">
            <img
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={product.image}
            />
          </div>
          <div className="flex md:flex-col gap-4 overflow-x-auto hide-scrollbar">
            {[1, 2, 3, 4].map((i) => (
              <button key={i} className={`w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === 1 ? 'border-primary' : 'border-transparent hover:border-outline-variant'}`}>
                <img alt={`Vue ${i}`} className="w-full h-full object-cover" src={product.image} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="md:col-span-5 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-4">
            {product.bio && <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full">Bio</span>}
            <span className="px-3 py-1 bg-surface-container-highest text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">Écocert</span>
            <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">En stock</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-1 leading-tight">{product.name}</h2>
          <p className="text-secondary font-medium italic mb-4">{product.latin}</p>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex">{renderStars(product.rating)}</div>
            <span className="text-sm font-medium text-on-surface-variant border-b border-outline-variant">{product.rating} ({product.reviews} avis)</span>
          </div>

          <div className="mb-8 p-6 bg-surface-container-low rounded-2xl">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-headline font-bold text-primary">{product.price.toFixed(2)} TND</span>
              {product.oldPrice && <span className="text-lg text-on-surface-variant line-through opacity-60">{product.oldPrice.toFixed(2)} TND</span>}
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Produit naturel d'exception, certifié biologique et distillé avec un savoir-faire artisanal pour préserver toute sa force thérapeutique.
            </p>
          </div>

          {/* Size Selector */}
          <div className="space-y-6 mb-8">
            <div>
              <span className="block text-xs font-bold text-primary uppercase tracking-widest mb-3">Contenance</span>
              <div className="flex gap-3">
                {(product.variants?.length > 0
                  ? product.variants.map(v => v.label)
                  : [product.volume || '10ml']
                ).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2 rounded-full border-2 font-medium text-sm transition-all ${
                      selectedSize === size ? 'border-primary bg-primary text-white' : 'border-outline-variant text-secondary hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-surface-container-high rounded-full px-4 py-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-primary"><Minus size={16} /></button>
                <span className="px-6 font-bold text-primary">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-primary"><Plus size={16} /></button>
              </div>
              <button className="btn-liquid flex-1 bg-primary text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-2">
                <ShoppingBag size={18} />
                Ajouter au panier
              </button>
              <button className="p-4 rounded-full border border-outline-variant text-secondary hover:text-error hover:border-error transition-all">
                <Heart size={18} />
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-4 py-6 border-t border-surface-container-highest">
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-secondary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Livraison 48h</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-secondary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Paiement Sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="mb-20">
        <div className="flex border-b border-surface-container-highest mb-10 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 border-b-2 font-bold text-sm tracking-widest uppercase whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-headline font-bold text-primary">À propos de ce produit</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Issue d'une distillation lente par entraînement à la vapeur d'eau des sommités fleuries. Sa fragrance fine et herbacée est un pur condensé de sérénité. Ce produit est reconnu pour ses propriétés exceptionnelles en aromathérapie et cosmétique naturelle.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-sm">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  <span className="font-bold text-primary w-32 shrink-0">Nom Botanique :</span>
                  <span className="text-on-surface-variant">{product.latin}</span>
                </li>
                <li className="flex items-center gap-4 text-sm">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  <span className="font-bold text-primary w-32 shrink-0">Origine :</span>
                  <span className="text-on-surface-variant">France / Méditerranée</span>
                </li>
                <li className="flex items-center gap-4 text-sm">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  <span className="font-bold text-primary w-32 shrink-0">Culture :</span>
                  <span className="text-on-surface-variant">{product.bio ? 'Biologique certifiée' : 'Conventionnelle contrôlée'}</span>
                </li>
              </ul>
            </div>
            <div className="bg-surface-container rounded-2xl p-8 flex flex-col justify-center gap-8">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-white rounded-xl shadow-sm"><Wind size={28} className="text-primary" /></div>
                <div>
                  <h4 className="font-headline font-bold text-primary mb-1">En Diffusion</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Verser 5 à 10 gouttes dans votre diffuseur pour une ambiance relaxante avant le coucher.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-4 bg-white rounded-xl shadow-sm"><Droplets size={28} className="text-primary" /></div>
                <div>
                  <h4 className="font-headline font-bold text-primary mb-1">En Massage</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Diluer 2 gouttes dans une cuillère à soupe d'huile végétale pour masser le plexus solaire.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="max-w-3xl space-y-6">
            <h3 className="text-2xl font-headline font-bold text-primary">Conseils d'utilisation</h3>
            <div className="bg-gold/10 border-l-4 border-gold p-4 rounded-r-lg">
              <p className="text-sm text-dark-text font-medium">⚠️ Précautions : Ne pas utiliser pur sur la peau. Déconseillé aux femmes enceintes et aux enfants de moins de 6 ans. Faire un test cutané avant utilisation.</p>
            </div>
            <ul className="space-y-4 text-on-surface-variant">
              <li className="flex gap-3"><span className="font-bold text-primary">Diffusion :</span> 5-10 gouttes dans un diffuseur pour purifier l'air ambiant.</li>
              <li className="flex gap-3"><span className="font-bold text-primary">Massage :</span> 2-3 gouttes diluées dans une huile végétale de votre choix.</li>
              <li className="flex gap-3"><span className="font-bold text-primary">Bain :</span> 5 gouttes mélangées à un dispersant avant d'ajouter à l'eau du bain.</li>
              <li className="flex gap-3"><span className="font-bold text-primary">Cosmétique :</span> 1-2% du total de votre formulation pour un soin visage.</li>
            </ul>
          </div>
        )}

        {activeTab === 'composition' && (
          <div className="max-w-3xl space-y-6">
            <h3 className="text-2xl font-headline font-bold text-primary">Composition / INCI</h3>
            <div className="bg-surface-container-low p-6 rounded-xl">
              <p className="text-sm text-on-surface-variant font-mono leading-relaxed">{product.latin} (extract), Limonene*, Linalool*, Geraniol*, Citral*</p>
              <p className="text-xs text-outline mt-4">*Composants naturellement présents dans l'huile essentielle.</p>
            </div>
            <div className="flex gap-4">
              <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold">Bio certifié</span>
              <span className="px-4 py-2 bg-surface-container-highest text-primary rounded-full text-sm font-bold">Écocert</span>
              <span className="px-4 py-2 bg-surface-container-highest text-primary rounded-full text-sm font-bold">Cosmos Natural</span>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-3xl space-y-8">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <span className="text-5xl font-headline font-bold text-primary">{product.rating}</span>
                <div className="flex justify-center mt-2">{renderStars(product.rating)}</div>
                <p className="text-sm text-secondary mt-1">{product.reviews} avis</p>
              </div>
            </div>
            <button className="btn-liquid bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm transition-all">
              Écrire un avis
            </button>
            {/* Sample reviews */}
            {[
              { name: 'Marie L.', date: '15 mars 2026', rating: 5, text: "Excellent produit ! L'odeur est divine et la qualité est au rendez-vous. Je recommande vivement." },
              { name: 'Sophie D.', date: '2 mars 2026', rating: 4, text: "Très bon produit, conforme à la description. Livraison rapide. Je suis satisfaite de mon achat." },
            ].map((review, i) => (
              <div key={i} className="border-b border-outline-variant/10 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">{renderStars(review.rating)}</div>
                  <span className="text-sm font-bold text-primary">{review.name}</span>
                  <span className="text-xs text-outline">— {review.date}</span>
                  <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">Achat vérifié</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mb-24 overflow-hidden">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="text-3xl font-headline font-bold text-primary">Vous aimerez aussi</h3>
              <p className="text-secondary">Complétez votre collection</p>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 -mx-2 px-2">
            {relatedProducts.map((p) => (
              <div key={p.id} className="min-w-[280px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
