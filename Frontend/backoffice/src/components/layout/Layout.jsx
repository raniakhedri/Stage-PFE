import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import apiClient from '../../api/apiClient'
import { applyAllColors } from '../../utils/brandColor'
import { canAccess, currentShopSlug, firstAllowedPath, moduleForPath, readUser, isPlatform } from '../../lib/sellio'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

function tokenClaims() {
  try {
    return JSON.parse(atob((localStorage.getItem('accessToken') || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

/**
 * Sessions opened before tokens carried the shop are upgraded once, so every API call is scoped to
 * the merchant's shop. Returns true when the page is reloading.
 */
async function upgradeLegacyToken(user) {
  if (isPlatform(user) || !user?.shopSlug || tokenClaims().shop) return false
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return false
  const data = await res.json()
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  localStorage.setItem('user', JSON.stringify(data.user))
  window.location.reload()
  return true
}

function Layout() {
  const location = useLocation()
  const [user, setUser] = useState(readUser)
  const [shop, setShop] = useState(null)

  // Keep the stored profile in sync (role, permissions and shop may change while signed in).
  useEffect(() => {
    let alive = true
    upgradeLegacyToken(readUser()).then((reloading) => {
      if (reloading || !alive) return
      apiClient.get('/auth/me')
        .then(({ data }) => {
          if (!alive || !data) return
          localStorage.setItem('user', JSON.stringify(data))
          setUser(data)
        })
        .catch(() => {})
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  // The backoffice carries the merchant's brand, not Sellio's.
  useEffect(() => {
    const slug = currentShopSlug() || user.shopSlug
    if (!slug) return
    fetch(`${API}/public/shops/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setShop(data)
        document.title = `${data.name} · Backoffice`
        // The merchant's own backoffice colours (Apparence > Back-office), else Sellio's.
        try {
          const colors = JSON.parse(data.settings || '{}')?.backoffice || {}
          if (Object.values(colors).some((v) => /^#[0-9A-Fa-f]{6}$/.test(v || ''))) applyAllColors(colors)
        } catch {
          // invalid settings: keep the default colours
        }
      })
      .catch(() => {})
  }, [user.shopSlug])

  const moduleKey = moduleForPath(location.pathname)
  if (moduleKey && !canAccess(user, moduleKey)) {
    const fallback = firstAllowedPath(user)
    if (fallback !== location.pathname) return <Navigate to={fallback} replace />
  }

  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar user={user} shop={shop} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-y-auto" id="main-scroll">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
