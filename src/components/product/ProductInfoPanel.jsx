import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  Check, 
  Smartphone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ColorSwatch } from '../ui/ColorSwatch';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';

export function ProductInfoPanel({
  product,
  onAddToCart,
  buyButtonRef,
  selectedColorState,
}) {
  const { addItem } = useCart();
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  const [internalColor, setInternalColor] = useState(
    product.color_variants && product.color_variants.length > 0 ? product.color_variants[0] : ''
  );
  
  const selectedColor = selectedColorState ? selectedColorState.color : internalColor;
  const setSelectedColor = selectedColorState ? selectedColorState.setColor : setInternalColor;

  const [quantity, setQuantity] = useState(product.available_stock > 0 ? 1 : 0);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [isModelsExpanded, setIsModelsExpanded] = useState(false);

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0;
  const isLowStock = !isOutOfStock && (product.available_stock <= 5 || product.stock_status === 'LOW_STOCK');
  const availableQty = product.available_stock || 0;
  const hasDiscount = product.mrp > product.selling_price;

  // Compatibility check
  const isCompatibleWithSavedPhone =
    savedPhone &&
    (
      !product.compatible_models ||
      product.compatible_models.length === 0 ||
      product.compatible_models.includes('Universal') ||
      product.mobile_brand === 'Universal' ||
      product.compatible_models.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim())
    );

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

  const compatibleList = product.compatible_models || [];

  return (
    <div className="flex flex-col space-y-6">
      {/* Category & Title */}
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-wide font-semibold text-neutral-500">
          {product.category} &bull; {product.subcategory}
        </span>
        <h1 className="text-display font-semibold text-neutral-900 tracking-tight leading-tight">
          {product.name}
        </h1>
      </div>

      {/* Price Line */}
      <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-200">
        <span className="text-display font-semibold text-neutral-900">
          ₹{product.selling_price.toLocaleString()}
        </span>

        {hasDiscount && (
          <span className="text-body text-neutral-400 line-through">
            ₹{product.mrp.toLocaleString()}
          </span>
        )}

        {hasDiscount && (
          <Badge variant="accent" size="md">
            {product.discount_percentage}% OFF
          </Badge>
        )}
      </div>

      {/* Compatibility Line */}
      <div className="py-1">
        {savedPhone && isCompatibleWithSavedPhone ? (
          <div className="flex items-center gap-2 text-emerald-800 text-body-sm font-semibold bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fits your {savedPhone.model}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsModelsExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full text-body-sm text-neutral-700 font-semibold bg-white border border-neutral-200 hover:border-neutral-400 p-3 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-neutral-500" />
              <span>Check compatibility</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <span>{compatibleList.length > 0 ? `${compatibleList.length} models` : 'Universal fit'}</span>
              {isModelsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
        )}

        {/* Expandable Model List */}
        {isModelsExpanded && (
          <div className="mt-3 p-4 bg-neutral-100 rounded-xl border border-neutral-200 space-y-2 text-xs">
            <p className="font-semibold text-neutral-900 uppercase tracking-wide">Full Compatible Model List</p>
            {compatibleList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {compatibleList.map((m) => (
                  <span key={m} className="px-2.5 py-1 bg-white rounded-lg border border-neutral-300 font-medium text-neutral-800">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600">Universal design fits standard devices without phone model restrictions.</p>
            )}

            {!savedPhone && (
              <button
                type="button"
                onClick={openPhoneSheet}
                className="pt-2 text-accent font-semibold hover:underline block text-xs"
              >
                Set your phone model for 1-click compatibility checks &rarr;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stock Line */}
      <div className="flex items-center gap-2 text-body-sm font-semibold">
        {isOutOfStock ? (
          <span className="text-neutral-500 bg-neutral-100 border border-neutral-300 px-3 py-1 rounded-lg">
            Out of stock
          </span>
        ) : isLowStock ? (
          <span className="text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg">
            Only {product.available_stock} left
          </span>
        ) : (
          <span className="text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg">
            In stock
          </span>
        )}
      </div>

      {/* Product Description */}
      {product.description && (
        <p className="text-body-sm text-neutral-600 leading-relaxed">
          {product.description}
        </p>
      )}

      {/* Choice 1: Colour Swatches (if any) */}
      {product.color_variants && product.color_variants.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-neutral-200">
          <label className="text-xs uppercase font-semibold text-neutral-500 tracking-wide block">
            Colour Variant: <strong className="text-neutral-900 font-semibold">{selectedColor}</strong>
          </label>
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

      {/* Choice 2: Quantity Stepper (Capped at available_stock) */}
      <div className="space-y-2 pt-3 border-t border-neutral-200">
        <label className="text-xs uppercase font-semibold text-neutral-500 tracking-wide block">
          Quantity (Max {availableQty})
        </label>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-between border border-neutral-300 bg-white rounded-xl h-12 px-3 w-36">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={handleDecrement}
              className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold text-neutral-900 text-body font-mono">
              {quantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || quantity >= availableQty}
              onClick={handleIncrement}
              className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

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
                ? 'Out of stock'
                : added
                ? `Added to Bag`
                : `Add to Bag • ₹${(product.selling_price * (quantity || 1)).toLocaleString()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInfoPanel;
