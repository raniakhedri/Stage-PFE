import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function FavorisPage() {
  const { wishlist, removeFromWishlist, addToCart } = useShop();

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
            <Heart size={28} className="text-rose-500" fill="currentColor" />
            Mes Favoris
          </h1>
          <p className="text-secondary mt-1 text-sm">
            {wishlist.length === 0
              ? 'Aucun article dans vos favoris'
              : `${wishlist.length} article${wishlist.length > 1 ? 's' : ''} sauvegardé${wishlist.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {wishlist.length > 0 && (
          <Link
            to="/"
            className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
          >
            Continuer mes achats <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center">
            <Heart size={40} className="text-rose-300" />
          </div>
          <div>
            <p className="text-xl font-headline font-bold text-primary mb-2">Votre liste de favoris est vide</p>
            <p className="text-secondary text-sm max-w-sm">
              Parcourez notre catalogue et cliquez sur ♡ pour sauvegarder vos produits préférés ici.
            </p>
          </div>
          <Link
            to="/"
            className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
          >
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {/* Image */}
              <Link to={`/produits/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>

              {/* Content */}
              <div className="p-4 space-y-3">
                <Link to={`/produits/${product.slug}`}>
                  <h3 className="font-headline font-bold text-primary text-[15px] leading-snug hover:text-secondary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <p className="font-headline font-bold text-lg text-primary">{product.price?.toFixed(2)} TND</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingBag size={15} />
                    Ajouter au panier
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant/20 text-outline hover:text-error hover:border-error transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
