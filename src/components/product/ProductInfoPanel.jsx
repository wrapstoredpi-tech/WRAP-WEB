import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Minus,
  Plus,
  ShoppingBag,
  Check,
  CheckCircle2,
  ChevronDown,
  Heart,
  Truck,
  ShieldCheck,
  Package,
  Headphones,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { formatINR } from '../../lib/currency';
import { resolveColorStyle, getValidColors } from '../../lib/colors';
import { ProductShare } from './ProductShare';

export function ProductInfoPanel({ product, onAddToCart, buyButtonRef }) {
  const navigate = useNavigate();
  const { products } = useProductsContext();
  const { addItem } = useCart();

  const isOutOfStock =
    product.stock_status === 'OUT_OF_STOCK' ||
    (product.available_stock ?? product.current_stock ?? 0) === 0;
  const availableQty = Math.max(0, product.available_stock ?? product.current_stock ?? 0);
  const sellingPrice = Number(product.selling_price) || 0;
  const rawMrp = Number(product.raw_mrp ?? product.mrp);
  const mrp =
    rawMrp > 0
      ? rawMrp
      : product.discount_percentage > 0
      ? Math.round(sellingPrice / (1 - product.discount_percentage / 100))
      : 0;
  const hasDiscount = mrp > sellingPrice;

  const compatibleModels = product.compatible_models || [];
  const isCase = (product.category || '').toLowerCase().includes('case');
  const needsModelSelection = isCase || compatibleModels.length > 0;

  // Selected phone model state: starts unselected by default per specification
  const [selectedModel, setSelectedModel] = useState('');
  const [modelError, setModelError] = useState(false);
  const modelSelectRef = useRef(null);

  // Validate that selectedModel is actually in compatibleModels
  const isModelSelected = Boolean(
    selectedModel &&
      (!compatibleModels.length || compatibleModels.includes(selectedModel))
  );

  // Collection-based Colour Selector state
  const collectionName = (product.collection || '').trim();

  // Find all products in the same collection
  const collectionProducts = useMemo(() => {
    if (!collectionName) return [product];
    return (products || []).filter(
      (p) =>
        p.collection &&
        p.collection.trim().toLowerCase() === collectionName.toLowerCase()
    );
  }, [products, collectionName, product]);

  // Derive all unique color variants across this collection
  const colorVariants = useMemo(() => {
    const variants = [];
    const seenColors = new Set();

    if (collectionName && collectionProducts.length > 0) {
      collectionProducts.forEach((p) => {
        const pColors = getValidColors(p.color_variants || p.color);
        const colList =
          pColors.length > 0
            ? pColors
            : typeof p.color_variants === 'string' && p.color_variants.trim()
            ? [p.color_variants.trim()]
            : p.color
            ? [p.color]
            : [];

        colList.forEach((col) => {
          const key = col.toLowerCase().trim();
          if (!seenColors.has(key)) {
            seenColors.add(key);
            variants.push({
              color: col,
              productId: p.id,
              isCurrent: p.id === product.id,
              product: p,
            });
          }
        });
      });
    } else {
      // If product has no collection, use only this product's own valid colors
      const ownColors = getValidColors(product.color_variants || product.colors);
      ownColors.forEach((col) => {
        const key = col.toLowerCase().trim();
        if (!seenColors.has(key)) {
          seenColors.add(key);
          variants.push({
            color: col,
            productId: product.id,
            isCurrent: true,
            product,
          });
        }
      });
    }

    return variants;
  }, [collectionName, collectionProducts, product.id, product.color_variants, product.colors]);

  // Selected color defaults to current product's color
  const currentProductColor =
    getValidColors(product.color_variants || product.colors)[0] ||
    (typeof product.color_variants === 'string' && product.color_variants.trim()) ||
    colorVariants.find((v) => v.isCurrent)?.color ||
    colorVariants[0]?.color ||
    '';

  const [selectedColor, setSelectedColor] = useState(currentProductColor);

  useEffect(() => {
    if (currentProductColor) {
      setSelectedColor(currentProductColor);
    }
  }, [product.id, currentProductColor]);

  const handleColorClick = (variant) => {
    setSelectedColor(variant.color);
    if (variant.productId && variant.productId !== product.id) {
      navigate(`/product/${variant.productId}`);
    }
  };

  // Quantity state
  const [quantity, setQuantity] = useState(availableQty > 0 ? 1 : 0);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Wishlist state persisted in localStorage
  const [isWishlisted, setIsWishlisted] = useState(() => {
    try {
      const saved = localStorage.getItem('wrapstore_wishlist_ids');
      if (saved) {
        const ids = JSON.parse(saved);
        return Array.isArray(ids) && ids.includes(product.id);
      }
    } catch {}
    return false;
  });

  const handleToggleWishlist = () => {
    setIsWishlisted((prev) => {
      const nextVal = !prev;
      try {
        const saved = localStorage.getItem('wrapstore_wishlist_ids');
        const set = new Set(saved ? JSON.parse(saved) : []);
        if (nextVal) {
          set.add(product.id);
        } else {
          set.delete(product.id);
        }
        localStorage.setItem('wrapstore_wishlist_ids', JSON.stringify(Array.from(set)));
        window.dispatchEvent(new Event('wrapstore_wishlist_updated'));
      } catch {}
      return nextVal;
    });
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < availableQty) {
      setQuantity((q) => q + 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // Check model validation for model-dependent cases
    if (needsModelSelection && !isModelSelected) {
      setModelError(true);
      if (modelSelectRef.current) {
        modelSelectRef.current.focus();
        modelSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsAdding(true);
    const chosenColor = selectedColor || null;
    const modelToSave = selectedModel || 'Universal';

    addItem(product, quantity, modelToSave, chosenColor);

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) {
        onAddToCart(product, quantity);
      }
      setTimeout(() => setAdded(false), 2200);
    }, 200);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* 1. Category Pill */}
      <div>
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[12px] font-medium bg-[#F2F1ED] text-[#737373] tracking-wide">
          {product.category || 'Mobile Cases'}
          {product.subcategory ? ` / ${product.subcategory}` : ''}
        </span>
      </div>

      {/* 2. Product Title - Explicit sans-serif bold matching mockup */}
      <h1 className="font-sans text-[28px] sm:text-[36px] font-bold text-[#141414] tracking-[-0.02em] leading-[1.15]">
        {product.name}
      </h1>

      {/* 3. Pricing and MRP */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 tabular-nums">
          <span className="font-sans text-[26px] sm:text-[30px] font-bold text-[#141414]">
            {formatINR(sellingPrice)}
          </span>
          {hasDiscount && (
            <span className="font-sans text-[16px] sm:text-[18px] text-[#737373] line-through font-normal">
              MRP {formatINR(mrp)}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#737373] font-normal">
          Inclusive of taxes
        </p>

        {/* 4. NEW REQUIREMENT — Dynamic Compatibility Status */}
        {needsModelSelection && isModelSelected && (
          <div className="pt-2 animate-fadeIn" data-testid="compatibility-status">
            <div className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#141414]">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#16A34A] shrink-0" />
              <span>Compatible with {selectedModel}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Phone Model Selector (When required) */}
      {needsModelSelection && (
        <div className="space-y-1.5">
          <label
            htmlFor="phone-model-select"
            className="block text-[14px] font-medium text-[#141414]"
          >
            Select Phone Model <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <select
              id="phone-model-select"
              ref={modelSelectRef}
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setModelError(false);
              }}
              className={`w-full bg-white border rounded-xl px-4 py-3 min-h-[48px] text-[14px] text-[#141414] transition-all appearance-none cursor-pointer pr-10 focus:outline-none focus:ring-1 ${
                modelError
                  ? 'border-[#DC2626] ring-1 ring-[#DC2626]'
                  : 'border-[#E5E5E3] hover:border-[#141414] focus:border-[#141414] focus:ring-[#141414]'
              }`}
            >
              <option value="">Choose your exact phone model</option>
              {compatibleModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#737373] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Validation / Helper message when no model is chosen */}
          {!isModelSelected && (
            <p className="text-[12px] text-[#DC2626] font-normal pt-0.5">
              Please choose your phone model to check exact fit.
            </p>
          )}
        </div>
      )}

      {/* 6. Colour Selector */}
      {colorVariants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-[#737373] font-normal">Colour:</span>
            <span className="font-semibold text-[#141414]">
              {selectedColor || currentProductColor}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {colorVariants.map((variant) => {
              const isSelected =
                variant.isCurrent ||
                (selectedColor &&
                  variant.color.toLowerCase() === selectedColor.toLowerCase());
              const style = resolveColorStyle(variant.color);
              return (
                <button
                  key={`${variant.productId}-${variant.color}`}
                  type="button"
                  onClick={() => handleColorClick(variant)}
                  aria-label={`Select ${variant.color} color`}
                  title={variant.color}
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-[#141414]'
                      : 'hover:scale-105'
                  }`}
                >
                  <span
                    className="w-full h-full rounded-full border border-black/10 shadow-2xs"
                    style={style}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Quantity, Add to Cart, and Wishlist Row */}
      <div className="pt-1 space-y-3">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Stepper Quantity Selector */}
          <div className="inline-flex items-center justify-between border border-[#E5E5E3] bg-white rounded-full min-h-[48px] px-3.5 w-28 shrink-0 select-none">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={handleDecrement}
              className="w-7 h-7 flex items-center justify-center text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 rounded-full transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[14px] font-semibold text-[#141414] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || quantity >= availableQty}
              onClick={handleIncrement}
              className="w-7 h-7 flex items-center justify-center text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 rounded-full transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button (Black Pill matching mockup) */}
          <div ref={buyButtonRef} className="flex-1">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full min-h-[48px] px-6 py-3 rounded-full text-[15px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                isOutOfStock
                  ? 'bg-[#E5E5E3] text-[#737373] cursor-not-allowed'
                  : 'bg-[#141414] hover:bg-[#262626] text-white active:scale-[0.99]'
              }`}
            >
              {isAdding ? (
                <span>Adding...</span>
              ) : added ? (
                <>
                  <Check className="w-4.5 h-4.5" />
                  <span>Added to Cart</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of stock</span>
              ) : (
                <>
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="w-12 h-12 rounded-full border border-[#E5E5E3] hover:border-[#141414] bg-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs hover:shadow-xs"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isWishlisted ? 'text-[#DC2626] fill-[#DC2626]' : 'text-[#141414]'
              }`}
            />
          </button>
        </div>

        {/* Quiet stock note */}
        {isOutOfStock ? (
          <p className="text-[13px] text-[#DC2626] font-medium">Currently out of stock</p>
        ) : availableQty <= 5 && availableQty > 0 ? (
          <p className="text-[13px] text-[#B0521F] font-semibold">
            Only {availableQty} left in stock
          </p>
        ) : null}
      </div>

      {/* 8. Service Benefits Strip (Matching Mockup with 4 cards & separators) */}
      <div className="bg-[#F8F7F4] rounded-2xl p-4 sm:p-5 border border-[#EDEAE3]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-2 sm:divide-x sm:divide-[#E5E2DA]">
          {/* 1: Free Delivery */}
          <div className="flex items-center gap-3 sm:px-2">
            <Truck className="w-5 h-5 text-[#141414] shrink-0 stroke-[1.6]" />
            <div className="leading-tight">
              <p className="text-[12px] sm:text-[13px] font-bold text-[#141414]">Free delivery</p>
              <p className="text-[11px] text-[#737373]">across India</p>
            </div>
          </div>

          {/* 2: Secure Payments */}
          <div className="flex items-center gap-3 sm:px-3">
            <ShieldCheck className="w-5 h-5 text-[#141414] shrink-0 stroke-[1.6]" />
            <div className="leading-tight">
              <p className="text-[12px] sm:text-[13px] font-bold text-[#141414]">Secure</p>
              <p className="text-[11px] text-[#737373]">payments</p>
            </div>
          </div>

          {/* 3: Easy Returns */}
          <div className="flex items-center gap-3 sm:px-3">
            <Package className="w-5 h-5 text-[#141414] shrink-0 stroke-[1.6]" />
            <div className="leading-tight">
              <p className="text-[12px] sm:text-[13px] font-bold text-[#141414]">Easy</p>
              <p className="text-[11px] text-[#737373]">returns</p>
            </div>
          </div>

          {/* 4: Dedicated Support */}
          <div className="flex items-center gap-3 sm:px-3">
            <Headphones className="w-5 h-5 text-[#141414] shrink-0 stroke-[1.6]" />
            <div className="leading-tight">
              <p className="text-[12px] sm:text-[13px] font-bold text-[#141414]">Dedicated</p>
              <p className="text-[11px] text-[#737373]">support</p>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Product Sharing */}
      <ProductShare product={product} selectedModel={selectedModel} />
    </div>
  );
}

export default ProductInfoPanel;
