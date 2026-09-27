import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { copyFor } from '../shared/content'
import { Logo } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

const small = 'text-[11px] uppercase tracking-[0.28em]'

export default function LuxuryFooter() {
  const { storeName, businessType } = useStore()
  const copy = copyFor(businessType)
  const categories = useFooterCategories()
  const link = 'text-sm font-light text-[#f6f1ea]/60 hover:text-[#f6f1ea] transition-colors'

  return (
    <footer className="bg-primary text-[#f6f1ea]">
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 pt-20 pb-10">
        <div className="text-center pb-16 border-b border-[#f6f1ea]/15">
          <Logo className="font-headline text-3xl md:text-4xl tracking-[0.2em] uppercase" imgClassName="h-12 mx-auto" />
          <p className="mt-5 font-headline italic text-lg text-[#f6f1ea]/70">{copy.footerBlurb}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 py-14 text-center md:text-left">
          {categories.length > 0 && (
            <div>
              <p className={`${small} mb-6 text-[#f6f1ea]/45`}>Collections</p>
              <ul className="space-y-3">
                {categories.map((c) => <li key={c.slug}><Link to={`/categories/${c.slug}`} className={link}>{c.name}</Link></li>)}
              </ul>
            </div>
          )}
          <div>
            <p className={`${small} mb-6 text-[#f6f1ea]/45`}>Service client</p>
            <ul className="space-y-3">
              <li><Link to="/profile" className={link}>Mon compte</Link></li>
              <li><Link to="/commandes" className={link}>Suivi de commande</Link></li>
              <li><Link to="/retours" className={link}>Retours</Link></li>
              <li><Link to="/favoris" className={link}>Liste d'envies</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className={`${small} mb-6 text-[#f6f1ea]/45`}>La maison</p>
            <ul className="space-y-3 text-sm font-light text-[#f6f1ea]/60">
              <li>Livraison partout en Tunisie</li>
              <li>Paiement sécurisé</li>
              <li>Emballage soigné</li>
            </ul>
          </div>
        </div>
        <div className={`${small} !tracking-[0.2em] pt-8 border-t border-[#f6f1ea]/15 flex flex-col sm:flex-row justify-between gap-3 text-[#f6f1ea]/40 text-center`}>
          <span>© {new Date().getFullYear()} {storeName || 'Boutique'}</span>
          <span>Tous droits réservés</span>
        </div>
      </div>
    </footer>
  )
}
