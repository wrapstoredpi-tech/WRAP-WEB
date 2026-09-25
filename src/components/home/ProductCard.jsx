import React, { useState } from 'react';
import { ShoppingBag, Check, Eye } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ColorSwatch } from '../ui/ColorSwatch';
import { useCart } from '../../context/CartContext';

export function ProductCard({ product, onAddToCart, onQuickView }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Use the precomputed stock_status from products_with_availability view
  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || product.available_stock === 0;
  const isLowStock = product.stock_status === 'LOW_STOCK';
  const hasDiscount = product.discount_percentage > 0;
  const isFeatured = product.online_featured;
  
  // Calculate original price before discount
  const originalPrice = hasDiscount
    ? (product.mrp || (product.selling_price / (1 - product.discount_percentage / 100))).toFixed(2)
    : null;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    addItem(product, 1);
    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) onAddToCart(product);
      setTimeout(() => setAdded(false), 1800);
    }, 250);
  };

  return (
    <article
      onClick={() => onQuickView && onQuickView(product)}
      className={`
        group relative flex flex-col cursor-pointer transition-all duration-300
        ${isOutOfStock ? 'opacity-65 grayscale-[35%]' : ''}
      `}
    >
      {/* 4:5 Aspect Ratio Editorial Image Frame */}
      <div className="relative aspect-[4/5] w-full bg-neutral-200/90 overflow-hidden">
        <img
          src={product.image_url || (product.images && product.images[0])}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <Badge variant="outofstock" size="sm">
              Out of Stock
            </Badge>
          ) : isLowStock ? (
            <Badge variant="lowstock" size="sm">
              Only {product.available_stock} left
            </Badge>
          ) : hasDiscount ? (
            <Badge variant="discount" size="sm">
              Save {product.discount_percentage}%
            </Badge>
          ) : isFeatured ? (
            <Badge variant="new" size="sm">
              Featured
            </Badge>
          ) : null}
        </div>

        {/* Hover Quick Add / Action Bar for Desktop */}
        {!isOutOfStock && (
          <div
            className="
              absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-neutral-950/60 via-neutral-950/20 to-transparent
              translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100
              transition-all duration-300 flex items-center justify-between gap-2 z-20
            "
          >
            <Button
              variant={added ? 'primary' : 'secondary'}
              size="sm"
              isFullWidth
              isLoading={isAdding}
              disabled={isAdding}
              onClick={handleAdd}
              className="bg-base-offwhite text-neutral-900 border-none hover:bg-white text-xs font-semibold py-2 shadow-md"
              leftIcon={
                added ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ShoppingBag className="w-3.5 h-3.5" />
                )
              }
            >
              {added ? 'Added to Bag' : 'Quick Add'}
            </Button>
          </div>
        )}
      </div>

      {/* Product Content & Typography */}
      <div className="space-y-1.5 pt-3">
        {/* Metadata: Category & Subcategory / Brand */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 uppercase tracking-editorial font-medium">
          <span className="truncate">
            {product.category}
          </span>
          <span className="shrink-0 text-neutral-400 pl-1 font-mono text-[10px]">
            {product.product_id}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-body font-medium text-neutral-900 group-hover:text-accent transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        {/* Price Hierarchy with MRP Strikethrough + Discount % */}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <span className="text-body font-semibold text-neutral-900 font-sans">
            ₹{product.selling_price.toLocaleString()}
          </span>
          {hasDiscount && originalPrice && (
            <span className="text-body-sm text-neutral-400 line-through font-normal">
              ₹{originalPrice}
            </span>
          )}
          {hasDiscount && (
            <span className="text-[10px] font-bold text-accent bg-accent-light px-1.5 py-0.5 border border-accent-border leading-none">
              -{product.discount_percentage}%
            </span>
          )}
          <span className="text-metadata text-neutral-400 uppercase ml-auto">
            {isOutOfStock ? 'Out of stock' : isLowStock ? `${product.available_stock} left` : ''}
          </span>
        </div>

        {/* Color variants preview */}
        {product.color_variants && product.color_variants.length > 0 && (
          <div className="pt-1">
            <ColorSwatch
              colors={product.color_variants}
              size="sm"
              interactive={false}
            />
          </div>
        )}
      </div>
    </article>
  );
}

export default ProductCard;
