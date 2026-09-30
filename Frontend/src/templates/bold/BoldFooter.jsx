import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { copyFor } from '../shared/content'
import { useFooterCategories } from '../shared/useFooterCategories'

export default function BoldFooter() {
  const { storeName, businessType } = useStore()
  const copy = copyFor(businessType)
  const categories = useFooterCategories()
  const link = 'block uppercase font-bold text-sm tracking-wide hover:opacity-50 transition-opacity'

  return (
    <footer className="t-footer bg-black text-white overflow-hidden">
      <div className="px-4 md:px-8 pt-16 grid grid-cols-2 md:grid-cols-4 gap-10 border-b border-white/15 pb-14">
        <div className="col-span-2 md:col-span-1">
          <p className="text-white/60 text-sm max-w-xs">{copy.footerBlurb}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-8 w-14 h-14 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors" aria-label="Haut de page">
            <ArrowUp size={20} />
          </button>
        </div>
        {categories.length > 0 && (
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-5">Shop</p>
          <div className="space-y-3">
            {categories.map((c) => <Link key={c.slug} to={`/categories/${c.slug}`} className={link}>{c.name}</Link>)}
          </div>
        </div>
        )}
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-5">Compte</p>
          <div className="space-y-3">
            <Link to="/profile" className={link}>Profil</Link>
            <Link to="/commandes" className={link}>Commandes</Link>
            <Link to="/retours" className={link}>Retours</Link>
            <Link to="/favoris" className={link}>Favoris</Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-5">Infos</p>
          <div className="space-y-3 uppercase font-bold text-sm tracking-wide">
            <p>Livraison Tunisie</p>
            <p>Paiement sécurisé</p>
          </div>
        </div>
      </div>
      <div className="px-4 md:px-8 pt-6 flex justify-between text-[11px] uppercase tracking-[0.2em] text-white/40">
        <span>© {new Date().getFullYear()}</span>
        <span>Tous droits réservés</span>
      </div>
      <p
        className="font-headline uppercase leading-[0.8] text-center whitespace-nowrap -mb-[2vw] pt-4 select-none"
        style={{ fontSize: `${Math.min(19, 150 / Math.max((storeName || 'Boutique').length, 1))}vw` }}
      >
        {storeName || 'Boutique'}
      </p>
    </footer>
  )
}
