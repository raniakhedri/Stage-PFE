import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Sparkles, Truck, ShieldCheck, RefreshCw, LogOut, Instagram, Facebook, Youtube, Linkedin, Music2, MessageCircle, MapPin, Phone, Mail } from 'lucide-react'
import { fetchAllProducts } from '../../api/apiClient'
import { track } from '../../tracking/tracker'
import { useStore } from '../../context/StoreContext'
import { formatPrice } from './content'

export const PROMISE_ICONS = { sparkles: Sparkles, truck: Truck, shield: ShieldCheck, refresh: RefreshCw }

/** Shop logo; its height can be set by the merchant (backoffice > Apparence), else the template's size. */
export function Logo({ className = '', imgClassName = 'h-8' }) {
  const { storeName, logo, settings } = useStore()
  const height = Number(settings?.logo?.height)
  const custom = height >= 16 && height <= 160
  return (
    <Link to="/" className={className} aria-label={storeName || 'Accueil'}>
      {logo ? (
        <img
          src={logo}
          alt={storeName || 'Boutique'}
          style={custom ? { height, maxWidth: height * 6 } : undefined}
          className={`${custom ? '' : `${imgClassName} max-w-[200px]`} w-auto object-contain`}
        />
      ) : (
        storeName || 'Boutique'
      )}
    </Link>
  )
}

const ANIMATIONS = {
  slide: 'hero-anim-slide',
  zoom: 'hero-anim-zoom',
  'ken-burns': 'hero-anim-ken-burns',
  blur: 'hero-anim-blur',
}

/** Background media for a hero: back-office banner (image or video) or a fallback image. */
export function HeroMedia({ banner, fallbackImage, index = 0, className = '' }) {
  const anim = banner ? ANIMATIONS[banner.animation] || 'hero-anim-fade' : 'hero-anim-ken-burns'
  const media = `absolute inset-0 w-full h-full object-cover ${anim} ${className}`

  if (banner?.videoUrl) {
    if (/youtube\.com|youtu\.be/i.test(banner.videoUrl)) {
      const sep = banner.videoUrl.includes('?') ? '&' : '?'
      return (
        <iframe
          key={`${banner.id}-${index}`}
          src={`${banner.videoUrl}${sep}autoplay=1&mute=1&loop=1&controls=0&playsinline=1`}
          className={`${media} pointer-events-none scale-[1.35]`}
          title={banner.title || 'Vidéo'}
          allow="autoplay; encrypted-media"
        />
      )
    }
    return <video key={`${banner.id}-${index}`} className={media} src={banner.videoUrl} autoPlay muted loop playsInline />
  }

  const src = banner?.imageUrl || fallbackImage
  if (!src) return <div className={`absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary ${className}`} />
  return (
    <picture key={`${banner?.id || 'fallback'}-${index}`}>
      {banner?.mobileImageUrl && <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl} />}
      <img className={media} src={src} alt={banner?.title || ''} />
    </picture>
  )
}

/** Renders a banner call-to-action as an internal Link or an external anchor. */
export function CtaLink({ to, children, className }) {
  const href = to || '/'
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

export function bannerCtaTarget(banner, categories) {
  if (banner?.ctaLink) return banner.ctaLink
  return categories[0] ? `/categories/${categories[0].slug}` : '/'
}

/** Account dropdown shared by all headers; visual styling comes from `panelClassName`. */
export function AccountMenu({ user, onLogout, onClose, panelClassName = '' }) {
  const item = 'block px-5 py-3 text-sm hover:bg-black/[0.04] transition-colors'
  return (
    <div className={`absolute right-0 top-full mt-3 w-56 bg-white text-ink shadow-xl border border-black/5 z-50 ${panelClassName}`}>
      {user ? (
        <>
          <div className="px-5 py-4 border-b border-black/5">
            <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
          {(user.roleName === 'SUPER_ADMIN' || user.roleName === 'ADMIN') && (
            <a href="http://localhost:3000" className={`${item} font-semibold`}>← Backoffice</a>
          )}
          <Link to="/profile" onClick={onClose} className={item}>Mon profil</Link>
          <Link to="/commandes" onClick={onClose} className={item}>Mes commandes</Link>
          <Link to="/retours" onClick={onClose} className={item}>Mes retours</Link>
          <Link to="/favoris" onClick={onClose} className={item}>Mes favoris</Link>
          <button onClick={() => { onClose(); onLogout() }} className={`${item} w-full text-left text-red-600 flex items-center gap-2 border-t border-black/5`}>
            <LogOut size={15} /> Déconnexion
          </button>
        </>
      ) : (
        <>
          <Link to="/login" onClick={onClose} className={`${item} font-semibold`}>Se connecter</Link>
          <Link to="/inscription" onClick={onClose} className={item}>Créer un compte</Link>
        </>
      )}
    </div>
  )
}

/** Closes a popover when clicking outside the element carrying the returned ref. */
export function useOutsideClose(open, onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const handler = (e) => ref.current && !ref.current.contains(e.target) && closeRef.current()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return ref
}

/** Locks page scroll while an overlay (menu, search) is open. */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [locked])
}

let productCache = null

