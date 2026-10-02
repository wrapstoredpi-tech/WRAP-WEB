import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';
import { ColorSwatch } from '../ui/ColorSwatch';
import { useProductColors } from '../../lib/colorExtraction';

export function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { savedPhone } = usePhoneContext();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-fetch priority: 1) DB color_variants, 2) Auto-detect from primary image, 3) None
  const colors = useProductColors(product);

  if (!product) return null;

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0;
  const isLowStock = !isOutOfStock && (product.available_stock <= 5 || product.stock_status === 'LOW_STOCK');
  const hasDiscount = product.mrp > product.selling_price;

  // Compatibility check against saved phone
  const isCompatible =
    !savedPhone ||
    !product.compatible_models ||
    product.compatible_models.length === 0 ||
    product.compatible_models.includes('Universal') ||
    product.mobile_brand === 'Universal' ||
    product.compatible_models.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim());

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const added = addItem(product, 1);
    if (added && onAddToCart) {
      onAddToCart(product, 1);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer bg-white rounded-lg border border-[#E7E5E4] hover:border-[#141414] transition-colors duration-150 flex flex-col overflow-hidden shadow-sm"
      role="article"
      aria-label={`${product.name}, Price ₹${product.selling_price}`}
    >
      {/* 4:5 Aspect Ratio Locked Container (No Layout Shift) */}
      <div className="relative aspect-[4/5] w-full bg-[#F5F5F4] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#E7E5E4]/50 animate-pulse" />
        )}

        <img
          src={product.image_url}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`
            w-full h-full object-cover transition-opacity duration-200
            ${isOutOfStock ? 'grayscale opacity-50' : ''}
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          loading="lazy"
        />

        {/* Quiet Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1 pointer-events-none z-10">
          <div className="flex flex-col gap-1 items-start">
            {isOutOfStock ? (
              <span className="text-[11px] font-semibold bg-[#141414]/90 text-white px-2 py-0.5 rounded-md">
                Sold out
              </span>
            ) : isLowStock ? (
              <span className="text-[11px] font-semibold bg-[#F8EBE7] text-[#9E381A] border border-[#ECCEC5] px-2 py-0.5 rounded-md">
                {product.available_stock} remaining
              </span>
            ) : null}

            {hasDiscount && (
              <span className="text-[11px] font-semibold bg-[#F5F5F4] text-[#141414] border border-[#E7E5E4] px-1.5 py-0.5 rounded-md">
                -{product.discount_percentage}%
              </span>
            )}
          </div>

          {savedPhone && isCompatible && (
            <span className="text-[11px] font-normal bg-white/90 text-[#141414] border border-[#E7E5E4] px-2 py-0.5 rounded-md backdrop-blur-xs">
              Fits {savedPhone.model.replace(/^iPhone\s+/i, '')}
            </span>
          )}
        </div>

        {/* Quiet Quick Add Action */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-lg bg-[#141414] hover:bg-[#262624] text-white flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shadow-sm"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
        <div className="space-y-0.5">
          <span className="text-[12px] font-normal text-[#666664]">
            {product.category}
          </span>
          <h3 className="text-[14px] font-semibold text-[#141414] line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold text-[#141414]">
              {formatINR(product.selling_price)}
            </span>

            {hasDiscount && (
              <span className="text-[12px] text-[#A8A29E] font-normal line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Informational Color Swatches (Non-interactive) */}
          {colors && colors.length > 0 && (
            <div className="flex items-center gap-1 shrink-0" title={`Colours: ${colors.join(', ')}`}>
              <ColorSwatch
                colors={colors.slice(0, 3)}
                size="xs"
              />
              {colors.length > 3 && (
                <span className="text-[11px] text-[#666664] font-normal">
                  +{colors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
