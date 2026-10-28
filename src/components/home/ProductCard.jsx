import React, { useState, useEffect, useMemo } from 'react';
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

  // Extract all distinct images for this product
  const images = useMemo(() => {
    const rawList = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      rawList.push(...product.images);
    }
    if (product.image_url) {
      rawList.push(product.image_url);
    }
    if (Array.isArray(product.combo_items)) {
      product.combo_items.forEach((it) => {
        if (it.image) rawList.push(it.image);
      });
    }

    const seen = new Set();
    const result = [];
    rawList.filter(Boolean).forEach((url) => {
      if (!seen.has(url)) {
        seen.add(url);
        result.push(url);
      }
    });

    return result.length > 0 ? result : [product.image_url || ''];
  }, [product.images, product.image_url, product.combo_items]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-scroll images smoothly when there are 2 or more images
  useEffect(() => {
    if (images.length <= 1) return;

    // Subtle deterministic stagger so multiple cards don't all scroll on the exact same microsecond
    const delay =
      Math.abs(
        String(product.id || '')
          .split('')
          .reduce((acc, c) => acc + c.charCodeAt(0), 0)
      ) % 800;

    let intervalId;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2600);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [images.length, product.id]);

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
      <div className="relative aspect-[4/5] w-full bg-white overflow-hidden">
        {product.is_combo ? (
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="inline-flex items-center text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#B0521F] text-white select-none">
              Combo
            </span>
          </div>
        ) : product.isNewArrival ? (
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="inline-flex items-center text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#141414] text-white select-none">
              New
            </span>
          </div>
        ) : null}

        {images.length > 1 ? (
          <div className="relative w-full h-full overflow-hidden">
            <div
              className="flex w-full h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((imgSrc, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 relative">
                  <img
                    src={imgSrc}
                    alt={`${product.name} - view ${idx + 1}`}
                    className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02] ${
                      isOutOfStock ? 'opacity-50 grayscale' : ''
                    }`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>

            {/* Pagination indicator dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm pointer-events-auto">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  aria-label={`Go to image ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentImageIndex === idx
                      ? 'w-3.5 bg-white shadow-sm'
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02] ${
              isOutOfStock ? 'opacity-50 grayscale' : ''
            }`}
            loading="lazy"
          />
        )}
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
        <div className="space-y-1">
          {product.is_combo && (
            <p className="text-[11px] font-semibold tracking-wide uppercase text-[#B0521F]">
              Combo Offer ({product.combo_items?.length || 2} Items)
            </p>
          )}
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
