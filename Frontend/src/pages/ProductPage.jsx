import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronRight, Heart, ShoppingBag, Truck, ShieldCheck, Star, Minus, Plus, Wind, Droplets, X, Send, Award, Leaf } from 'lucide-react';
import { fetchProductBySlug, fetchReviewsByProduct, submitReview, fetchMyOrders, fetchSimilarProducts } from '../api/apiClient';
import { getUser } from '../api/tokenStorage';
import ProductCard from '../components/ProductCard';
import { sizeOptions, needsSizeChoice } from '../utils/cartLines';
import { track } from '../tracking/tracker';
import RecommendedProducts from '../components/RecommendedProducts';
import { useShop } from '../context/ShopContext';
import LoginPromptModal from '../components/LoginPromptModal';
import { TryOnButton } from '../components/TryOnModal';
import { useStore } from '../context/StoreContext';
import { ATTRIBUTE_LABELS, LONG_ATTRIBUTES, TABLE_ATTRIBUTES, attributeChips, attributeValue, sizeLabelOf, specRows } from '../data/sectors';

// Star rating input component
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={(hovered || value) >= n ? 'fill-gold text-gold' : 'text-outline-variant'}
          />
        </button>
      ))}
    </div>
  );
}

// Review form modal
function ReviewModal({ product, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (note === 0) { setError('Veuillez sélectionner une note.'); return; }
    setSubmitting(true); setError('');
    try {
      // Find eligible delivered order containing this product
      const orders = await fetchMyOrders();
      const eligible = orders.find(o =>
        o.statut === 'LIVREE' &&
        o.items?.some(item => item.productId === product.id)
      );
      if (!eligible) {
        setError('Vous devez avoir commandé et reçu ce produit pour laisser un avis.');
        setSubmitting(false); return;
      }
      await submitReview({ orderId: eligible.id, productId: product.id, note, commentaire });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.error || err?.message || 'Erreur lors de l\'envoi de votre avis.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-low"><X size={20} /></button>
        <h3 className="text-xl font-headline font-bold text-primary mb-1">Écrire un avis</h3>
        <p className="text-sm text-on-surface-variant mb-6">{product.name}</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Votre note *</label>
            <StarInput value={note} onChange={setNote} />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Votre commentaire</label>
            <textarea
              rows={4}
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Partagez votre expérience avec ce produit..."
              className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-error bg-error/5 px-4 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
            <Send size={16} />
            {submitting ? 'Envoi...' : 'Publier mon avis'}
          </button>
          <p className="text-[10px] text-on-surface-variant text-center">Votre avis sera visible après validation par notre équipe.</p>
        </form>
      </div>
    </div>,
    document.body
  );
}

function renderStars(rating, size = 16) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={size} className={i < Math.floor(rating) ? 'fill-gold text-gold' : (i < rating ? 'fill-gold/50 text-gold' : 'text-outline-variant')} />
  ));
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProductPage() {
  const { slug } = useParams();
  const user = getUser();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const { isClothes, hasSizes, sector, businessType } = useStore();
  const generic = sector.kind === 'generic';
  const cosmetics = sector.kind === 'cosmetics';
  const sizeLabel = sizeLabelOf(businessType, product);
  const sizeWord = sizeLabel.toLowerCase();

  const handleWishlist = () => {
    const result = toggleWishlist(product);
    if (result?.requiresLogin) setShowLoginModal(true);
  };

  const loadReviews = (productId) => {
    fetchReviewsByProduct(productId).then(setReviews).catch(() => setReviews([]));
  };

  useEffect(() => {
    setLoading(true);
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        track('VIEW_PRODUCT', { productId: p.id, price: p.price, categorySlug: p.categorySlug });
        // Several sizes: the customer must pick one. A single option is chosen for them.
        const opts = sizeOptions(p, hasSizes);
        setSelectedSize(opts.length === 1 ? opts[0] : null);
        setSizeError(false);
        // Load similar/upsell products if defined, otherwise fall back to category
        if (p.upsellTags) {
          const ids = p.upsellTags.split(',').map(s => s.trim()).filter(Boolean);
          if (ids.length > 0) {
            fetchSimilarProducts(ids)
              .then(prods => setRelatedProducts(prods.filter(rp => rp.id !== p.id)))
              .catch(() => setRelatedProducts([]));
            loadReviews(p.id);
            return;
          }
        }
        setRelatedProducts([]);
        loadReviews(p.id);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center text-on-surface-variant">Chargement...</div>
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold text-primary mb-4">Produit introuvable</h1>
        <Link to="/" className="text-sage font-bold hover:underline">Retour accueil</Link>
      </div>
    </div>
  );

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1) : null;

  // Sector characteristics (sport, high-tech, maison…): short ones in the description, long ones in their tab.
  const attributes = product.attributes || {};
  const shortAttributes = Object.entries(attributes).filter(([key]) => !LONG_ATTRIBUTES.includes(key));
  const longAttributes = Object.entries(attributes).filter(([key]) => LONG_ATTRIBUTES.includes(key));
  const chips = generic ? attributeChips(businessType, attributes) : [];

  const tabs = [
    { id: 'description', label: 'Description' },
    ...(isClothes && product.entretien ? [{ id: 'entretien', label: 'Entretien' }] : []),
    ...(cosmetics && (product.usageInstructions || product.precautions) ? [{ id: 'usage', label: "Conseils d'utilisation" }] : []),
    ...(cosmetics && product.inciComposition ? [{ id: 'composition', label: 'Composition / INCI' }] : []),
    ...(generic && longAttributes.length ? [{ id: 'specs', label: 'Caractéristiques' }] : []),
    { id: 'reviews', label: `Avis clients${reviews.length ? ` (${reviews.length})` : ''}` },
  ];

  // Usage instructions — parse line-by-line or display as block
  const usageLines = (product.usageInstructions || '').split('\n').filter(Boolean);

  return (
    <div className="pb-12 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 pt-8 text-xs font-medium text-on-surface-variant tracking-wider uppercase">
        <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
        <ChevronRight size={14} />
        <Link to={`/categories/${product.categorySlug}`} className="hover:text-primary transition-colors">{product.category}</Link>
        <ChevronRight size={14} />
        <span className="text-primary">{product.name}</span>
      </nav>

      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
        {/* Gallery */}
        <div className="md:col-span-7 flex flex-col md:flex-row-reverse gap-4">
          <div className="flex-1 bg-surface-container-low rounded-xl overflow-hidden group relative aspect-square md:aspect-auto">
            <img alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={product.image} />
          </div>
          <div className="flex md:flex-col gap-4 overflow-x-auto hide-scrollbar">
            {[1, 2, 3, 4].map(i => (
              <button key={i} className={`w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === 1 ? 'border-primary' : 'border-transparent hover:border-outline-variant'}`}>
                <img alt="" className="w-full h-full object-cover" src={product.image} />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-5 flex flex-col">
          {/* Badges: bio + certifications */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(isClothes || generic) && product.couleur && (
              <span className="px-3 py-1 bg-surface-container-highest text-primary text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: product.couleurHex || '#111' }} />
                {product.couleur}
              </span>
            )}
            {isClothes && product.tissu && <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">{product.tissu}</span>}
            {chips.map((chip) => (
              <span key={chip} className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">{chip}</span>
            ))}
            {cosmetics && product.bio && <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1"><Leaf size={10} />Bio</span>}
            {cosmetics && product.certifications.map(cert => (
              <span key={cert} className="px-3 py-1 bg-surface-container-highest text-primary text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1"><Award size={10} />{cert}</span>
            ))}
            {product.stock > 0
              ? <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">En stock</span>
              : <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider rounded-full">Rupture</span>}
          </div>

          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-1 leading-tight">{product.name}</h2>
          {cosmetics && product.latin && <p className="text-secondary font-medium italic mb-4">{product.latin}</p>}
          {isClothes && (product.coupe || product.genre) && (
            <p className="text-secondary font-medium mb-4">{[product.genre, product.coupe, product.saison].filter(Boolean).join(' · ')}</p>
          )}

          {/* Live rating */}
          {avgRating && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">{renderStars(parseFloat(avgRating))}</div>
              <span className="text-sm font-medium text-on-surface-variant border-b border-outline-variant">{avgRating} ({reviews.length} avis)</span>
            </div>
          )}

          <div className="mb-8 p-6 bg-surface-container-low rounded-2xl">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="t-price text-3xl font-headline font-bold text-primary">{product.price.toFixed(2)} TND</span>
              {product.oldPrice && <span className="text-lg text-on-surface-variant line-through opacity-60">{product.oldPrice.toFixed(2)} TND</span>}
            </div>
            {product.description && <p className="text-on-surface-variant text-sm leading-relaxed">{product.description}</p>}
          </div>

          {/* Size */}
          <div className="space-y-6 mb-8">
            {sizeOptions(product, hasSizes).length > 0 && (
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="block text-xs font-bold text-primary uppercase tracking-widest">
                    {sizeLabel}
                    {selectedSize && <span className="ml-2 normal-case tracking-normal font-medium text-secondary">: {selectedSize}</span>}
                  </span>
                  {sizeError && <span className="text-xs font-semibold text-red-600">Choisissez : {sizeWord}</span>}
                </div>
                <div className={`flex flex-wrap gap-3 rounded-2xl transition-all ${sizeError ? 'p-2 -m-2 ring-2 ring-red-400 size-shake' : ''}`}>
                  {sizeOptions(product, hasSizes).map(size => (
                    <button key={size} onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      className={`min-w-[52px] px-5 py-2 rounded-full border-2 font-medium text-sm transition-all ${selectedSize === size ? 'border-primary bg-primary text-white' : 'border-outline-variant text-secondary hover:border-primary'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-surface-container-high rounded-full px-4 py-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-primary"><Minus size={16} /></button>
                <span className="px-6 font-bold text-primary">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} className="text-primary" disabled={product.stock <= 0}><Plus size={16} /></button>
              </div>
              <button
                disabled={product.stock <= 0}
                className={`btn-liquid flex-1 whitespace-nowrap font-bold py-4 px-6 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 ${
                  product.stock > 0 ? 'bg-primary text-white shadow-primary/10' : 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
                }`}
                onClick={() => {
                  if (product.stock <= 0) return;
                  if (needsSizeChoice(product, hasSizes) && !selectedSize) { setSizeError(true); return; }
                  addToCart(product, quantity, selectedSize || '');
                }}>
                <ShoppingBag size={18} />{needsSizeChoice(product, hasSizes) && !selectedSize ? `Choisir : ${sizeWord}` : 'Ajouter au panier'}
              </button>
              {sector.tryOn && (
              <TryOnButton
                product={product}
                className="px-5 py-4 rounded-full border-2 border-primary text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all"
              />
              )}
              <button onClick={handleWishlist}
                className={`p-4 rounded-full border transition-all ${isWishlisted(product.id) ? 'border-error text-error bg-error/5' : 'border-outline-variant text-secondary hover:text-error hover:border-error'}`}>
                <Heart size={18} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 border-t border-surface-container-highest">
            <div className="flex items-center gap-3"><Truck size={18} className="text-secondary" /><span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Livraison 48h</span></div>
            <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-secondary" /><span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Paiement Sécurisé</span></div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="mb-20">
        <div className="flex border-b border-surface-container-highest mb-10 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 border-b-2 font-bold text-sm tracking-widest uppercase whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description tab */}
        {activeTab === 'description' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-headline font-bold text-primary">A propos de ce produit</h3>
              {product.description && <p className="text-on-surface-variant leading-relaxed">{product.description}</p>}
              <ul className="space-y-4">
                {isClothes ? (
                  <>
                    {[
                      ['Tissu', product.tissu],
                      ['Couleur', product.couleur],
                      ['Coupe', product.coupe],
                      ['Col', product.col],
                      ['Manches', product.manches],
                      ['Genre', product.genre],
                      ['Saison', product.saison],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <li key={label} className="flex items-center gap-4 text-sm">
                        <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                        <span className="font-bold text-primary w-36 shrink-0">{label}</span>
                        <span className="text-on-surface-variant">{value}</span>
                      </li>
                    ))}
                  </>
                ) : generic ? (
                  <>
                    {[['Couleur', product.couleur], ...shortAttributes.map(([key, value]) => [ATTRIBUTE_LABELS[key] || key, attributeValue(businessType, key, value)])]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <li key={label} className="flex items-start gap-4 text-sm">
                          <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1.5" />
                          <span className="font-bold text-primary w-36 shrink-0">{label}</span>
                          <span className="text-on-surface-variant">{String(value).split(',').map((v) => v.trim()).join(' · ')}</span>
                        </li>
                      ))}
                  </>
                ) : (
                  <>
                {product.latin && (
                  <li className="flex items-center gap-4 text-sm">
                    <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    <span className="font-bold text-primary w-36 shrink-0">Nom Botanique :</span>
                    <span className="text-on-surface-variant">{product.latin}</span>
                  </li>
                )}
                {product.origine && (
                  <li className="flex items-center gap-4 text-sm">
                    <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    <span className="font-bold text-primary w-36 shrink-0">Origine :</span>
                    <span className="text-on-surface-variant">{product.origine}</span>
                  </li>
                )}
                <li className="flex items-center gap-4 text-sm">
                  <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                  <span className="font-bold text-primary w-36 shrink-0">Culture :</span>
                  <span className="text-on-surface-variant">{product.bio ? 'Biologique certifiee' : 'Conventionnelle controlee'}</span>
                </li>
                  </>
                )}
              </ul>
            </div>
            {product.usageInstructions && (
              <div className="bg-surface-container rounded-2xl p-8 flex flex-col justify-center gap-6">
                <h4 className="font-headline font-bold text-primary text-lg">Utilisations recommandees</h4>
                {usageLines.slice(0, 3).map((line, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                      {i === 0 ? <Wind size={24} className="text-primary" /> : <Droplets size={24} className="text-primary" />}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed pt-1">{line}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Usage tab — shown only if field exists */}
        {activeTab === 'usage' && (
          <div className="max-w-3xl space-y-6">
            <h3 className="text-2xl font-headline font-bold text-primary">Conseils d utilisation</h3>
            {product.precautions && (
              <div className="bg-gold/10 border-l-4 border-gold p-4 rounded-r-lg">
                <p className="text-sm text-dark-text font-medium">{product.precautions}</p>
              </div>
            )}
            {usageLines.length > 0 ? (
              <ul className="space-y-4 text-on-surface-variant">
                {usageLines.map((line, i) => {
                  const [label, ...rest] = line.split(':');
                  return rest.length > 0 ? (
                    <li key={i} className="flex gap-3"><span className="font-bold text-primary">{label} :</span><span>{rest.join(':').trim()}</span></li>
                  ) : (
                    <li key={i} className="flex gap-3 items-start"><span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" /><span>{line}</span></li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-on-surface-variant">Aucun conseil disponible pour ce produit.</p>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-3xl space-y-10">
            {longAttributes.map(([key, value]) => (
              <div key={key}>
                <h3 className="text-2xl font-headline font-bold text-primary mb-4">{ATTRIBUTE_LABELS[key] || key}</h3>
                {TABLE_ATTRIBUTES.includes(key) ? (
                  <table className="w-full text-sm border-t border-surface-container-highest">
                    <tbody>
                      {specRows(value).map(([name, val], i) => (
                        <tr key={i} className="border-b border-surface-container-highest">
                          <th className="text-left font-bold text-primary py-3 pr-6 w-1/2 align-top">{name || '—'}</th>
                          <td className="py-3 text-on-surface-variant">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{value}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'entretien' && (
          <div className="max-w-2xl">
            <h3 className="text-2xl font-headline font-bold text-primary mb-4">Entretien</h3>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{product.entretien}</p>
          </div>
        )}

        {/* Composition tab — shown only if field exists */}
        {activeTab === 'composition' && (
          <div className="max-w-3xl space-y-6">
            <h3 className="text-2xl font-headline font-bold text-primary">Composition / INCI</h3>
            <div className="bg-surface-container-low p-6 rounded-xl">
              <p className="text-sm text-on-surface-variant font-mono leading-relaxed whitespace-pre-wrap">{product.inciComposition}</p>
            </div>
            {product.certifications.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {product.bio && <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold flex items-center gap-2"><Leaf size={14} />Bio certifie</span>}
                {product.certifications.map(cert => (
                  <span key={cert} className="px-4 py-2 bg-surface-container-highest text-primary rounded-full text-sm font-bold flex items-center gap-2"><Award size={14} />{cert}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div className="max-w-3xl space-y-8">
            {/* Summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-8 p-6 bg-surface-container-low rounded-2xl">
                <div className="text-center shrink-0">
                  <span className="text-5xl font-headline font-bold text-primary">{avgRating}</span>
                  <div className="flex justify-center mt-2">{renderStars(parseFloat(avgRating))}</div>
                  <p className="text-sm text-secondary mt-1">{reviews.length} avis verifies</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => r.note === star).length;
                    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-primary w-4">{star}</span>
                        <Star size={12} className="fill-gold text-gold shrink-0" />
                        <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-on-surface-variant w-4">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write review button */}
            <button
              onClick={() => { if (!user) setShowLoginModal(true); else setShowReviewModal(true); }}
              className="btn-liquid bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
              <Star size={16} />
              Ecrire un avis
            </button>

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <p className="text-on-surface-variant text-sm py-8 text-center">Aucun avis pour ce produit. Soyez le premier !</p>
            ) : (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-outline-variant/10 pb-6">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {review.clientInitials || '?'}
                      </div>
                      <span className="text-sm font-bold text-primary">{review.clientName}</span>
                      <div className="flex">{renderStars(review.note, 14)}</div>
                      <span className="text-xs text-outline ml-auto">{formatDate(review.createdAt)}</span>
                      <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">Achat verifie</span>
                    </div>
                    {review.commentaire && <p className="text-sm text-on-surface-variant leading-relaxed">{review.commentaire}</p>}
                    {review.reponse && (
                      <div className="mt-3 ml-4 p-3 bg-surface-container-low rounded-lg border-l-2 border-primary">
                        <p className="text-xs font-bold text-primary mb-1">Reponse de NaturEssence :</p>
                        <p className="text-xs text-on-surface-variant">{review.reponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mb-24 overflow-hidden">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="text-3xl font-headline font-bold text-primary">Complétez votre collection</h3>
              <p className="text-secondary">La sélection de la boutique</p>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 -mx-2 px-2">
            {relatedProducts.map(p => (
              <div key={p.id} className="min-w-[280px]"><ProductCard product={p} /></div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendation engine: similar products (hybrid model), then personalised picks */}
      <RecommendedProducts bare kind="similar" params={{ productId: String(product.id) }} reloadKey={product.id} title="Vous aimerez aussi" eyebrow="Produits similaires" />
      <RecommendedProducts bare kind="for-you" reloadKey={`fy-${product.id}`} title="Recommandé pour vous" eyebrow="Selon votre navigation" exclude={[product.id]} />

      <LoginPromptModal open={showLoginModal} onClose={() => setShowLoginModal(false)} redirectTo={`/produits/${slug}`} />
      {showReviewModal && <ReviewModal product={product} onClose={() => setShowReviewModal(false)} onSuccess={() => loadReviews(product.id)} />}
    </div>
  );
}