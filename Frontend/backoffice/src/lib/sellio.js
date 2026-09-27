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
  window.location.replace(`/${user.shopSlug}/dashboard`)
}

export function shopQuery() {
  const slug = currentShopSlug()
  return slug ? `?shop=${encodeURIComponent(slug)}` : ''
}

export function currentShopSlug() {
  const first = window.location.pathname.split('/').filter(Boolean)[0]
  const reserved = new Set(['login', 'inscription', 'auth-callback', 'nouvelle-boutique', 'sellio'])
  if (!first || reserved.has(first)) return ''
  return first
}
