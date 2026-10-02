import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../lib/currency';

export function StickyMobileCartBar({
  product,
  buyButtonRef,
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
      if (rect.bottom < 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [buyButtonRef]);

  const isOutOfStock = product.available_stock === 0 || product.stock_status === 'OUT_OF_STOCK';

  const handleAdd = () => {
    if (isOutOfStock) return;

    setIsAdding(true);
    addItem(product, 1);

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) {
        onAddToCart(product, 1);
      }
      setTimeout(() => setAdded(false), 2000);
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      className="
        fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-md
        border-t border-[#E7E5E4] shadow-modal p-3.5 sm:hidden
        animate-slide-down transition-all duration-200
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 bg-[#F5F5F4] aspect-square rounded-md overflow-hidden shrink-0 border border-[#E7E5E4]">
            <img
              src={product.image_url || (product.images && product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#141414] truncate">
              {product.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#141414]">
                {formatINR(product.selling_price)}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 w-32">
          <Button
            variant={isOutOfStock ? 'secondary' : 'accent'}
            size="sm"
            isFullWidth
            disabled={isOutOfStock}
            isLoading={isAdding}
            onClick={handleAdd}
            leftIcon={
              added ? (
                <Check className="w-3.5 h-3.5 text-white" />
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
