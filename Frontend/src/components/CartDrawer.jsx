import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function CartDrawer({ open, onClose }) {
  const { cart, removeFromCart, updateQty, cartTotal, cartCount } = useShop();
  const items = cart;
  const count = cartCount;
  const total = cartTotal;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[90]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[100] shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} className="text-primary" />
            <h2 className="font-headline font-bold text-xl text-primary">Mon Panier</h2>
            {count > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
            )}
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingBag size={48} className="text-outline-variant" />
              <p className="text-on-surface-variant">Votre panier est vide</p>
              <button
                onClick={onClose}
                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-surface-container-low">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-primary text-sm leading-tight truncate">{item.name}</p>
                  {item.volume && (
                    <p className="text-xs text-secondary mt-0.5">{item.volume}</p>
                  )}
                  <p className="text-primary font-bold mt-1">{(item.price * item.qty).toFixed(2)} TND</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-white rounded-full border border-outline-variant/20 px-2 py-1 gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="text-primary hover:text-secondary"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-bold text-primary w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="text-primary hover:text-secondary"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-outline hover:text-error transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-outline-variant/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">Sous-total</span>
              <span className="text-primary font-bold text-lg">{total.toFixed(2)} TND</span>
            </div>
            <p className="text-xs text-outline">Livraison et taxes calculées à la prochaine étape.</p>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full bg-primary text-white text-center py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              Passer la commande
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
