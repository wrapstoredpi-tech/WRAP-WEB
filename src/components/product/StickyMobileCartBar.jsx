import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePurchaseSheet } from '../../context/PurchaseSheetContext';
import { formatINR } from '../../lib/currency';
import { combosOrderable, store } from '../../config/store';

export function StickyMobileCartBar({
  product,
  selectedModel,
  isModelSelected,
  needsModelSelection,
  onAddToCart,
  modelSelectRef,
  setModelError,
}) {
  const navigate = useNavigate();
  const { cartItems, addItem } = useCart();
  const { openSheet } = usePurchaseSheet();

  if (!product) return null;

  const isOutOfStock =
    product.stock_status === 'OUT_OF_STOCK' ||
    (product.available_stock !== undefined && product.available_stock === 0) ||
    (product.current_stock !== undefined && product.current_stock === 0);

  const isModelDisabled = needsModelSelection && !isModelSelected;

  const isInCart = Boolean(
    product.id &&
      Array.isArray(cartItems) &&
      cartItems.some((i) => {
        const matchesId = String(i.productId) === String(product.id) || String(i.id) === String(product.id);
        if (!matchesId) return false;
        if (needsModelSelection) {
          return String(i.selected_model) === String(selectedModel);
        }
        return true;
      })
  );

  const handleClick = () => {
    if (isOutOfStock) return;

    if (isInCart) {
      navigate('/cart');
      return;
    }

    if (isModelDisabled) {
      if (setModelError) setModelError(true);
      if (modelSelectRef?.current) {
        modelSelectRef.current.focus();
        modelSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const modelToSave = selectedModel || 'Universal';
    addItem(product, 1, modelToSave, null);
    openSheet({
      product,
      quantity: 1,
      selectedModel: modelToSave,
      selectedColor: null,
    });
    if (onAddToCart) {
      onAddToCart(product, 1, modelToSave, null);
    }
  };

  const sellingPrice = Number(product.selling_price) || 0;
  const isCombo = Boolean(product.is_combo || product.product_type === 'combo');

  if (isCombo && product.empty_intersection) {
    return (
      <aside
        aria-label="Unavailable"
        className="fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-md border-t border-[#E5E5E3] p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden shadow-lg select-none"
      >
        <div className="w-full max-w-[1280px] mx-auto text-center py-2">
          <p className="text-[13px] text-[#6B6B6B] font-medium">
            This combo is not available for any single phone model
          </p>
        </div>
      </aside>
    );
  }

  if (isCombo && !combosOrderable) {
    return (
      <aside
        aria-label="Inquire on WhatsApp"
        className="fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-md border-t border-[#E5E5E3] p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden shadow-lg select-none"
      >
        <div className="w-full max-w-[1280px] mx-auto space-y-1.5">
          <p className="text-center text-[12px] text-[#6B6B6B] font-medium">
            Coming soon online – available in store
          </p>
          <a
            href={`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
              `Hi WrapStore, I would like to inquire about the ${product.name} combo.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-[52px] px-6 text-[15px] font-semibold rounded-[6px] flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#B0521F] text-white transition-all shadow-sm"
          >
            <MessageCircle className="w-4.5 h-4.5" />
            <span>Ask on WhatsApp</span>
          </a>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Add to Bag"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-md border-t border-[#E5E5E3] p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden shadow-lg select-none"
    >
      <div className="w-full max-w-[1280px] mx-auto">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleClick}
          className={`w-full h-[52px] px-6 text-[15px] font-semibold rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            isOutOfStock
              ? 'bg-[#E5E5E3] text-[#6B6B6B] cursor-not-allowed'
              : isInCart
              ? 'bg-[#141414] hover:bg-[#262626] text-white active:scale-[0.99]'
              : 'bg-[#B0521F] hover:bg-[#964317] text-white active:scale-[0.99]'
          }`}
        >
          {isOutOfStock ? (
            <span>Out of stock</span>
          ) : isInCart ? (
            <>
              <span>Go to Bag</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          ) : (
            <>
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>
                Add to Bag {sellingPrice > 0 ? `· ${formatINR(sellingPrice)}` : ''}
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default StickyMobileCartBar;
