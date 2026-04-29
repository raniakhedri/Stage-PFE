import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Minus, Plus, Trash2, ShoppingBag, Truck, CreditCard, Banknote, Tag, X, CheckCircle, MapPin, Plus as PlusIcon } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';
import { fetchMyProfile } from '../api/apiClient';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

const API = 'http://localhost:8080/api/v1/public';

async function fetchShippingZones() {
  const res = await fetch(`${API}/checkout/shipping-zones`);
  return res.json();
}

async function fetchTvaConfig() {
  const res = await fetch(`${API}/checkout/tva-config`);
  return res.json();
}

async function createPaymentIntent(amount, orderReference) {
  const res = await fetch(`${API}/stripe/payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, orderReference }),
  });
  if (!res.ok) throw new Error('Stripe error');
  return res.json();
}

async function validateCouponCode(code, userId) {
  const params = new URLSearchParams({ code: code.trim().toUpperCase() });
  if (userId) params.append('userId', String(userId));
  const res = await fetch(`${API}/coupons/validate?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Code coupon invalide');
  }
  return res.json();
}

async function placeOrder(payload) {
  const res = await fetch(`${API}/checkout/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Erreur commande');
  }
  return res.json();
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, updateQty, removeFromCart } = useShop();
  const items = cart;
  const total = cartTotal;
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [tvaConfig, setTvaConfig] = useState(null);
  const [step, setStep] = useState('info'); // 'info' | 'payment'
  const [paymentMethod, setPaymentMethod] = useState('ESPECES_LIVRAISON');
  const [clientSecret, setClientSecret] = useState(null);
  const [orderRef, setOrderRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Saved address from profile
  const [savedAddress, setSavedAddress] = useState(null);
  const [addressMode, setAddressMode] = useState('new'); // 'saved' | 'new'

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    gouvernorat: '',
    shippingZoneName: '',
  });

  // Pre-fill from logged-in user + fetch saved address
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u) {
        setForm((f) => ({
          ...f,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          phone: u.phone || '',
        }));
        // Fetch full profile to get saved address
        fetchMyProfile().then((profile) => {
          if (profile?.address) {
            setSavedAddress(profile);
            // Auto-select saved address
            setAddressMode('saved');
            setForm((f) => ({
              ...f,
              address: profile.address || '',
              city: profile.city || '',
              postalCode: profile.postalCode || '',
              gouvernorat: profile.gouvernorat || '',
            }));
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchShippingZones()
      .then((z) => {
        setZones(z);
        if (z.length > 0) setForm((f) => ({ ...f, shippingZoneName: z[0].nom }));
      })
      .catch(() => {});
    fetchTvaConfig().then(setTvaConfig).catch(() => {});
  }, []);

  const selectedZone = zones.find((z) => z.nom === form.shippingZoneName);
  // Free shipping applies if cart total meets the admin-configured threshold
  const freeShippingThreshold = tvaConfig?.standardEnabled && tvaConfig?.standardSeuil > 0 ? tvaConfig.standardSeuil : null;
  const rawShippingCost = selectedZone ? (selectedZone.cout ?? 0) : 0;
  const shippingCost = freeShippingThreshold && total >= freeShippingThreshold ? 0 : rawShippingCost;
  // TVA info (TVA is included in product prices — display informative line only)
  const tvaRate = tvaConfig?.tvaActive ? (tvaConfig.tauxDefaut ?? 0) : 0;
  const tvaAmount = tvaRate > 0 ? Math.round((total / (1 + tvaRate / 100)) * (tvaRate / 100) * 100) / 100 : 0;

  // Compute discount from applied coupon
  const computeDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotalWithShipping = total + shippingCost;
    switch (appliedCoupon.type) {
      case 'pourcentage':
        return Math.min((subtotalWithShipping * appliedCoupon.valeur) / 100, subtotalWithShipping);
      case 'fixe':
        return Math.min(appliedCoupon.valeur, subtotalWithShipping);
      case 'livraison':
        return shippingCost;
      default:
        return 0;
    }
  };
  const discount = computeDiscount();
  const orderTotal = total + shippingCost - discount;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
      const data = await validateCouponCode(couponInput, user?.id || null);

      // Check minimum order amount
      if (data.montantMin > 0 && (total + shippingCost) < data.montantMin) {
        setCouponError(`Montant minimum requis : ${data.montantMin.toFixed(2)} TND`);
        return;
      }

      // Check category restriction
      if (data.categories && data.categories.length > 0) {
        const allowed = data.categories.map(c => c.toLowerCase().trim()).filter(Boolean);
        const cartHasMatch = items.some(item => {
          const cat = (item.category || '').toLowerCase().trim();
          const parent = (item.parentCategory || '').toLowerCase().trim();
          // Guard: skip if both are empty (old localStorage item without category info)
          if (!cat && !parent) return false;
          return allowed.some(a =>
            (cat && (cat === a || cat.includes(a) || a.includes(cat))) ||
            (parent && (parent === a || parent.includes(a) || a.includes(parent)))
          );
        });
        if (!cartHasMatch) {
          setCouponError(`Ce coupon est réservé aux catégories : ${data.categories.join(', ')}`);
          return;
        }
      }

      // Check product restriction
      if (data.produits && data.produits.length > 0) {
        const allowed = data.produits.map(p => p.toLowerCase().trim()).filter(Boolean);
        const cartHasMatch = items.some(item => {
          const name = (item.name || '').toLowerCase().trim();
          const slug = (item.slug || '').toLowerCase().trim();
          return allowed.some(a =>
            (name && (name === a || name.includes(a))) ||
            (slug && slug === a)
          );
        });
        if (!cartHasMatch) {
          setCouponError(`Ce coupon est réservé à des produits spécifiques non présents dans votre panier`);
          return;
        }
      }

      setAppliedCoupon(data);
      setCouponError('');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError('');
    setLoading(true);

    const ref = `ORDER-${Date.now()}`;
    setOrderRef(ref);

    if (paymentMethod === 'CARTE' && stripePromise) {
      try {
        const { clientSecret: cs } = await createPaymentIntent(orderTotal, ref);
        setClientSecret(cs);
        setStep('payment');
      } catch (err) {
        setError('Erreur lors de la création du paiement. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    } else {
      // Cash on delivery — place order immediately
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        await placeOrder({
          ...form,
          paymentMethod: 'ESPECES_LIVRAISON',
          userId: user?.id || null,
          couponCode: appliedCoupon?.code || null,
          items: items.map((i) => ({
            productId: i.id,
            productName: i.name,
            productSlug: i.slug,
            image: i.image,
            size: i.volume || '',
            unitPrice: i.price,
            quantity: i.qty,
          })),
        });
        clearCart();
        navigate('/confirmation');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStripeSuccess = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      await placeOrder({
        ...form,
        paymentMethod: 'CARTE',
        userId: user?.id || null,
        couponCode: appliedCoupon?.code || null,
        items: items.map((i) => ({
          productId: i.id,
          productName: i.name,
          productSlug: i.slug,
          image: i.image,
          size: i.volume || '',
          unitPrice: i.price,
          quantity: i.qty,
        })),
      });
      clearCart();
      navigate('/confirmation');
    } catch (err) {
      setError(err.message);
    }
  };

  if (items.length === 0 && step === 'info') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <ShoppingBag size={48} className="text-outline-variant" />
        <p className="text-on-surface-variant text-lg">Votre panier est vide</p>
        <Link to="/" className="bg-primary text-white px-8 py-3 rounded-full font-bold">
          Continuer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 text-xs font-medium text-on-surface-variant tracking-wider uppercase">
        <Link to="/" className="hover:text-primary">Accueil</Link>
        <ChevronRight size={12} />
        <span className="text-primary">Commande</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Form */}
        <div className="lg:col-span-7">
          {step === 'info' ? (
            <form onSubmit={handleInfoSubmit} className="space-y-8">
              <div className="bg-white rounded-2xl border border-outline-variant/10 p-6 space-y-5">
                <h2 className="font-headline font-bold text-xl text-primary">Informations de livraison</h2>

                {/* ── Saved address selector ── */}
                {savedAddress && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Adresse de livraison</p>
                    {/* Saved address option */}
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        addressMode === 'saved' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressMode"
                        value="saved"
                        checked={addressMode === 'saved'}
                        onChange={() => {
                          setAddressMode('saved');
                          setForm((f) => ({
                            ...f,
                            address: savedAddress.address || '',
                            city: savedAddress.city || '',
                            postalCode: savedAddress.postalCode || '',
                            gouvernorat: savedAddress.gouvernorat || '',
                          }));
                        }}
                        className="mt-0.5 accent-primary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={13} className="text-primary" />
                          <span className="text-sm font-bold text-primary">Mon adresse enregistrée</span>
                        </div>
                        <p className="text-sm text-secondary leading-relaxed">
                          {savedAddress.address}, {savedAddress.postalCode} {savedAddress.city}
                          {savedAddress.gouvernorat ? `, ${savedAddress.gouvernorat}` : ''}
                        </p>
                      </div>
                    </label>
                    {/* New address option */}
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        addressMode === 'new' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressMode"
                        value="new"
                        checked={addressMode === 'new'}
                        onChange={() => {
                          setAddressMode('new');
                          setForm((f) => ({ ...f, address: '', city: '', postalCode: '', gouvernorat: '' }));
                        }}
                        className="accent-primary flex-shrink-0"
                      />
                      <PlusIcon size={13} className="text-secondary" />
                      <span className="text-sm font-semibold text-secondary">Utiliser une autre adresse</span>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Prénom *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Nom *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="Ex: 20 123 456"
                    className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                {/* Show address fields only when 'new' selected, or always when no saved address */}
                {(addressMode === 'new' || !savedAddress) && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Adresse *</label>
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        required
                        className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Ville *</label>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          required
                          className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Code Postal *</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleChange}
                          required
                          className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Gouvernorat</label>
                      <input
                        type="text"
                        name="gouvernorat"
                        value={form.gouvernorat}
                        onChange={handleChange}
                        className="w-full border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Shipping Zone */}
              {zones.length > 0 && (
                <div className="bg-white rounded-2xl border border-outline-variant/10 p-6 space-y-4">
                  <h2 className="font-headline font-bold text-xl text-primary flex items-center gap-2">
                    <Truck size={20} /> Zone de livraison
                  </h2>
                  <div className="space-y-2">
                    {zones.map((z) => (
                      <label
                        key={z.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          form.shippingZoneName === z.nom ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingZoneName"
                            value={z.nom}
                            checked={form.shippingZoneName === z.nom}
                            onChange={handleChange}
                            className="accent-primary"
                          />
                          <span className="font-medium text-primary text-sm">{z.nom}</span>
                        </div>
                        <span className="font-bold text-primary text-sm">
                          {freeShippingThreshold && total >= freeShippingThreshold
                            ? 'Gratuite'
                            : z.cout === 0 ? 'Gratuite' : `${z.cout?.toFixed(2)} TND`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="bg-white rounded-2xl border border-outline-variant/10 p-6 space-y-4">
                <h2 className="font-headline font-bold text-xl text-primary">Mode de paiement</h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'ESPECES_LIVRAISON' ? 'border-primary bg-primary/5' : 'border-outline-variant/20'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ESPECES_LIVRAISON"
                      checked={paymentMethod === 'ESPECES_LIVRAISON'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="accent-primary"
                    />
                    <Banknote size={20} className="text-primary" />
                    <div>
                      <p className="font-bold text-primary text-sm">Paiement à la livraison</p>
                      <p className="text-xs text-secondary">Payez en espèces à la réception</p>
                    </div>
                  </label>

                  {stripePromise && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'CARTE' ? 'border-primary bg-primary/5' : 'border-outline-variant/20'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CARTE"
                        checked={paymentMethod === 'CARTE'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-primary"
                      />
                      <CreditCard size={20} className="text-primary" />
                      <div>
                        <p className="font-bold text-primary text-sm">Carte bancaire (Stripe)</p>
                        <p className="text-xs text-secondary">Visa, Mastercard — paiement sécurisé</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full bg-primary text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? 'Chargement...' : paymentMethod === 'CARTE' ? 'Passer au paiement →' : 'Confirmer la commande'}
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/10 p-6">
              <h2 className="font-headline font-bold text-xl text-primary mb-6 flex items-center gap-2">
                <CreditCard size={20} /> Paiement sécurisé
              </h2>
              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    onSuccess={handleStripeSuccess}
                    onBack={() => setStep('info')}
                    total={orderTotal}
                    error={error}
                    setError={setError}
                  />
                </Elements>
              ) : (
                <p className="text-secondary">Initialisation du paiement...</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-outline-variant/10 p-6 sticky top-24">
            <h2 className="font-headline font-bold text-xl text-primary mb-5">Récapitulatif</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative shrink-0">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{item.name}</p>
                    {item.volume && <p className="text-xs text-secondary">{item.volume}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="text-outline hover:text-primary"><Minus size={12} /></button>
                      <span className="text-xs font-bold text-primary">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-outline hover:text-primary"><Plus size={12} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="text-outline hover:text-error ml-1"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary shrink-0">{(item.price * item.qty).toFixed(2)} TND</p>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="border-t border-outline-variant/10 mt-5 pt-5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={16} />
                    <span className="text-sm font-bold">{appliedCoupon.code}</span>
                    <span className="text-xs text-green-600">
                      {appliedCoupon.type === 'pourcentage' ? `−${appliedCoupon.valeur}%` :
                        appliedCoupon.type === 'fixe' ? `−${appliedCoupon.valeur.toFixed(2)} TND` :
                        appliedCoupon.type === 'livraison' ? 'Livraison offerte' : ''}
                    </span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-green-500 hover:text-green-700">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">Code promo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Ex : COUPON50"
                      className="flex-1 border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <Tag size={14} />
                      {couponLoading ? '...' : 'Appliquer'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-xs font-medium mt-1">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant/10 mt-5 pt-5 space-y-3 text-sm">
              <div className="flex justify-between text-secondary">
                <span>Sous-total</span>
                <span className="font-medium text-primary">{total.toFixed(2)} TND</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span className="flex items-center gap-1">
                  <Truck size={13} /> Livraison
                  {freeShippingThreshold && total < freeShippingThreshold && (
                    <span className="text-[10px] text-secondary ml-1">(gratuite dès {freeShippingThreshold.toFixed(0)} TND)</span>
                  )}
                </span>
                <span className="font-medium text-primary">
                  {shippingCost === 0 ? <span className="text-green-600 font-bold">Gratuite</span> : `${shippingCost.toFixed(2)} TND`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag size={13} /> Réduction</span>
                  <span className="font-medium">−{discount.toFixed(2)} TND</span>
                </div>
              )}
              {tvaAmount > 0 && (
                <div className="flex justify-between text-secondary text-xs">
                  <span>dont TVA ({tvaRate}%)</span>
                  <span>{tvaAmount.toFixed(2)} TND</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-outline-variant/10">
                <span className="text-primary">Total TTC</span>
                <span className="text-primary text-lg">{orderTotal.toFixed(2)} TND</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
