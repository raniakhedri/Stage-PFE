const API_BASE = 'http://localhost:8080/api/v1/public';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
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
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price,
      stock: v.stock,
    })),
  };
}
