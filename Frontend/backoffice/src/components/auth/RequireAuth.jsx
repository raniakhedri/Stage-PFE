import { Outlet } from 'react-router-dom'
import { currentShopSlug, readUser } from '../../lib/sellio'

export default function RequireAuth() {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    window.location.replace('/login')
    return null
  }
  const user = readUser()
  if (user?.roleName === 'CLIENT') {
    // Shop customers have no backoffice: drop their session and show the Sellio home page.
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.replace('/')
    return null
  }
  const slug = currentShopSlug()
  if (user?.roleName === 'ADMIN' && !user.shopSlug && slug) {
    window.location.replace('/nouvelle-boutique')
    return null
  }
  if (user?.roleName === 'ADMIN' && user.shopSlug && slug && slug !== user.shopSlug) {
    window.location.replace(`/${user.shopSlug}/dashboard`)
    return null
  }
  return <Outlet />
}