import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { CrossSellSection } from '../components/cart/CrossSellSection';
import { ComboThumbnail } from '../components/cart/ComboThumbnail';
import { ComboIncludedItems } from '../components/cart/ComboIncludedItems';
import { formatINR } from '../lib/currency';
import { storeConfig } from '../config/store';
import { policies } from '../config/policies';

export function CartPage() {
  const { itemCount, updateQuantity, removeItem } = useCart();
  const { products } = useProductsContext();
  const navigate = useNavigate();

  // Live hydrated cart items & totals
  const {
    items,
    subtotal,
    shippingFee,
    estimatedTotal,
    hasStockWarnings,
  } = useHydratedCart(products);

  const handleProceedToCheckout = () => {
    if (hasStockWarnings || items.length === 0) return;
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-24 text-center space-y-6">
        <div className="max-w-md mx-auto space-y-3 bg-white border border-[#E5E5E3] rounded-[6px] p-8">
          <div className="w-12 h-12 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center mx-auto text-[#6B6B6B]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-[28px] font-semibold text-[#141414]">
            Your Bag is Empty
          </h1>
          <p className="text-[14px] text-[#6B6B6B]">
            Explore our collection of phone cases and everyday accessories.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#B0521F] text-white text-[14px] font-semibold rounded-[6px] hover:bg-[#994518] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-12">
      {/* Page Title */}
      <div className="pb-4 border-b border-[#E5E5E3] flex items-baseline justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
            Shopping Bag
          </h1>
          <p className="text-[14px] text-[#6B6B6B] mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag
          </p>
        </div>
        <Link
          to="/"
          className="text-[14px] text-[#B0521F] font-semibold hover:underline"
        >
          Continue shopping
        </Link>
      </div>

      {/* Main 2-Column Layout: Items on Left, Sticky Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Amber Stock Warnings Alert Banner */}
          {hasStockWarnings && (
            <div className="p-4 bg-[#F9EDE7] border border-[#B0521F] rounded-[6px] text-[#141414] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B0521F] shrink-0 mt-0.5" />
              <div className="text-[14px] space-y-0.5">
                <strong className="block font-semibold text-[#B0521F]">
                  Stock Alert
                </strong>
                <p className="text-[#141414]">
                  One or more items in your bag exceed available inventory or are no longer available. Please adjust quantities or remove unavailable items to proceed to checkout.
                </p>
              </div>
            </div>
          )}

          {/* Cart Lines */}
          <div className="bg-white border border-[#E5E5E3] rounded-[6px] divide-y divide-[#E5E5E3]">
            {items.map((line) => {
              // Deleted or hidden combo/product in POS while in bag
              if (line.isUnavailable) {
                return (
                  <div key={line.id || line.productId} className="p-4 sm:p-6 space-y-3 bg-[#FAFAF9]">
                    <div className="flex gap-4 sm:gap-6 items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[16px] font-semibold text-[#141414]">
                          {line.product.name}
                        </p>
                        <p className="text-[13px] text-[#B0521F] font-medium">
                          {line.unavailableMessage || 'This combo is no longer available'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.id)}
                        className="min-h-[44px] px-4 py-2 text-[13px] font-semibold text-[#B0521F] border border-[#B0521F] rounded-[4px] hover:bg-[#B0521F] hover:text-white transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }

              const maxStock = line.availableStock ?? 99;

              return (
                <div key={line.id || line.productId} className="p-4 sm:p-6 space-y-3">
                  <div className="flex gap-4 sm:gap-6">
                    {/* Item Image: Tiled photos for combo, standard thumbnail for products */}
                    {line.is_combo ? (
                      <ComboThumbnail
                        product={line.product}
                        components={line.components}
                      />
                    ) : (
                      <div className="w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0">
                        <img
                          src={line.product.image_url}
                          alt={line.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={`/product/${line.product.id}`}
                            className="text-[16px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors line-clamp-1"
                          >
                            {line.product.name}
                          </Link>
                          <span className="text-[16px] font-semibold text-[#141414] shrink-0 tabular-nums">
                            {formatINR(line.product.selling_price * line.quantity)}
                          </span>
                        </div>

                        {/* Quiet Combo text tag (small, muted, no pill) */}
                        {line.is_combo && (
                          <p className="text-[12px] text-[#737373] font-normal">
                            Combo
                          </p>
                        )}

                        {/* Selected Model: for combo, show when it has a model-specific component */}
                        {line.is_combo ? (
                          line.hasModelSpecificComponent && line.selected_model && (
                            <p className="text-[14px] text-[#141414]">
                              <span className="text-[#737373]">Model: </span>
                              <span className="font-semibold">{line.selected_model}</span>
                            </p>
                          )
                        ) : (
                          line.selected_model && (
                            <p className="text-[14px] text-[#141414]">
                              <span className="text-[#6B6B6B]">Model: </span>
                              <span className="font-semibold">{line.selected_model}</span>
                            </p>
                          )
                        )}

                        {/* Colour (for standard products) */}
                        {!line.is_combo && line.selected_color && (
                          <p className="text-[12px] text-[#6B6B6B]">
                            Colour: {line.selected_color}
                          </p>
                        )}

                        {/* Unit price */}
                        <p className="text-[12px] text-[#6B6B6B]">
                          {formatINR(line.product.selling_price)} each
                        </p>

                        {/* Real savings note on combo lines */}
                        {line.is_combo && line.hasRealSavings && (
                          <p className="text-[12px] text-[#16A34A] font-medium">
                            Worth {formatINR(line.originalValue)}, you save {formatINR(line.savings)}
                          </p>
                        )}

                        {/* Quiet "Price updated" note if POS edited price while in bag */}
                        {line.priceChanged && (
                          <p className="text-[12px] text-[#737373] italic">
                            Price updated
                          </p>
                        )}
                      </div>

                      {/* Stepper & Remove */}
                      <div className="flex items-center justify-between pt-3">
                        <div className="inline-flex items-center border border-[#E5E5E3] rounded-[6px] bg-[#FAFAF9] min-h-[44px]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity - 1, maxStock)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-[14px] font-semibold text-[#141414] tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={line.quantity >= maxStock}
                            onClick={() => updateQuantity(line.id, line.quantity + 1, maxStock)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(line.id)}
                          className="min-h-[44px] px-3 text-[12px] text-[#6B6B6B] hover:text-[#B0521F] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Included items breakdown for combos */}
                  {line.is_combo && Array.isArray(line.components) && line.components.length > 0 && (
                    <ComboIncludedItems
                      components={line.components}
                      comboQuantity={line.quantity}
                      selectedModel={line.selected_model}
                      comboName={line.product.name}
                    />
                  )}

                  {/* Amber Line Stock Warning */}
                  {line.stockWarning && (
                    <div className="p-2.5 bg-[#F9EDE7] border border-[#B0521F] rounded-[6px] text-[12px] text-[#B0521F] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {line.stockWarningMessage ||
                          (line.isOutOfStock
                            ? 'This item is out of stock. Please remove it to proceed.'
                            : `Only ${line.availableStock} available in stock. Please reduce your quantity.`)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Complete the ecosystem accessories below items */}
          <CrossSellSection />
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white border border-[#E5E5E3] rounded-[6px] subtle-elevation p-6 space-y-5">
            <h2 className="text-[20px] font-semibold text-[#141414] pb-3 border-b border-[#E5E5E3]">
              Order Summary
            </h2>

            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal</span>
                <span className="text-[#141414] font-semibold tabular-nums">{formatINR(subtotal)}</span>
              </div>

              <div className="flex justify-between text-[#6B6B6B]">
                <span>Shipping</span>
                <span className="text-[#141414] font-semibold tabular-nums">{formatINR(shippingFee)}</span>
              </div>

              <div className="pt-3 border-t border-[#E5E5E3] flex justify-between text-[16px] font-semibold text-[#141414]">
                <span>Total</span>
                <span className="text-[#B0521F] tabular-nums">{formatINR(estimatedTotal)}</span>
              </div>

              <p className="text-[12px] text-[#6B6B6B]">
                Inclusive of all applicable GST
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={hasStockWarnings || items.length === 0}
                onClick={handleProceedToCheckout}
                className="w-full min-h-[44px] py-3 px-6 bg-[#141414] text-white text-[14px] font-semibold rounded-[6px] hover:bg-[#262626] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

export default CartPage;
