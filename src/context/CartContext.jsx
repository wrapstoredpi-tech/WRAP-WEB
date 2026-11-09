import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { isRealColor, getValidColors } from '../lib/colors';
import { getShippingFee } from '../config/policies';

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

  // Item count (sum of line quantities - combos count as 1 per combo line quantity)
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
      // Cart line key = combo_id + selected_model
      const targetModel = modelToSave || 'Universal';
      const lineKey = `${product.id}_${targetModel}`;

      // Find line matching both product ID and selected model
      const existingIndex = prevItems.findIndex(
        (i) => i.id === lineKey || (i.productId === product.id && (i.selected_model || 'Universal') === targetModel)
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
          added_price: updated[existingIndex].added_price ?? product.selling_price,
        };
        return updated;
      } else {
        const finalQty = Math.min(addQty, maxStock);
        return [
          ...prevItems,
          {
            id: lineKey,
            productId: product.id,
            quantity: finalQty,
            selected_model: modelToSave,
            selected_color: colorToSave,
            added_price: product.selling_price,
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
 * For combos: resolves constituent items, stock, availability, and POS edits live.
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

        // Model resolution: line choice > saved product model > null
        const resolvedModel = item.selected_model || (product ? product.mobile_model : null);
        const itemColor = isRealColor(item.selected_color) ? item.selected_color : null;
        const validProdColors = product ? getValidColors(product) : [];
        const resolvedColor = itemColor || (validProdColors.length > 0 ? validProdColors[0] : null);

        // Check if combo/product was deleted or hidden in POS while in bag
        if (!product || product.is_active === false || product.online_visible === false) {
          return {
            id: item.id || item.productId,
            lineId: item.id || item.productId,
            productId: item.productId,
            product: product || { id: item.productId, name: 'Combo', selling_price: item.added_price || 0 },
            quantity: item.quantity,
            selected_model: resolvedModel,
            selected_color: resolvedColor,
            isUnavailable: true,
            unavailableMessage: 'This combo is no longer available',
            stockWarning: true,
            isOutOfStock: true,
            exceedsStock: false,
            availableStock: 0,
            is_combo: true,
            components: [],
          };
        }

        // Price change detection: if POS edited price while in bag
        const priceChanged =
          item.added_price !== undefined &&
          Number(product.selling_price) !== Number(item.added_price);

        // Combo line resolution
        if (product.is_combo) {
          const rawComboItems = Array.isArray(product.combo_items) ? product.combo_items : [];

          // Derive component list, photos, names, and stock live from productMap
          const components = rawComboItems.map((ci) => {
            const compProd = productMap[ci.product_id];
            const stock = compProd
              ? Math.max(0, compProd.available_stock ?? compProd.current_stock ?? 0)
              : 0;
            const allottedQty = Math.max(1, Number(ci.allotted_qty) || 1);
            return {
              product_id: ci.product_id,
              name: compProd?.name || ci.product_name || 'Component Item',
              image: compProd?.image_url || ci.image || null,
              stock,
              allotted_qty: allottedQty,
              mobile_model: ci.mobile_model || compProd?.mobile_model || null,
              category: compProd?.category || ci.category || '',
              subcategory: compProd?.subcategory || ci.subcategory || '',
              maxCombosPossible: Math.floor(stock / allottedQty),
            };
          });

          // Availability = min over components of floor(stock / allotted_qty)
          const comboAvailability = components.length > 0
            ? Math.min(...components.map((c) => c.maxCombosPossible))
            : 0;

          const isOutOfStock = comboAvailability === 0;
          const exceedsStock = item.quantity > comboAvailability;
          const stockWarning = isOutOfStock || exceedsStock;

          let stockWarningMessage = null;
          if (isOutOfStock) {
            const outOfStockComp = components.find((c) => c.maxCombosPossible === 0);
            stockWarningMessage = outOfStockComp
              ? `Out of stock: ${outOfStockComp.name}`
              : 'Out of stock';
          } else if (exceedsStock) {
            const limitingComp = [...components].sort((a, b) => a.maxCombosPossible - b.maxCombosPossible)[0];
            stockWarningMessage = limitingComp
              ? `Only ${comboAvailability} ${comboAvailability === 1 ? 'combo' : 'combos'} available because ${limitingComp.name} is running low`
              : `Only ${comboAvailability} combos available`;
          }

          // Savings calculation
          const originalValue = Number(product.raw_mrp || product.original_value || product.mrp || 0);
          const sellingPrice = Number(product.selling_price) || 0;
          const hasRealSavings = originalValue > sellingPrice;
          const savings = hasRealSavings ? originalValue - sellingPrice : 0;

          // Check if any component has model specificity
          const hasModelSpecificComponent = components.some(
            (c) =>
              (c.mobile_model && c.mobile_model !== 'Universal') ||
              (c.category || '').toLowerCase().includes('case') ||
              (c.subcategory || '').toLowerCase().includes('iphone') ||
              (c.subcategory || '').toLowerCase().includes('samsung')
          );

          return {
            id: item.id || item.productId,
            lineId: item.id || item.productId,
            productId: item.productId,
            product,
            quantity: item.quantity,
            selected_model: resolvedModel,
            selected_color: resolvedColor,
            is_combo: true,
            components,
            comboAvailability,
            availableStock: comboAvailability,
            isOutOfStock,
            exceedsStock,
            stockWarning,
            stockWarningMessage,
            priceChanged,
            originalValue,
            hasRealSavings,
            savings,
            hasModelSpecificComponent,
          };
        }

        // Standard product line
        const availableStock = product.available_stock ?? product.current_stock ?? 0;
        const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || availableStock === 0;
        const exceedsStock = item.quantity > availableStock;
        const stockWarning = isOutOfStock || exceedsStock;

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
          priceChanged,
          is_combo: false,
        };
      })
      .filter(Boolean);
  }, [cartItems, productMap]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.product.selling_price || 0) * (item.quantity || 1),
        0
      ),
    [items]
  );

  // Default base shipping fee based on user's saved state or Tamil Nadu (₹55)
  const defaultSavedState = (() => {
    try {
      const stored = localStorage.getItem('wrapstore_checkout_user_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state) return parsed.state;
      }
    } catch {}
    return 'Tamil Nadu';
  })();

  const baseShippingFee = items.length === 0 ? 0 : getShippingFee(defaultSavedState);
  const estimatedTotal = subtotal + baseShippingFee;
  const hasStockWarnings = items.some((item) => item.stockWarning || item.isUnavailable);

  return {
    items,
    subtotal,
    shippingFee: baseShippingFee,
    estimatedTotal,
    hasStockWarnings,
  };
}

export default CartContext;
