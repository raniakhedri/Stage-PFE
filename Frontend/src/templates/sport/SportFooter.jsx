import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { useCopy } from '../shared/useCopy'
import { Logo, FooterContact } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function SportFooter() {
  const { storeName, businessType } = useStore()
  const copy = useCopy()
  const categories = useFooterCategories()
  const link = 'text-sm text-white/65 hover:text-accent transition-colors'
  const head = 'font-headline text-xl text-accent mb-4'

  return (
    <footer className="t-footer bg-primary text-white">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 pt-16 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <Logo className="font-headline text-4xl text-white" />
          <p className="mt-4 text-sm text-white/65 max-w-xs leading-relaxed">{copy.footerBlurb}</p>
          <FooterContact />
          <p className="mt-6 font-headline text-2xl text-white/20">{copy.statement.join(' ')}</p>
        </div>
        {categories.length > 0 && (
          <div className="md:col-span-3">
            <p className={head}>Boutique</p>
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
          <ul className="space-y-3 text-sm text-white/65">
            <li>Carte bancaire</li>
            <li>Paiement à la livraison</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/50 uppercase font-semibold">
          <span>© {new Date().getFullYear()} {storeName || 'Boutique'}</span>
          <span>Livraison partout en Tunisie</span>
        </div>
      </div>
    </footer>
  )
}
