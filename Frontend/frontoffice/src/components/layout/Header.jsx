import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useFoAppearance } from '../../context/AppearanceContext'

/* ── Fallback data (used while API loads or if it fails) ── */
const fallbackCategoryData = {
  FEMME: {
    season: 'SEASON 2026 / FEMME',
    subs: ['Nouveautés', 'Best Sellers', 'Vestes & Manteaux', 'Robes', 'Tops', 'Jeans', 'Pantalons', 'Chaussures', 'Accessoires'],
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'NOUVELLE COLLECTION', sub: 'EXPLORE NOW' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'SPRING SUMMER 2026', sub: 'THE LOOKBOOK' },
    ],
  },
  HOMME: {
    season: 'SEASON 2026 / HOMME',
    subs: ['Nouveautés', 'Best Sellers', 'Vestes & Manteaux', 'Chemises', 'T-shirts', 'Pantalons', 'Jeans', 'Chaussures', 'Accessoires'],
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'COLLECTION HOMME', sub: 'DÉCOUVRIR' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'ESSENTIELS', sub: 'THE LOOKBOOK' },
    ],
  },
  ENFANTS: {
    season: 'SEASON 2026 / ENFANTS',
    subs: ['Nouveautés', 'Fille', 'Garçon', 'Bébé', 'Chaussures', 'Accessoires'],
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'MINI COLLECTION', sub: 'EXPLORE' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'SUMMER KIDS', sub: 'VOIR' },
    ],
  },
  BEAUTÉ: {
    season: 'SEASON 2026 / BEAUTÉ',
    subs: ['Nouveautés', 'Parfums', 'Soins', 'Maquillage', 'Coffrets'],
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'BEAUTÉ', sub: 'DÉCOUVRIR' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'ESSENTIELS BEAUTÉ', sub: 'VOIR' },
    ],
  },
  COLLECTIONS: {
    season: 'SEASON 2026 / COLLECTIONS',
    subs: ['Printemps-Été', 'Automne-Hiver', 'Éditions Limitées', 'Collaborations', 'Archives'],
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'SPRING SUMMER 2026', sub: 'THE LOOKBOOK' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'FALL WINTER 2025', sub: 'REVISITER' },
    ],
  },
  NOUVEAUTÉS: {
    season: 'SEASON 2026 / NOUVEAUTÉS',
    subs: ['Tout Voir', 'Femme', 'Homme', 'Enfants', 'Accessoires'],
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'JUST DROPPED', sub: 'VOIR TOUT' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'TENDANCES', sub: 'DÉCOUVRIR' },
    ],
  },
}

const fallbackMainCategories = Object.keys(fallbackCategoryData)

