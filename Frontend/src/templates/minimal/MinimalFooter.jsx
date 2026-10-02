import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { useCopy } from '../shared/useCopy'
import { Logo, FooterContact } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function MinimalFooter() {
  const { storeName, businessType } = useStore()
  const copy = useCopy()
  const categories = useFooterCategories()
  const link = 'text-sm text-neutral-500 hover:text-ink transition-colors'

  return (
    <footer className="t-footer bg-surface-container-low border-t border-neutral-200">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 pt-16 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <Logo className="text-xl font-semibold tracking-tight text-ink" />
          <p className="mt-4 text-sm text-neutral-500 max-w-xs leading-relaxed">{copy.footerBlurb}</p>
          <FooterContact />
        </div>
        {categories.length > 0 && (
        <div className="md:col-span-3">
          <p className="text-[13px] font-medium text-ink mb-4">Boutique</p>
          <ul className="space-y-3">
            {categories.map((c) => (
              <li key={c.slug}><Link to={`/categories/${c.slug}`} className={link}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        )}
        <div className="md:col-span-2">
          <p className="text-[13px] font-medium text-ink mb-4">Mon compte</p>
          <ul className="space-y-3">
            <li><Link to="/profile" className={link}>Profil</Link></li>
            <li><Link to="/commandes" className={link}>Commandes</Link></li>
            <li><Link to="/retours" className={link}>Retours</Link></li>
            <li><Link to="/favoris" className={link}>Favoris</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="text-[13px] font-medium text-ink mb-4">Paiement</p>
          <ul className="space-y-3 text-sm text-neutral-500">
            <li>Carte bancaire</li>
            <li>Paiement à la livraison</li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between gap-2 text-xs text-neutral-400">
        <span>© {new Date().getFullYear()} {storeName || 'Boutique'}. Tous droits réservés.</span>
        <span>Livraison partout en Tunisie</span>
      </div>
    </footer>
  )
}
