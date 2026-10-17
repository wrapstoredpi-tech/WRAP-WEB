import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../../lib/currency';
import { ColorSwatch, getValidColors } from '../ui/ColorSwatch';

export function ProductCard({ product }) {
  const navigate = useNavigate();

  if (!product) return null;

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0;
  const isLowStock = !isOutOfStock && (product.available_stock <= 5 || product.stock_status === 'LOW_STOCK');
  const hasDiscount = product.mrp > product.selling_price;
  const validColors = getValidColors(product);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer bg-white rounded-[6px] border border-[#E5E5E3] hover:border-[#141414] transition-colors flex flex-col overflow-hidden"
      role="article"
      aria-label={`${product.name}, Price ₹${product.selling_price}`}
    >
      {/* Real photo at fixed 4:5 aspect ratio */}
      <div className="relative aspect-[4/5] w-full bg-[#FAFAF9] overflow-hidden">
        {product.isNewArrival && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="inline-flex items-center text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#141414] text-white select-none">
              New
            </span>
          </div>
        )}
        <img
          src={product.image_url}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02] ${
            isOutOfStock ? 'opacity-50 grayscale' : ''
          }`}
          loading="lazy"
        />
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
        <div className="space-y-1">
          <h3 className="text-[16px] font-semibold text-[#141414] line-clamp-1">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[16px] font-semibold text-[#141414]">
              {formatINR(product.selling_price)}
            </span>
            {hasDiscount && (
              <span className="text-[14px] text-[#6B6B6B] line-through font-normal">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Color variants preview (only shown if colors updated from POS, disappears cleanly otherwise) */}
          {validColors.length > 0 && (
            <div className="pt-0.5">
              <ColorSwatch colors={validColors.slice(0, 5)} size="xs" />
            </div>
          )}
        </div>

        {/* Quiet low-stock / stock note */}
        <div className="text-[12px] pt-1">
          {isOutOfStock ? (
            <span className="text-[#6B6B6B]">Out of stock</span>
          ) : isLowStock ? (
            <span className="text-[#B0521F] font-semibold">
              Only {product.available_stock} left
            </span>
          ) : (
            <span className="text-[#6B6B6B]">In stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