const defaultImages = [
  { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'NOUVELLE COLLECTION', sub: 'EXPLORE NOW' },
  { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'SPRING SUMMER 2026', sub: 'THE LOOKBOOK' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // Dynamic categories from API
  const [categoryData, setCategoryData] = useState(fallbackCategoryData)
  const [mainCategories, setMainCategories] = useState(fallbackMainCategories)
  const [activeCategory, setActiveCategory] = useState(fallbackMainCategories[0] || 'FEMME')

  // Collections for menu
  const [menuCollections, setMenuCollections] = useState([])
  const [hoveredCollection, setHoveredCollection] = useState(null)

  // Fetch menu categories from public API
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/public/categories/menu')
      .then(res => {
        const apiCats = res.data
        if (!apiCats || apiCats.length === 0) return // keep fallback

        const built = {}
        apiCats.forEach(cat => {
          const name = cat.nom.toUpperCase()
          const subs = (cat.children || []).map(c => c.nom)
          const img = cat.imageUrl
          built[name] = {
            season: `SEASON 2026 / ${name}`,
            subs: subs.length > 0 ? subs : ['Tout Voir'],
            images: img
              ? [{ src: img, title: name, sub: 'DÉCOUVRIR' }, defaultImages[1]]
              : defaultImages,
          }
        })
        if (Object.keys(built).length > 0) {
          setCategoryData(built)
          const keys = Object.keys(built)
          setMainCategories(keys)
          setActiveCategory(keys[0])
        }
      })
      .catch(() => {}) // silently keep fallback
  }, [])

  // Fetch menu collections from public API
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/public/collections/menu')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setMenuCollections(res.data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = showNav ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showNav])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setShowMenu(false)
    navigate('/login')
  }

  const { brandName, slogan, logoMain, logoLight, logoNavbar } = useFoAppearance()

  const handleCategoryHover = (cat) => {
    if (cat !== activeCategory) {
      setActiveCategory(cat)
      setAnimKey((k) => k + 1)
      setHoveredCollection(null)
    }
  }

  const current = categoryData[activeCategory]

  // Collections for active category
  const categoryCollections = menuCollections.filter(
    col => col.menuParentCategory && col.menuParentCategory.toUpperCase() === activeCategory
  )

  // Featured collections for this category (menuFeatured = true)
  const featuredCollections = categoryCollections.filter(col => col.menuFeatured)

  // Images are ALWAYS fixed on the featured collections — hover never changes them
  const displayImages = (() => {
    if (featuredCollections.length >= 2) {
      return [
        { src: featuredCollections[0].imageUrl || defaultImages[0].src, title: featuredCollections[0].nom, sub: 'DÉCOUVRIR' },
        { src: featuredCollections[1].imageUrl || defaultImages[1].src, title: featuredCollections[1].nom, sub: 'THE LOOKBOOK' },
      ]
    }
    if (featuredCollections.length === 1) {
      return [
        { src: featuredCollections[0].imageUrl || defaultImages[0].src, title: featuredCollections[0].nom, sub: 'DÉCOUVRIR' },
        current.images[1] || defaultImages[1],
      ]
    }
    return current.images
  })()

  const isHome = location.pathname === '/'
  const isTransparent = isHome && !scrolled && !showNav

  return (
    <>
      {/* ── Top Navigation Bar ── */}
      <nav className={`fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-12 py-5 z-50 transition-all duration-500 ${
        isTransparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-xl'
      }`}>
        {/* Left: Search */}
        <div className="flex items-center gap-3 flex-1">
          <span className={`material-symbols-outlined text-[20px] transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-primary'}`}>search</span>
          <span className={`hidden md:inline text-[11px] tracking-[0.15em] font-label uppercase transition-colors duration-500 ${isTransparent ? 'text-white/60' : 'text-outline/50'}`}>SEARCH</span>
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center">
          <Link to="/" className="flex flex-col items-center gap-0.5">
            {(() => {
              const solidLogo = logoNavbar || logoMain
              const transparentLogo = logoLight || solidLogo
              const activeLogo = isTransparent ? transparentLogo : solidLogo
              return activeLogo ? (
                <img
                  src={activeLogo}
                  alt={brandName}
                  className="h-8 w-auto object-contain transition-all duration-500"
                />
              ) : (
                <>
                  <span className={`text-2xl font-black tracking-[0.15em] uppercase transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-brand'}`}>{brandName || 'GMIR'}</span>
                  <span className={`text-[9px] font-medium tracking-[0.35em] uppercase transition-colors duration-500 ${isTransparent ? 'text-white/80' : 'text-brand'}`}>{slogan || 'JEWELRY'}</span>
                </>
              )
            })()}
          </Link>
        </div>

        {/* Right: Icons */}
        <div className="flex-1 flex justify-end items-center gap-6">
          {/* Person icon + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center hover:opacity-60"
              onClick={() => {
                if (!user) { navigate('/login'); return }
                setShowMenu((v) => !v)
              }}
            >
              <span className={`material-symbols-outlined text-[20px] transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-primary'}`}>person</span>
            </button>

            {showMenu && user && (
              <div className="absolute right-0 top-full mt-3 w-56 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] z-50 py-2">
                <div className="px-5 py-3 border-b border-neutral-100">
                  <p className="font-bold text-[13px] uppercase tracking-tight text-black">{user.name}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowMenu(false); navigate('/profil') }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-600 hover:bg-surface-container-low hover:text-black"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_circle</span>
                    Mon profil
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/commandes') }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-600 hover:bg-surface-container-low hover:text-black"
                  >
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    Mes commandes
                  </button>
                  {user.roleName && user.roleName !== 'CLIENT' && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowMenu(false)
                      const t = localStorage.getItem('accessToken')
                      const r = localStorage.getItem('refreshToken')
                      const u = localStorage.getItem('user')
                      if (t && r) {
                        window.location.href = `http://localhost:3000/auth-callback?accessToken=${encodeURIComponent(t)}&refreshToken=${encodeURIComponent(r)}&user=${encodeURIComponent(u || '')}`
                      } else {
                        window.location.href = 'http://localhost:3000'
                      }
                    }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-600 hover:bg-surface-container-low hover:text-black"
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    Dashboard
                  </a>
                  )}
                </div>
                <div className="border-t border-neutral-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center hover:opacity-60" onClick={() => navigate('/panier')}>
            <span className={`material-symbols-outlined text-[20px] transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-primary'}`}>shopping_bag</span>
          </button>

          {/* Menu toggle (hamburger / close) */}
          <button className="flex items-center hover:opacity-60" onClick={() => { setShowNav((v) => !v); setActiveCategory(mainCategories[0] || 'FEMME'); setAnimKey(0); setHoveredCollection(null) }}>
            <span className={`material-symbols-outlined text-[20px] transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-primary'}`}>{showNav ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* ── Full-Screen Editorial Navigation Overlay ── */}
      <div
        className={`fixed inset-0 z-40 bg-white transition-opacity duration-500 ease-in-out ${
          showNav ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <main className={`min-h-screen pt-28 md:pt-36 pb-12 px-6 md:px-12 flex flex-col md:flex-row gap-12 md:gap-0 transition-all duration-500 ease-in-out ${showNav ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          {/* Column 1: Main Categories */}
          <section className="w-full md:w-1/4 flex flex-col">
            <nav className="flex flex-col space-y-1">
              {mainCategories.map((cat) => (
                <a
                  key={cat}
                  href="#"
                  onMouseEnter={() => handleCategoryHover(cat)}
                  onClick={(e) => { e.preventDefault(); setShowNav(false); navigate('/produits') }}
                  className={`font-headline font-black text-4xl md:text-5xl tracking-tighter transition-colors duration-300 ${
                    activeCategory === cat ? 'text-primary' : 'text-outline-variant hover:text-primary'
                  }`}
                >
                  {cat}
                </a>
              ))}
            </nav>
            <div className="mt-12 md:mt-auto flex flex-col space-y-2 text-xs font-label tracking-[0.1em] text-outline">
              <a href="#" className="hover:text-primary transition-colors duration-200">AIDE</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowNav(false); navigate('/profil') }} className="hover:text-primary transition-colors duration-200">MON COMPTE</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowNav(false); navigate('/login') }} className="hover:text-primary transition-colors duration-200">CONNEXION</a>
            </div>
          </section>

          {/* Column 2: Sub-categories (changes on hover) */}
          <section className="w-full md:w-1/4 pt-2 md:pt-4">
            <div key={animKey} className="animate-nav-fade-in">
              <h2 className="text-[10px] tracking-[0.2em] font-label text-outline mb-8 uppercase">{current.season}</h2>
              <nav className="flex flex-col space-y-4 text-sm font-label tracking-widest uppercase">
                {current.subs.map((sub, i) => (
                  <a
                    key={sub}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="transition-colors duration-200 text-on-surface/70 hover:text-primary hover:font-bold"
                  >
                    {sub}
                  </a>
                ))}
                {categoryCollections.length > 0 && (
                  <>
                    {categoryCollections.map((col) => (
                      <a
                        key={col.id}
                        href="#"
                        onMouseEnter={() => setHoveredCollection(col)}
                        onMouseLeave={() => setHoveredCollection(null)}
                        onClick={(e) => { e.preventDefault(); setShowNav(false); navigate('/produits') }}
                        className={`transition-colors duration-200 ${
                          hoveredCollection?.id === col.id ? 'text-primary font-bold' : 'text-on-surface/70 hover:text-primary'
                        }`}
                      >
                        {col.nom}
                      </a>
                    ))}
                  </>
                )}
                <div className="pt-8">
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-[10px] tracking-[0.2em] border-b border-primary pb-1 inline-block">VIEW ALL</a>
                </div>
              </nav>
            </div>
          </section>

          {/* Column 3: Editorial Images (changes on hover) */}
          <section className="w-full md:w-2/4 grid grid-cols-1 md:grid-cols-2 gap-4 md:pl-12">
            {displayImages.map((img, i) => (
              <div key={`${animKey}-${i}`} className="relative aspect-[3/4] group cursor-pointer overflow-hidden bg-surface-container-high animate-nav-image-in" style={{ animationDelay: `${i * 100}ms` }}>
                <img
                  className="w-full h-full object-cover grayscale brightness-90 group-hover:scale-105 transition-transform duration-700"
                  src={img.src}
                  alt={img.title}
                />
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/40 to-transparent">
                  <h3 className="font-headline text-white text-xl font-black tracking-tighter uppercase">{img.title}</h3>
                  <p className="text-white/80 text-[10px] tracking-[0.15em] mt-1 font-label">{img.sub}</p>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </>
  )
}
