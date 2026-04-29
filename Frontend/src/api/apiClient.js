const API_BASE = 'http://localhost:8080/api/v1/public';
const API_PROFILE = 'http://localhost:8080/api/v1/profile';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

async function authRequest(path, options = {}) {
  const token = localStorage.getItem('accessToken');
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

export async function fetchCategories() {
  const cats = await request('/categories/homepage');
  return cats.map(mapCategory);
}

export async function fetchCategoryBySlug(slug) {
  const cats = await request('/categories');
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) return null;
  return mapCategory(cat);
}

function mapCategory(c) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.nom,
    description: c.description || '',
    image: c.imageUrl || '',
    heroImage: c.imageUrl || '',
    subcategories: (c.children || []).map((ch) => ch.nom),
    productCount: c.childrenCount || 0,
  };
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
  const cat = cats.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  const products = await request(`/products/parent-category/${cat.id}`);
  return products.map(mapProduct);
}

export async function fetchProductBySlug(slug) {
  const p = await request(`/products/${slug}`);
  return mapProduct(p);
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
    image: p.imageUrl || '',
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

export async function fetchMyReviews() {
  return authRequest('/profile/reviews');
}

function mapBanner(b) {
  return {
    id: b.id,
    title: b.titre || '',
    subtitle: b.sousTitre || '',
    badgeText: b.badgeTexte || 'Nouvelle Collection',
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
