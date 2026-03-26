import { useLocation, useNavigate } from 'react-router-dom'

const singleTitles = {
  '/dashboard':       'Tableau de bord',
  '/produits':        'Produits',
  '/commandes':       'Commandes',
  '/clients':         'Clients',
  '/analyses':        'Analyses',
  '/apparence':       'Apparence',
  '/collections':     'Collections',
  '/promotions':      'Promotions',
  '/email-marketing': 'Email Marketing',
  '/roles':           'Rôles & Permissions',
  '/retours':         'Gestion des Retours',
  '/compte':          'Réglages Système',
  '/categories':      'Catégories',
  '/bannieres':       'Bannières',
  '/tva-livraison':   'TVA & Livraison',
  '/avis':             'Gestion des avis',
}

function getBreadcrumbs(pathname) {
  if (pathname === '/collections/nouveau') {
    return [
      { label: 'Collections', path: '/collections' },
      { label: 'Ajouter Collection', path: null },
    ]
  }
  if (pathname.match(/^\/collections\/\d+$/)) {
    return [
      { label: 'Collections', path: '/collections' },
      { label: 'Gérer Collection', path: null },
    ]
  }
  if (pathname.match(/^\/clients\/\d+$/)) {
    return [
      { label: 'Clients', path: '/clients' },
      { label: 'Détail Client', path: null },
    ]
  }
  if (pathname.startsWith('/produits/edit/')) {
    return [
      { label: 'Produits', path: '/produits' },
      { label: 'Modifier Produit', path: null },
    ]
  }
  if (pathname === '/produits/nouveau') {
    return [
      { label: 'Produits', path: '/produits' },
      { label: 'Ajouter Produit', path: null },
    ]
  }
  if (pathname === '/retours/historique') {
    return [
      { label: 'Gestion des Retours', path: '/retours' },
      { label: 'Historique Remboursements', path: null },
    ]
  }
  if (pathname === '/categories/nouveau') {
    return [
      { label: 'Catégories', path: '/categories' },
      { label: 'Ajouter Catégorie', path: null },
    ]
  }
  if (pathname.match(/^\/commandes\/\d+$/)) {
    return [
      { label: 'Commandes', path: '/commandes' },
      { label: 'Détail Commande', path: null },
    ]
  }
  if (pathname === '/bannieres/nouveau') {
    return [
      { label: 'Bannières', path: '/bannieres' },
      { label: 'Ajouter Bannière', path: null },
    ]
  }
  return [{ label: singleTitles[pathname] || 'Back Office', path: null }]
}

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const crumbs = getBreadcrumbs(location.pathname)

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <nav className="flex items-center gap-2">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <span key={crumb.label} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-slate-300 font-bold text-xl select-none">/</span>
              )}
              {crumb.path && !isLast ? (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="text-xl font-bold text-slate-400 hover:text-slate-700 transition-colors font-heading"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-xl font-bold text-slate-800 font-heading">{crumb.label}</span>
              )}
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-6">
        {/* Counters */}
        <div className="flex items-center gap-4 text-slate-500">
          <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-full">
            <span className="material-symbols-outlined text-base">mail</span>
            <span className="text-sm font-bold text-slate-700">1,000</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-full">
            <span className="material-symbols-outlined text-base">smart_toy</span>
            <span className="text-sm font-bold text-slate-700">42</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative cursor-pointer">
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-[11px] text-white flex items-center justify-center rounded-full border-2 border-white font-bold">4</span>
          <span className="material-symbols-outlined text-[22px] text-slate-400">notifications</span>
        </div>

        <div className="h-9 w-px bg-slate-200 mx-2"></div>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">Admin User</p>
            <p className="text-xs text-slate-500">Directeur Commercial</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-[22px]">person</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
