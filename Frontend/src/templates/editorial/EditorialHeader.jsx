import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, Menu } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import MobileDrawer from '../shared/MobileDrawer'
import { Logo, AccountMenu, SearchOverlay, CountBadge, useOutsideClose } from '../shared/ui'

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Éditorial: magazine masthead (issue line + big italic title), then a sticky numbered table of contents. */
export default function EditorialHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { categories, announcement, user, logout, pathname, scrolled, isHome } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  const now = new Date()
  const issue = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const icon = 't-nav-link relative p-1.5 text-ink hover:text-accent transition-colors'

  return (
    <>
      {/* Masthead */}
      <div className={`bg-surface border-b border-ink ${isHome ? '' : 'hidden md:block'}`}>
        <div className="t-announce max-w-[1360px] mx-auto px-5 md:px-10 py-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink/60 border-b border-ink/15">
          <span>Édition de {issue}</span>
          <span className="hidden md:block text-center">{announcement}</span>
          <span>N° {String(now.getMonth() + 1).padStart(2, '0')}</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-6 md:py-8 text-center">
          <Logo className="font-headline italic text-5xl md:text-7xl text-ink leading-none" imgClassName="h-14 mx-auto" />
        </div>
      </div>

      <header className="t-nav sticky top-0 z-[100] bg-surface border-b-[3px] border-double border-ink" onMouseLeave={() => setOpenSlug(null)}>
        <div className="max-w-[1360px] mx-auto px-5 md:px-10 h-14 flex items-center gap-6">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className={`${icon} lg:hidden`}><Menu size={22} /></button>
          <Logo
            className={`t-nav-link font-headline italic text-2xl text-ink transition-all duration-300 ${scrolled || !isHome ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}
            imgClassName="h-7"
          />
          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {categories.map((c, i) => (
              <div key={c.slug} className="relative" onMouseEnter={() => setOpenSlug(c.slug)}>
                <Link
                  to={`/categories/${c.slug}`}
                  onClick={() => setOpenSlug(null)}
                  className={`t-nav-link flex items-baseline gap-1.5 text-[13px] uppercase tracking-[0.14em] transition-colors ${
                    pathname === `/categories/${c.slug}` || openSlug === c.slug ? 'text-accent' : 'text-ink hover:text-accent'
                  }`}
                >
                  <span className="font-headline italic normal-case text-xs text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                  {c.name}
                </Link>
                {openSlug === c.slug && c.subcategories.length > 0 && (
                  <div className="absolute left-0 top-full pt-4 w-64">
                    <div className="bg-surface border border-ink p-5 shadow-[6px_6px_0_rgb(var(--rgb-ink))]">
                      <p className="font-headline italic text-lg mb-3">{c.name}</p>
                      {c.subcategories.map((sub) => (
                        <Link
                          key={sub}
                          to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`}
                          onClick={() => setOpenSlug(null)}
                          className="block py-1.5 text-sm text-ink/70 hover:text-accent border-b border-ink/10 last:border-0"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => setSearch(true)} aria-label="Rechercher" className={icon}><Search size={19} /></button>
            <div className="hidden sm:block text-ink"><NotificationBell /></div>
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className={icon}><User size={19} /></button>
              {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} />}
            </div>
            <Link to="/favoris" aria-label="Favoris" className={`${icon} hidden sm:block`}>
              <Heart size={19} />
              <CountBadge count={wishlistCount} className="bg-accent text-white" />
            </Link>
            <button onClick={() => setCart(true)} className="t-nav-link text-[13px] uppercase tracking-[0.14em] text-ink hover:text-accent">
              Panier <span className="font-headline italic normal-case">({cartCount || 0})</span>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        categories={categories}
        user={user}
        look={{
          panel: 'bg-surface text-ink',
          divider: 'border-ink/15',
          logo: 'font-headline italic text-2xl text-ink',
          link: 'font-headline italic text-xl',
          button: 'bg-ink text-surface uppercase tracking-[0.14em] text-xs',
          secondary: 'border border-ink uppercase tracking-[0.14em] text-xs',
        }}
      />
      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="editorial" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
