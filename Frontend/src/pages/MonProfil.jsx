import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Star, ShieldCheck, ChevronDown, CheckCircle,
  Edit3, Save, X, RefreshCw, AlertCircle, Package, Heart,
  Phone, Mail, Calendar, Users, Award, Clock, ShoppingBag, Leaf
} from 'lucide-react';
import { fetchMyProfile, updateMyProfile, fetchMyReviews, fetchMyOrders, fetchMyLoyalty } from '../api/apiClient';

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getInitials(firstName, lastName) {
  return [(firstName || '').charAt(0), (lastName || '').charAt(0)]
    .filter(Boolean).join('').toUpperCase() || '?';
}

const GOUVERNORATS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
  'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
  'Tataouine','Tozeur','Tunis','Zaghouan',
];

const GENDER_LABELS = { HOMME: 'Homme', FEMME: 'Femme', NON_PRECISE: 'Non précisé' };

const STATUS_CFG = {
  EN_ATTENTE:      { label: 'En attente',     color: 'text-amber-700',   bg: 'bg-amber-50'   },
  EN_PREPARATION:  { label: 'En préparation', color: 'text-blue-700',    bg: 'bg-blue-50'    },
  EXPEDIEE:        { label: 'Expédiée',       color: 'text-violet-700',  bg: 'bg-violet-50'  },
  LIVREE:          { label: 'Livrée',         color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ANNULEE:         { label: 'Annulée',        color: 'text-red-700',     bg: 'bg-red-50'     },
};

// ── Field components ────────────────────────────────────────────────────────
function FormField({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full border border-outline-variant/25 rounded-xl px-4 py-3 text-sm text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-secondary/40 disabled:bg-surface-container-low disabled:cursor-not-allowed";

// ── Sidebar Nav ─────────────────────────────────────────────────────────────
const TABS = [
  { key: 'info',     label: 'Informations personnelles', icon: User },
  { key: 'address',  label: 'Adresse',                   icon: MapPin },
  { key: 'orders',   label: 'Mes commandes',             icon: ShoppingBag, link: '/commandes' },
  { key: 'reviews',  label: 'Mes avis',                  icon: Star },
  { key: 'loyalty',  label: 'Points & Fidélité',         icon: Award },
  { key: 'security', label: 'Sécurité',                  icon: ShieldCheck },
];

// ── Section: Loyalty ────────────────────────────────────────────────────────
const TX_TYPE_CFG = {
  COMMANDE:     { label: 'Commande',     color: 'text-emerald-700', bg: 'bg-emerald-50' },
  AVIS:         { label: 'Avis client',  color: 'text-blue-700',    bg: 'bg-blue-50'    },
  BIENVENUE:    { label: 'Bienvenue',    color: 'text-violet-700',  bg: 'bg-violet-50'  },
  ANNIVERSAIRE: { label: 'Anniversaire',color: 'text-pink-700',    bg: 'bg-pink-50'    },
  AJUSTEMENT:   { label: 'Ajustement',  color: 'text-amber-700',   bg: 'bg-amber-50'   },
};

const BENEFIT_LABELS = {
  livraisonGratuiteStandard: 'Livraison standard gratuite',
  livraisonGratuiteExpress:  'Livraison express gratuite',
  livraisonPrioritaire:      'Livraison prioritaire',
  cadeauAnniversaire:        'Cadeau anniversaire',
  emballageOffert:           'Emballage cadeau',
  echantillonsGratuits:      'Échantillons gratuits',
  accesAnticipe:             'Accès anticipé',
  produitExclusif:           'Produits exclusifs',
  invitationsEvenements:     'Invitations événements',
  accesVentesPrivees:        'Ventes privées',
  prioriteSupport:           'Priorité support',
  retourEtendu:              'Retour étendu',
  conseillerPersonnel:       'Conseiller personnel',
};

function LoyaltySection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchMyLoyalty()
      .then(setData)
      .catch(() => setErr('Impossible de charger vos points de fidélité.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (err) return <p className="text-red-600 text-sm py-8 text-center">{err}</p>;
  if (!data) return null;

  const { points, currentSegment, nextSegment, history } = data;
  const progressPct = (nextSegment && nextSegment.seuilPoints > 0)
    ? Math.min(100, Math.round((points / nextSegment.seuilPoints) * 100))
    : 100;

  const activeBenefits = currentSegment
    ? Object.entries(BENEFIT_LABELS).filter(([k]) => currentSegment[k] === true)
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-headline font-bold text-primary flex items-center gap-2"><Award size={20} /> Points & Fidélité</h2>

      {/* Balance + tier */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Star size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-headline font-bold text-primary">{points}</p>
            <p className="text-xs text-secondary uppercase tracking-wider font-semibold">points fidélité</p>
          </div>
        </div>

        {currentSegment && (
          <div className="flex-1 rounded-2xl p-5 text-white flex items-center gap-4"
               style={{ backgroundColor: currentSegment.color || '#6366f1' }}>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Award size={28} />
            </div>
            <div>
              <p className="font-bold text-xl">{currentSegment.label}</p>
              {currentSegment.description && <p className="text-xs opacity-80 mt-0.5">{currentSegment.description}</p>}
              {currentSegment.remiseAutomatique > 0 && (
                <p className="text-xs font-semibold mt-1 opacity-90">−{currentSegment.remiseAutomatique}% sur vos achats</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress to next tier */}
      {nextSegment && (
        <div className="bg-surface-container-low/40 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-secondary">
            <span>{points} pts</span>
            <span>{nextSegment.seuilPoints} pts requis pour <span style={{ color: nextSegment.color || '#6366f1' }}>{nextSegment.label}</span></span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border border-outline-variant/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: nextSegment.color || '#6366f1' }}
            />
          </div>
          <p className="text-[11px] text-secondary text-center">{nextSegment.seuilPoints - points} pts pour atteindre {nextSegment.label}</p>
        </div>
      )}

      {/* Active benefits */}
      {activeBenefits.length > 0 && (
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Vos avantages actuels</p>
          <div className="flex flex-wrap gap-2">
            {activeBenefits.map(([k, label]) => (
              <span key={k} className="inline-flex items-center gap-1 bg-primary/8 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                <CheckCircle size={11} /> {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Historique des points</p>
        {history && history.length > 0 ? (
          <div className="divide-y divide-outline-variant/10 border border-outline-variant/10 rounded-2xl overflow-hidden">
            {history.map(tx => {
              const cfg = TX_TYPE_CFG[tx.type] || TX_TYPE_CFG.AJUSTEMENT;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  <p className="flex-1 text-sm text-secondary truncate">{tx.description || '—'}</p>
                  <span className={`text-sm font-bold ${tx.points >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.points >= 0 ? '+' : ''}{tx.points} pts
                  </span>
                  <span className="text-[11px] text-secondary/60 flex-shrink-0">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary/60 text-center py-6">Aucune transaction enregistrée.</p>
        )}
      </div>
    </div>
  );
}

// ── Section: Personal info ───────────────────────────────────────────────────
function PersonalInfoSection({ profile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const startEdit = () => {
    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
    });
    setEditing(true);
    setError('');
    setSuccess(false);
  };

  const cancel = () => { setEditing(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      if (!payload.gender) delete payload.gender;
      await updateMyProfile(payload);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      onSaved();
    } catch (err) {
      setError(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-primary text-xl">Informations personnelles</h2>
          <p className="text-sm text-secondary mt-0.5">Gérez vos coordonnées et données de compte.</p>
        </div>
        {!editing && (
          <button onClick={startEdit}
            className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 px-4 py-2 rounded-xl transition-colors">
            <Edit3 size={14} /> Modifier
          </button>
        )}
      </div>

      {success && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-semibold">Informations mises à jour avec succès.</p>
        </div>
      )}

      {!editing ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { label: 'Prénom', value: profile.firstName, icon: User },
            { label: 'Nom', value: profile.lastName, icon: User },
            { label: 'E-mail', value: profile.email, icon: Mail, full: true },
            { label: 'Téléphone', value: profile.phone, icon: Phone },
            { label: 'Date de naissance', value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null, icon: Calendar },
            { label: 'Genre', value: GENDER_LABELS[profile.gender], icon: Users },
          ].map(f => (
            <div key={f.label} className={`${f.full ? 'sm:col-span-2' : ''} bg-surface-container-low/50 rounded-xl p-4`}>
              <div className="flex items-center gap-2 text-xs text-secondary font-bold uppercase tracking-widest mb-1.5">
                <f.icon size={11} /> {f.label}
              </div>
              <p className="text-primary font-semibold text-sm">{f.value || <span className="text-secondary/50 font-normal">—</span>}</p>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Prénom">
              <input className={inputCls} value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} placeholder="Votre prénom" />
            </FormField>
            <FormField label="Nom">
              <input className={inputCls} value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} placeholder="Votre nom" />
            </FormField>
          </div>
          <FormField label="Téléphone">
            <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+216 XX XXX XXX" type="tel" />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Date de naissance">
              <input className={inputCls} value={form.dateOfBirth} onChange={e => setForm(f => ({...f, dateOfBirth: e.target.value}))} type="date" max={new Date().toISOString().split('T')[0]} />
            </FormField>
            <FormField label="Genre">
              <select className={inputCls} value={form.gender || ''} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                <option value="">— Choisir —</option>
                <option value="HOMME">Homme</option>
                <option value="FEMME">Femme</option>
                <option value="NON_PRECISE">Non précisé</option>
              </select>
            </FormField>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={cancel} className="flex items-center gap-2 border border-outline-variant/25 text-secondary px-5 py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-sm">
              <X size={14} /> Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm disabled:opacity-60">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Section: Address ────────────────────────────────────────────────────────
function AddressSection({ profile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const startEdit = () => {
    setForm({
      address: profile.address || '',
      city: profile.city || '',
      postalCode: profile.postalCode || '',
      gouvernorat: profile.gouvernorat || '',
      country: profile.country || 'Tunisie',
    });
    setEditing(true);
    setError('');
    setSuccess(false);
  };

  const cancel = () => { setEditing(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateMyProfile(form);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      onSaved();
    } catch (err) {
      setError(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const hasAddress = profile.address || profile.city;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-primary text-xl">Adresse de livraison</h2>
          <p className="text-sm text-secondary mt-0.5">Votre adresse principale pour la livraison de vos commandes.</p>
        </div>
        {!editing && (
          <button onClick={startEdit}
            className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 px-4 py-2 rounded-xl transition-colors">
            <Edit3 size={14} /> {hasAddress ? 'Modifier' : 'Ajouter'}
          </button>
        )}
      </div>

      {success && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-semibold">Adresse mise à jour avec succès.</p>
        </div>
      )}

      {!editing ? (
        hasAddress ? (
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-primary">{profile.firstName} {profile.lastName}</p>
                <p className="text-sm text-secondary">{profile.address}</p>
                <p className="text-sm text-secondary">{profile.postalCode} {profile.city}</p>
                {profile.gouvernorat && <p className="text-sm text-secondary">{profile.gouvernorat}</p>}
                <p className="text-sm text-secondary">{profile.country || 'Tunisie'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-outline-variant/20 rounded-2xl p-10 text-center">
            <MapPin size={32} className="text-secondary/30 mx-auto mb-3" />
            <p className="text-secondary mb-3">Aucune adresse enregistrée</p>
            <button onClick={startEdit} className="text-primary font-semibold text-sm hover:underline">
              + Ajouter une adresse
            </button>
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Adresse">
            <input className={inputCls} value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Rue, numéro, résidence..." />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Code postal">
              <input className={inputCls} value={form.postalCode} onChange={e => setForm(f => ({...f, postalCode: e.target.value}))} placeholder="XXXX" />
            </FormField>
            <FormField label="Ville">
              <input className={inputCls} value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="Votre ville" />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Gouvernorat">
              <select className={inputCls} value={form.gouvernorat} onChange={e => setForm(f => ({...f, gouvernorat: e.target.value}))}>
                <option value="">— Choisir —</option>
                {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField label="Pays">
              <input className={inputCls} value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} placeholder="Tunisie" />
            </FormField>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={cancel} className="flex items-center gap-2 border border-outline-variant/25 text-secondary px-5 py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-sm">
              <X size={14} /> Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm disabled:opacity-60">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Section: Reviews ─────────────────────────────────────────────────────────
function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyReviews()
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setError('Impossible de charger vos avis.'))
      .finally(() => setLoading(false));
  }, []);

  const STAR_LABELS = ['','Très déçu(e)','Déçu(e)','Correct','Bien','Excellent !'];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline font-bold text-primary text-xl">Mes avis produits</h2>
        <p className="text-sm text-secondary mt-0.5">Les avis que vous avez partagés sur nos produits.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-secondary text-sm">Chargement...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-center">
          <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="border-2 border-dashed border-outline-variant/20 rounded-2xl p-10 text-center">
          <Star size={32} className="text-secondary/30 mx-auto mb-3" />
          <p className="text-secondary mb-1">Aucun avis pour le moment</p>
          <p className="text-sm text-secondary/60">Après réception de vos commandes, vous pourrez laisser un avis sur chaque produit.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-outline-variant/15 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {review.productImage && (
                  <Link to={`/produits/${review.productSlug}`} className="w-14 h-14 rounded-xl overflow-hidden bg-beige flex-shrink-0 hover:opacity-80 transition-opacity">
                    <img src={review.productImage} alt={review.productName} className="w-full h-full object-cover" />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/produits/${review.productSlug}`} className="font-semibold text-primary hover:text-secondary transition-colors text-sm line-clamp-1">
                    {review.productName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={13} className={n <= (review.note || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                    <span className="text-xs text-secondary font-semibold">{STAR_LABELS[review.note || 0]}</span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      review.statut === 'Approuvé' ? 'bg-emerald-50 text-emerald-700' :
                      review.statut === 'Refusé' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {review.statut || 'En attente'}
                    </span>
                  </div>
                  {review.commentaire && (
                    <p className="text-sm text-secondary mt-2 leading-relaxed">{review.commentaire}</p>
                  )}
                  <p className="text-[10px] text-secondary/50 mt-2">{formatDate(review.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section: Security ────────────────────────────────────────────────────────
function SecuritySection({ profile }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline font-bold text-primary text-xl">Sécurité du compte</h2>
        <p className="text-sm text-secondary mt-0.5">Gérez votre mot de passe et la sécurité de votre compte.</p>
      </div>

      <div className="space-y-4">
        {/* Email info */}
        <div className="bg-surface-container-low/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Adresse e-mail</p>
            <p className="text-primary font-semibold">{profile.email}</p>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <CheckCircle size={11} /> Vérifiée
          </span>
        </div>

        {/* Password */}
        <div className="bg-surface-container-low/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Mot de passe</p>
            <p className="text-primary font-semibold">••••••••</p>
          </div>
          <span className="text-xs text-secondary/50 italic">Changement à venir</span>
        </div>

        {/* Last login */}
        {profile.lastLogin && (
          <div className="bg-surface-container-low/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Dernière connexion</p>
              <p className="text-primary font-semibold">{formatDate(profile.lastLogin)}</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Conseils de sécurité</p>
            <ul className="text-xs text-amber-700 mt-1.5 space-y-1 list-disc list-inside">
              <li>Utilisez un mot de passe unique d'au moins 8 caractères</li>
              <li>Ne partagez jamais vos identifiants</li>
              <li>Déconnectez-vous après chaque session sur un appareil partagé</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function MonProfil() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();

  const localUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useEffect(() => {
    if (!localUser) { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [prof, ords] = await Promise.allSettled([fetchMyProfile(), fetchMyOrders()]);
      if (prof.status === 'fulfilled') setProfile(prof.value);
      else throw new Error('Impossible de charger votre profil.');
      if (ords.status === 'fulfilled') setOrders(Array.isArray(ords.value) ? ords.value : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stats derived from orders
  const totalSpent = orders.filter(o => !['ANNULEE','REMBOURSEE'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'LIVREE').length;
  const pendingCount = orders.filter(o => ['EN_ATTENTE','EN_PREPARATION','EXPEDIEE'].includes(o.status)).length;
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige/40 to-white">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronDown size={14} className="-rotate-90" />
            <span className="text-white">Mon profil</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-white/20 rounded-lg animate-pulse" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div className="w-18 h-18 flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                  <span className="text-white font-headline font-bold text-2xl">
                    {getInitials(profile.firstName, profile.lastName)}
                  </span>
                </div>
              </div>
              {/* Info */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-white/70 text-sm mt-1">{profile.email}</p>
                {profile.segment && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-900 bg-gold/90 px-3 py-1 rounded-full">
                    <Award size={11} /> {profile.segment.name || profile.segment}
                  </span>
                )}
              </div>
              {/* Stats mini */}
              <div className="sm:ml-auto flex gap-4 sm:gap-6 text-center">
                {[
                  { label: 'Commandes', value: orders.length },
                  { label: 'Livrées', value: deliveredCount },
                  { label: 'Total dépensé', value: `${totalSpent.toFixed(0)} TND` },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl sm:text-2xl font-headline font-bold text-white">{s.value}</div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-8 -mt-4">
        {error && !profile && (
          <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button onClick={loadAll} className="flex items-center gap-2 mx-auto bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              <RefreshCw size={16} /> Réessayer
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-secondary">Chargement du profil...</p>
          </div>
        )}

        {!loading && profile && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <aside className="md:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
                {TABS.map((tab, i) => {
                  const Icon = tab.icon;
                  if (tab.link) {
                    return (
                      <Link key={tab.key} to={tab.link}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-secondary hover:bg-surface-container-low hover:text-primary transition-colors border-b border-outline-variant/10 last:border-0">
                        <Icon size={16} className="flex-shrink-0" />
                        {tab.label}
                        {pendingCount > 0 && tab.key === 'orders' && (
                          <span className="ml-auto text-[10px] bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingCount}</span>
                        )}
                      </Link>
                    );
                  }
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors border-b border-outline-variant/10 last:border-0 ${
                        activeTab === tab.key
                          ? 'bg-primary/5 text-primary border-l-2 border-l-primary'
                          : 'text-secondary hover:bg-surface-container-low hover:text-primary'
                      }`}>
                      <Icon size={16} className="flex-shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}

                {/* Account info */}
                {profile.createdAt && (
                  <div className="px-5 py-4 border-t border-outline-variant/10 bg-surface-container-low/30">
                    <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-bold mb-1">Membre depuis</p>
                    <p className="text-xs text-secondary font-semibold">{formatDate(profile.createdAt)}</p>
                  </div>
                )}
              </div>

              {/* Recent orders mini */}
              {recentOrders.length > 0 && (
                <div className="mt-4 bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Récent</p>
                    <Link to="/commandes" className="text-[10px] text-primary font-semibold hover:underline">Voir tout</Link>
                  </div>
                  <div className="space-y-2">
                    {recentOrders.map(o => {
                      const cfg = STATUS_CFG[o.status] || STATUS_CFG.EN_ATTENTE;
                      return (
                        <div key={o.id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-primary truncate">{o.reference}</p>
                            <p className="text-[10px] text-secondary">{formatDate(o.createdAt)}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* Main content */}
            <div className="flex-1 bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 md:p-8 min-h-[400px]">
              {activeTab === 'info' && (
                <PersonalInfoSection profile={profile} onSaved={loadAll} />
              )}
              {activeTab === 'address' && (
                <AddressSection profile={profile} onSaved={loadAll} />
              )}
              {activeTab === 'reviews' && (
                <ReviewsSection />
              )}
              {activeTab === 'loyalty' && (
                <LoyaltySection />
              )}
              {activeTab === 'security' && (
                <SecuritySection profile={profile} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
