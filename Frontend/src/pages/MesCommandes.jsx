import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, Star, ArrowRight, RefreshCw, Eye,
  MapPin, CreditCard, Tag, Calendar, Receipt, AlertCircle
} from 'lucide-react';
import { fetchMyOrders, submitReview, submitReturn, fetchMyReturns, fetchReturnPolicy } from '../api/apiClient';
import { getUser } from '../api/tokenStorage';
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

// ── Return Modal ────────────────────────────────────────────────────────────
const RETURN_REASONS = [
  'Produit défectueux',
  'Non conforme à la description',
  'Produit endommagé à la réception',
  'Réaction allergique',
  'Produit expiré',
  'Erreur de commande',
  'Autre',
];

function ReturnModal({ order, item, existingReturnIds, onClose, onSuccess }) {
  const [raison, setRaison] = useState(RETURN_REASONS[0]);
  const [commentaire, setCommentaire] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [iban, setIban] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policy, setPolicy] = useState(null);

  const alreadyReturned = existingReturnIds.includes(item.id);
  const needsIban = policy?.modeRemboursement === 'Virement bancaire';
  const duree = policy?.dureeJours ?? 30;
  const windowStart = order.deliveredAt || null;
  const deadline = windowStart
    ? new Date(new Date(windowStart).getTime() + duree * 24 * 60 * 60 * 1000)
    : null;
  const isExpired = deadline ? Date.now() > deadline.getTime() : false;

  useEffect(() => {
    fetchReturnPolicy().then(setPolicy).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 2 - photos.length);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(prev => [...prev, ev.target.result].slice(0, 2));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsIban && !iban.trim()) { setError('Veuillez saisir votre IBAN pour le remboursement par virement.'); return; }
    setLoading(true);
    setError('');
    try {
      await submitReturn({
        orderId: order.id, orderItemId: item.id, raison, commentaire,
        photo1: photos[0] || null, photo2: photos[1] || null,
        ibanClient: needsIban ? iban.trim() : null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.message || err?.error || 'Erreur lors de la soumission.';
      if (msg.includes('existe déjà')) {
        setDuplicate(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const modeLabel = policy?.modeRemboursement ?? 'Mode original';

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-6 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto" onClick={e => e.stopPropagation()}>
        {/* Sticky header */}
        <div className="sticky top-0 bg-white rounded-t-2xl z-10 flex items-start gap-4 px-6 pt-6 pb-4 border-b border-outline-variant/15">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-beige flex-shrink-0">
            {item.image
              ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-sage" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline font-bold text-primary text-base leading-tight">{item.productName}</h3>
            <p className="text-xs text-secondary mt-0.5">Commande {order.reference}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-low flex-shrink-0">
            <XCircle size={20} className="text-secondary" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(100vh-200px)]">
          {alreadyReturned || duplicate ? (
            <div className="text-center py-8">
              <RefreshCw size={32} className="mx-auto text-emerald-500 mb-3" />
              <p className="font-semibold text-primary">Retour déjà soumis</p>
              <p className="text-sm text-secondary mt-1">Une demande de retour existe déjà pour cet article.</p>
            </div>
          ) : isExpired ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-red-400" />
              </div>
              <p className="font-semibold text-primary text-base">Délai de retour dépassé</p>
              <p className="text-sm text-secondary mt-2">
                La période de retour de <strong>{duree} jours</strong> est expirée
                {deadline ? <> (date limite : <strong>{deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>)</> : ''}.
              </p>
              <p className="text-xs text-secondary mt-1">Aucun retour ne peut être soumis pour cet article.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl border border-outline-variant/30 text-secondary text-sm font-semibold hover:bg-surface-container-low transition">
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Reasons */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Raison du retour *</label>
                <div className="grid grid-cols-1 gap-2">
                  {RETURN_REASONS.map(r => (
                    <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      raison === r ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/20 hover:bg-surface-container-low text-secondary'
                    }`}>
                      <input type="radio" name="raison" value={r} checked={raison === r} onChange={() => setRaison(r)} className="accent-primary" />
                      <span className="text-sm font-medium">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Commentaire <span className="font-normal text-secondary">(optionnel)</span>
                </label>
                <textarea
                  value={commentaire} onChange={e => setCommentaire(e.target.value)}
                  rows={3} maxLength={500}
                  placeholder="Décrivez le problème en détail..."
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Photos / Preuves <span className="font-normal text-secondary">(optionnel, max 2)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/20 group">
                      <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <XCircle size={20} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 2 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition">
                      <span className="text-2xl text-secondary/50 mb-1">+</span>
                      <span className="text-[10px] text-secondary">Ajouter</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* IBAN — shown only when mode = Virement bancaire */}
              {needsIban && (
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">
                    IBAN pour le remboursement <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-secondary mb-2">Le remboursement sera effectué par virement bancaire.</p>
                  <input
                    type="text"
                    value={iban}
                    onChange={e => setIban(e.target.value.toUpperCase())}
                    placeholder="TN59 0000 0000 0000 0000 0000"
                    maxLength={34}
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-mono text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

              {/* Policy banner — dynamic */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 space-y-1">
                <p><strong>Politique de retour :</strong> Retour accepté dans les <strong>{duree} jours</strong> suivant la réception
                  {policy?.eligibilite ? `, pour produit ${policy.eligibilite.toLowerCase()}.` : '.'}</p>
                <p><strong>Remboursement :</strong> {modeLabel}
                  {policy?.fraisRetour ? <> · <strong>Frais :</strong> {policy.fraisRetour}</> : null}</p>
                {policy?.conditionsSpeciales && <p><strong>Conditions :</strong> {policy.conditionsSpeciales}</p>}
              </div>

              <div className="flex gap-3 pb-1">
                <button type="button" onClick={onClose} className="flex-1 border border-outline-variant/30 text-secondary py-3 rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Soumettre le retour
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
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
      setError(err?.error || err?.message || 'Erreur lors de la soumission.');
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
function OrderCard({ order, onReviewSuccess, myReturnItemIds, myReturns, onReturnSuccess }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [returnItem, setReturnItem] = useState(null);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.EN_ATTENTE;
  const StatusIcon = cfg.icon;
  const stepIdx = STEP_ORDER[order.status] ?? 0;
  const isCancelled = order.status === 'ANNULEE' || order.status === 'REMBOURSEE';

  const orderReturns = (myReturns || []).filter(r => r.orderId === order.id);
  const hasPendingReturn = orderReturns.some(r => r.status === 'EN_ATTENTE');

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
            {hasPendingReturn && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                <RefreshCw size={10} className="animate-spin" />
                Retour en cours
              </span>
            )}
            {orderReturns.length > 0 && !hasPendingReturn && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                <RefreshCw size={10} />
                Retour traité
              </span>
            )}
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
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setReturnItem(item)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-secondary bg-surface-container-low hover:bg-primary/10 border border-outline-variant/20 hover:border-primary/30 hover:text-primary px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RefreshCw size={12} />
                      Retour
                    </button>
                    <button
                      onClick={() => setReviewItem(item)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      Avis
                    </button>
                  </div>
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

      {/* Return Modal */}
      {returnItem && (
        <ReturnModal
          order={order}
          item={returnItem}
          existingReturnIds={myReturnItemIds || []}
          onClose={() => setReturnItem(null)}
          onSuccess={() => { setReturnItem(null); onReturnSuccess?.(); }}
        />
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function MesCommandes() {
  const [orders, setOrders] = useState([]);
  const [myReturnItemIds, setMyReturnItemIds] = useState([]);
  const [myReturns, setMyReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('tous');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);
  const navigate = useNavigate();

  const user = getUser();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, returns] = await Promise.all([fetchMyOrders(), fetchMyReturns().catch(() => [])]);
      setOrders(Array.isArray(data) ? data : []);
      const returnList = Array.isArray(returns) ? returns : [];
      setMyReturns(returnList);
      const ids = returnList.map(r => r.orderItemId);
      setMyReturnItemIds(ids);
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

        {/* Return success toast */}
        {returnSuccess && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <RefreshCw size={20} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-800">Demande de retour soumise !</p>
              <p className="text-sm text-blue-700">Notre équipe traitera votre demande sous 2-3 jours ouvrés.</p>
            </div>
            <button onClick={() => setReturnSuccess(false)} className="ml-auto text-blue-600 hover:text-blue-800">
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
                myReturnItemIds={myReturnItemIds}
                myReturns={myReturns}
                onReviewSuccess={() => { setReviewSuccess(true); setTimeout(() => setReviewSuccess(false), 5000); }}
                onReturnSuccess={() => { setReturnSuccess(true); load(); setTimeout(() => setReturnSuccess(false), 6000); }}
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
