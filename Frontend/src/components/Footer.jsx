import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { fetchFooterCategories } from '../api/apiClient';

export default function Footer() {
  const [navCats, setNavCats] = useState([]);

  useEffect(() => {
    fetchFooterCategories()
      .then((cats) => setNavCats(cats))
      .catch(() => setNavCats([]));
  }, []);

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
          {navCats.map((c) => (
            <li key={c.slug}>
              <Link to={`/categories/${c.slug}`} className="hover:text-gold hover:opacity-100 transition-all">
                {c.name}
              </Link>
            </li>
          ))}
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
        <p className="text-sm opacity-60 font-body">Recevez nos conseils botaniques et offres exclusives.</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Votre email"
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:border-gold"
          />
        </div>
      </div>
    </footer>
  );
}
