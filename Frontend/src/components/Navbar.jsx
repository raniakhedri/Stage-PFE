import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown, ChevronRight, Truck, Phone, LogOut } from 'lucide-react';
import { categories } from '../data/categories';
import { fetchTopAnnouncement } from '../api/apiClient';

export default function Navbar() {
  const DEFAULT_ANNOUNCEMENT = "LIVRAISON GRATUITE DÈS 49 TND D'ACHAT";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [announcementText, setAnnouncementText] = useState(DEFAULT_ANNOUNCEMENT);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[role="profile-dropdown"]')) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setProfileOpen(false);
  }, [location]);

  useEffect(() => {
    let mounted = true;

    const loadAnnouncement = async () => {
      try {
        const promo = await fetchTopAnnouncement();
        if (!mounted) return;
        if (promo?.message && String(promo.message).trim()) {
          setAnnouncementText(String(promo.message));
        } else {
          setAnnouncementText(DEFAULT_ANNOUNCEMENT);
        }
      } catch {
        if (mounted) setAnnouncementText(DEFAULT_ANNOUNCEMENT);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAnnouncement();
      }
    };

    loadAnnouncement();
    const intervalId = setInterval(loadAnnouncement, 15000);
    window.addEventListener('focus', loadAnnouncement);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', loadAnnouncement);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setProfileOpen(false);
    navigate('/');
  };

  const navLinks = categories.map(c => ({
    label: c.name.split(' ')[0] === 'Huiles' ? (c.slug === 'essentielles' ? 'Essentielles' : 'Végétales') :
           c.slug === 'actifs' ? 'Actifs' :
           c.slug === 'beurres' ? 'Beurres' :
           c.slug === 'hydrolats' ? 'Hydrolats' : 'Argiles',
    to: `/categories/${c.slug}`,
    slug: c.slug,
  }));

  const isActive = (slug) => location.pathname === `/categories/${slug}`;

  return (
    <>
      {/* Announcement Bar */}
      <div className={`w-full py-2 px-6 md:px-12 flex justify-between items-center text-[10px] md:text-xs font-body tracking-[0.15em] uppercase transition-colors duration-300 ${
        isHome && !scrolled ? 'bg-white/10 backdrop-blur-sm text-white' : 'bg-primary-container text-white'
      }`}>
        <span className="flex items-center gap-2">
          <Truck size={14} /> {announcementText}
        </span>
        <div className="hidden md:flex items-center gap-4">
          <span className="flex items-center gap-1"><Phone size={12} /> +33 (0)1 23 45 67 89</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className={`w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 transition-all duration-300 ${
        isHome && !scrolled
          ? 'bg-transparent text-white'
          : 'bg-white/95 backdrop-blur-md shadow-sm text-primary'
      }`}>
        <div className="flex items-center gap-8">
          {/* Mobile hamburger */}
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={24} className={isHome && !scrolled ? 'text-white' : 'text-primary'} />
          </button>

          {/* Logo */}
          <Link to="/" className={`text-2xl font-headline font-bold tracking-tight transition-colors duration-300 ${isHome && !scrolled ? 'text-white' : 'text-primary'}`}>
            NaturEssence
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 h-full">
            {navLinks.map((link) => (
              <div key={link.slug} className="relative h-full flex items-center group mega-menu-trigger">
                <Link
                  to={link.to}
                  className={`text-sm font-headline font-bold tracking-wide pb-1 transition-colors ${
                    isActive(link.slug)
                      ? 'text-gold border-b-2 border-gold'
                      : isHome && !scrolled
                        ? 'text-white/80 hover:text-white'
                        : 'text-secondary hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>

                {/* Mega Menu */}
                <div className="mega-menu absolute top-[48px] -left-12 w-[700px] bg-white shadow-2xl rounded-xl p-8 hidden grid-cols-3 gap-8 border border-outline-variant/10">
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-primary text-xs uppercase tracking-widest">Par Type</h4>
                    <ul className="space-y-2 text-sm text-secondary">
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Voir tout</Link></li>
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Bio certifié</Link></li>
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Nouveautés</Link></li>
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Promotions</Link></li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-primary text-xs uppercase tracking-widest">Par Bienfait</h4>
                    <ul className="space-y-2 text-sm text-secondary">
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Apaisant</Link></li>
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Tonifiant</Link></li>
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Hydratant</Link></li>
                      <li><Link to={link.to} className="hover:text-primary transition-colors">Purifiant</Link></li>
                    </ul>
                  </div>
                  <div className="bg-secondary-container/30 rounded-lg p-4 flex flex-col justify-center text-center space-y-3">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Promotion</span>
                    <h5 className="font-headline text-lg font-bold text-primary leading-tight">Nouveautés Printemps</h5>
                    <p className="text-xs text-secondary">-20% sur la sélection</p>
                    <Link to={link.to} className="text-xs font-bold text-primary underline decoration-gold underline-offset-4">Découvrir</Link>
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-5">
   

          {/* Profile Dropdown */}
          <div className="relative" role="profile-dropdown">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`hover:opacity-80 transition-opacity flex items-center gap-2 ${isHome && !scrolled ? 'text-white' : 'text-primary'}`}
            >
              <User size={22} />
              {user && (
                <span className={`text-sm font-body hidden sm:inline ${isHome && !scrolled ? 'text-white' : 'text-primary'}`}>
                  {user.firstName}
                </span>
              )}
            </button>

            {/* Dropdown Menu - Logged In */}
            {profileOpen && user && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-outline-variant/10 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-outline-variant/10">
                  <p className="text-sm font-body text-primary font-bold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-secondary">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-3 text-sm font-body text-primary hover:bg-surface-container-low transition-colors border-b border-outline-variant/10"
                >
                  Mon Profil
                </Link>
                <Link
                  to="/commandes"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-3 text-sm font-body text-primary hover:bg-surface-container-low transition-colors border-b border-outline-variant/10"
                >
                  Mes Commandes
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-body text-red-600 hover:bg-surface-container-low transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            )}

            {/* Dropdown Menu - Not Logged In */}
            {profileOpen && !user && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-outline-variant/10 overflow-hidden z-50">
                <Link
                  to="/login"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-3 text-sm font-body text-primary hover:bg-surface-container-low transition-colors border-b border-outline-variant/10"
                >
                  Se connecter
                </Link>
                <Link
                  to="/inscription"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-3 text-sm font-body text-primary hover:bg-surface-container-low transition-colors"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>

          <button className={`relative hover:opacity-80 transition-opacity ${isHome && !scrolled ? 'text-white' : 'text-primary'}`}>
            <Heart size={22} />
            <span className="absolute -top-1 -right-1 bg-sage text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">3</span>
          </button>
          <button onClick={() => setCartOpen(true)} className={`relative hover:opacity-80 transition-opacity ${isHome && !scrolled ? 'text-white' : 'text-primary'}`}>
            <ShoppingBag size={22} />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-6 flex justify-between items-center border-b border-outline-variant/10">
              <span className="font-headline font-bold text-xl text-primary">NaturEssence</span>
              <button onClick={() => setMobileOpen(false)}><X size={24} className="text-primary" /></button>
            </div>
            <div className="p-4">
              <div className="flex items-center bg-surface-container-high rounded-full px-3 py-2 mb-6">
                <Search size={16} className="text-outline" />
                <input type="text" className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline" placeholder="Rechercher..." />
              </div>
              <nav className="space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.slug}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-3 px-2 text-primary font-headline font-bold hover:bg-surface-container-low rounded-lg"
                  >
                    {link.label}
                    <ChevronRight size={18} className="text-outline" />
                  </Link>
                ))}
              </nav>
              <div className="border-t border-outline-variant/10 mt-6 pt-6 space-y-3">
                <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 px-2 text-sm text-secondary hover:text-primary">Accueil</Link>
                
                {user ? (
                  <>
                    <div className="py-2 px-2">
                      <p className="text-sm font-bold text-primary">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-secondary">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-2 px-2 text-sm text-secondary hover:text-primary">Mon Profil</Link>
                    <Link to="/commandes" onClick={() => setMobileOpen(false)} className="block py-2 px-2 text-sm text-secondary hover:text-primary">Mes Commandes</Link>
                    <a href="#" className="block py-2 px-2 text-sm text-secondary hover:text-primary">Ma Liste de Souhaits</a>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }} 
                      className="block w-full text-left py-2 px-2 text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 px-2 text-sm text-secondary hover:text-primary font-semibold">Se connecter</Link>
                    <Link to="/inscription" onClick={() => setMobileOpen(false)} className="block py-2 px-2 text-sm text-secondary hover:text-primary font-semibold">Créer un compte</Link>
                    <a href="#" className="block py-2 px-2 text-sm text-secondary hover:text-primary">Ma Liste de Souhaits</a>
                  </>
                )}
                <a href="#" className="block py-2 px-2 text-sm text-secondary hover:text-primary">Nous Contacter</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative w-96 max-w-[90vw] bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 flex justify-between items-center border-b border-outline-variant/10">
              <h2 className="font-headline font-bold text-xl text-primary">Mon Panier (2)</h2>
              <button onClick={() => setCartOpen(false)}><X size={24} className="text-primary" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {/* Cart item example */}
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface-container-low flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-beige flex items-center justify-center text-xs text-outline">HE</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-primary leading-tight">Huile Essentielle Lavande</h4>
                    <span className="text-xs font-bold text-primary">8,50 TND</span>
                  </div>
                  <p className="text-xs text-secondary mt-1">10ml</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-surface-container rounded px-2 py-0.5 gap-2">
                      <button className="text-xs text-secondary">-</button>
                      <span className="text-xs font-bold">1</span>
                      <button className="text-xs text-secondary">+</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface-container-low flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-beige flex items-center justify-center text-xs text-outline">BK</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-primary leading-tight">Beurre de Karité Brut</h4>
                    <span className="text-xs font-bold text-primary">12,50 TND</span>
                  </div>
                  <p className="text-xs text-secondary mt-1">200g</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-surface-container rounded px-2 py-0.5 gap-2">
                      <button className="text-xs text-secondary">-</button>
                      <span className="text-xs font-bold">1</span>
                      <button className="text-xs text-secondary">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary font-medium">Sous-total</span>
                <span className="text-lg font-bold text-primary">21,00 TND</span>
              </div>
              <p className="text-[10px] text-secondary text-center italic">Frais de port offerts à partir de 49 TND</p>
              <button className="w-full bg-primary text-white py-4 rounded-xl font-headline font-bold text-sm tracking-wide hover:opacity-90 transition-opacity">
                Commander
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
