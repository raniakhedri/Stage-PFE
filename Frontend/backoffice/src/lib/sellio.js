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

export function openMerchantHome(user) {
  if (!user || user.roleName === 'CLIENT') {
    window.location.replace('/login')
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
  window.location.replace(`/${user.shopSlug}/dashboard`)
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
  const reserved = new Set(['login', 'inscription', 'auth-callback', 'nouvelle-boutique', 'verification', 'sellio'])
  if (!first || reserved.has(first)) return ''
  return first
}
