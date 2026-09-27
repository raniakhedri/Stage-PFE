import { getAccessToken } from './tokenStorage';

const API_BASE = 'http://localhost:8080/api/v1/public';
const API_PROFILE = 'http://localhost:8080/api/v1/profile';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

async function authRequest(path, options = {}) {
  const token = getAccessToken();
  const res = await fetch(`http://localhost:8080/api/v1${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Categories ──────────────────────────────────────────────────────────────

function normalizeSlug(slug) {
  return String(slug || '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function mapCategory(c) {
  return {
    id: c.id,
    slug: normalizeSlug(c.slug),
    name: c.nom,
    description: c.description || '',
    image: c.imageUrl || '',
    heroImage: c.imageUrl || '',
    subcategories: (c.children || []).map((ch) => ch.nom),
    productCount: Number(c.productCount) || 0,
    visMenu: Boolean(c.visMenu),
    visHomepage: Boolean(c.visHomepage),
    visFooter: Boolean(c.visFooter),
  };
}

export async function fetchCategories() {
  const cats = await request('/categories/homepage');
  return cats.map(mapCategory);
}

export async function fetchMenuCategories() {
  const cats = await request('/categories/menu');
  return cats.map(mapCategory);
}

export async function fetchFooterCategories() {
  const cats = await request('/categories/footer');
  return cats.map(mapCategory);
}

export async function fetchCategoryBySlug(slug) {
  const cats = await request('/categories');
  const wanted = normalizeSlug(slug);
  const cat = cats.find((c) => normalizeSlug(c.slug) === wanted);
  if (!cat) return null;
  return mapCategory(cat);
}

// ── Products ────────────────────────────────────────────────────────────────

function slugifyCategory(name) {
  if (!name) return '';
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function fetchProductsByCategory(categorySlug) {
  // First resolve category slug to parent id
  const cats = await request('/categories');
  const wanted = normalizeSlug(categorySlug);
  const cat = cats.find((c) => normalizeSlug(c.slug) === wanted);
  if (!cat) return [];
  const products = await request(`/products/parent-category/${cat.id}`);
  return products.map(mapProduct);
}

export async function fetchProductBySlug(slug) {
  const p = await request(`/products/${slug}`);
  return mapProduct(p);
}

export async function createTryOnToken() {
  const attempts = [
    'http://localhost:8080/api/v1/public/tryon/token',
    '/api/tryon/token',
  ]
  let lastError = new Error('Essayage indisponible')
  for (const url of attempts) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.apiKey) return data
      lastError = new Error(data.message || data.error || `Essayage: ${res.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : lastError
    }
  }
  throw lastError
}

export async function fetchSimilarProducts(ids) {
  if (!ids || ids.length === 0) return [];
  const p = await request(`/products/by-ids?ids=${ids.join(',')}`);
  return Array.isArray(p) ? p.map(mapProduct) : [];
}

export async function fetchFeaturedProducts() {
  const products = await request('/products');
  return products.slice(0, 8).map(mapProduct);
}

export async function fetchHomepageBanners(segment, device = 'desktop') {
  const qs = new URLSearchParams({ position: 'HOMEPAGE_HERO' });
  if (segment) qs.append('segment', String(segment).toUpperCase());

  const res = await fetch(`${API_BASE}/banners?${qs.toString()}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const payload = await res.json();
  const list = Array.isArray(payload) ? payload : (payload?.data || []);
  return list
    .map(mapBanner)
    .filter((b) => b.visibleHomepage)
    .filter((b) => (device === 'mobile' ? b.visibleMobile : b.visibleDesktop));
}

export async function fetchTopAnnouncementCoupon() {
  try {
    const data = await request('/coupons/announcement');
    return data || null;
  } catch {
    return null;
  }
}

export async function fetchTvaConfig() {
  try {
    return await request('/checkout/tva-config');
  } catch {
    return null;
  }
}

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`
}

function firstProductImage(p) {
  if (p.imageUrl) return p.imageUrl
  const raw = String(p.images || '').trim()
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed[0]) return parsed[0]
    } catch { /* ignore */ }
  }
  if (raw.startsWith('data:')) return raw
  return raw.split(',')[0]?.trim() || ''
}

