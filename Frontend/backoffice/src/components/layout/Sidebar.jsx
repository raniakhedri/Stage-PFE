import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAdminNotifications } from '../../hooks/useAdminNotifications'

const navItems = [
  { path: '/dashboard',      label: 'Tableau de bord',  icon: 'dashboard',        moduleKey: 'TABLEAU_DE_BORD' },
  { path: '/produits',       label: 'Produits',          icon: 'inventory_2',      moduleKey: 'PRODUITS' },
  { path: '/commandes',      label: 'Commandes',         icon: 'shopping_cart',    moduleKey: 'COMMANDES' },
  { path: '/retours',        label: 'Retours',           icon: 'assignment_return',moduleKey: 'RETOURS' },
  { path: '/clients',        label: 'Clients',           icon: 'group',            moduleKey: 'CLIENTS' },
  { path: '/categories',     label: 'Catégories',        icon: 'folder',           moduleKey: 'CATEGORIES' },
  { path: '/bannieres',      label: 'Bannières',         icon: 'view_carousel',    moduleKey: 'BANNIERES' },
  { path: '/tva-livraison',  label: 'TVA & Livraison',   icon: 'local_shipping',   moduleKey: 'TVA_LIVRAISON' },
]

const marketingItems = [
  { path: '/promotions',      label: 'Promotions',      icon: 'campaign',     moduleKey: 'PROMOTIONS' },
  { path: '/fidelite',        label: 'Fidélité',        icon: 'stars',        moduleKey: 'PROMOTIONS' },
  { path: '/email-marketing', label: 'Email Marketing', icon: 'mail',         moduleKey: 'EMAIL_MARKETING' },
  { path: '/avis',            label: 'Avis',            icon: 'reviews',      moduleKey: 'AVIS' },
]

const parametresItems = [
  { path: '/apparence', label: 'Apparence',           icon: 'palette',             moduleKey: 'APPARENCE' },
  { path: '/roles',     label: 'Rôles & Permissions', icon: 'admin_panel_settings', moduleKey: 'ROLES_PERMISSIONS' },
  { path: '/compte',    label: 'Compte & Hébergement',icon: 'settings',            moduleKey: 'COMPTE_HEBERGEMENT' },
]

function canSee(permissions, roleName, moduleKey) {
  if (roleName === 'SUPER_ADMIN') return true
  if (!permissions) return false
  return permissions[moduleKey] === true
}

