import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, ShoppingBasket, Menu } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import MobileDrawer from '../shared/MobileDrawer'
import { Logo, AccountMenu, SearchOverlay, CountBadge, useOutsideClose } from '../shared/ui'

/** Artisan: cream paper, centred serif logo, categories underneath with rounded dropdowns. */
export default function ArtisanHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { categories, announcement, user, logout, pathname } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  const icon = 't-nav-link relative p-2 rounded-full text-ink/80 hover:bg-primary/10 hover:text-primary transition-colors'

  return (
    <>
      {announcement && (
        <div className="t-announce bg-primary text-surface text-[13px] font-headline italic text-center py-2 px-4">{announcement}</div>
      )}

      <header className="t-nav sticky top-0 z-[100] bg-surface/95 backdrop-blur artisan-paper border-b border-primary/15" onMouseLeave={() => setOpenSlug(null)}>
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 h-20 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)} aria-label="Menu" className={`${icon} lg:hidden`}><Menu size={22} /></button>
            <button onClick={() => setSearch(true)} className="t-nav-link hidden lg:inline-flex items-center gap-2 text-sm text-ink/70 hover:text-primary">
              <Search size={17} /> Rechercher
            </button>
          </div>
          <Logo className="t-nav-link font-headline italic text-3xl text-primary justify-self-center" />
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setSearch(true)} aria-label="Rechercher" className={`${icon} lg:hidden`}><Search size={19} /></button>
            <div className="hidden sm:block text-ink/80"><NotificationBell /></div>
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className={icon}><User size={19} /></button>
              {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="rounded-2xl overflow-hidden" />}
            </div>
            <Link to="/favoris" aria-label="Favoris" className={`${icon} hidden sm:block`}>
              <Heart size={19} />
              <CountBadge count={wishlistCount} className="bg-primary text-surface" />
            </Link>
            <button onClick={() => setCart(true)} className="t-btn ml-1 inline-flex items-center gap-2 rounded-full bg-primary text-surface px-4 py-2 text-sm">
              <ShoppingBasket size={17} />
              <span className="hidden sm:inline">Panier</span>
              {cartCount > 0 && <span className="text-xs bg-surface text-primary rounded-full px-1.5">{cartCount}</span>}
            </button>
          </div>
        </div>

        <nav className="hidden lg:flex justify-center items-center gap-1 pb-3">
          {categories.map((c, i) => (
            <div key={c.slug} className="relative flex items-center" onMouseEnter={() => setOpenSlug(c.slug)}>
              {i > 0 && <span className="text-primary/30 px-1">·</span>}
              <Link
                to={`/categories/${c.slug}`}
                onClick={() => setOpenSlug(null)}
                className={`t-nav-link px-3 py-1 rounded-full font-headline text-[17px] transition-colors ${
                  pathname === `/categories/${c.slug}` || openSlug === c.slug ? 'bg-primary/10 text-primary' : 'text-ink/80 hover:text-primary'
                }`}
              >
                {c.name}
              </Link>
              {openSlug === c.slug && c.subcategories.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-60">
                  <div className="bg-surface rounded-2xl shadow-xl border border-primary/15 p-3">
                    {c.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`}
                        onClick={() => setOpenSlug(null)}
                        className="block px-3 py-2 rounded-xl text-sm text-ink/80 hover:bg-primary/10 hover:text-primary"
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
      </header>

      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        categories={categories}
        user={user}
        look={{
          panel: 'bg-surface text-ink artisan-paper',
          divider: 'border-primary/15',
          logo: 'font-headline italic text-2xl text-primary',
          link: 'font-headline text-lg',
          button: 'bg-primary text-surface rounded-full',
          secondary: 'border border-primary/30 rounded-full text-primary',
        }}
      />
      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="artisan" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
