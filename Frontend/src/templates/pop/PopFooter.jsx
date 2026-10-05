import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { useCopy } from '../shared/useCopy'
import { Logo, FooterContact } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function PopFooter() {
  const { storeName, businessType } = useStore()
  const copy = useCopy()
  const categories = useFooterCategories()
  const link = 'text-sm text-white/75 hover:text-gold transition-colors'
  const head = 'font-headline text-lg text-gold mb-4'

  return (
    <footer className="t-footer bg-primary text-white mt-6">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block w-full h-10 -mt-px text-surface" aria-hidden>
        <path d="M0 0 H1440 V20 C1200 60 960 0 720 30 C480 60 240 0 0 30 Z" fill="currentColor" />
      </svg>
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 pt-8 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <Logo className="font-headline text-3xl text-white" />
          <p className="mt-4 text-sm text-white/75 max-w-xs leading-relaxed">{copy.footerBlurb}</p>
          <FooterContact />
          <div className="mt-6 flex gap-2">
            {['bg-gold', 'bg-accent', 'bg-emerald-400', 'bg-sky-400'].map((c) => <span key={c} className={`w-6 h-6 rounded-full ${c}`} />)}
          </div>
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
          <ul className="space-y-3 text-sm text-white/75">
            <li>Carte bancaire</li>
            <li>Paiement à la livraison</li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 py-6 border-t border-white/15 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/60">
        <span>© {new Date().getFullYear()} {storeName || 'Boutique'} 💜</span>
        <span>Livraison partout en Tunisie</span>
      </div>
    </footer>
  )
}
