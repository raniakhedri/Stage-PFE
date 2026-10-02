import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, ArrowUpRight, X, ShoppingCart } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useStore } from '../context/StoreContext';
import LoginPromptModal from './LoginPromptModal';
import { hideBroken } from '../templates/shared/ui';
import { sizeOptions, needsSizeChoice } from '../utils/cartLines';
import { track } from '../tracking/tracker';
import { productDetail, sizeLabelOf } from '../data/sectors';

function Price({ product, className = '', oldClassName = '' }) {
  return (
    <span className={`t-price inline-flex items-baseline gap-2 ${className}`}>
      {product.oldPrice && <span className={`line-through opacity-50 text-[0.85em] ${oldClassName}`}>{product.oldPrice.toFixed(2)}</span>}
      <span className={product.oldPrice ? 't-sale text-red-600' : ''}>{product.price.toFixed(2)} TND</span>
    </span>
  );
}

export default function ProductCard({ product, index }) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const { hasSizes, sector, layout, businessType } = useStore();
  const wishlisted = isWishlisted(product.id);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const to = `/produits/${product.slug}`;
  const detail = productDetail(businessType, product);

  const handleWishlist = (e) => {
    e.preventDefault();
    const result = toggleWishlist(product);
    if (result?.requiresLogin) setShowLoginModal(true);
  };
  // A click anywhere on the card except its buttons (add to cart, wishlist) opens the product.
  const trackClick = (e) => {
    if (!e.target.closest('button')) track('CLICK_PRODUCT', { productId: product.id, price: product.price });
  };
  const sizes = sizeOptions(product, hasSizes);
  const [picking, setPicking] = useState(false);
  const handleAdd = (e) => {
    e.preventDefault();
    if (needsSizeChoice(product, hasSizes)) setPicking(true);
    else addToCart(product, 1, sizes[0] || '');
  };
  const pickSize = (e, size) => {
    e.preventDefault();
    addToCart(product, 1, size);
    setPicking(false);
  };

  const pickerStyle = {
    bold: { box: 'inset-x-0 bottom-0 bg-black text-white p-3', title: 'text-[11px] font-bold uppercase tracking-wider', chip: 'min-w-[40px] px-2 py-2 border-2 border-white text-xs font-bold uppercase hover:bg-white hover:text-black' },
    luxury: { box: 'left-3 right-3 bottom-3 bg-surface/95 backdrop-blur text-ink p-4', title: 'text-[10px] uppercase tracking-[0.25em]', chip: 'min-w-[40px] px-2 py-2 border border-ink/30 text-xs tracking-wider hover:bg-ink hover:text-surface' },
    sport: { box: 'inset-x-0 bottom-0 bg-primary text-white p-3', title: 'text-xs font-extrabold uppercase italic', chip: 'min-w-[40px] px-2 py-2 bg-white/10 text-xs font-bold hover:bg-accent hover:text-primary' },
    tech: { box: 'left-2 right-2 bottom-2 bg-white rounded-xl shadow-xl text-ink p-3', title: 'text-xs font-semibold', chip: 'min-w-[40px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs hover:border-accent hover:text-accent' },
    artisan: { box: 'left-3 right-3 bottom-3 bg-surface rounded-2xl shadow-lg text-ink p-3', title: 'font-headline italic text-sm', chip: 'min-w-[40px] px-3 py-1.5 rounded-full border border-primary/30 text-xs hover:bg-primary hover:text-surface' },
    pop: { box: 'left-2 right-2 bottom-2 bg-gold rounded-3xl text-ink p-3', title: 'font-headline text-sm', chip: 'min-w-[40px] px-3 py-1.5 rounded-full bg-white text-xs font-semibold hover:bg-accent hover:text-white' },
    editorial: { box: 'inset-x-0 bottom-0 bg-surface border-t border-ink text-ink p-4', title: 'text-[10px] uppercase tracking-[0.2em]', chip: 'min-w-[40px] px-2 py-1.5 border border-ink text-xs hover:bg-ink hover:text-surface' },
    minimal: { box: 'left-3 right-3 bottom-3 bg-surface/95 backdrop-blur rounded-lg shadow-lg text-ink p-3', title: 'text-xs font-medium', chip: 'min-w-[40px] px-2.5 py-1.5 rounded-full border border-neutral-300 text-xs hover:bg-ink hover:text-surface hover:border-ink' },
  }[layout] || null;
  const sizePicker = picking && pickerStyle && (
    <div className={`absolute z-10 ${pickerStyle.box}`} onClick={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={pickerStyle.title}>{`Choisir : ${sizeLabelOf(businessType, product).toLowerCase()}`}</span>
        <button type="button" onClick={(e) => { e.preventDefault(); setPicking(false); }} aria-label="Fermer" className="opacity-60 hover:opacity-100"><X size={15} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => (
          <button type="button" key={size} onClick={(e) => pickSize(e, size)} className={`transition-colors ${pickerStyle.chip}`}>{size}</button>
        ))}
      </div>
    </div>
  );

  const modal = <LoginPromptModal open={showLoginModal} onClose={() => setShowLoginModal(false)} redirectTo={to} />;
  const image = (className) =>
    product.image
      ? <img onError={hideBroken} src={product.image} alt={product.name} loading="lazy" className={`w-full h-full object-cover ${className}`} />
      : <div className="w-full h-full" />;

  if (layout === 'bold') {
    return (
      <div onClickCapture={trackClick} className="group relative">
        <Link to={to} className="block relative aspect-[3/4] overflow-hidden bg-neutral-200">
          {image('transition-transform duration-700 group-hover:scale-105')}
          {product.badge && (
            <span className="t-badge absolute top-0 left-0 bg-black text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">{product.badge}</span>
          )}
          {index != null && (
            <span className="absolute top-2 right-3 font-headline text-white text-3xl mix-blend-difference">{String(index + 1).padStart(2, '0')}</span>
          )}
          <button
            onClick={handleAdd}
            className="t-btn absolute inset-x-0 bottom-0 bg-black text-white uppercase font-bold text-sm tracking-wider py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Ajouter
          </button>
          {sizePicker}
        </Link>
        <div className="flex items-start justify-between gap-3 pt-3 border-t-2 border-black mt-3">
          <Link to={to} className="min-w-0">
            <h3 className="font-headline text-lg leading-none uppercase truncate">{product.name}</h3>
            {detail && <p className="text-xs uppercase text-neutral-500 mt-1.5 truncate">{detail}</p>}
          </Link>
          <div className="text-right shrink-0">
            <Price product={product} className="font-bold text-sm flex-col !gap-0" />
          </div>
        </div>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute left-3 ${product.badge ? 'top-11' : 'top-3'} w-9 h-9 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${wishlisted ? 'text-red-600 opacity-100' : ''}`}>
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        {modal}
      </div>
    );
  }

  if (layout === 'luxury') {
    return (
      <div onClickCapture={trackClick} className="group relative text-center">
        <Link to={to} className="block relative aspect-[3/4] overflow-hidden bg-[#ebe4d9]">
          {image('transition-all duration-[1200ms] ease-out group-hover:scale-[1.04]')}
          {product.badge && (
            <span className="t-badge absolute top-4 left-4 text-[10px] uppercase tracking-[0.25em] text-neutral-800 bg-white/80 backdrop-blur px-3 py-1.5">{product.badge}</span>
          )}
          <button
            onClick={handleAdd}
            className="t-btn absolute left-4 right-4 bottom-4 bg-white/90 backdrop-blur text-ink text-[11px] uppercase tracking-[0.25em] py-3.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
          >
            Ajouter au panier
          </button>
          {sizePicker}
        </Link>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-4 right-4 ${wishlisted ? 'text-ink' : 'text-neutral-700 opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <Heart size={17} strokeWidth={1.25} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="pt-6 px-2">
          {detail && <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">{detail}</p>}
          <Link to={to}><h3 className="font-headline text-xl leading-snug text-ink">{product.name}</h3></Link>
          <Price product={product} className="mt-2 text-sm tracking-wide text-neutral-600" />
        </div>
        {modal}
      </div>
    );
  }

  if (layout === 'sport') {
    return (
      <div onClickCapture={trackClick} className="group relative bg-white rounded overflow-hidden">
        <Link to={to} className="block relative aspect-square overflow-hidden bg-surface-container-low">
          {image('transition-transform duration-500 group-hover:scale-110')}
          {product.badge && (
            <span className="t-badge absolute top-3 left-0 bg-accent text-primary text-xs font-extrabold uppercase italic px-3 py-1">{product.badge}</span>
          )}
          {index != null && <span className="absolute bottom-2 right-3 font-headline text-5xl text-white/80 drop-shadow">{String(index + 1).padStart(2, '0')}</span>}
          {sizePicker}
        </Link>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow ${wishlisted ? 'text-red-600' : 'text-primary opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="p-3 border-t-4 border-primary">
          <Link to={to}><h3 className="font-headline text-xl leading-none truncate">{product.name}</h3></Link>
          {detail && <p className="text-[11px] font-bold uppercase text-secondary mt-1 truncate">{detail}</p>}
          <div className="flex items-center justify-between mt-3">
            <Price product={product} className="font-headline text-xl" />
            <button onClick={handleAdd} aria-label="Ajouter au panier" className="t-btn w-10 h-10 bg-primary text-accent flex items-center justify-center -skew-x-12 hover:bg-accent hover:text-primary transition-colors">
              <Plus size={18} strokeWidth={3} className="skew-x-12" />
            </button>
          </div>
        </div>
        {modal}
      </div>
    );
  }

  if (layout === 'tech') {
    return (
      <div onClickCapture={trackClick} className="group relative bg-white rounded-2xl border border-slate-200 p-3 hover:border-accent hover:shadow-xl hover:shadow-accent/10 transition-all flex flex-col">
        <Link to={to} className="block relative aspect-square rounded-xl overflow-hidden bg-slate-50">
          {image('object-contain p-2 transition-transform duration-500 group-hover:scale-105')}
          {product.badge && (
            <span className="t-badge absolute top-2 left-2 bg-accent text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">{product.badge}</span>
          )}
          {sizePicker}
        </Link>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center ${wishlisted ? 'text-red-500' : 'text-slate-500'}`}>
          <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="pt-3 flex-1 flex flex-col">
          {detail && <p className="text-[11px] font-semibold text-accent uppercase tracking-wide truncate">{detail}</p>}
          <Link to={to}><h3 className="text-[15px] font-semibold text-ink leading-snug line-clamp-2 mt-0.5">{product.name}</h3></Link>
          <p className={`mt-1 text-[11px] font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>● {product.stock > 0 ? 'En stock' : 'Rupture'}</p>
          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <Price product={product} className="font-headline text-lg text-ink" />
            <button onClick={handleAdd} className="t-btn h-9 px-3 rounded-lg bg-accent text-white text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-90">
              <ShoppingCart size={15} /> Ajouter
            </button>
          </div>
        </div>
        {modal}
      </div>
    );
  }

  if (layout === 'artisan') {
    return (
      <div onClickCapture={trackClick} className="group relative">
        <Link to={to} className="block relative aspect-[4/5] overflow-hidden rounded-[24px] bg-surface-container-low">
          {image('transition-transform duration-700 group-hover:scale-105')}
          {product.badge && (
            <span className="t-badge absolute top-3 left-3 bg-surface text-primary text-xs font-headline italic px-3 py-1 rounded-full">{product.badge}</span>
          )}
          <button
            onClick={handleAdd}
            className="t-btn absolute left-3 right-3 bottom-3 rounded-full bg-primary text-surface text-sm py-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
          >
            Ajouter au panier
          </button>
          {sizePicker}
        </Link>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-surface flex items-center justify-center ${wishlisted ? 'text-primary' : 'text-ink/60 opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="pt-4 text-center">
          <Link to={to}><h3 className="font-headline text-lg text-ink leading-snug">{product.name}</h3></Link>
          {detail && <p className="text-xs italic text-ink/55 mt-0.5 truncate">{detail}</p>}
          <Price product={product} className="mt-1.5 font-headline text-primary" />
        </div>
        {modal}
      </div>
    );
  }

  if (layout === 'pop') {
    return (
      <div onClickCapture={trackClick} className="group relative bg-white rounded-[28px] p-3 border-2 border-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all">
        <Link to={to} className="block relative aspect-square overflow-hidden rounded-[22px] bg-surface-container-low">
          {image('transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2')}
          {product.badge && (
            <span className="t-badge absolute top-2 left-2 bg-gold text-ink text-xs font-headline px-3 py-1 rounded-full rotate-[-6deg]">{product.badge}</span>
          )}
          {sizePicker}
        </Link>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-5 right-5 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center ${wishlisted ? 'text-accent' : 'text-ink/50'}`}>
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="pt-3 px-1">
          <Link to={to}><h3 className="font-headline text-lg text-ink leading-tight line-clamp-2">{product.name}</h3></Link>
          {detail && <p className="text-xs text-ink/55 mt-0.5 truncate">{detail}</p>}
          <div className="flex items-center justify-between mt-2">
            <Price product={product} className="font-headline text-lg text-primary" />
            <button onClick={handleAdd} aria-label="Ajouter au panier" className="t-btn w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center hover:scale-110 hover:rotate-90 transition-transform">
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
        {modal}
      </div>
    );
  }

  if (layout === 'editorial') {
    return (
      <div onClickCapture={trackClick} className="group relative">
        <Link to={to} className="block relative aspect-[3/4] overflow-hidden bg-surface-container-low">
          {image('grayscale-[25%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]')}
          {product.badge && (
            <span className="t-badge absolute top-3 left-3 bg-accent text-white text-[10px] uppercase tracking-[0.2em] px-2 py-1">{product.badge}</span>
          )}
          {sizePicker}
        </Link>
        <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-3 right-3 ${wishlisted ? 'text-accent' : 'text-white opacity-0 group-hover:opacity-100'} transition-opacity drop-shadow`}>
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="pt-4 border-t border-ink mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {index != null && <p className="font-headline italic text-accent text-sm">N° {String(index + 1).padStart(2, '0')}</p>}
            <Link to={to}><h3 className="font-headline italic text-xl text-ink leading-snug">{product.name}</h3></Link>
            {detail && <p className="text-[11px] uppercase tracking-[0.16em] text-ink/50 mt-1 truncate">{detail}</p>}
          </div>
          <div className="text-right shrink-0">
            <Price product={product} className="text-sm flex-col !gap-0" />
            <button onClick={handleAdd} className="t-btn mt-2 text-[11px] uppercase tracking-[0.16em] border-b border-ink hover:text-accent hover:border-accent">
              Ajouter
            </button>
          </div>
        </div>
        {modal}
      </div>
    );
  }

  return (
    <div onClickCapture={trackClick} className="group relative">
      <Link to={to} className="block relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100">
        {image('transition-transform duration-700 group-hover:scale-[1.03]')}
        {product.badge && (
          <span className="t-badge absolute top-3 left-3 bg-white text-ink text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm">{product.badge}</span>
        )}
        <button
          onClick={handleAdd}
          aria-label="Ajouter au panier"
          className="t-btn absolute right-3 bottom-3 h-10 pl-3 pr-4 rounded-full bg-white text-ink shadow-md text-[13px] font-medium flex items-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-neutral-900 hover:text-white"
        >
          <Plus size={15} /> Ajouter
        </button>
          {sizePicker}
      </Link>
      <button onClick={handleWishlist} aria-label="Favoris" className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm transition-opacity ${wishlisted ? 'text-red-500' : 'text-neutral-700 opacity-0 group-hover:opacity-100'}`}>
        <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
      </button>
      <Link to={to} className="flex items-start justify-between gap-3 pt-3.5">
        <div className="min-w-0">
          <h3 className="text-[15px] text-ink leading-snug truncate">{product.name}</h3>
          {detail && <p className="text-[13px] text-neutral-500 mt-0.5 truncate">{detail}</p>}
        </div>
        <ArrowUpRight size={16} className="text-neutral-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <Price product={product} className="mt-1.5 text-[15px] font-medium text-ink" />
      {modal}
    </div>
  );
}
