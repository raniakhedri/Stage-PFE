export const RESERVED_PATHS = new Set([
  'login', 'inscription', 'auth-callback', 'nouvelle-boutique', 'verification', 'sellio',
  'mot-de-passe-oublie', 'changer-mot-de-passe',
])

export function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

export function storeSession(accessToken, refreshToken, user) {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

/** Backoffice pages and the permission each one needs (same keys as the server). */
export const PAGE_MODULES = [
  ['/dashboard', 'TABLEAU_DE_BORD'],
  ['/produits', 'PRODUITS'],
  ['/commandes', 'COMMANDES'],
  ['/retours', 'RETOURS'],
  ['/clients', 'CLIENTS'],
  ['/categories', 'CATEGORIES'],
  ['/collections', 'COLLECTIONS'],
  ['/bannieres', 'BANNIERES'],
  ['/tva-livraison', 'TVA_LIVRAISON'],
  ['/promotions', 'PROMOTIONS'],
  ['/fidelite', 'PROMOTIONS'],
  ['/email-marketing', 'EMAIL_MARKETING'],
  ['/avis', 'AVIS'],
  ['/comportement', 'ANALYSES'],
  ['/apparence', 'APPARENCE'],
  ['/configuration', 'APPARENCE'],
  ['/roles', 'ROLES_PERMISSIONS'],
  ['/compte', 'COMPTE_HEBERGEMENT'],
]

export function canAccess(user, moduleKey) {
  if (!user) return false
  if (user.roleName === 'SUPER_ADMIN' || user.roleName === 'ADMIN') return true
  return user.permissions?.[moduleKey] === true
}

/** Module needed for a backoffice path (without the shop prefix), or null when the page is open to the team. */
export function moduleForPath(path) {
  const match = PAGE_MODULES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  return match ? match[1] : null
}

/** First page a team member may open (the dashboard for owners). */
export function firstAllowedPath(user) {
  const found = PAGE_MODULES.find(([, moduleKey]) => canAccess(user, moduleKey))
  return found ? found[0] : '/dashboard'
}

export function openMerchantHome(user) {
  if (!user || user.roleName === 'CLIENT') {
    window.location.replace('/login')
    return
  }
  if (user.mustChangePassword) {
    window.location.replace('/changer-mot-de-passe')
    return
  }
  if (user.roleName === 'SUPER_ADMIN') {
    window.location.replace('/sellio')
    return
  }
  if (!user.shopSlug) {
    window.location.replace('/nouvelle-boutique')
    return
  }
  if (!shopIsActive(user)) {
    window.location.replace('/verification')
    return
  }
  window.location.replace(`/${user.shopSlug}${firstAllowedPath(user)}`)
}

/** Shops created before verification existed have no status and are live. */
export function shopIsActive(user) {
  return !user?.shopStatus || user.shopStatus === 'ACTIVE'
}

export function shopQuery() {
  const slug = currentShopSlug()
  return slug ? `?shop=${encodeURIComponent(slug)}` : ''
}

export function currentShopSlug() {
  const first = window.location.pathname.split('/').filter(Boolean)[0]
  if (!first || RESERVED_PATHS.has(first)) return ''
  return first
}
