import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, Star, ArrowRight, RefreshCw, Eye,
  MapPin, CreditCard, Tag, Calendar, Receipt, AlertCircle
} from 'lucide-react';
import { fetchMyOrders, submitReview } from '../api/apiClient';
import { createPortal } from 'react-dom';

// ── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  EN_ATTENTE:      { label: 'En attente',      color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400',   icon: Clock },
  EN_PREPARATION:  { label: 'En préparation',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400',    icon: Package },
  EXPEDIEE:        { label: 'Expédiée',        color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-400',  icon: Truck },
  LIVREE:          { label: 'Livrée',          color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500', icon: CheckCircle },
  ANNULEE:         { label: 'Annulée',         color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-400',     icon: XCircle },
  REMBOURSEE:      { label: 'Remboursée',      color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200',   dot: 'bg-gray-400',    icon: RefreshCw },
};

const STEPS = [
  { key: 'EN_ATTENTE',     label: 'Confirmée',     icon: CheckCircle },
  { key: 'EN_PREPARATION', label: 'En préparation',icon: Package },
  { key: 'EXPEDIEE',       label: 'Expédiée',      icon: Truck },
  { key: 'LIVREE',         label: 'Livrée',        icon: CheckCircle },
];
const STEP_ORDER = { EN_ATTENTE: 0, EN_PREPARATION: 1, EXPEDIEE: 2, LIVREE: 3 };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Star Input ──────────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star size={28} className={n <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

// ── Review Modal ────────────────────────────────────────────────────────────
function ReviewModal({ order, item, onClose, onSuccess }) {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (note === 0) { setError('Veuillez choisir une note.'); return; }
    setLoading(true);
    setError('');
    try {
      await submitReview({ orderId: order.id, productId: item.productId, note, commentaire });
      onSuccess();
    } catch (err) {
      setError(err?.message || 'Erreur lors de la soumission.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-beige flex-shrink-0">
            {item.image
              ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-sage" /></div>
            }
          </div>
          <div>
            <h3 className="font-headline font-bold text-primary text-lg leading-tight">{item.productName}</h3>
            <p className="text-sm text-secondary mt-1">Commande {order.reference}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Votre note</label>
            <StarInput value={note} onChange={setNote} />
            {note > 0 && (
              <p className="text-xs text-secondary mt-1">
                {['','Très déçu(e)','Déçu(e)','Correct','Bien','Excellent !'][note]}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Votre avis <span className="font-normal text-secondary">(optionnel)</span></label>
            <textarea
              value={commentaire} onChange={e => setCommentaire(e.target.value)}
              rows={4} maxLength={500}
              placeholder="Partagez votre expérience avec ce produit..."
              className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            <p className="text-xs text-secondary text-right mt-1">{commentaire.length}/500</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-outline-variant/30 text-secondary py-3 rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading || note === 0}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Star size={16} />}
              Publier mon avis
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({ order, onReviewSuccess }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.EN_ATTENTE;
  const StatusIcon = cfg.icon;
  const stepIdx = STEP_ORDER[order.status] ?? 0;
  const isCancelled = order.status === 'ANNULEE' || order.status === 'REMBOURSEE';

  const discount = order.couponDiscount || 0;
  const tvaAmount = order.tvaAmount || 0;

  return (
    <div className={`bg-white rounded-2xl border ${expanded ? 'border-primary/20 shadow-lg' : 'border-outline-variant/15 shadow-sm hover:shadow-md hover:border-primary/10'} transition-all duration-300`}>
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status icon */}
        <div className={`w-12 h-12 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}>
          <StatusIcon size={22} className={cfg.color} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-headline font-bold text-primary text-[15px]">{order.reference}</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(order.createdAt)}</span>
            <span className="flex items-center gap-1"><ShoppingBag size={11} />{order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><CreditCard size={11} />{order.paymentMethod === 'CARTE' ? 'Carte bancaire' : 'Livraison'}</span>
          </div>
        </div>

        {/* Total + toggle */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="font-headline font-bold text-primary text-xl">{(order.total || 0).toFixed(2)} <span className="text-sm font-body font-normal">TND</span></div>
            <div className="text-[10px] text-secondary uppercase tracking-wider">Total TTC</div>
          </div>
          <button onClick={() => setExpanded(v => !v)}
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-primary/10 flex items-center justify-center transition-colors">
            {expanded ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-secondary" />}
          </button>
        </div>
      </div>

      {/* Items preview (collapsed) */}
      {!expanded && (
        <div className="px-5 pb-4 flex gap-2 overflow-x-auto">
          {(order.items || []).slice(0, 4).map(item => (
            <div key={item.id} className="w-12 h-12 rounded-lg overflow-hidden bg-beige flex-shrink-0 border border-outline-variant/10">
              {item.image
                ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-sage" /></div>
              }
            </div>
          ))}
          {(order.items?.length || 0) > 4 && (
            <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-xs font-bold text-secondary flex-shrink-0">
              +{order.items.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-outline-variant/10">
          {/* Status Timeline */}
          {!isCancelled && (
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Suivi de commande</h4>
              <div className="flex items-start gap-0">
                {STEPS.map((step, i) => {
                  const done = i <= stepIdx;
                  const active = i === stepIdx;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < stepIdx ? 'bg-primary' : 'bg-outline-variant/20'} transition-colors duration-500`} />
                      )}
                      <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        done ? 'bg-primary border-primary' : 'bg-white border-outline-variant/30'
                      } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                        <StepIcon size={14} className={done ? 'text-white' : 'text-outline-variant/50'} />
                      </div>
                      <span className={`text-[10px] font-semibold mt-2 text-center leading-tight px-1 ${done ? 'text-primary' : 'text-secondary/50'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="px-6 py-5 space-y-4 border-b border-outline-variant/10">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-widest">Articles commandés</h4>
            {(order.items || []).map(item => (
              <div key={item.id} className="flex gap-4 items-start">
                <Link to={`/produits/${item.productSlug}`} className="w-16 h-16 rounded-xl overflow-hidden bg-beige flex-shrink-0 border border-outline-variant/10 hover:opacity-80 transition-opacity">
                  {item.image
                    ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-sage" /></div>
                  }
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/produits/${item.productSlug}`} className="font-semibold text-primary text-sm hover:text-secondary transition-colors line-clamp-1">
                    {item.productName}
                  </Link>
                  <div className="text-xs text-secondary mt-0.5 space-x-2">
                    {item.size && <span>Taille: {item.size}</span>}
                    {item.color && <span>Couleur: {item.color}</span>}
                    <span>Qté: {item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-secondary">{(item.unitPrice || 0).toFixed(2)} TND × {item.quantity}</span>
                    <span className="text-sm font-bold text-primary">{(item.lineTotal || 0).toFixed(2)} TND</span>
                  </div>
                </div>
                {order.status === 'LIVREE' && (
                  <button
                    onClick={() => setReviewItem(item)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    Avis
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Summary + Address */}
          <div className="px-6 py-5 grid md:grid-cols-2 gap-6">
            {/* Récapitulatif */}
            <div>
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Récapitulatif</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-secondary">
                  <span>Sous-total</span>
                  <span>{(order.subtotal || 0).toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Livraison — {order.shippingZoneName}</span>
                  <span className={order.shippingCost === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {order.shippingCost === 0 ? 'Gratuite' : `${(order.shippingCost || 0).toFixed(2)} TND`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1"><Tag size={11} />{order.couponCode}</span>
                    <span>−{discount.toFixed(2)} TND</span>
                  </div>
                )}
                {tvaAmount > 0 && (
                  <div className="flex justify-between text-secondary text-xs">
                    <span>dont TVA ({order.tvaRate || 0}%)</span>
                    <span>{tvaAmount.toFixed(2)} TND</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-primary border-t border-outline-variant/10 pt-2 mt-2">
                  <span>Total TTC</span>
                  <span>{(order.total || 0).toFixed(2)} TND</span>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Livraison à</h4>
              <div className="flex gap-2 text-sm text-secondary">
                <MapPin size={14} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-primary font-semibold">{order.firstName} {order.lastName}</p>
                  <p>{order.address}</p>
                  <p>{order.postalCode} {order.city}</p>
                  {order.gouvernorat && <p>{order.gouvernorat}</p>}
                  {order.phone && <p className="mt-1">{order.phone}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewItem && (
        <ReviewModal
          order={order}
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onSuccess={() => { setReviewItem(null); onReviewSuccess?.(); }}
        />
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function MesCommandes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('tous');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError('Impossible de charger vos commandes.');
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { key: 'tous',          label: 'Toutes' },
    { key: 'EN_ATTENTE',    label: 'En attente' },
    { key: 'EN_PREPARATION',label: 'En préparation' },
    { key: 'EXPEDIEE',      label: 'Expédiées' },
    { key: 'LIVREE',        label: 'Livrées' },
    { key: 'ANNULEE',       label: 'Annulées' },
  ];

  const filtered = filter === 'tous' ? orders : orders.filter(o => o.status === filter);

  // Stats
  const totalSpent = orders.filter(o => o.status !== 'ANNULEE' && o.status !== 'REMBOURSEE').reduce((s, o) => s + (o.total || 0), 0);
  const pendingCount = orders.filter(o => ['EN_ATTENTE','EN_PREPARATION','EXPEDIEE'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'LIVREE').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige/40 to-white">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronDown size={14} className="-rotate-90" />
            <span className="text-white">Mes commandes</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-white mb-1">Mes commandes</h1>
          <p className="text-white/70 font-body">Bonjour {user?.firstName}, retrouvez l'historique de vos achats.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 -mt-4">
        {/* Stats Cards */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Commandes', value: orders.length, icon: Receipt, color: 'text-primary bg-primary/10' },
              { label: 'En cours', value: pendingCount, icon: Truck, color: 'text-violet-700 bg-violet-50' },
              { label: 'Livrées', value: deliveredCount, icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-headline font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-secondary">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review success toast */}
        {reviewSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Avis envoyé !</p>
              <p className="text-sm text-emerald-700">Votre avis est en attente de modération.</p>
            </div>
            <button onClick={() => setReviewSuccess(false)} className="ml-auto text-emerald-600 hover:text-emerald-800">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Filters */}
        {orders.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                  filter === f.key
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-secondary border-outline-variant/20 hover:border-primary/30 hover:text-primary'
                }`}>
                {f.label}
                {f.key !== 'tous' && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({orders.filter(o => o.status === f.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-secondary">Chargement de vos commandes...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button onClick={load} className="flex items-center gap-2 mx-auto bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              <RefreshCw size={16} /> Réessayer
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-12 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShoppingBag size={36} className="text-primary/40" />
            </div>
            <h3 className="text-xl font-headline font-bold text-primary mb-2">Aucune commande</h3>
            <p className="text-secondary mb-6">Vous n'avez pas encore passé de commande. Découvrez notre catalogue !</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              <ShoppingBag size={18} /> Commencer mes achats
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-10 text-center">
            <Eye size={36} className="text-secondary/40 mx-auto mb-3" />
            <p className="text-secondary">Aucune commande dans cette catégorie.</p>
            <button onClick={() => setFilter('tous')} className="mt-3 text-primary font-semibold text-sm hover:underline">
              Voir toutes les commandes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onReviewSuccess={() => { setReviewSuccess(true); setTimeout(() => setReviewSuccess(false), 5000); }}
              />
            ))}
          </div>
        )}

        {/* Total spent */}
        {!loading && orders.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">Total dépensé</p>
              <p className="text-2xl font-headline font-bold text-primary mt-0.5">{totalSpent.toFixed(2)} TND</p>
            </div>
            <Link to="/" className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm">
              <ShoppingBag size={16} /> Continuer mes achats <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
