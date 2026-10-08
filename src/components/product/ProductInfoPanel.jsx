import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  Check, 
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ColorSwatch } from '../ui/ColorSwatch';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';
import { isProductCompatibleWithPhone } from '../../lib/useProducts';
import { useProductColors } from '../../lib/colorExtraction';

export function ProductInfoPanel({
  product,
  onAddToCart,
  buyButtonRef,
}) {
  const { addItem } = useCart();
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  // Auto-fetch priority: 1) DB color_variants, 2) Auto-detected from primary image, 3) None
  const colors = useProductColors(product);

  const [quantity, setQuantity] = useState(product.available_stock > 0 ? 1 : 0);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [isModelsExpanded, setIsModelsExpanded] = useState(false);

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0;
  const isLowStock = !isOutOfStock && (product.available_stock <= 5 || product.stock_status === 'LOW_STOCK');
  const availableQty = product.available_stock || 0;
  const hasDiscount = product.mrp > product.selling_price;

  const isMobileCase = (product.category || '').toLowerCase() === 'mobile cases';
  const isCompatibleWithSavedPhone = isProductCompatibleWithPhone(product, savedPhone);

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
    addItem(product, quantity);

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) {
        onAddToCart(product, quantity);
      }
      setTimeout(() => setAdded(false), 2000);
    }, 200);
  };

  const compatibleList = product.compatible_models || [];

  return (
    <div className="flex flex-col space-y-6">
      {/* Category & Title */}
      <div className="space-y-1.5">
        <span className="text-[12px] font-normal text-[#666664]">
          {product.category} {product.subcategory && `· ${product.subcategory}`}
        </span>
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-[#141414] tracking-[-0.02em] leading-snug">
          {product.name}
        </h1>
      </div>

      {/* Price Line */}
      <div className="flex items-baseline gap-3 pb-4 border-b border-[#E7E5E4]">
        <span className="text-[22px] sm:text-[24px] font-semibold text-[#141414]">
          {formatINR(product.selling_price)}
        </span>

        {hasDiscount && (
          <span className="text-[14px] text-[#A8A29E] font-normal line-through">
            {formatINR(product.mrp)}
          </span>
        )}

        {hasDiscount && (
          <span className="text-[11px] font-semibold bg-[#F8EBE7] text-[#9E381A] px-2 py-0.5 rounded-md">
            Save {product.discount_percentage}%
          </span>
        )}
      </div>

      {/* Compatibility Line */}
      <div className="py-0.5">
        {savedPhone && isMobileCase && isCompatibleWithSavedPhone && compatibleList.length > 0 ? (
          <div className="flex items-center gap-2 text-[13px] text-[#141414] bg-white border border-[#E7E5E4] p-3 rounded-lg font-normal">
            <Smartphone className="w-4 h-4 text-[#666664] shrink-0" />
            <span>Guaranteed fit for <strong className="font-semibold">{savedPhone.model}</strong></span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsModelsExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full text-[13px] text-[#141414] bg-white border border-[#E7E5E4] hover:border-[#D6D3D1] p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#666664]" />
              <span className="font-normal">Check compatibility</span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[#666664]">
              <span>{compatibleList.length > 0 ? `${compatibleList.length} models` : 'Universal fit'}</span>
              {isModelsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
        )}

        {/* Expandable Model List */}
        {isModelsExpanded && (
          <div className="mt-2.5 p-4 bg-white rounded-lg border border-[#E7E5E4] space-y-2 text-[12px]">
            <p className="font-semibold text-[#141414]">Compatible models</p>
            {compatibleList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {compatibleList.map((m) => (
                  <span key={m} className="px-2.5 py-1 bg-[#FAFAF9] rounded-md border border-[#E7E5E4] text-[#141414] font-normal">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[#666664]">Universal design fits standard devices.</p>
            )}

            {!savedPhone && (
              <button
                type="button"
                onClick={openPhoneSheet}
                className="pt-2 text-[#9E381A] font-semibold hover:underline block text-[12px]"
              >
                Select your phone for 1-click compatibility
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2 text-[13px]">
        {isOutOfStock ? (
          <span className="text-[#666664] bg-[#F5F5F4] border border-[#E7E5E4] px-2.5 py-1 rounded-md font-normal">
            Out of stock
          </span>
        ) : isLowStock ? (
          <span className="text-[#9E381A] bg-[#F8EBE7] border border-[#ECCEC5] px-2.5 py-1 rounded-md font-semibold">
            Only {product.available_stock} units left
          </span>
        ) : (
          <span className="text-[#141414] font-normal flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#141414]" />
            In stock
          </span>
        )}
      </div>

      {/* Product Description */}
      {product.description && (
        <p className="text-[14px] text-[#666664] font-normal leading-relaxed">
          {product.description}
        </p>
      )}

      {/* Informational Colour Swatches (Display only, non-interactive) */}
      {colors && colors.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-[#E7E5E4]">
          <span className="text-[12px] font-normal text-[#666664] block">
            Colours ({colors.join(', ')})
          </span>
          <ColorSwatch
            colors={colors}
            size="md"
          />
        </div>
      )}

      {/* Quantity Stepper & Add to Bag */}
      <div className="space-y-2 pt-3 border-t border-[#E7E5E4]">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-between border border-[#E7E5E4] bg-white rounded-lg h-11 px-3 w-32 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={handleDecrement}
              className="w-7 h-7 flex items-center justify-center text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-[#141414] text-[14px]">
              {quantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || quantity >= availableQty}
              onClick={handleIncrement}
              className="w-7 h-7 flex items-center justify-center text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div ref={buyButtonRef} className="flex-1">
            <Button
              variant={isOutOfStock ? 'secondary' : 'accent'}
              size="md"
              isFullWidth
              disabled={isOutOfStock}
              isLoading={isAdding}
              onClick={handleAddToCart}
              leftIcon={
                added ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )
              }
            >
              {isOutOfStock
                ? 'Out of stock'
                : added
                ? 'Added to Bag'
                : `Add to Bag · ${formatINR(product.selling_price * (quantity || 1))}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInfoPanel;
