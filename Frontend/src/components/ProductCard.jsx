import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, ArrowUpRight, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useStore } from '../context/StoreContext';
import LoginPromptModal from './LoginPromptModal';
import { hideBroken } from '../templates/shared/ui';
import { sizeOptions, needsSizeChoice } from '../utils/cartLines';
import { track } from '../tracking/tracker';

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
  const { isClothes, layout } = useStore();
  const wishlisted = isWishlisted(product.id);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const to = `/produits/${product.slug}`;
  const detail = isClothes ? [product.tissu, product.couleur].filter(Boolean).join(' · ') : (product.latin || product.volume);

  const handleWishlist = (e) => {
    e.preventDefault();
    const result = toggleWishlist(product);
    if (result?.requiresLogin) setShowLoginModal(true);
  };
  // A click anywhere on the card except its buttons (add to cart, wishlist) opens the product.
  const trackClick = (e) => {
    if (!e.target.closest('button')) track('CLICK_PRODUCT', { productId: product.id, price: product.price });
  };
  const sizes = sizeOptions(product, isClothes);
  const [picking, setPicking] = useState(false);
  const handleAdd = (e) => {
    e.preventDefault();
    if (needsSizeChoice(product, isClothes)) setPicking(true);
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
    minimal: { box: 'left-3 right-3 bottom-3 bg-surface/95 backdrop-blur rounded-lg shadow-lg text-ink p-3', title: 'text-xs font-medium', chip: 'min-w-[40px] px-2.5 py-1.5 rounded-full border border-neutral-300 text-xs hover:bg-ink hover:text-surface hover:border-ink' },
  }[layout] || null;
  const sizePicker = picking && pickerStyle && (
    <div className={`absolute z-10 ${pickerStyle.box}`} onClick={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={pickerStyle.title}>{isClothes ? 'Choisir une taille' : 'Choisir une contenance'}</span>
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
