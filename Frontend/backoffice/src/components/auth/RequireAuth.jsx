import { Outlet } from 'react-router-dom'
import { clearSession, currentShopSlug, firstAllowedPath, isPlatform, readUser, shopIsActive } from '../../lib/sellio'

export default function RequireAuth() {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    window.location.replace('/login')
    return null
  }
  const user = readUser()
  if (user?.roleName === 'CLIENT') {
    // Shop customers have no backoffice: drop their session and show the Sellio home page.
    clearSession()
    window.location.replace('/')
    return null
  }
  // Accounts created from the backoffice must replace their one-time password first.
  if (user?.mustChangePassword) {
    window.location.replace('/changer-mot-de-passe')
    return null
  }
  // The Sellio team runs the console; a shop's backoffice (customers, orders…) belongs to its merchant.
  if (isPlatform(user)) {
    if (currentShopSlug()) {
      window.location.replace('/sellio')
      return null
    }
    return <Outlet />
  }

  // Merchant owners and their team members stay inside their own shop.
  const slug = currentShopSlug()
  if (!user.shopSlug && slug) {
    window.location.replace('/nouvelle-boutique')
    return null
  }
  // The backoffice stays closed until Sellio has validated the merchant's identity.
  if (user.shopSlug && slug && !shopIsActive(user)) {
    window.location.replace('/verification')
    return null
  }
  if (user.shopSlug && slug && slug !== user.shopSlug) {
    window.location.replace(`/${user.shopSlug}${firstAllowedPath(user)}`)
    return null
  }
  return <Outlet />
}
