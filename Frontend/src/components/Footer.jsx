import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-12 px-6 md:px-24 grid grid-cols-1 md:grid-cols-4 gap-8 bg-[#163328] text-[#FEF8F3] mt-12">
      <div className="space-y-4">
        <Link to="/" className="font-headline text-2xl font-bold tracking-tight block">NaturEssence</Link>
        <p className="text-sm font-body leading-relaxed opacity-60">
          Votre destination pour des matières premières cosmétiques naturelles et certifiées. L'éveil botanique au service de votre beauté naturelle.
        </p>
        <div className="flex gap-4">
          <Leaf size={18} className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
        </div>
      </div>

      <div>
        <h4 className="font-headline font-bold text-sm uppercase tracking-widest mb-4 text-gold">Navigation</h4>
        <ul className="space-y-2 text-sm opacity-60 font-body">
          <li><Link to="/" className="hover:text-gold hover:opacity-100 transition-all">Accueil</Link></li>
          <li><Link to="/categories/essentielles" className="hover:text-gold hover:opacity-100 transition-all">Essentielles</Link></li>
          <li><Link to="/categories/vegetales" className="hover:text-gold hover:opacity-100 transition-all">Végétales</Link></li>
          <li><Link to="/categories/actifs" className="hover:text-gold hover:opacity-100 transition-all">Actifs</Link></li>
          <li><Link to="/categories/beurres" className="hover:text-gold hover:opacity-100 transition-all">Beurres</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-headline font-bold text-sm uppercase tracking-widest mb-4 text-gold">Aide & Infos</h4>
        <ul className="space-y-2 text-sm opacity-60 font-body">
          <li><a href="#" className="hover:text-gold hover:opacity-100 transition-all">À propos</a></li>
          <li><a href="#" className="hover:text-gold hover:opacity-100 transition-all">Livraison</a></li>
          <li><a href="#" className="hover:text-gold hover:opacity-100 transition-all">CGV</a></li>
          <li><a href="#" className="hover:text-gold hover:opacity-100 transition-all">Politique de Confidentialité</a></li>
          <li><a href="#" className="hover:text-gold hover:opacity-100 transition-all">Contact</a></li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-headline font-bold text-sm uppercase tracking-widest mb-4 text-gold">Newsletter</h4>
        <p className="text-xs opacity-60 mb-4">Restez informé de nos nouveautés et recevez nos formulations exclusives.</p>
        <div className="flex">
          <input
            type="email"
            className="bg-white/10 border-none rounded-l-lg text-sm w-full focus:ring-1 focus:ring-gold px-4 py-2"
            placeholder="votre@email.com"
          />
          <button className="bg-gold text-primary px-4 py-2 rounded-r-lg font-bold text-sm hover:opacity-90 transition-opacity">
            OK
          </button>
        </div>
      </div>

      <div className="md:col-span-4 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xs opacity-40">© 2026 NaturEssence. Tous droits réservés.</span>
        <div className="flex gap-4 text-xs opacity-40">
          <span>Visa</span>
          <span>Mastercard</span>
          <span>PayPal</span>
          <span>Apple Pay</span>
        </div>
      </div>
    </footer>
  );
}
