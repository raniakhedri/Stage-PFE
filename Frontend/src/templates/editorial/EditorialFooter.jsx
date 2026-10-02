import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { copyFor } from '../shared/content'
import { Logo } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function EditorialFooter() {
  const { storeName, businessType } = useStore()
  const copy = copyFor(businessType)
  const categories = useFooterCategories()
  const link = 'text-sm text-ink/60 hover:text-accent transition-colors'
  const head = 'text-[11px] uppercase tracking-[0.2em] text-ink mb-4'

  return (
    <footer className="t-footer bg-surface border-t-[3px] border-double border-ink">
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 pt-14 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <p className="text-sm text-ink/60 max-w-sm leading-relaxed">{copy.footerBlurb}</p>
          <p className="mt-4 font-headline italic text-lg text-ink">{copy.quote}</p>
        </div>
        {categories.length > 0 && (
          <div className="md:col-span-3">
            <p className={head}>Rubriques</p>
            <ul className="space-y-3">
              {categories.map((c, i) => (
                <li key={c.slug}>
                  <Link to={`/categories/${c.slug}`} className={link}>
                    <span className="font-headline italic text-ink/30 mr-2">{String(i + 1).padStart(2, '0')}</span>{c.name}
                  </Link>
                </li>
              ))}
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
          <ul className="space-y-3 text-sm text-ink/60">
            <li>Carte bancaire</li>
            <li>Paiement à la livraison</li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 overflow-hidden">
        <Logo className="block font-headline italic text-[16vw] md:text-[11vw] leading-none text-ink/[0.07] whitespace-nowrap" imgClassName="h-24 opacity-20" />
      </div>
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-5 border-t border-ink/15 flex flex-col sm:flex-row justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/50">
        <span>© {new Date().getFullYear()} {storeName || 'Boutique'}</span>
        <span>Livraison partout en Tunisie</span>
      </div>
    </footer>
  )
}
