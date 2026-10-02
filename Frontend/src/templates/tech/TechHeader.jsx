import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, ShoppingCart, Menu, ChevronDown } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import MobileDrawer from '../shared/MobileDrawer'
import { Logo, AccountMenu, SearchOverlay, CountBadge, useOutsideClose } from '../shared/ui'

/** Tech: dark top bar with a central search field, then a light category bar with dropdowns. */
export default function TechHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { categories, announcement, user, logout, pathname } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  // Ctrl/⌘ + K opens the search, as the shortcut hint in the bar says.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const icon = 't-nav-link relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors'

  return (
    <>
      <header className="sticky top-0 z-[100]" onMouseLeave={() => setOpenSlug(null)}>
        <div className="t-nav bg-primary text-white">
          <div className="max-w-[1440px] mx-auto h-16 px-4 md:px-8 flex items-center gap-4 md:gap-8">
            <button onClick={() => setDrawer(true)} aria-label="Menu" className={`${icon} lg:hidden`}><Menu size={22} /></button>
            <Logo className="t-nav-link font-headline text-xl text-white shrink-0" />
            <button
              onClick={() => setSearch(true)}
              className="hidden md:flex flex-1 max-w-2xl items-center gap-3 h-10 px-4 rounded-xl bg-white/[0.07] border border-white/10 text-sm text-slate-400 hover:border-accent/60 transition-colors"
            >
              <Search size={17} /> Rechercher un produit, une marque…
              <kbd className="ml-auto text-[10px] border border-white/15 rounded px-1.5 py-0.5">Ctrl K</kbd>
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setSearch(true)} aria-label="Rechercher" className={`${icon} md:hidden`}><Search size={20} /></button>
              <div className="hidden sm:block text-slate-300"><NotificationBell /></div>
              <div className="relative" ref={accountRef}>
                <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className={icon}><User size={20} /></button>
                {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="rounded-xl overflow-hidden" />}
              </div>
              <Link to="/favoris" aria-label="Favoris" className={`${icon} hidden sm:block`}>
                <Heart size={20} />
                <CountBadge count={wishlistCount} className="bg-white text-primary" />
              </Link>
              <button onClick={() => setCart(true)} aria-label="Panier" className="t-btn ml-2 h-10 px-4 rounded-xl bg-accent text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90">
                <ShoppingCart size={17} /> <span className="hidden sm:inline">Panier</span>
                {cartCount > 0 && <span className="bg-white text-accent text-[11px] font-bold rounded-md px-1.5">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>

        <nav className="hidden lg:block bg-surface/95 backdrop-blur border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto px-8 h-11 flex items-center gap-1">
            {categories.map((c) => {
              const active = pathname === `/categories/${c.slug}` || openSlug === c.slug
              return (
                <div key={c.slug} className="relative" onMouseEnter={() => setOpenSlug(c.slug)}>
                  <Link
                    to={`/categories/${c.slug}`}
                    onClick={() => setOpenSlug(null)}
                    className={`h-8 px-3 rounded-lg flex items-center gap-1 text-[13.5px] font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-slate-600 hover:text-ink hover:bg-slate-100'}`}
                  >
                    {c.name}
                    {c.subcategories.length > 0 && <ChevronDown size={13} className="opacity-60" />}
                  </Link>
                  {openSlug === c.slug && c.subcategories.length > 0 && (
                    <div className="absolute left-0 top-full pt-2 w-64">
                      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2">
                        {c.subcategories.map((sub) => (
                          <Link
                            key={sub}
                            to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`}
                            onClick={() => setOpenSlug(null)}
                            className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-accent"
                          >
                            {sub}
                          </Link>
                        ))}
                        <Link to={`/categories/${c.slug}`} onClick={() => setOpenSlug(null)} className="block px-3 py-2 mt-1 border-t border-slate-100 text-sm font-semibold text-accent">
                          Tout voir →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {announcement && <span className="t-announce ml-auto text-xs text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{announcement}</span>}
          </div>
        </nav>
      </header>

      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        categories={categories}
        user={user}
        look={{
          panel: 'bg-primary text-white',
          divider: 'border-white/10',
          logo: 'font-headline text-xl text-white',
          link: 'text-[15px]',
          button: 'bg-accent text-white rounded-xl font-semibold',
          secondary: 'border border-white/20 rounded-xl',
        }}
      />
      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="tech" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
