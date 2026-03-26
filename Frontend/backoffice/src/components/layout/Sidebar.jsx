import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'

const navItems = [
  { path: '/dashboard',   label: 'Tableau de bord', icon: 'dashboard' },
  { path: '/produits',    label: 'Produits',         icon: 'inventory_2' },
  { path: '/commandes',   label: 'Commandes',        icon: 'shopping_cart' },
  { path: '/retours',     label: 'Retours',          icon: 'assignment_return' },
  { path: '/clients',     label: 'Clients',          icon: 'group' },
  { path: '/analyses',    label: 'Analyses',         icon: 'analytics' },
  { path: '/collections', label: 'Collections',       icon: 'category' },
  { path: '/categories', label: 'Catégories',        icon: 'folder' },
  { path: '/bannieres',  label: 'Bannières',          icon: 'view_carousel' },
  { path: '/tva-livraison', label: 'TVA & Livraison',   icon: 'local_shipping' },
]

const marketingItems = [
  { path: '/promotions',      label: 'Promotions',      icon: 'campaign' },
  { path: '/email-marketing', label: 'Email Marketing', icon: 'mail' },
  { path: '/avis',            label: 'Avis',             icon: 'reviews' },
]

const parametresItems = [
  { path: '/apparence', label: 'Apparence', icon: 'palette' },
  { path: '/roles', label: 'Rôles & Permissions', icon: 'admin_panel_settings' },
  { path: '/compte', label: 'Compte & Hébergement', icon: 'settings' },
]

function Sidebar() {
  const navigate = useNavigate()

  /* ── read sidebar layout toggles from CSS custom properties ── */
  const readToggle = useCallback((prop) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
    return v !== '0'           // '0' → hidden, anything else (including '') → visible
  }, [])

  const [showIcons, setShowIcons] = useState(() => readToggle('--sidebar-show-icons'))
  const [showLogo, setShowLogo]   = useState(() => readToggle('--sidebar-show-logo'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setShowIcons(readToggle('--sidebar-show-icons'))
      setShowLogo(readToggle('--sidebar-show-logo'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [readToggle])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.href = 'http://localhost:3001/login'
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen font-sidebar">
      {/* Logo */}
      {showLogo && (
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-sidebar rounded-custom flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white text-[20px]">shield</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">
          WORKWEAR<span className="text-sidebar">PRO</span>
        </span>
      </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 px-3 flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-slate-100 text-sidebar font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-sidebar'
              }`
            }
          >
            {showIcons && <span className="material-symbols-outlined text-[20px]">{item.icon}</span>}
            {item.label}
          </NavLink>
        ))}

        {/* Marketing Section */}
        <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Marketing
        </div>
        {marketingItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-slate-100 text-sidebar font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-sidebar'
              }`
            }
          >
            {showIcons && <span className="material-symbols-outlined text-[20px]">{item.icon}</span>}
            {item.label}
          </NavLink>
        ))}

        {/* Paramètres Section */}
        <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Paramètres
        </div>
        {parametresItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-slate-100 text-sidebar font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-sidebar'
              }`
            }
          >
            {showIcons && <span className="material-symbols-outlined text-[20px]">{item.icon}</span>}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Voir site + Logout */}
      <div className="p-4 mt-auto border-t border-slate-100 space-y-1">
        <a
          href="http://localhost:3001"
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-sidebar rounded-lg transition-all"
        >
          {showIcons && <span className="material-symbols-outlined text-[20px]">language</span>}
          <span className="text-sm font-medium">Voir le site</span>
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          {showIcons && <span className="material-symbols-outlined text-[20px]">logout</span>}
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
