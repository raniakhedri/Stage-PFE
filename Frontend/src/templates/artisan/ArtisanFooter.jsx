import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { copyFor } from '../shared/content'
import { Logo } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function ArtisanFooter() {
  const { storeName, businessType } = useStore()
  const copy = copyFor(businessType)
  const categories = useFooterCategories()
  const link = 'text-sm text-surface/70 hover:text-surface transition-colors'
  const head = 'font-headline italic text-lg text-surface mb-4'

  return (
    <footer className="t-footer bg-ink text-surface rounded-t-[40px] mt-6">
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 pt-16 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <Logo className="font-headline italic text-3xl text-surface" />
          <p className="mt-4 text-sm text-surface/70 max-w-xs leading-relaxed">{copy.footerBlurb}</p>
          <p className="mt-6 font-headline italic text-surface/50">{copy.quote}</p>
        </div>
        {categories.length > 0 && (
          <div className="md:col-span-3">
            <p className={head}>La boutique</p>
            <ul className="space-y-3">
              {categories.map((c) => <li key={c.slug}><Link to={`/categories/${c.slug}`} className={link}>{c.name}</Link></li>)}
            </ul>
          </div>
        )}
        <div className="md:col-span-2">
          <p className={head}>Mon compte</p>
          <ul className="space-y-3">
            <li><Link to="/profile" className={link}>Profil</Link></li>
            <li><Link to="/commandes" className={link}>Commandes</Link></li>
            <li><Link to="/retours" className={link}>Retours</Link></li>
            <li><Link to="/favoris" className={link}>Favoris</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className={head}>Paiement</p>
          <ul className="space-y-3 text-sm text-surface/70">
            <li>Carte bancaire</li>
            <li>Paiement à la livraison</li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-6 border-t border-white/15 flex flex-col sm:flex-row justify-between gap-2 text-xs text-surface/50">
        <span>© {new Date().getFullYear()} {storeName || 'Boutique'} — fait avec soin</span>
        <span>Livraison partout en Tunisie</span>
      </div>
    </footer>
  )
}
