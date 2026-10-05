import { Link } from 'react-router-dom'
import { ShieldCheck, Truck, CreditCard } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useCopy } from '../shared/useCopy'
import { Logo, FooterContact } from '../shared/ui'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function TechFooter() {
  const { storeName, businessType } = useStore()
  const copy = useCopy()
  const categories = useFooterCategories()
  const link = 'text-sm text-slate-400 hover:text-white transition-colors'
  const head = 'text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-4'

  return (
    <footer className="t-footer bg-primary text-white mt-10">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-8 grid sm:grid-cols-3 gap-4 border-b border-white/10">
        {[[ShieldCheck, 'Produits garantis'], [Truck, 'Livraison 24–48 h'], [CreditCard, 'Paiement sécurisé']].map(([Icon, label]) => (
          <div key={label} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-accent"><Icon size={18} /></span>
            {label}
          </div>
        ))}
      </div>
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 pt-12 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <Logo className="font-headline text-2xl text-white" />
          <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">{copy.footerBlurb}</p>
          <FooterContact />
        </div>
        {categories.length > 0 && (
          <div className="md:col-span-3">
            <p className={head}>Catégories</p>
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
            <li><Link to="/retours" className={link}>Retours & SAV</Link></li>
            <li><Link to="/favoris" className={link}>Favoris</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className={head}>Paiement</p>
          <ul className="space-y-3 text-sm text-slate-400">
            <li>Carte bancaire</li>
            <li>Paiement à la livraison</li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-5 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} {storeName || 'Boutique'}. Tous droits réservés.</span>
        <span>Livraison partout en Tunisie</span>
      </div>
    </footer>
  )
}