/** Full-screen product search. `variant` switches the look per template. */
export function SearchOverlay({ open, onClose, variant = 'minimal' }) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState(productCache || [])
  const inputRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
    if (!productCache) {
      fetchAllProducts().then((list) => { productCache = list; setProducts(list) }).catch(() => {})
    }
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products
      .filter((p) => [p.name, p.category, p.parentCategory].some((v) => String(v || '').toLowerCase().includes(q)))
      .slice(0, 8)
  }, [query, products])

  // A search is recorded once the visitor stops typing, with its number of results
  // (searches with 0 results show the merchant what is missing from the catalogue).
  useEffect(() => {
    const q = query.trim()
    if (!open || q.length < 2) return
    const id = setTimeout(() => track('SEARCH', { query: q, resultsCount: results.length }), 900)
    return () => clearTimeout(id)
  }, [open, query, results.length])

  if (!open) return null

  const dark = ['bold', 'sport', 'tech'].includes(variant)
  const serif = ['luxury', 'editorial', 'artisan'].includes(variant)
  const background = variant === 'bold' ? 'bg-black text-white' : dark ? 'bg-primary text-white' : variant === 'pop' || variant === 'artisan' ? 'bg-surface text-ink' : 'bg-white text-ink'

  return (
    <div className={`fixed inset-0 z-[200] overflow-y-auto ${background}`}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-8 pb-20">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Fermer" className="p-2 hover:opacity-60"><X size={26} /></button>
        </div>
        <div className={`flex items-center gap-4 border-b ${dark ? 'border-white/30' : 'border-neutral-300'} pb-4 mt-6`}>
          <Search size={dark ? 34 : 24} className="opacity-60 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dark ? 'CHERCHER' : 'Rechercher un produit'}
            className={`w-full bg-transparent outline-none border-none focus:ring-0 placeholder:opacity-40 ${
              dark ? 'text-4xl md:text-7xl font-headline uppercase' : serif ? 'text-3xl md:text-5xl font-headline italic' : 'text-2xl md:text-4xl font-light'
            }`}
          />
        </div>
        {query && (
          <p className="mt-6 text-xs uppercase tracking-[0.2em] opacity-50">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {results.map((p) => (
            <Link key={p.id} to={`/produits/${p.slug}`} onClick={() => { track('SEARCH_CLICK', { productId: p.id, query: query.trim() }); onClose() }} className="group">
              <div className={`aspect-[4/5] overflow-hidden ${dark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
              </div>
              <p className={`mt-3 text-sm ${dark ? 'uppercase font-semibold' : ''}`}>{p.name}</p>
              <p className="text-sm opacity-60">{formatPrice(p.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Hides an <img> whose URL fails to load, leaving its placeholder background visible. */
export const hideBroken = (e) => { e.currentTarget.style.visibility = 'hidden' }

export function CountBadge({ count, className = '' }) {
  if (!count) return null
  return (
    <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-bold flex items-center justify-center rounded-full ${className}`}>
      {count}
    </span>
  )
}

export function NewsletterForm({ className = '', inputClassName = '', buttonClassName = '', buttonLabel = "S'inscrire", placeholder = 'Votre adresse email' }) {
  const [sent, setSent] = useState(false)
  if (sent) return <p className={`text-sm ${className}`}>Merci, votre inscription est confirmée.</p>
  return (
    <form className={className} onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
      <input type="email" required placeholder={placeholder} className={inputClassName} />
      <button type="submit" className={buttonClassName}>{buttonLabel}</button>
    </form>
  )
}

const SOCIALS = [
  ['instagram', Instagram, 'Instagram'],
  ['facebook', Facebook, 'Facebook'],
  ['tiktok', Music2, 'TikTok'],
  ['youtube', Youtube, 'YouTube'],
  ['linkedin', Linkedin, 'LinkedIn'],
]

/** Contact details and social links set by the merchant (backoffice > Apparence), in the template's footer colours. */
export function FooterContact({ className = 'mt-6' }) {
  const { settings } = useStore()
  const id = settings?.identity || {}
  const links = SOCIALS.filter(([key]) => /^https?:\/\//i.test(id[key] || ''))
  const whatsapp = String(id.whatsapp || '').replace(/[^\d]/g, '')
  if (!id.phone && !id.email && !id.address && !links.length && !whatsapp) return null
  return (
    <div className={`${className} space-y-2 text-sm`}>
      {id.address && <p className="flex items-start gap-2 opacity-80"><MapPin size={15} className="mt-0.5 shrink-0" />{id.address}</p>}
      {id.phone && <a href={`tel:${id.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 opacity-80 hover:opacity-100"><Phone size={15} />{id.phone}</a>}
      {id.email && <a href={`mailto:${id.email}`} className="flex items-center gap-2 opacity-80 hover:opacity-100"><Mail size={15} />{id.email}</a>}
      {(links.length > 0 || whatsapp) && (
        <div className="flex items-center gap-3 pt-2">
          {links.map(([key, Icon, label]) => (
            <a key={key} href={id[key]} target="_blank" rel="noopener noreferrer" aria-label={label} className="opacity-80 hover:opacity-100">
              <Icon size={18} />
            </a>
          ))}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="opacity-80 hover:opacity-100">
              <MessageCircle size={18} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
