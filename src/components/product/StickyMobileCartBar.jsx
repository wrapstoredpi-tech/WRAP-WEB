import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatINR } from '../../lib/currency';

export function StickyMobileCartBar({
  product,
  buyButtonRef,
  onAddToCart,
}) {
  const [isVisible, setIsVisible] = useState(false);

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

  const isOutOfStock = product?.available_stock === 0 || product?.stock_status === 'OUT_OF_STOCK';

  const handleAdd = () => {
    if (isOutOfStock) return;

    // Scroll smoothly to buy controls
    if (buyButtonRef?.current) {
      buyButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isVisible || !product) return null;

  return (
    <aside
      aria-label="Quick Add to Bag"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E5E3] p-3 sm:hidden shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-11 h-11 bg-[#F5F4F0] rounded-xl overflow-hidden shrink-0 border border-[#E5E5E3]">
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
            <span className="text-[13px] font-bold text-[#141414]">
              {formatINR(product.selling_price)}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`min-h-[44px] px-5 py-2 text-[14px] font-semibold rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isOutOfStock
                ? 'bg-[#E5E5E3] text-[#737373] cursor-not-allowed'
                : 'bg-[#141414] hover:bg-[#262626] text-white active:scale-95'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isOutOfStock ? 'Out of stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default StickyMobileCartBar;