function Sidebar() {
  const navigate = useNavigate()

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userPermissions = storedUser.permissions || {}
  const userRole = storedUser.roleName || ''

  /* ── read sidebar layout toggles from CSS custom properties ── */
  const readToggle = useCallback((prop) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
    return v !== '0'           // '0' → hidden, anything else (including '') → visible
  }, [])

  const [showIcons, setShowIcons] = useState(() => readToggle('--sidebar-show-icons'))
  const [showLogo, setShowLogo]   = useState(() => readToggle('--sidebar-show-logo'))
  const [logoMain, setLogoMain]   = useState(() => document.documentElement.getAttribute('data-logo-main') || '')
  const [logoLight, setLogoLight] = useState(() => document.documentElement.getAttribute('data-logo-light') || '')
  const [isDark, setIsDark]       = useState(() => document.documentElement.classList.contains('dark-mode'))
  const [logoScale, setLogoScale] = useState(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--logo-scale').trim()
    return v ? parseInt(v, 10) : 100
  })
  const [logoAlign, setLogoAlign] = useState(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--logo-align').trim() || 'left'
  })

  // Pick the right logo: use light variant in dark mode if available, else main
  const logoSrc = (isDark && logoLight) ? logoLight : logoMain

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setShowIcons(readToggle('--sidebar-show-icons'))
      setShowLogo(readToggle('--sidebar-show-logo'))
      setLogoMain(document.documentElement.getAttribute('data-logo-main') || '')
      setLogoLight(document.documentElement.getAttribute('data-logo-light') || '')
      setIsDark(document.documentElement.classList.contains('dark-mode'))
      const v = getComputedStyle(document.documentElement).getPropertyValue('--logo-scale').trim()
      setLogoScale(v ? parseInt(v, 10) : 100)
      setLogoAlign(getComputedStyle(document.documentElement).getPropertyValue('--logo-align').trim() || 'left')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-logo-main', 'data-logo-light'] })
    return () => observer.disconnect()
  }, [readToggle])

  // ── Notification bell ──────────────────────────────────────────────────
  const { notifications } = useAdminNotifications()
  const [bellOpen, setBellOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('admin_notif_read') || '[]')); } catch { return new Set(); }
  })
  const bellRef = useRef(null)
  const btnRef  = useRef(null)
  const [panelPos, setPanelPos] = useState({ top: null, bottom: null, left: 0 })
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  useEffect(() => {
    function onClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleBellClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const panelH = 400 // max panel height (header + max-h-80)
      const spaceBelow = window.innerHeight - rect.top
      if (spaceBelow < panelH) {
        // not enough room below → anchor to bottom of button, grow upward
        setPanelPos({ top: null, bottom: window.innerHeight - rect.bottom, left: rect.right + 8 })
      } else {
        setPanelPos({ top: rect.top, bottom: null, left: rect.right + 8 })
      }
    }
    setBellOpen(o => !o)
    if (!bellOpen) {
      const all = new Set([...readIds, ...notifications.map(n => n.id)])
      setReadIds(all)
      localStorage.setItem('admin_notif_read', JSON.stringify([...all]))
    }
  }

  const SEVERITY_COLOR = { error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500' }

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
      <div className={`px-4 py-4 flex-shrink-0 flex items-center border-b border-slate-200 ${logoAlign === 'center' ? 'justify-center' : ''}`}>
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logo"
            className="w-auto object-contain transition-all duration-200"
            style={{ height: `${36 * logoScale / 100}px`, maxWidth: '200px' }}
          />
        ) : (
          <>
            <div className="w-9 h-9 bg-sidebar rounded-custom flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[18px]">shield</span>
            </div>
            <span className="ml-3 text-lg font-bold tracking-tight text-slate-800">
              Nature<span className="text-sidebar">Essence</span>
            </span>
          </>
        )}
      </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 px-3 flex-1 space-y-1 overflow-y-auto">
        {navItems.filter(item => canSee(userPermissions, userRole, item.moduleKey)).map((item) => (
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

        {/* Marketing Section — afficher seulement si au moins 1 item visible */}
        {marketingItems.some(item => canSee(userPermissions, userRole, item.moduleKey)) && (
          <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Marketing
          </div>
        )}
        {marketingItems.filter(item => canSee(userPermissions, userRole, item.moduleKey)).map((item) => (
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

        {/* Paramètres Section — afficher seulement si au moins 1 item visible */}
        {parametresItems.some(item => canSee(userPermissions, userRole, item.moduleKey)) && (
          <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Paramètres
          </div>
        )}
        {parametresItems.filter(item => canSee(userPermissions, userRole, item.moduleKey)).map((item) => (
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

        {/* Notification bell */}
        <div ref={bellRef}>
          <button
            ref={btnRef}
            onClick={handleBellClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-sidebar rounded-lg transition-all"
          >
            {showIcons && (
              <span className="relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            )}
            <span className="text-sm font-medium flex-1 text-left">Notifications</span>
            {!showIcons && unreadCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              style={{
                position: 'fixed',
                top:    panelPos.top    != null ? panelPos.top    : undefined,
                bottom: panelPos.bottom != null ? panelPos.bottom : undefined,
                left:   panelPos.left,
                zIndex: 9999,
              }}
              className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm">Alertes</span>
                {notifications.length === 0 && (
                  <span className="text-xs text-slate-400">Tout est en ordre</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-slate-300">check_circle</span>
                    Aucune alerte en cours
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { navigate(n.link); setBellOpen(false); }}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${SEVERITY_COLOR[n.severity] || 'text-slate-500'}`}>
                        {n.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 truncate">{n.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
