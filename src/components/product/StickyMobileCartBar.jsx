import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '../../context/CartContext';

export function StickyMobileCartBar({
  product,
  buyButtonRef,
  selectedColor,
  onAddToCart,
}) {
  const { addItem } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!buyButtonRef?.current) return;
      const rect = buyButtonRef.current.getBoundingClientRect();
      // If the top buy button has scrolled out of view above the viewport
      if (rect.bottom < 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [buyButtonRef]);

  const isOutOfStock = product.current_stock === 0;

  const handleAdd = () => {
    if (isOutOfStock) return;

    console.log('[WrapStore Mobile] Add to Cart:', {
      product_id: product.product_id || product.id,
      product_name: product.name,
      quantity: 1,
      selected_color: selectedColor || null,
      unit_price: product.selling_price,
    });

    setIsAdding(true);
    addItem(product, 1, { selected_color: selectedColor });

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) {
        onAddToCart(product, 1, selectedColor);
      }
      setTimeout(() => setAdded(false), 2000);
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <div
      className="
        fixed bottom-0 inset-x-0 z-40 bg-base-offwhite/95 backdrop-blur-md
        border-t border-neutral-300 shadow-2xl p-3.5 sm:hidden
        animate-slide-down transition-all duration-300
      "
      style={{ animationDirection: 'normal' }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Product Thumbnail & Quick Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-11 h-11 bg-neutral-200 aspect-square overflow-hidden shrink-0 border border-neutral-200">
            <img
              src={product.image_url || (product.images && product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-900 truncate">
              {product.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-900 font-sans">
                ${product.selling_price.toFixed(2)}
              </span>
              {selectedColor && (
                <span className="text-[10px] text-neutral-500 truncate">
                  &bull; {selectedColor}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 w-36">
          <Button
            variant={isOutOfStock ? 'secondary' : added ? 'primary' : 'accent'}
            size="sm"
            isFullWidth
            disabled={isOutOfStock}
            isLoading={isAdding}
            onClick={handleAdd}
            leftIcon={
              added ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )
            }
          >
            {isOutOfStock ? 'Out of Stock' : added ? 'Added' : 'Add to Bag'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StickyMobileCartBar;
