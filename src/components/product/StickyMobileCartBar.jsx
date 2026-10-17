import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
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

    // Scroll to buy box if user hasn't selected model
    if (buyButtonRef?.current) {
      buyButtonRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Quick Add to Bag"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF9] border-t border-[#E5E5E3] p-3 sm:hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 bg-[#FAFAF9] rounded-[6px] overflow-hidden shrink-0 border border-[#E5E5E3]">
            <img
              src={product.image_url || (product.images && product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[#141414] truncate">
              {product.name}
            </p>
            <span className="text-[12px] font-semibold text-[#141414]">
              {formatINR(product.selling_price)}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`min-h-[44px] px-4 py-2 text-[14px] font-semibold rounded-[6px] flex items-center gap-1.5 transition-colors ${
              isOutOfStock
                ? 'bg-[#E5E5E3] text-[#6B6B6B] cursor-not-allowed'
                : 'bg-[#B0521F] text-white hover:bg-[#994518]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isOutOfStock ? 'Out of stock' : 'Choose Model'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default StickyMobileCartBar;
