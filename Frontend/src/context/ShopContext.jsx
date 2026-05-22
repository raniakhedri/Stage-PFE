import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUser, getAccessToken } from '../api/tokenStorage';
import { fetchServerCart, saveServerCart } from '../api/apiClient';
import { useToast } from './ToastContext';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
  });

  // ── Persist locally ──────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  // ── Server-side cart sync ────────────────────────────────────────────────
  // On mount: if logged in, load server cart and merge with local cart
  useEffect(() => {
    if (!getAccessToken()) return;
    fetchServerCart()
      .then((serverRaw) => {
        let serverItems;
        try {
          serverItems = typeof serverRaw === 'string' ? JSON.parse(serverRaw) : serverRaw;
          if (!Array.isArray(serverItems)) serverItems = [];
        } catch { serverItems = []; }

        if (serverItems.length === 0) {
          // Nothing on server — push local cart up if non-empty
          setCart((local) => { if (local.length > 0) saveServerCart(local).catch(() => {}); return local; });
          return;
        }

        // Merge: server items are authoritative; local-only items are added
        setCart((local) => {
          const merged = [...serverItems];
          local.forEach((localItem) => {
            if (!merged.find((s) => s.id === localItem.id)) {
              merged.push(localItem);
            }
          });
          saveServerCart(merged).catch(() => {});
          return merged;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save to server whenever cart changes (skip on first render)
  const isFirstRender = useRef(true);
  const saveTimer = useRef(null);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!getAccessToken()) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveServerCart(cart).catch(() => {}); }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [cart]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        showToast(`Quantité mise à jour — ${product.nom || product.name}`, 'cart');
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      showToast(`${product.nom || product.name} ajouté au panier`, 'cart');
      return [...prev, { ...product, qty }];
    });
  }, [showToast]);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
  }, [removeFromCart]);

  /**
   * Toggle wishlist — requires authentication.
   * Returns { requiresLogin: true } if not logged in, so caller can redirect.
   */
  const toggleWishlist = useCallback((product) => {
    const user = getUser();
    if (!user) {
      return { requiresLogin: true };
    }
    setWishlist(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        showToast(`${product.nom || product.name} retiré des favoris`, 'wishlist');
        return prev.filter(i => i.id !== product.id);
      }
      showToast(`${product.nom || product.name} ajouté aux favoris`, 'wishlist');
      return [...prev, product];
    });
    return { requiresLogin: false };
  }, [showToast]);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist(prev => prev.filter(i => i.id !== productId));
  }, []);

  const isWishlisted = useCallback((productId) => {
    return wishlist.some(i => i.id === productId);
  }, [wishlist]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const wishlistCount = wishlist.length;

  return (
    <ShopContext.Provider value={{
      cart, wishlist,
      addToCart, removeFromCart, updateQty, clearCart,
      toggleWishlist, removeFromWishlist, isWishlisted,
      cartCount, cartTotal, wishlistCount,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
