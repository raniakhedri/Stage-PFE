import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronDown } from 'lucide-react'
import { Logo, useScrollLock } from './ui'

/**
 * Mobile navigation panel used by the Sport, Tech, Artisan, Pop and Éditorial headers.
 * `look` carries the template's classes: panel, divider, link, button and secondary button.
 */
export default function MobileDrawer({ open, onClose, categories, user, look }) {
  const [expanded, setExpanded] = useState(null)
  useScrollLock(open)

  return (
    <div className={`fixed inset-0 z-[150] lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className={`absolute inset-y-0 left-0 w-[88vw] max-w-sm flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} ${look.panel}`}>
        <div className={`h-16 px-5 flex items-center justify-between border-b ${look.divider}`}>
          <Logo className={look.logo} imgClassName="h-7" />
          <button onClick={onClose} aria-label="Fermer"><X size={22} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 py-3">
          <Link to="/" onClick={onClose} className={`block py-4 border-b ${look.divider} ${look.link}`}>Accueil</Link>
          {categories.map((c) => (
            <div key={c.slug} className={`border-b ${look.divider}`}>
              <div className="flex items-center justify-between">
                <Link to={`/categories/${c.slug}`} onClick={onClose} className={`flex-1 py-4 ${look.link}`}>{c.name}</Link>
                {c.subcategories.length > 0 && (
                  <button onClick={() => setExpanded(expanded === c.slug ? null : c.slug)} className="p-2" aria-label="Sous-catégories">
                    <ChevronDown size={16} className={`transition-transform ${expanded === c.slug ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {expanded === c.slug && (
                <div className="pb-4 pl-3 space-y-3">
                  {c.subcategories.map((sub) => (
                    <Link key={sub} to={`/categories/${c.slug}?sub=${encodeURIComponent(sub)}`} onClick={onClose} className="block text-sm opacity-70">
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className={`p-5 border-t ${look.divider} grid grid-cols-2 gap-3 text-sm`}>
          {user ? (
            <>
              <Link to="/profile" onClick={onClose} className={`py-3 text-center ${look.secondary}`}>Mon profil</Link>
              <Link to="/commandes" onClick={onClose} className={`py-3 text-center ${look.secondary}`}>Commandes</Link>
            </>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className={`py-3 text-center ${look.button}`}>Connexion</Link>
              <Link to="/inscription" onClick={onClose} className={`py-3 text-center ${look.secondary}`}>Inscription</Link>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
