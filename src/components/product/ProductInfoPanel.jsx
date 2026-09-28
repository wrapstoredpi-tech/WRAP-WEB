import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Sparkles,
  AlertCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ColorSwatch } from '../ui/ColorSwatch';
import { useCart } from '../../context/CartContext';

export function ProductInfoPanel({
  product,
  onAddToCart,
  buyButtonRef,
  selectedColorState,
}) {
  const { addItem } = useCart();
  const [internalColor, setInternalColor] = useState(
    product.color_variants && product.color_variants.length > 0 ? product.color_variants[0] : ''
  );
  
  // Use parent color state if passed, otherwise internal
  const selectedColor = selectedColorState ? selectedColorState.color : internalColor;
  const setSelectedColor = selectedColorState ? selectedColorState.setColor : setInternalColor;

  const [quantity, setQuantity] = useState((product.available_stock ?? product.current_stock) > 0 ? 1 : 0);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [isModelsExpanded, setIsModelsExpanded] = useState(false);

  // Use stock_status from products_with_availability view
  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || (product.available_stock ?? product.current_stock) === 0;
  const isLowStock = product.stock_status === 'LOW_STOCK';
  const availableQty = product.available_stock ?? product.current_stock ?? 0;
  const hasDiscount = product.discount_percentage > 0;

  // Calculate original MRP price
  const originalPrice = hasDiscount
    ? (product.mrp || (product.selling_price / (1 - product.discount_percentage / 100))).toFixed(2)
    : null;

  // Stepper increment / decrement capped at current_stock
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
    if (isOutOfStock || quantity < 1) return;

    // Log to console as specified in requirements
    console.log('[WrapStore] Add to Cart:', {
      product_id: product.product_id || product.id,
      product_name: product.name,
      quantity,
      selected_color: selectedColor || null,
      unit_price: product.selling_price,
      total_price: (product.selling_price * quantity).toFixed(2),
    });

    setIsAdding(true);
    addItem(product, quantity, { selected_color: selectedColor });

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) {
        onAddToCart(product, quantity, selectedColor);
      }
      setTimeout(() => setAdded(false), 2000);
    }, 250);
  };

  // Compatible models slicing: show first 4 chips + expandable remainder
  const compatibleList = product.compatible_models || [];
  const visibleModels = isModelsExpanded ? compatibleList : compatibleList.slice(0, 4);
  const remainingCount = compatibleList.length - 4;

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Brand & Subcategory Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {product.brand_compatibility && product.brand_compatibility.length > 0 ? (
            product.brand_compatibility.map((b) => (
              <Badge key={b} variant="neutral" size="sm">
                {b}
              </Badge>
            ))
          ) : (
            <Badge variant="neutral" size="sm">
              Universal
            </Badge>
          )}
          <span className="text-metadata uppercase text-neutral-400 tracking-editorial font-semibold">
            {product.category} &bull; {product.subcategory}
          </span>
          <span className="text-metadata uppercase text-neutral-400 font-mono ml-auto">
            {product.product_id}
          </span>
        </div>

        {/* Product Name */}
        <h1 className="text-h1 sm:text-display font-medium text-neutral-900 tracking-tight leading-tight">
          {product.name}
        </h1>
      </div>

      {/* Pricing & GST Note */}
      <div className="pb-4 border-b border-neutral-200 space-y-1.5">
        <div className="flex items-baseline gap-3">
          <span className="text-h2 font-semibold text-neutral-900">
            ₹{product.selling_price.toLocaleString()}
          </span>

          {hasDiscount && originalPrice && (
            <span className="text-body-lg text-neutral-400 line-through font-normal">
              ₹{Number(originalPrice).toLocaleString()}
            </span>
          )}

          {hasDiscount && (
            <Badge variant="discount" size="md">
              Save {product.discount_percentage}%
            </Badge>
          )}
        </div>

        {/* GST-inclusive Note */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>Price inclusive of all taxes ({product.gst_percentage || 18}% GST included).</span>
        </div>
      </div>

      {/* Stock Status Indicator */}
      <div className="flex items-center gap-2 text-body-sm font-medium">
        {isOutOfStock ? (
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
            <Badge variant="outofstock" size="sm">
              Out of Stock
            </Badge>
            <span className="text-xs text-neutral-400">&bull; Join waitlist for next production batch</span>
          </div>
        ) : isLowStock ? (
          <div className="flex items-center gap-2 text-amber-900">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <Badge variant="lowstock" size="sm">
              Only {product.available_stock} left
            </Badge>
            <span className="text-xs text-amber-700 font-medium">&bull; Order soon to secure batch allocation</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="font-semibold">In Stock</span>
            <span className="text-xs text-neutral-500 font-normal">&bull; Ships within 24 hours</span>
          </div>
        )}
      </div>

      {/* Short Description */}
      <div className="text-body text-neutral-600 leading-relaxed">
        <p>{product.description}</p>
      </div>

      {/* ========================================================================= */}
      {/* "Compatible with" Section (First 4 chips + expandable +N more)             */}
      {/* ========================================================================= */}
      <div className="space-y-2.5 pt-2 border-t border-neutral-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-accent" />
            <span className="text-metadata uppercase font-semibold text-neutral-900 tracking-editorial">
              Compatible With
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">
            {compatibleList.length > 0 ? `${compatibleList.length} Models` : 'Universal'}
          </span>
        </div>

        {compatibleList.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {visibleModels.map((model) => (
                <span
                  key={model}
                  className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 select-none"
                >
                  {model}
                </span>
              ))}

              {/* +N More Expandable Toggle */}
              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsModelsExpanded(!isModelsExpanded)}
                  className="px-2.5 py-1 text-xs font-semibold text-accent hover:text-accent-dark bg-accent-light border border-accent-border transition-colors inline-flex items-center gap-1"
                >
                  <span>{isModelsExpanded ? 'Show less' : `+${remainingCount} more`}</span>
                  {isModelsExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 leading-tight">
              One precision case design engineered with exact port tolerances for each listed model.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
              Universal Accessory (Compatible across all Apple, Samsung & standard devices)
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Color Swatch Selector (Visual only — stored as note in cart line)         */}
      {/* ========================================================================= */}
      {product.color_variants && product.color_variants.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-200/80">
          <div className="flex items-center justify-between">
            <label className="text-metadata uppercase font-semibold text-neutral-500 tracking-editorial block">
              Color Variant
            </label>
            <span className="text-xs text-neutral-400 font-sans">
              Selected: <strong className="text-neutral-900 font-medium">{selectedColor}</strong>
            </span>
          </div>

          <ColorSwatch
            colors={product.color_variants}
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
            size="md"
            showLabel={false}
            interactive={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Quantity Stepper & Add to Cart Action                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-3 border-t border-neutral-200">
        <label className="text-metadata uppercase font-semibold text-neutral-500 tracking-editorial block">
          Quantity {product.current_stock > 0 && <span className="text-neutral-400 font-normal">(Max {product.current_stock})</span>}
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Stepper capped at current_stock */}
          <div className="inline-flex items-center justify-between border border-neutral-300 bg-base-offwhite h-12 px-3 sm:w-36 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={handleDecrement}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="font-semibold text-neutral-900 text-body font-mono">
              {quantity}
            </span>

            <button
              type="button"
              disabled={isOutOfStock || quantity >= product.current_stock}
              onClick={handleIncrement}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <div ref={buyButtonRef} className="flex-1">
            <Button
              variant={isOutOfStock ? 'secondary' : added ? 'primary' : 'accent'}
              size="lg"
              isFullWidth
              disabled={isOutOfStock}
              isLoading={isAdding}
              onClick={handleAddToCart}
              leftIcon={
                added ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )
              }
            >
              {isOutOfStock
                ? 'Out of Stock'
                : added
                ? `Added (${quantity}) to Bag`
                : `Add to Bag • ₹${(product.selling_price * (quantity || 1)).toLocaleString()}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Editorial Guarantees */}
      <div className="pt-6 border-t border-neutral-200 space-y-3 text-body-sm text-neutral-600">
        <div className="flex items-start gap-3">
          <Truck className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <span>Complimentary tracked express shipping on orders over $100.</span>
        </div>
        <div className="flex items-start gap-3">
          <RotateCcw className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <span>30-day hassle-free returns & worldwide exchange policy.</span>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
          <span>Lifetime craftsmanship guarantee against structural stitching flaws.</span>
        </div>
      </div>

    </div>
  );
}

export default ProductInfoPanel;
