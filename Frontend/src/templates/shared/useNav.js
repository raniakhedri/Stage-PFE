import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchTopAnnouncementCoupon, fetchTvaConfig, fetchMenuCategories } from '../../api/apiClient'
import { getUser, clearTokens, cancelAutoLogout } from '../../api/tokenStorage'
import { useStore } from '../../context/StoreContext'

function formatAmount(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n <= 0) return ''
  return Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(/\.00$/, '')
}

function defaultAnnouncement(tvaConfig) {
  const seuil = tvaConfig?.standardEnabled && tvaConfig?.standardSeuil > 0 ? tvaConfig.standardSeuil : 49
  return `Livraison gratuite dès ${formatAmount(seuil)} TND d'achat`
}

function couponAnnouncement(coupon) {
  const code = String(coupon.code).toUpperCase()
  const minAmount = Number(coupon.montantMin || 0)
  const minPart = minAmount > 0 ? ` dès ${formatAmount(minAmount)} TND d'achat` : ''
  const type = String(coupon.type || '').toLowerCase()
  if (type === 'pourcentage') return `${Math.round(Number(coupon.valeur || 0))}% de réduction avec ${code}${minPart}`
  if (type === 'fixe') return `${formatAmount(coupon.valeur)} TND de réduction avec ${code}${minPart}`
  if (type === 'livraison') return `Livraison gratuite avec ${code}${minPart}`
  if (type === 'cadeau') return `Cadeau offert avec ${code}${minPart}`
  if (type === 'bogo') return `1 acheté = 1 offert avec ${code}${minPart}`
  return `Offre spéciale avec ${code}${minPart}`
}

/** Everything a template header needs: menu categories, announcement, user session and scroll state. */
export function useNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [autoAnnouncement, setAnnouncement] = useState('')
  // Announcement bar (backoffice > Apparence): automatic (coupon / free delivery), custom text, or hidden.
  const { settings } = useStore()
  const bar = settings?.announcement || {}
  const announcement = bar.mode === 'off' ? '' : bar.mode === 'custom' && bar.text?.trim() ? bar.text.trim() : autoAnnouncement
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      const [coupon, tvaConfig] = await Promise.all([fetchTopAnnouncementCoupon(), fetchTvaConfig()])
      if (!alive) return
      setAnnouncement(coupon?.code ? couponAnnouncement(coupon) : defaultAnnouncement(tvaConfig))
    }
    refresh()
    const id = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => {
      alive = false
      clearInterval(id)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    fetchMenuCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setUser(getUser())
  }, [location])

  const logout = () => {
    cancelAutoLogout()
    clearTokens()
    setUser(null)
    navigate('/')
  }

  return {
    categories,
    announcement,
    user,
    logout,
    scrolled,
    isHome: location.pathname === '/',
    pathname: location.pathname,
  }
}
