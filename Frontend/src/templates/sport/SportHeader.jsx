import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, Menu, ChevronDown, ArrowRight } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import MobileDrawer from '../shared/MobileDrawer'
import { Logo, AccountMenu, SearchOverlay, CountBadge, useOutsideClose, hideBroken } from '../shared/ui'

/** Sport: navy bar, condensed italic menu, lime accents and a skewed cart button. */
export default function SportHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { categories, announcement, user, logout, pathname } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  const openCat = categories.find((c) => c.slug === openSlug)
  const icon = 't-nav-link relative p-1.5 text-white/85 hover:text-accent transition-colors'

  return (
    <>
      {announcement && (
        <div className="t-announce bg-accent text-primary text-[12px] font-extrabold uppercase italic tracking-wide text-center py-2 px-4">
          ⚡ {announcement}
        </div>
      )}

      <header className="t-nav sticky top-0 z-[100] bg-primary text-white" onMouseLeave={() => setOpenSlug(null)}>
        <div className="max-w-[1440px] mx-auto h-16 px-4 md:px-8 flex items-center gap-6">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className={`${icon} lg:hidden`}><Menu size={24} /></button>
          <Logo className="t-nav-link font-headline text-3xl leading-none text-white shrink-0" />

          <nav className="hidden lg:flex items-center gap-1 h-full flex-1">
            {categories.map((c) => {
              const active = pathname === `/categories/${c.slug}` || openSlug === c.slug
              return (
                <Link
                  key={c.slug}
                  to={`/categories/${c.slug}`}
                  onMouseEnter={() => setOpenSlug(c.slug)}
                  onClick={() => setOpenSlug(null)}
                  className={`t-nav-link h-16 px-3 flex items-center gap-1 font-headline text-lg tracking-wide border-b-4 transition-colors ${
                    active ? 'border-accent text-white' : 'border-transparent text-white/75 hover:text-white'
                  }`}
                >
                  {c.name}
                  {c.subcategories.length > 0 && <ChevronDown size={14} className="opacity-60" />}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => setSearch(true)} aria-label="Rechercher" className={icon}><Search size={20} /></button>
            <div className="hidden sm:block text-white/85"><NotificationBell /></div>
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className={icon}><User size={20} /></button>
              {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="rounded" />}
            </div>
            <Link to="/favoris" aria-label="Favoris" className={`${icon} hidden sm:block`}>
              <Heart size={20} />
              <CountBadge count={wishlistCount} className="bg-white text-primary" />
            </Link>
            <button onClick={() => setCart(true)} className="t-btn sport-skew bg-accent text-primary font-extrabold uppercase italic text-sm px-4 py-2 rounded-sm">
              <span>Panier{cartCount ? ` (${cartCount})` : ''}</span>
            </button>
          </div>
        </div>

        {openCat && openCat.subcategories.length > 0 && (
          <div className="hidden lg:block absolute inset-x-0 top-full bg-primary border-t border-white/10 shadow-2xl">
            <div className="max-w-[1440px] mx-auto px-8 py-8 grid grid-cols-12 gap-8">
              <div className="col-span-8 grid grid-cols-3 gap-x-8 gap-y-3 content-start">
                <Link to={`/categories/${openCat.slug}`} onClick={() => setOpenSlug(null)} className="col-span-3 font-headline text-3xl text-accent mb-2">
                  Tout {openCat.name} →
                </Link>
                {openCat.subcategories.map((sub) => (
                  <Link
                    key={sub}
                    to={`/categories/${openCat.slug}?sub=${encodeURIComponent(sub)}`}
                    onClick={() => setOpenSlug(null)}
                    className="font-semibold uppercase text-sm text-white/80 hover:text-accent hover:translate-x-1 transition-all"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
              {openCat.image && (
                <Link to={`/categories/${openCat.slug}`} onClick={() => setOpenSlug(null)} className="col-span-4 relative aspect-[16/9] overflow-hidden rounded group">
                  <img onError={hideBroken} src={openCat.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <span className="absolute left-3 bottom-3 bg-accent text-primary font-headline text-xl px-3 py-1 flex items-center gap-2">
                    {openCat.name} <ArrowRight size={16} />
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        categories={categories}
        user={user}
        look={{
          panel: 'bg-primary text-white',
          divider: 'border-white/10',
          logo: 'font-headline text-2xl text-white',
          link: 'font-headline text-xl tracking-wide',
          button: 'bg-accent text-primary font-bold uppercase italic rounded',
          secondary: 'border border-white/30 rounded uppercase font-semibold',
        }}
      />
      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="sport" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
