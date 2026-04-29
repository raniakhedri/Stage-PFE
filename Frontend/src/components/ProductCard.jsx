import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import LoginPromptModal from './LoginPromptModal';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const wishlisted = isWishlisted(product.id);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleWishlist = (e) => {
    e.preventDefault();
    const result = toggleWishlist(product);
    if (result?.requiresLogin) {
      setShowLoginModal(true);
    }
  };
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={11}
          className={i <= Math.floor(rating) ? 'fill-gold text-gold' : 'fill-outline-variant/30 text-outline-variant/30'}
        />
      );
    }
    return stars;
  };

  const badgeColor = () => {
    if (!product.badge) return '';
    if (product.badge.startsWith('-')) return 'bg-gradient-to-r from-rose-500 to-red-500 text-white';
    if (product.badge === 'Nouveau') return 'bg-gradient-to-r from-primary to-emerald-600 text-white';
    return 'bg-tertiary-container text-on-tertiary-container';
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-2 border border-transparent hover:border-sage/15">
      {/* Image Container */}
      <Link to={`/produits/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-surface-container-low to-beige">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <span className={`${badgeColor()} text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm`}>
                {product.badge}
              </span>
            )}
            {product.bio && (
              <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                Bio
              </span>
            )}
          </div>

          {/* Action buttons - slide in from right on hover */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
            <button
              onClick={handleWishlist}
              className={`w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 ${wishlisted ? 'text-rose-500' : 'text-primary hover:text-rose-500'}`}
            >
              <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); navigate(`/produits/${product.slug}`); }}
              className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
            >
              <Eye size={15} />
            </button>
          </div>

          {/* Add to cart bar - slides up from bottom on hover */}
          <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product); }}
              className="btn-liquid-dark w-full flex items-center justify-center gap-2 bg-primary/95 backdrop-blur text-white py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xl"
            >
              <ShoppingBag size={15} />
              Ajouter au panier
            </button>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 pt-3.5 space-y-1.5">
        <p className="text-[10px] font-semibold text-sage uppercase tracking-[0.15em]">{product.latin}</p>
        <h3 className="font-headline font-bold text-[15px] text-primary leading-snug hover:text-secondary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex gap-0.5">{renderStars(product.rating)}</div>
          <span className="text-[10px] text-on-surface-variant/70 font-medium">({product.reviews})</span>
        </div>
        <div className="flex items-end justify-between pt-2 border-t border-outline-variant/8 mt-2">
          <div>
            <span className="text-[11px] text-on-surface-variant/60 block">{product.volume}</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              {product.oldPrice && (
                <span className="text-xs text-outline/60 line-through">{product.oldPrice.toFixed(2)} TND</span>
              )}
              <span className={`font-headline font-bold text-lg tracking-tight ${product.oldPrice ? 'text-rose-600' : 'text-primary'}`}>
                {product.price.toFixed(2)} TND
              </span>
            </div>
          </div>
        </div>
      </div>

      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectTo={`/produits/${product.slug}`}
      />
    </div>
  );
}
