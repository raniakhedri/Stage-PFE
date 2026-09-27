import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, Menu, X, Plus, Minus } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import { useStore } from '../../context/StoreContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import { copyFor } from '../shared/content'
import { Logo, AccountMenu, SearchOverlay, useOutsideClose, useScrollLock, hideBroken } from '../shared/ui'

export default function LuxuryHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { businessType } = useStore()
  const copy = copyFor(businessType)
  const { categories, announcement, user, logout, scrolled, isHome, pathname } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  useScrollLock(drawer)

  useEffect(() => { setDrawer(false); setOpenSlug(null) }, [pathname])

  const openCat = categories.find((c) => c.slug === openSlug)
  const transparent = isHome && !scrolled && !openCat
  const tone = transparent ? 'text-white' : 'text-ink'
  const small = 'text-[11px] uppercase tracking-[0.25em]'
  const featured = categories.filter((c) => c.image && c.slug !== openSlug).slice(0, 2)

  return (
    <>
      <div className={`${isHome ? 'fixed' : 'sticky'} top-0 inset-x-0 z-[100]`} onMouseLeave={() => setOpenSlug(null)}>
        {announcement && (
          <div className={`${small} !tracking-[0.2em] text-center py-2.5 px-4 transition-colors duration-500 ${transparent ? 'text-white/80 border-b border-white/15' : 'bg-primary text-[#f6f1ea]'}`}>
            {announcement}
          </div>
        )}
        <header className={`transition-colors duration-500 ${transparent ? 'bg-transparent' : 'bg-surface border-b border-ink/10'} ${tone}`}>
          <div className="h-[72px] md:h-20 px-5 md:px-12 grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center gap-6">
              <button onClick={() => setDrawer(true)} aria-label="Menu" className="lg:hidden"><Menu size={22} strokeWidth={1.25} /></button>
              <button onClick={() => setSearch(true)} className={`${small} hidden lg:flex items-center gap-2 hover:opacity-60 transition-opacity`}>
                <Search size={15} strokeWidth={1.25} /> Rechercher
              </button>
              <button onClick={() => setSearch(true)} aria-label="Rechercher" className="lg:hidden"><Search size={20} strokeWidth={1.25} /></button>
            </div>

            <Logo className="font-headline text-2xl md:text-[30px] tracking-[0.18em] uppercase leading-none" imgClassName="h-9 md:h-11" />

            <div className="flex items-center justify-end gap-5 md:gap-6">
              <div className="hidden sm:block"><NotificationBell /></div>
              <div className="relative" ref={accountRef}>
                <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className="hover:opacity-60 transition-opacity flex">
                  <User size={20} strokeWidth={1.25} />
                </button>
                {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="!rounded-none" />}
              </div>
              <Link to="/favoris" aria-label="Favoris" className="relative hidden sm:flex hover:opacity-60 transition-opacity">
                <Heart size={20} strokeWidth={1.25} />
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-current" />}
              </Link>
              <button onClick={() => setCart(true)} className={`${small} hover:opacity-60 transition-opacity`}>
                <span className="hidden md:inline">Panier </span>({cartCount})
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex justify-center gap-11 pb-5 -mt-1">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                onMouseEnter={() => setOpenSlug(c.slug)}
                className={`${small} relative py-1 after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-current after:transition-all after:duration-500 ${
                  openSlug === c.slug || pathname === `/categories/${c.slug}` ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </header>

        {/* Mega menu */}
        <div className={`hidden lg:block absolute inset-x-0 top-full bg-surface border-b border-ink/10 overflow-hidden transition-all duration-500 ${openCat ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          {openCat && (
            <div className="max-w-[1320px] mx-auto px-12 py-12 grid grid-cols-12 gap-12 text-ink">
              <div className="col-span-3">
                <p className="font-headline text-3xl italic mb-6">{openCat.name}</p>
                <ul className="space-y-3.5">
                  {openCat.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link to={`/categories/${openCat.slug}?sub=${encodeURIComponent(sub)}`} className="text-sm text-neutral-600 hover:text-ink transition-colors">{sub}</Link>
                    </li>
                  ))}
                  <li className="pt-3">
                    <Link to={`/categories/${openCat.slug}`} className={`${small} border-b border-ink pb-1`}>Tout découvrir</Link>
                  </li>
                </ul>
              </div>
              <div className="col-span-3 self-center">
                {openCat.description ? (
                  <p className="font-headline text-lg italic leading-relaxed text-neutral-600">{openCat.description}</p>
                ) : (
                  <p className="font-headline text-lg italic leading-relaxed text-neutral-600">{copy.quote}</p>
                )}
              </div>
              <div className="col-span-6 grid grid-cols-2 gap-6">
                {[openCat, ...featured].filter((c) => c.image).slice(0, 2).map((c, i) => (
                  <Link key={c.slug} to={`/categories/${c.slug}`} className="group">
                    <div className="aspect-[4/5] max-h-[340px] w-full overflow-hidden bg-neutral-200">
                      <img onError={hideBroken} src={c.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[1200ms]" />
                    </div>
                    <p className={`${small} mt-4`}>{i === 0 ? copy.menuFeature : c.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[150] lg:hidden transition-opacity duration-500 ${drawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
        <aside className={`absolute inset-y-0 left-0 w-full max-w-md bg-surface text-ink flex flex-col transition-transform duration-500 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-[72px] px-5 flex items-center justify-between border-b border-ink/10">
            <button onClick={() => setDrawer(false)} aria-label="Fermer"><X size={22} strokeWidth={1.25} /></button>
            <Logo className="font-headline text-xl tracking-[0.18em] uppercase" imgClassName="h-8" />
            <span className="w-[22px]" />
          </div>
          <nav className="flex-1 overflow-y-auto px-6 py-6">
            {categories.map((c) => (
              <div key={c.slug} className="border-b border-ink/10">
                <div className="flex items-center justify-between">
                  <Link to={`/categories/${c.slug}`} className="flex-1 py-5 font-headline text-3xl">{c.name}</Link>
                  {c.subcategories.length > 0 && (
                    <button onClick={() => setExpanded(expanded === c.slug ? null : c.slug)} className="p-2" aria-label="Sous-catégories">
                      {expanded === c.slug ? <Minus size={16} strokeWidth={1.25} /> : <Plus size={16} strokeWidth={1.25} />}
                    </button>
                  )}
                </div>
                {expanded === c.slug && (
                  <div className="pb-5 space-y-3">
                    {c.subcategories.map((sub) => (
                      <Link key={sub} to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`} className={`${small} block text-neutral-600`}>{sub}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="px-6 py-6 border-t border-ink/10 space-y-4">
            {user ? (
              <>
                <Link to="/profile" className={`${small} block`}>Mon compte</Link>
                <Link to="/commandes" className={`${small} block`}>Mes commandes</Link>
                <button onClick={logout} className={`${small} block text-neutral-500`}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${small} block`}>Se connecter</Link>
                <Link to="/inscription" className={`${small} block`}>Créer un compte</Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="luxury" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