function mapProduct(p) {
  const badge = p.badgeNouveau ? 'Nouveau'
    : p.badgeBestSeller ? 'Best-Seller'
    : (p.promoActive && p.promoPrice && p.salePrice && p.promoPrice < p.salePrice)
      ? `-${Math.round(((p.salePrice - p.promoPrice) / p.salePrice) * 100)}%`
    : null;

  return {
    id: p.id,
    slug: p.slug,
    name: p.nom,
    latin: p.latin || '',
    category: p.subCategory || p.categoryNom || '',
    parentCategory: p.parentCategoryNom || '',
    categorySlug: p.parentCategoryId ? slugifyCategory(p.parentCategoryNom) : '',
    price: p.promoActive && p.promoPrice ? p.promoPrice : p.salePrice,
    oldPrice: p.promoActive && p.promoPrice ? p.salePrice : null,
    volume: (p.volumes || '').split(',')[0]?.trim() || '',
    rating: 5,
    reviews: 0,
    badge,
    bio: Boolean(p.bio),
    stock: Number(p.stock) || 0,
    image: resolveMediaUrl(firstProductImage(p)),
    description: p.description || '',
    // Cosmetic detail fields
    origine: p.origine || '',
    usageInstructions: p.usageInstructions || '',
    precautions: p.precautions || '',
    inciComposition: p.inciComposition || '',
    certifications: (p.certifications || '').split(',').map(s => s.trim()).filter(Boolean),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price,
      stock: v.stock,
    })),
    upsellTags: p.upsellTags || '',
  };
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export async function fetchReviewsByProduct(productId) {
  return request(`/reviews/product/${productId}`);
}

export async function submitReview({ orderId, productId, note, commentaire }) {
  return authRequest('/profile/reviews', {
    method: 'POST',
    body: JSON.stringify({ orderId, productId, note, commentaire }),
  });
}

export async function fetchMyOrders() {
  return authRequest('/profile/orders');
}

export async function fetchReturnPolicy() {
  return request('/return-policy');
}

export async function submitReturn({ orderId, orderItemId, raison, commentaire, photo1, photo2, ibanClient }) {
  return authRequest('/profile/returns', {
    method: 'POST',
    body: JSON.stringify({ orderId, orderItemId, raison, commentaire, photo1, photo2, ibanClient }),
  });
}

export async function fetchMyReturns() {
  return authRequest('/profile/returns');
}

export async function fetchMyLoyalty() {
  return authRequest('/profile/loyalty');
}

export async function fetchMyProfile() {
  return authRequest('/profile');
}

export async function updateMyProfile(data) {
  return authRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function fetchServerCart() {
  return authRequest('/profile/cart');
}

export async function saveServerCart(cartItems) {
  const token = getAccessToken();
  if (!token) return;
  await fetch('http://localhost:8080/api/v1/profile/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(cartItems),
  });
}

export async function fetchMyReviews() {
  return authRequest('/profile/reviews');
}

function mapBanner(b) {
  return {
    id: b.id,
    title: b.titre || '',
    subtitle: b.sousTitre || '',
    badgeText: b.badgeTexte || '',
    badgeBgColor: b.badgeBgColor || 'rgba(255,255,255,0.15)',
    badgeTextColor: b.badgeTextColor || '#ffffff',
    alignement: b.alignement || 'center',
    imageUrl: b.imageUrl || '',
    mobileImageUrl: b.mobileImageUrl || '',
    videoUrl: b.videoUrl || '',
    ctaText: b.ctaTexte || 'Découvrir',
    ctaType: b.ctaType || 'produit',
    ctaLink: b.ctaLien || '/',
    visibleHomepage: b.visibleHomepage !== false,
    visibleMobile: b.visibleMobile !== false,
    visibleDesktop: b.visibleDesktop !== false,
    order: b.ordre ?? 0,
    durationSeconds: b.dureeSecondes ?? 5,
    animation: b.animation || 'fade',
  };
}
