import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Truck, ShieldCheck, Users, ChevronLeft, ChevronRight, Clock, FlaskConical, Star, ArrowRight } from 'lucide-react';
import { fetchCategories, fetchFeaturedProducts, fetchHomepageBanners } from '../api/apiClient';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [heroBanners, setHeroBanners] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const getCurrentDevice = () => (window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop');

  const loadHeroBanners = async () => {
    const rawUser = localStorage.getItem('user');
    let segment = '';
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        segment = parsed?.segmentName || '';
      } catch {
        segment = '';
      }
    }

    try {
      const banners = await fetchHomepageBanners(segment, getCurrentDevice());
      setHeroBanners(banners);
      setHeroIndex((prev) => (banners.length ? Math.min(prev, banners.length - 1) : 0));
    } catch {
      setHeroBanners([]);
      setHeroIndex(0);
    }
  };

  const fallbackHero = {
    id: 'fallback',
    title: "L'Âme Pure des Plantes",
    subtitle: "Découvrez nos extraits botaniques d'exception, sourcés de manière éthique pour sublimer vos rituels de soin quotidiens.",
    badgeText: 'Nouvelle Collection',
    badgeBgColor: 'rgba(255,255,255,0.15)',
    badgeTextColor: '#ffffff',
    alignement: 'left',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWVj8BZ8_Z5-wxdOSa_VKdUM7tzna6WHwcuUNavG640Vu2uF5ahJosCOKcencohIQ2Q9B9PQZUlOtvYnmJyLK9gH547ehL4CI4rMKvWvFCiWeBLCwvKbLAlLpNUgE9CbAnLUA4svNg_mmVXPLxsDSKk-qPCXaRclrE_WgBT4YZXObzOpIO1QojV5wpblFdtRMo7WBCzxK8-6xHCLKMf_D1Eb2harWRydo6AUswLJo-CCRReJE5NfsEekZ624Og1OCAxiKISuHZp8Tp',
    mobileImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWVj8BZ8_Z5-wxdOSa_VKdUM7tzna6WHwcuUNavG640Vu2uF5ahJosCOKcencohIQ2Q9B9PQZUlOtvYnmJyLK9gH547ehL4CI4rMKvWvFCiWeBLCwvKbLAlLpNUgE9CbAnLUA4svNg_mmVXPLxsDSKk-qPCXaRclrE_WgBT4YZXObzOpIO1QojV5wpblFdtRMo7WBCzxK8-6xHCLKMf_D1Eb2harWRydo6AUswLJo-CCRReJE5NfsEekZ624Og1OCAxiKISuHZp8Tp',
    videoUrl: '',
    ctaText: 'Découvrir la collection',
    ctaType: 'categorie',
    ctaLink: '/categories/essentielles',
    durationSeconds: 5,
    animation: 'fade',
  };

  const currentHero = heroBanners[heroIndex] || fallbackHero;
  const hasMultipleBanners = heroBanners.length > 1;
  const linkValue = currentHero.ctaLink || '/';
  const isExternalCta = currentHero.ctaType === 'lien-externe' || /^https?:\/\//i.test(linkValue);
  const isInternalCta = !isExternalCta;
  const isYouTubeVideo = /youtube\.com|youtu\.be/i.test(currentHero.videoUrl || '');

  const heroAlignmentClass =
    currentHero.alignement === 'center'
      ? 'items-center text-center'
      : currentHero.alignement === 'right'
        ? 'items-end text-right ml-auto'
        : 'items-start text-left';

  const heroCtaAlignmentClass =
    currentHero.alignement === 'center'
      ? 'justify-center'
      : currentHero.alignement === 'right'
        ? 'justify-end'
        : 'justify-start';

  const heroAnimationClass =
    currentHero.animation === 'slide'
      ? 'hero-anim-slide'
      : currentHero.animation === 'zoom'
        ? 'hero-anim-zoom'
        : currentHero.animation === 'ken-burns'
          ? 'hero-anim-ken-burns'
          : currentHero.animation === 'blur'
            ? 'hero-anim-blur'
            : 'hero-anim-fade';

  const toSafeCssColor = (value, fallback) => {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    const v = value.trim();
    const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
    const isRgb = /^rgba?\([^\)]+\)$/i.test(v);
    const isHsl = /^hsla?\([^\)]+\)$/i.test(v);
    return isHex || isRgb || isHsl ? v : fallback;
  };

  const heroBadgeText = currentHero.badgeText || fallbackHero.badgeText;
  const heroBadgeBgColor = toSafeCssColor(currentHero.badgeBgColor, fallbackHero.badgeBgColor);
  const heroBadgeTextColor = toSafeCssColor(currentHero.badgeTextColor, fallbackHero.badgeTextColor);

  const goToPrevBanner = () => {
    if (!heroBanners.length) return;
    setHeroIndex((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1));
  };

  const goToNextBanner = () => {
    if (!heroBanners.length) return;
    setHeroIndex((prev) => (prev + 1) % heroBanners.length);
  };

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchFeaturedProducts().then(setFeaturedProducts).catch(() => {});
    loadHeroBanners();
  }, []);

  useEffect(() => {
    const refreshBanners = () => {
      loadHeroBanners();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshBanners();
      }
    };

    const intervalId = setInterval(refreshBanners, 30000);
    window.addEventListener('focus', refreshBanners);
    window.addEventListener('resize', refreshBanners);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', refreshBanners);
      window.removeEventListener('resize', refreshBanners);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!hasMultipleBanners) return;
    const durationMs = Math.max(2, Number(currentHero.durationSeconds || 5)) * 1000;
    const timer = setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [hasMultipleBanners, currentHero.durationSeconds, heroBanners.length, heroIndex]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="w-full h-full relative group overflow-hidden">
          {currentHero.videoUrl ? (
            isYouTubeVideo ? (
              <iframe
                key={`${currentHero.id}-${heroIndex}`}
                src={`${currentHero.videoUrl}${currentHero.videoUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&controls=0&playsinline=1`}
                className={`w-full h-full object-cover brightness-90 pointer-events-none ${heroAnimationClass}`}
                title={currentHero.title || 'Bannière vidéo NaturEssence'}
                allow="autoplay; encrypted-media"
              />
            ) : (
              <video
                key={`${currentHero.id}-${heroIndex}`}
                className={`w-full h-full object-cover brightness-90 ${heroAnimationClass}`}
                src={currentHero.videoUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            )
          ) : (
            <picture key={`${currentHero.id}-${heroIndex}`} className={`block w-full h-full ${heroAnimationClass}`}>
              <source
                media="(max-width: 768px)"
                srcSet={currentHero.mobileImageUrl || currentHero.imageUrl || fallbackHero.mobileImageUrl}
              />
              <img
                className="w-full h-full object-cover brightness-90"
                src={currentHero.imageUrl || fallbackHero.imageUrl}
                alt={currentHero.title || 'Bannière NaturEssence'}
              />
            </picture>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-transparent flex items-center px-8 md:px-20">
            <div className={`max-w-2xl text-white flex flex-col ${heroAlignmentClass}`}>
              <span
                className="inline-block px-3 py-1 rounded-full backdrop-blur-md text-xs font-body tracking-widest uppercase mb-6"
                style={{ backgroundColor: heroBadgeBgColor, color: heroBadgeTextColor }}
              >
                {heroBadgeText}
              </span>
              <h1 className="text-4xl md:text-7xl font-headline font-bold leading-tight mb-8">
                {currentHero.title || fallbackHero.title}
              </h1>
              <p className="text-lg text-white/80 mb-10 max-w-lg font-light leading-relaxed">
                {currentHero.subtitle || fallbackHero.subtitle}
              </p>
              <div className={`flex gap-4 flex-wrap ${heroCtaAlignmentClass}`}>
                {isInternalCta ? (
                  <Link to={linkValue} className="btn-liquid bg-primary text-on-primary px-8 py-4 rounded-lg font-medium transition-all shadow-xl">
                    {currentHero.ctaText || 'Découvrir la collection'}
                  </Link>
                ) : (
                  <a
                    href={linkValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-liquid bg-primary text-on-primary px-8 py-4 rounded-lg font-medium transition-all shadow-xl"
                  >
                    {currentHero.ctaText || 'Découvrir la collection'}
                  </a>
                )}
              
              </div>
            </div>
          </div>

          {hasMultipleBanners && (
            <>
              {/* Carousel arrows */}
              <button
                type="button"
                onClick={goToPrevBanner}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                aria-label="Bannière précédente"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goToNextBanner}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                aria-label="Bannière suivante"
              >
                <ChevronRight size={20} />
              </button>

              {/* Carousel dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {heroBanners.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setHeroIndex(index)}
                    className={index === heroIndex ? 'w-12 h-1 bg-white rounded-full' : 'w-3 h-1 bg-white/40 rounded-full'}
                    aria-label={`Aller à la bannière ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-headline font-bold text-primary mb-4">Nos Catégories</h2>
          <div className="w-12 h-0.5 bg-sage mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/categories/${cat.slug}`} className="group flex flex-col items-center text-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 bg-surface-container transition-transform duration-500 group-hover:scale-105 group-hover:shadow-lg">
                <img className="w-full h-full object-cover" src={cat.image} alt={cat.name} />
              </div>
              <span className="font-headline font-semibold text-primary group-hover:text-gold transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-surface-container-low overflow-hidden">
        <div className="px-6 md:px-12 flex justify-between items-end mb-12">
          <div>
            <span className="text-xs font-body uppercase tracking-widest text-secondary mb-2 block">Incontournables</span>
            <h2 className="text-4xl font-headline font-bold text-primary">Meilleures Ventes</h2>
          </div>
          <Link to="/categories/essentielles" className="text-primary font-bold text-sm border-b-2 border-gold pb-1 hover:text-secondary transition-colors">
            Voir tout →
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto px-6 md:px-12 hide-scrollbar pb-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="min-w-[280px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* DIY Formulations */}
      <section className="py-24 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div className="max-w-xl">
              <span className="text-xs font-body uppercase tracking-widest text-gold font-bold mb-4 block">Atelier Cosmétique</span>
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary leading-tight">Nos Formulations DIY</h2>
            </div>
            <a href="#" className="text-primary font-bold border-b-2 border-primary/20 hover:border-primary transition-all pb-1 mb-2 inline-block">
              Voir toutes les recettes →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Sérum Éclat à la Vitamine C",
                level: "Débutant",
                time: "15 min",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIZ576jI-MJLY0NW_byflr0XUpvlG5Bww6wIIoj3PeQVW6gvPefwXulux4Lw_A5fETft1aVqvKlIUryJzBbskQW0cDQ7s6rI4gEoy-JwYM_81copCL3Oo7e115aBxhvfs0Z28OHXYT9K0YImX5-7bWRgKgua678qPjtfDZneRavUUqroZovpiry3wFVV-pXjTLYGN8NpSvpqAaBko93ElHWP3j6EgMKnKoK96QMAS0CyTTaXH780tv7KOdvLerhhgFe64xmeoVTC1"
              },
              {
                title: "Crème Visage Apaisante Lavande",
                level: "Intermédiaire",
                time: "45 min",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXn_grXq17NJx916PCYaC6-LvrM_x5GlirRgq7e0YfF1hQtIGQQSnF1MtSuLMegvfsaZovoRuLxTynyZBkxVa-Y0Cp3hHKOT4T7Nq566KiF7pL8biCklxdcBVdK_5a3ZF1yILdAdpgd8ucm5lrxVJveoe0E58JMVqRYSQOdQ2v69VNOjpZX5dqYmkrNLepdkuWctJUp7RHcrYdv8-iSYPY5TysDmjmx_lSU0MdZbZwPpTtDiN5FqfKmO1tpm5shyAhV78DkHeAbrtC"
              },
              {
                title: "Shampoing Solide Fortifiant",
                level: "Débutant",
                time: "10 min",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj6TJFBj-nnL6LgZPjGQtZpkS6zfGqB8U1wPAfuQj-mUNjkUSN2jLlnNKtBWWP7Q_mSt9FQ7dSqLkFIRuieLD3OnAjSbN4r3eYCFaAse_wgQHjg-khA7Ue1VMhNvSSC5snQDfXBN3chANTdRAnCT5sIvJL2ywmsZT8n_YCSlDtvlbzANT1YlHWUlPmw64DoE-VlbwCvlyiu39dUR_7ornwa4NU7_GHAK3nT1hLeKfk_u__6LGqxBBZhn7ZiEnAv_NfZ5psJ9VFxUD1"
              }
            ].map((recipe, i) => (
              <div key={i} className="group relative bg-surface-container rounded-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
                <div className="h-64 overflow-hidden">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={recipe.image} alt={recipe.title} />
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      recipe.level === 'Débutant' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'
                    }`}>
                      {recipe.level}
                    </span>
                    <div className="flex items-center gap-1 text-secondary text-xs">
                      <Clock size={14} />
                      <span>{recipe.time}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-6">{recipe.title}</h3>
                  <button className="flex items-center gap-2 text-primary font-bold group/btn transition-all">
                    Découvrir la recette
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Promise Banner */}
      <section id="engagements" className="py-20 bg-surface-container-highest border-y border-outline-variant/10">
        <div className="px-6 md:px-12 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { icon: Leaf, title: "100% Naturel", desc: "Produits purs, sans additifs chimiques ni conservateurs synthétiques." },
            { icon: Truck, title: "Livraison Rapide", desc: "Expédition sous 24h et livraison gratuite dès 49 TND d'achat." },
            { icon: ShieldCheck, title: "Qualité Certifiée", desc: "Nos huiles sont analysées en laboratoire pour garantir leur pureté." },
            { icon: Users, title: "Conseils d'Experts", desc: "Une équipe de naturopathes à votre écoute pour vous guider." },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <Icon size={36} className="text-primary mb-4" />
              <h4 className="font-headline font-bold text-primary mb-2">{title}</h4>
              <p className="text-xs text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-primary-container px-6 md:px-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-white mb-6">
            Rejoignez Notre Communauté
          </h2>
          <p className="text-on-primary-container text-lg mb-12 max-w-2xl mx-auto">
            Recevez nos formulations exclusives et offres spéciales directement dans votre boîte mail.
          </p>
          <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              className="flex-grow bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg px-6 py-4 focus:ring-2 focus:ring-gold outline-none"
              placeholder="Votre adresse email"
              type="email"
            />
            <button className="btn-liquid bg-gold text-primary font-bold px-8 py-4 rounded-lg transition-all" style={{'--btn-wave-bg': '#163328', '--btn-wave-text': '#C4A55A'}}>
              S'inscrire
            </button>
          </form>
          <p className="mt-6 text-[10px] text-white/40 uppercase tracking-widest">
            Désinscription possible à tout moment • Politique de confidentialité respectée
          </p>
        </div>
      </section>
    </>
  );
}
