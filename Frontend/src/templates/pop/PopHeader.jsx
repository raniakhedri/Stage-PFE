import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, ShoppingBag, Menu } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import MobileDrawer from '../shared/MobileDrawer'
import { Logo, AccountMenu, SearchOverlay, CountBadge, useOutsideClose } from '../shared/ui'

export const POP_COLORS = ['bg-amber-300', 'bg-rose-300', 'bg-emerald-300', 'bg-sky-300', 'bg-violet-300', 'bg-orange-300']

/** Pop: floating rounded bar, logo in a colour blob, categories as colourful pills. */
export default function PopHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { categories, announcement, user, logout, pathname } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  const icon = 't-nav-link relative w-10 h-10 rounded-full bg-surface-container-low text-ink flex items-center justify-center hover:scale-110 transition-transform'

  return (
    <>
      {announcement && (
        <div className="t-announce bg-gold text-ink text-sm font-headline text-center py-2 px-4">🎉 {announcement}</div>
      )}

      <header className="sticky top-0 z-[100] px-3 md:px-6 pt-3" onMouseLeave={() => setOpenSlug(null)}>
        <div className="t-nav max-w-[1360px] mx-auto bg-white rounded-full shadow-lg shadow-primary/10 border-2 border-primary/10 h-16 pl-3 pr-2 flex items-center gap-3">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className={`${icon} lg:hidden`}><Menu size={20} /></button>
          <Logo className="t-nav-link font-headline text-xl text-white bg-[rgb(var(--rgb-primary))] rounded-full px-5 py-2 shrink-0 hover:rotate-[-3deg] transition-transform" imgClassName="h-7" />

          <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            {categories.map((c, i) => (
              <div key={c.slug} className="relative" onMouseEnter={() => setOpenSlug(c.slug)}>
                <Link
                  to={`/categories/${c.slug}`}
                  onClick={() => setOpenSlug(null)}
                  className={`t-nav-link block font-headline text-[15px] text-ink px-4 py-1.5 rounded-full border-2 border-transparent hover:-translate-y-0.5 transition-all ${
                    pathname === `/categories/${c.slug}` || openSlug === c.slug ? `${POP_COLORS[i % POP_COLORS.length]} border-ink/10` : 'hover:bg-surface-container-low'
                  }`}
                >
                  {c.name}
                </Link>
                {openSlug === c.slug && c.subcategories.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-56">
                    <div className={`rounded-3xl p-3 shadow-xl border-2 border-ink/10 ${POP_COLORS[i % POP_COLORS.length]}`}>
                      {c.subcategories.map((sub) => (
                        <Link
                          key={sub}
                          to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`}
                          onClick={() => setOpenSlug(null)}
                          className="block px-3 py-2 rounded-2xl font-headline text-ink hover:bg-white/60"
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

          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <button onClick={() => setSearch(true)} aria-label="Rechercher" className={icon}><Search size={18} /></button>
            <div className="hidden sm:block"><NotificationBell /></div>
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className={icon}><User size={18} /></button>
              {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="rounded-3xl overflow-hidden" />}
            </div>
            <Link to="/favoris" aria-label="Favoris" className={`${icon} hidden sm:flex`}>
              <Heart size={18} />
              <CountBadge count={wishlistCount} className="bg-accent text-white" />
            </Link>
            <button onClick={() => setCart(true)} className="t-btn h-12 px-5 rounded-full bg-accent text-white font-headline flex items-center gap-2 hover:scale-105 transition-transform">
              <ShoppingBag size={18} /> {cartCount || 0}
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
          panel: 'bg-surface text-ink rounded-r-[32px]',
          divider: 'border-primary/10',
          logo: 'font-headline text-xl text-primary',
          link: 'font-headline text-lg',
          button: 'bg-accent text-white rounded-full font-headline',
          secondary: 'bg-gold rounded-full font-headline',
        }}
      />
      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="pop" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
