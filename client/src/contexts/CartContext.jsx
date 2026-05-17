import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api.js';
import { getItemUnitPrice, normalizeCartItem, toServerCartItem } from '../utils/cart.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('ecommerce-cart');
    return saved ? JSON.parse(saved).map(normalizeCartItem) : [];
  });
  const skipSyncRef = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem('ecommerce-cart', JSON.stringify(cart));
    // sync to server for logged-in users
    if (user && !skipSyncRef.current) {
      try {
        api.put('/cart', { items: cart.map(toServerCartItem) }).catch((err) => console.warn('Cart sync failed', err));
      } catch (e) {
        console.warn('Cart sync error', e);
      }
    }
    if (skipSyncRef.current) skipSyncRef.current = false;
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, normalizeCartItem({ ...product, quantity: 1 })];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const clearCart = () => setCart([]);

  const refreshCart = async () => {
    if (!user?.email) return;
    try {
      const res = await api.get('/cart');
      const serverItems = (res.data?.items || []).map(normalizeCartItem);
      skipSyncRef.current = true;
      setCart(serverItems);
    } catch (err) {
      console.warn('Unable to load server cart', err);
    }
  };

  // when user logs in, fetch server cart
  useEffect(() => {
    refreshCart();
  }, [user?.email]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + getItemUnitPrice(item) * (item.quantity || 1), 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
