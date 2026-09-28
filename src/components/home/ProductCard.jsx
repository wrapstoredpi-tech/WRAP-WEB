import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';

export function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { savedPhone } = usePhoneContext();
  const [imageLoaded, setImageLoaded] = useState(false);

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
      className="group relative cursor-pointer bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-900 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md"
      role="article"
      aria-label={`${product.name}, Price ₹${product.selling_price}`}
    >
      {/* Aspect Ratio Container for Image (No layout shift) */}
      <div className="relative aspect-[4/5] w-full bg-neutral-100 overflow-hidden">
        {/* Loading skeleton placeholder before image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
        )}

        <img
          src={product.image_url}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`
            w-full h-full object-cover transition-transform duration-300 group-hover:scale-105
            ${isOutOfStock ? 'grayscale opacity-60' : ''}
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1 pointer-events-none z-10">
          <div className="flex flex-col gap-1 items-start">
            {isOutOfStock ? (
              <span className="text-[11px] font-semibold bg-neutral-900 text-white px-2 py-0.5 rounded-md">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                Only {product.available_stock} left
              </span>
            ) : null}

            {hasDiscount && (
              <span className="text-[11px] font-semibold bg-accent text-white px-2 py-0.5 rounded-md">
                {product.discount_percentage}% OFF
              </span>
            )}
          </div>

          {savedPhone && isCompatible && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              <Smartphone className="w-3 h-3" />
              Fits your phone
            </span>
          )}
        </div>

        {/* Quick Add Button overlay */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 min-h-[44px] min-w-[44px] rounded-xl bg-neutral-900 hover:bg-accent text-white flex items-center justify-center shadow-md transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="text-body-sm font-semibold text-neutral-900 line-clamp-1 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-body-sm font-semibold text-neutral-900">
            ₹{product.selling_price.toLocaleString()}
          </span>

          {hasDiscount && (
            <span className="text-xs text-neutral-400 line-through">
              ₹{product.mrp.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
