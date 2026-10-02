// Storefront templates (same keys as the server's ShopCatalog.LAYOUTS and the backoffice list).
export const LAYOUTS = ['minimal', 'bold', 'luxury', 'sport', 'tech', 'artisan', 'pop', 'editorial']

export function layoutOf(templateKey) {
  const key = String(templateKey || '').toLowerCase()
  if (LAYOUTS.includes(key)) return key
  if (key === 'noir' || key === 'marin') return 'bold'
  if (key === 'atelier' || key === 'apothicaire' || key === 'botanique') return 'luxury'
  return 'minimal'
}
