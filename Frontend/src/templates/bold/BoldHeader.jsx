import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, Heart, X, ArrowUpRight } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import CartDrawer from '../../components/CartDrawer'
import NotificationBell from '../../components/NotificationBell'
import { useNav } from '../shared/useNav'
import { Logo, AccountMenu, SearchOverlay, useOutsideClose, useScrollLock, hideBroken } from '../shared/ui'

function Marquee({ text }) {
  const items = Array.from({ length: 8 }, () => text)
  return (
    <div className="bg-primary text-white overflow-hidden whitespace-nowrap py-2 text-[11px] font-bold uppercase tracking-[0.2em]">
      <div className="marquee-track inline-flex">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="px-8 flex items-center gap-8">{t}<span aria-hidden>✦</span></span>
        ))}
      </div>
    </div>
  )
}

export default function BoldHeader() {
  const { cartCount, wishlistCount } = useShop()
  const { categories, announcement, user, logout, scrolled, isHome, pathname } = useNav()
  const [menu, setMenu] = useState(false)
  const [hovered, setHovered] = useState(0)
  const [search, setSearch] = useState(false)
  const [cart, setCart] = useState(false)
  const [account, setAccount] = useState(false)
  const accountRef = useOutsideClose(account, () => setAccount(false))
  useScrollLock(menu)

  useEffect(() => setMenu(false), [pathname])

  const overlay = isHome && !scrolled
  const active = categories[hovered]
  const btn = 'relative uppercase text-[12px] font-bold tracking-[0.12em] hover:opacity-60 transition-opacity'

  return (
    <>
      <div className={`${isHome ? 'fixed' : 'sticky'} top-0 inset-x-0 z-[100]`}>
        {announcement && <Marquee text={announcement} />}
        <header className={`transition-colors duration-300 ${overlay ? 'bg-transparent text-white' : 'bg-black text-white'}`}>
          <div className="h-16 md:h-20 px-4 md:px-8 grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center gap-5 md:gap-8">
              <button onClick={() => setMenu(true)} className={`${btn} flex items-center gap-3`}>
                <span className="flex flex-col gap-[5px]"><span className="w-6 h-[2px] bg-current" /><span className="w-4 h-[2px] bg-current" /></span>
                <span className="hidden sm:inline">Menu</span>
              </button>
              <button onClick={() => setSearch(true)} className={`${btn} hidden md:flex items-center gap-2`}>
                <Search size={16} strokeWidth={2.5} /> Chercher
              </button>
            </div>

            <Logo className="font-headline text-2xl md:text-4xl uppercase leading-none tracking-tight" imgClassName="h-8 md:h-10" />

            <div className="flex items-center justify-end gap-4 md:gap-6">
              <button onClick={() => setSearch(true)} aria-label="Chercher" className="md:hidden"><Search size={20} strokeWidth={2.5} /></button>
              <div className="hidden sm:block"><NotificationBell /></div>
              <div className="relative" ref={accountRef}>
                <button onClick={() => setAccount((v) => !v)} className={`${btn} flex items-center gap-2`}>
                  <User size={18} strokeWidth={2.5} />
                  <span className="hidden lg:inline">{user ? user.firstName : 'Compte'}</span>
                </button>
                {account && <AccountMenu user={user} onLogout={logout} onClose={() => setAccount(false)} panelClassName="!rounded-none border-2 !border-black" />}
              </div>
              <Link to="/favoris" className={`${btn} hidden sm:flex items-center gap-1`}>
                <Heart size={18} strokeWidth={2.5} />
                {wishlistCount > 0 && <span>({wishlistCount})</span>}
              </Link>
              <button onClick={() => setCart(true)} className={btn}>
                Panier ({cartCount})
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Full-screen menu */}
      <div className={`fixed inset-0 z-[160] bg-black text-white transition-[clip-path] duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] ${menu ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_0_100%_0)] pointer-events-none'}`}>
        <div className="h-full flex flex-col">
          <div className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/15">
            <button onClick={() => setMenu(false)} className={`${btn} flex items-center gap-3`}>
              <X size={22} strokeWidth={2.5} /> Fermer
            </button>
            <Logo className="font-headline text-2xl md:text-4xl uppercase leading-none" imgClassName="h-8 md:h-10" />
            <button onClick={() => { setMenu(false); setCart(true) }} className={btn}>Panier ({cartCount})</button>
          </div>

          <div className="flex-1 min-h-0 grid lg:grid-cols-[1.3fr_1fr]">
            <nav className="overflow-y-auto px-4 md:px-8 py-8 md:py-12">
              <Link to="/" onClick={() => setMenu(false)} className="block text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6 hover:text-white">
                ← Accueil
              </Link>
              {categories.map((c, i) => (
                <div
                  key={c.slug}
                  onMouseEnter={() => setHovered(i)}
                  className="border-b border-white/15"
                >
                  <Link
                    to={`/categories/${c.slug}`}
                    onClick={() => setMenu(false)}
                    className={`group flex items-baseline gap-4 md:gap-6 py-2 md:py-3 transition-all duration-500 ${menu ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                    style={{ transitionDelay: menu ? `${150 + i * 60}ms` : '0ms' }}
                  >
                    <span className="text-xs font-bold text-white/40 w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`font-headline uppercase leading-[0.9] text-5xl md:text-7xl xl:text-8xl transition-colors ${hovered === i ? 'text-white' : 'text-white/35'} group-hover:text-white`}>
                      {c.name}
                    </span>
                    <ArrowUpRight size={36} className="ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                  {hovered === i && c.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-4 pl-10 md:pl-12">
                      {c.subcategories.map((sub) => (
                        <Link
                          key={sub}
                          to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`}
                          onClick={() => setMenu(false)}
                          className="text-xs font-bold uppercase tracking-wider border border-white/30 px-3 py-1.5 hover:bg-white hover:text-black transition-colors"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold uppercase tracking-[0.15em]">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMenu(false)} className="hover:opacity-60">Profil</Link>
                    <Link to="/commandes" onClick={() => setMenu(false)} className="hover:opacity-60">Commandes</Link>
                    <Link to="/retours" onClick={() => setMenu(false)} className="hover:opacity-60">Retours</Link>
                    <button onClick={() => { setMenu(false); logout() }} className="text-left hover:opacity-60">Déconnexion</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenu(false)} className="hover:opacity-60">Connexion</Link>
                    <Link to="/inscription" onClick={() => setMenu(false)} className="hover:opacity-60">Inscription</Link>
                  </>
                )}
              </div>
            </nav>

            <div className="hidden lg:block relative overflow-hidden border-l border-white/15">
              {categories.map((c, i) => (
                c.image && (
                  <img
                    onError={hideBroken}
                    key={c.slug}
                    src={c.image}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${hovered === i ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                  />
                )
              ))}
              {active && (
                <div className="absolute left-0 bottom-0 p-8 mix-blend-difference">
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">{active.productCount > 0 ? `${active.productCount} produits` : 'Collection'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SearchOverlay open={search} onClose={() => setSearch(false)} variant="bold" />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  )
}
