export const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3001'

export function normalizeStorefrontSlug(slug) {
  return String(slug || '').replace(/^\/+/, '').replace(/\/+$/, '')
}

export function storefrontCategoryUrl(slug) {
  const s = normalizeStorefrontSlug(slug)
  return s ? `${STOREFRONT_URL}/categories/${s}` : STOREFRONT_URL
}
