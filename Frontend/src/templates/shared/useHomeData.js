import { useEffect, useState } from 'react'
import { fetchAllProducts, fetchCategories, fetchFeaturedProducts, fetchHomepageBanners, fetchTvaConfig } from '../../api/apiClient'
import { useStore } from '../../context/StoreContext'
import { getUser } from '../../api/tokenStorage'

const currentDevice = () => (window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop')

/** Loads everything a template home page renders and runs the back-office banner carousel. */
export function useHomeData() {
  const { settings } = useStore()
  const featured = settings?.home?.featured
  const featuredIds = featured?.mode === 'manual' ? (featured.productIds || []).map(String).join(',') : ''
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [bannerIndex, setBannerIndex] = useState(0)
  const [freeShipping, setFreeShipping] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadBanners = () =>
      fetchHomepageBanners(getUser()?.segmentName || '', currentDevice())
        .then((list) => {
          setBanners(list)
          setBannerIndex((i) => (list.length ? Math.min(i, list.length - 1) : 0))
        })
        .catch(() => setBanners([]))

    Promise.allSettled([
      fetchCategories().then(setCategories),
      loadBanners(),
      fetchTvaConfig().then((cfg) => {
        if (cfg?.standardEnabled && cfg?.standardSeuil > 0) setFreeShipping(cfg.standardSeuil)
      }),
    ]).finally(() => setLoaded(true))

    const onVisible = () => document.visibilityState === 'visible' && loadBanners()
    const id = setInterval(loadBanners, 30000)
    window.addEventListener('focus', loadBanners)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', loadBanners)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Products shown on the home page: the merchant's picks in their order, else the newest.
  useEffect(() => {
    let alive = true
    const load = featuredIds
      ? fetchAllProducts().then((all) => {
        const byId = new Map(all.map((p) => [String(p.id), p]))
        return featuredIds.split(',').map((id) => byId.get(id)).filter(Boolean)
      })
      : fetchFeaturedProducts()
    load.then((list) => alive && setProducts(list)).catch(() => alive && setProducts([]))
    return () => { alive = false }
  }, [featuredIds])

  const banner = banners[bannerIndex] || null

  useEffect(() => {
    if (banners.length < 2 || !banner) return
    const ms = Math.max(2, Number(banner.durationSeconds || 5)) * 1000
    const t = setTimeout(() => setBannerIndex((i) => (i + 1) % banners.length), ms)
    return () => clearTimeout(t)
  }, [banners.length, banner, bannerIndex])

  const next = () => banners.length && setBannerIndex((i) => (i + 1) % banners.length)
  const prev = () => banners.length && setBannerIndex((i) => (i === 0 ? banners.length - 1 : i - 1))

  // Image used when the merchant has not configured a banner yet.
  const fallbackImage = categories.find((c) => c.image)?.image || products.find((p) => p.image)?.image || ''
  const productImages = products.map((p) => p.image).filter(Boolean)
  const editorialImage = productImages[productImages.length - 1] || categories.filter((c) => c.image)[1]?.image || fallbackImage

  return {
    loaded,
    categories,
    products,
    banners,
    banner,
    bannerIndex,
    setBannerIndex,
    next,
    prev,
    freeShipping,
    fallbackImage,
    editorialImage,
  }
}
