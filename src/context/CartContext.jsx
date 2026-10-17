import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { isRealColor, getValidColors } from '../lib/colors';

const CartContext = createContext(undefined);
const LOCAL_STORAGE_KEY = 'wrapstore_cart_items_v4';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not load cart from localStorage', e);
    }
    return [];
  });

  const [lastAddedItem, setLastAddedItem] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [cartItems]);

  // Item count (sum of quantities)
  const itemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  // ── Cart Actions ────────────────────────────────────────────────────────────
  const addItem = (product, quantityToAdd = 1, selectedModel = null, selectedColor = null) => {
    if (!product || !product.id) return false;
    // Out-of-stock guard
    if (product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0) return false;

    const maxStock = product.available_stock ?? product.current_stock ?? 99;
    const addQty = Math.max(1, Number(quantityToAdd) || 1);
    const modelToSave = selectedModel || product.selected_model || null;
    const rawColor = selectedColor || product.selected_color || null;
    const colorToSave = isRealColor(rawColor) ? rawColor : (getValidColors(product)[0] || null);

    setCartItems((prevItems) => {
      // Find line matching both product ID and selected model
      const existingIndex = prevItems.findIndex(
        (i) => i.productId === product.id && (i.selected_model || null) === (modelToSave || null)
      );

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity || 0;
        const newQty = Math.min(currentQty + addQty, maxStock);
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          selected_model: modelToSave,
          selected_color: colorToSave || updated[existingIndex].selected_color,
        };
        return updated;
      } else {
        const finalQty = Math.min(addQty, maxStock);
        const lineId = `${product.id}_${modelToSave || 'default'}_${Date.now()}`;
        return [
          ...prevItems,
          {
            id: lineId,
            productId: product.id,
            quantity: finalQty,
            selected_model: modelToSave,
            selected_color: colorToSave,
          },
        ];
      }
    });

    setLastAddedItem({ product, quantity: addQty, selected_model: modelToSave });
    return true;
  };

  const removeItem = (lineIdOrProductId) => {
    if (!lineIdOrProductId) return;
    setCartItems((prev) =>
      prev.filter((i) => i.id !== lineIdOrProductId && i.productId !== lineIdOrProductId)
    );
  };

  const updateQuantity = (lineIdOrProductId, newQuantity, maxStock = 99) => {
    if (!lineIdOrProductId) return;
    const targetQty = Number(newQuantity);
    if (isNaN(targetQty) || targetQty <= 0) {
      removeItem(lineIdOrProductId);
      return;
    }

    const capped = Math.min(targetQty, maxStock || 99);
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === lineIdOrProductId || item.productId === lineIdOrProductId
          ? { ...item, quantity: capped }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const value = {
    cartItems,
    itemCount,
    lastAddedItem,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
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
 * Hydrates cart stubs with live product prices, stock levels, model choices, and names.
 */
export function useHydratedCart(products = []) {
  const { cartItems } = useCart();

  const productMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (p && p.id) {
        map[p.id] = p;
      }
    }
    return map;
  }, [products]);

  const items = useMemo(() => {
    return cartItems
      .map((item) => {
        const product = productMap[item.productId];
        if (!product) return null;
        const availableStock = product.available_stock ?? product.current_stock ?? 0;
        const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || availableStock === 0;
        const exceedsStock = item.quantity > availableStock;
        const stockWarning = isOutOfStock || exceedsStock;

        // Model resolution: line choice > saved product model > null
        const resolvedModel = item.selected_model || product.mobile_model || null;
        const itemColor = isRealColor(item.selected_color) ? item.selected_color : null;
        const validProdColors = getValidColors(product);
        const resolvedColor = itemColor || (validProdColors.length > 0 ? validProdColors[0] : null);

        return {
          id: item.id || item.productId,
          lineId: item.id || item.productId,
          productId: item.productId,
          product,
          quantity: item.quantity,
          selected_model: resolvedModel,
          selected_color: resolvedColor,
          stockWarning,
          isOutOfStock,
          exceedsStock,
          availableStock,
        };
      })
      .filter(Boolean);
  }, [cartItems, productMap]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.product.selling_price || 0) * (item.quantity || 1), 0),
    [items]
  );

  const FREE_SHIPPING_THRESHOLD = 1000; // ₹1,000
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0;
  const shippingFee = items.length === 0 ? 0 : isFreeShipping ? 0 : 99;
  const estimatedTotal = subtotal + shippingFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const hasStockWarnings = items.some((item) => item.stockWarning);

  return {
    items,
    subtotal,
    shippingFee,
    isFreeShipping,
    estimatedTotal,
    amountToFreeShipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    hasStockWarnings,
  };
}

export default CartContext;
