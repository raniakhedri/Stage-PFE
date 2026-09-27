import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown, ArrowRight } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import { useStore } from '../../context/StoreContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import { copyFor } from '../shared/content'
import { Logo, AccountMenu, SearchOverlay, CountBadge, useOutsideClose, useScrollLock, hideBroken } from '../shared/ui'

export default function MinimalHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { businessType } = useStore()
  const copy = copyFor(businessType)
  const { categories, announcement, user, logout, pathname } = useNav()
  const [openSlug, setOpenSlug] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  useScrollLock(drawer)

  const openCat = categories.find((c) => c.slug === openSlug)
  const icon = 'relative p-1.5 text-neutral-800 hover:text-neutral-500 transition-colors'

  return (
    <>
      {announcement && (
        <div className="bg-primary text-white text-[11px] tracking-[0.08em] text-center py-2.5 px-4">{announcement}</div>
      )}

      <header className="sticky top-0 z-[100] bg-surface/95 backdrop-blur border-b border-neutral-200" onMouseLeave={() => setOpenSlug(null)}>
        <div className="max-w-[1440px] mx-auto h-[72px] px-5 md:px-10 grid grid-cols-[1fr_auto_1fr] lg:grid-cols-[auto_1fr_auto] items-center gap-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setDrawer(true)} aria-label="Menu" className={icon}><Menu size={22} /></button>
            <button onClick={() => setSearch(true)} aria-label="Rechercher" className={icon}><Search size={20} /></button>
          </div>

          <Logo className="justify-self-center lg:justify-self-start text-xl font-semibold tracking-tight text-ink" />

          <nav className="hidden lg:flex items-center justify-center gap-1 h-full">
            {categories.map((c) => {
              const active = pathname === `/categories/${c.slug}`
              return (
                <Link
                  key={c.slug}
                  to={`/categories/${c.slug}`}
                  onMouseEnter={() => setOpenSlug(c.slug)}
                  onClick={() => setOpenSlug(null)}
                  className={`h-[72px] px-4 flex items-center gap-1 text-[13.5px] transition-colors border-b-2 ${
                    active || openSlug === c.slug ? 'border-ink text-ink' : 'border-transparent text-neutral-600 hover:text-ink'
                  }`}
                >
                  {c.name}
                  {c.subcategories.length > 0 && <ChevronDown size={14} className="opacity-50" />}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-3 md:gap-4">
            <button onClick={() => setSearch(true)} aria-label="Rechercher" className={`${icon} hidden lg:block`}><Search size={20} /></button>
            <div className="text-neutral-800 hidden sm:block"><NotificationBell /></div>
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccount((v) => !v)} aria-label="Compte" className={icon}><User size={20} /></button>
              {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="rounded-md" />}
            </div>
            <Link to="/favoris" aria-label="Favoris" className={`${icon} hidden sm:block`}>
              <Heart size={20} />
              <CountBadge count={wishlistCount} className="bg-ink text-surface" />
            </Link>
            <button onClick={() => setCart(true)} aria-label="Panier" className={icon}>
              <ShoppingBag size={20} />
              <CountBadge count={cartCount} className="bg-primary text-white" />
            </button>
          </div>
        </div>

        {/* Mega menu */}
        {openCat && (
          <div className="hidden lg:block absolute left-0 right-0 top-full bg-surface border-b border-neutral-200 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]">
            <div className="max-w-[1440px] mx-auto px-10 py-10 grid grid-cols-12 gap-10">
              <div className="col-span-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-5">{openCat.name}</p>
                <ul className="space-y-3">
                  <li>
                    <Link to={`/categories/${openCat.slug}`} onClick={() => setOpenSlug(null)} className="text-[15px] font-medium text-ink hover:underline underline-offset-4">
                      Tout voir
                    </Link>
                  </li>
                  {openCat.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link
                        to={`/categories/${openCat.slug}?sub=${encodeURIComponent(sub)}`}
                        onClick={() => setOpenSlug(null)}
                        className="text-[15px] text-neutral-600 hover:text-ink transition-colors"
                      >
                        {sub}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-4 text-sm text-neutral-500 leading-relaxed self-end">
                {openCat.description && <p className="mb-5 max-w-sm">{openCat.description}</p>}
                <Link to={`/categories/${openCat.slug}`} onClick={() => setOpenSlug(null)} className="inline-flex items-center gap-2 text-ink font-medium">
                  Découvrir {openCat.name} <ArrowRight size={15} />
                </Link>
              </div>
              <div className="col-span-5 grid grid-cols-2 gap-4">
                {categories.filter((c) => c.image).slice(0, 2).map((c, i) => (
                  <Link key={c.slug} to={`/categories/${c.slug}`} onClick={() => setOpenSlug(null)} className="group">
                    <div className="aspect-[4/3] overflow-hidden rounded-md bg-neutral-100">
                      <img onError={hideBroken} src={i === 0 && openCat.image ? openCat.image : c.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <p className="mt-2 text-[13px] text-neutral-700">{i === 0 ? copy.menuFeature : c.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[150] lg:hidden transition-opacity ${drawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
        <aside className={`absolute inset-y-0 left-0 w-[88vw] max-w-sm bg-surface flex flex-col transition-transform duration-300 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-200">
            <Logo className="text-lg font-semibold text-ink" imgClassName="h-7" />
            <button onClick={() => setDrawer(false)} aria-label="Fermer"><X size={22} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-3">
            <Link to="/" onClick={() => setDrawer(false)} className="block py-4 border-b border-neutral-100 text-[15px]">Accueil</Link>
            {categories.map((c) => (
              <div key={c.slug} className="border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <Link to={`/categories/${c.slug}`} onClick={() => setDrawer(false)} className="flex-1 py-4 text-[15px]">{c.name}</Link>
                  {c.subcategories.length > 0 && (
                    <button onClick={() => setExpanded(expanded === c.slug ? null : c.slug)} className="p-2" aria-label="Sous-catégories">
                      <ChevronDown size={16} className={`transition-transform ${expanded === c.slug ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {expanded === c.slug && (
                  <div className="pb-4 pl-3 space-y-3">
                    {c.subcategories.map((sub) => (
                      <Link key={sub} to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`} onClick={() => setDrawer(false)} className="block text-sm text-neutral-500">
                        {sub}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="p-5 border-t border-neutral-200 grid grid-cols-2 gap-3 text-sm">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setDrawer(false)} className="py-3 text-center border border-neutral-300 rounded-md">Mon profil</Link>
                <Link to="/commandes" onClick={() => setDrawer(false)} className="py-3 text-center border border-neutral-300 rounded-md">Commandes</Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setDrawer(false)} className="py-3 text-center bg-ink text-surface rounded-md">Connexion</Link>
                <Link to="/inscription" onClick={() => setDrawer(false)} className="py-3 text-center border border-neutral-300 rounded-md">Inscription</Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="minimal" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
