/**
 * src/context/CartContext.jsx
 * ──────────────────────────
 * Cart state management. Stores cart item stubs { productId, quantity, selectedColor }.
 * Product hydration (name, price, stock) is done by consuming components
 * via useProductsContext(), so CartContext has NO dependency on product data.
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';

const CartContext = createContext(undefined);
const LOCAL_STORAGE_KEY = 'wrapstore_cart_items_v2';

export function CartProvider({ children }) {
  // Raw cart stubs — only IDs + quantities, no product data
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not load cart from localStorage', e);
    }
    return [];
  });

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const autoCloseTimerRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [cartItems]);

  // Item count (sum of quantities) — no product lookup needed
  const itemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Auto-dismiss mini cart
  const triggerAutoClose = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      setIsMiniCartOpen(false);
    }, 4500);
  };

  // ── Cart Actions ────────────────────────────────────────────────────────────
  const addItem = (product, quantityToAdd = 1, options = {}) => {
    if (!product) return false;
    // Out-of-stock guard using view's stock_status
    if (product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0) return false;

    const selectedColor =
      options.selected_color ||
      options.selectedColor ||
      (product.color_variants && product.color_variants[0]) ||
      null;

    const maxStock = product.available_stock ?? product.current_stock ?? 99;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.productId === product.id && i.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        const newQty = Math.min(prevItems[existingIndex].quantity + quantityToAdd, maxStock);
        const updated = [...prevItems];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty, selectedColor };
        return updated;
      } else {
        const finalQty = Math.min(quantityToAdd, maxStock);
        return [...prevItems, { productId: product.id, quantity: finalQty, selectedColor }];
      }
    });

    setLastAddedItem({ product, quantity: quantityToAdd, selectedColor });
    setIsMiniCartOpen(true);
    triggerAutoClose();
    return true;
  };

  const removeItem = (productId, selectedColor = null) => {
    setCartItems((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && (selectedColor === null || i.selectedColor === selectedColor))
      )
    );
  };

  const updateQuantity = (productId, newQuantity, selectedColor = null, maxStock = 99) => {
    if (newQuantity <= 0) {
      removeItem(productId, selectedColor);
      return;
    }
    const capped = Math.min(newQuantity, maxStock);
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && (selectedColor === null || item.selectedColor === selectedColor)
          ? { ...item, quantity: capped }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const openMiniCart = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setIsMiniCartOpen(true);
  };

  const closeMiniCart = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setIsMiniCartOpen(false);
  };

  const value = {
    // Raw stubs for components that need to hydrate themselves
    cartItems,
    // Aggregate counts
    itemCount,
    // UI state
    isMiniCartOpen,
    lastAddedItem,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openMiniCart,
    closeMiniCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

/**
 * useHydratedCart(products)
 * Call from any component that has access to the live products array.
 * Returns { items, subtotal, shippingFee, isFreeShipping, estimatedTotal,
 *           amountToFreeShipping, freeShippingThreshold }
 * Each item also gets a .stockWarning flag when its stock dropped to 0 while in cart.
 */
export function useHydratedCart(products = []) {
  const { cartItems } = useCart();
  const productMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[p.id] = p;
    }
    return map;
  }, [products]);

  const items = useMemo(() => {
    return cartItems
      .map((item, index) => {
        const product = productMap[item.productId];
        if (!product) return null;
        const stockWarning = product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0;
        return {
          id: `${item.productId}-${item.selectedColor || 'default'}-${index}`,
          productId: item.productId,
          product,
          selectedColor:
            item.selectedColor ||
            (product.color_variants && product.color_variants[0]) ||
            null,
          quantity: Math.min(item.quantity, product.available_stock || 1),
          stockWarning, // true when POS sold out this item while it was in cart
        };
      })
      .filter(Boolean);
  }, [cartItems, productMap]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0),
    [items]
  );

  const FREE_SHIPPING_THRESHOLD = 1000; // ₹1,000
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0;
  const shippingFee = items.length === 0 ? 0 : isFreeShipping ? 0 : 99;
  const estimatedTotal = subtotal + shippingFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return {
    items,
    subtotal,
    shippingFee,
    isFreeShipping,
    estimatedTotal,
    amountToFreeShipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
}

export default CartContext;
