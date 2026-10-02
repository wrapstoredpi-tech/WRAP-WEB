import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CrossSellSection } from '../components/cart/CrossSellSection';
import { formatINR } from '../lib/currency';

export function CartPage() {
  const { itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { products } = useProductsContext();

  // Live hydrated cart items & totals
  const {
    items,
    subtotal,
    shippingFee,
    isFreeShipping,
    estimatedTotal,
    amountToFreeShipping,
    freeShippingThreshold,
  } = useHydratedCart(products);

  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'WRAP15' || code === 'EDITION15') {
      setAppliedDiscount(15);
      setPromoSuccess('15% Studio discount applied');
    } else if (code === 'FREESHIP') {
      setAppliedDiscount(10);
      setPromoSuccess('Special promotion applied');
    } else {
      setPromoError('Invalid promotional code. Try "WRAP15".');
    }
  };

  const discountAmount = (subtotal * appliedDiscount) / 100;
  const finalTotal = Math.max(0, estimatedTotal - discountAmount);

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  // Check if any cart item went out of stock
  const hasStockWarnings = items.some((item) => item.stockWarning);

  return (
    <main className="flex-grow max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 w-full">
      {/* Toast Notification for cross-sell add */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white px-4 py-3 shadow-modal border border-neutral-800 flex items-center gap-2.5 rounded-lg animate-fade-in text-[13px] font-medium">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-6 border-b border-[#E7E5E4]">
        <div>
          <span className="text-caption uppercase text-[#666664] font-semibold tracking-wider block">
            Bag Overview
          </span>
          <h1 className="text-display font-semibold text-[#141414] tracking-tight mt-1">
            Shopping Bag
          </h1>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-4 text-body">
            <span className="text-[#666664]">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="text-caption text-[#666664] hover:text-[#9E381A] flex items-center gap-1.5 transition-colors font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Bag</span>
            </button>
          </div>
        )}
      </div>

      {/* Realtime Stock Warning Banner */}
      {hasStockWarnings && (
        <div className="mt-6 flex items-start gap-3 bg-[#F8EBE7] border border-[#ECCEC5] text-[#9E381A] p-4 rounded-lg text-body">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#9E381A]" />
          <div>
            <p className="font-semibold">Stock update</p>
            <p className="text-caption text-[#9E381A]/90 mt-0.5">
              One or more items in your bag are now out of stock. Please remove them to proceed with checkout.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="py-16 sm:py-24 text-center space-y-8">
          <div className="max-w-md mx-auto space-y-4 bg-white border border-[#E7E5E4] p-8 sm:p-12 rounded-lg shadow-card">
            <div className="w-14 h-14 bg-[#F5F5F4] text-[#666664] rounded-lg flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-section font-semibold text-[#141414]">
                Your bag is empty
              </h2>
              <p className="text-body text-[#666664] max-w-sm mx-auto">
                Explore our collection of precision cases, sleeves, and everyday carry essentials.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Active Cart Layout: 2 Columns on Desktop */
        <div className="space-y-12 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Line Items List */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* Free Shipping Banner */}
              <div className="p-4 bg-white border border-[#E7E5E4] rounded-lg text-body shadow-card">
                {isFreeShipping ? (
                  <div className="flex items-center gap-2 text-[#141414] font-medium text-[13px]">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your order qualifies for complimentary standard shipping.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[#141414] text-caption font-medium">
                      <span>Add {formatINR(amountToFreeShipping)} more for complimentary shipping</span>
                      <span className="text-[#666664] font-semibold">
                        {Math.round((subtotal / freeShippingThreshold) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#E7E5E4] h-1.5 rounded-lg overflow-hidden">
                      <div
                        className="bg-[#9E381A] h-full rounded-lg transition-all duration-300"
                        style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="divide-y divide-[#E7E5E4] border-y border-[#E7E5E4]">
                {items.map(({ id, product, quantity, stockWarning }) => {
                  const maxStock = product.available_stock || 1;
                  const isMaxStock = quantity >= maxStock;
                  const originalPrice = product.discount_percentage > 0
                    ? product.selling_price / (1 - product.discount_percentage / 100)
                    : null;

                  return (
                    <div
                      key={id}
                      className={`py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-opacity ${
                        stockWarning ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <Link
                        to={`/product/${product.id}`}
                        className="w-20 sm:w-24 aspect-[4/5] bg-[#F5F5F4] rounded-lg shrink-0 overflow-hidden border border-[#E7E5E4] group"
                      >
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-caption uppercase text-[#666664] font-semibold tracking-wider">
                            {product.category} {product.mobile_brand && `• ${product.mobile_brand}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="sm:hidden text-[#666664] hover:text-[#141414] p-1 rounded-lg"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Link
                          to={`/product/${product.id}`}
                          className="text-subheading font-semibold text-[#141414] hover:text-[#9E381A] transition-colors block truncate"
                        >
                          {product.name}
                        </Link>

                        {product.mobile_model && (
                          <p className="text-caption text-[#666664]">
                            {product.mobile_model}
                          </p>
                        )}

                        {/* Unit Price */}
                        <div className="flex items-baseline gap-2 pt-0.5">
                          <span className="text-body font-semibold text-[#141414]">
                            {formatINR(product.selling_price)}
                          </span>
                          {originalPrice && (
                            <span className="text-caption text-[#A8A29E] line-through">
                              {formatINR(originalPrice)}
                            </span>
                          )}
                          {product.discount_percentage > 0 && (
                            <Badge variant="discount" size="sm">
                              {product.discount_percentage}% off
                            </Badge>
                          )}
                        </div>

                        {/* Stock warning */}
                        {stockWarning ? (
                          <div className="flex items-center gap-1.5 text-caption text-[#9E381A] bg-[#F8EBE7] border border-[#ECCEC5] px-2.5 py-1 rounded-lg mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">Out of stock — please remove item.</span>
                          </div>
                        ) : isMaxStock ? (
                          <p className="text-caption text-[#9E381A] font-medium pt-0.5">
                            Maximum available quantity reached ({product.available_stock} max)
                          </p>
                        ) : null}
                      </div>

                      {/* Stepper and Line Total */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                        <div className="flex items-center gap-2">
                          {/* Stepper */}
                          <div className="inline-flex items-center border border-[#E7E5E4] bg-white rounded-lg h-9 px-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1, product.available_stock)}
                              className="p-1.5 text-[#141414] hover:text-[#666664] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 font-semibold text-caption text-[#141414]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isMaxStock || stockWarning}
                              onClick={() => updateQuantity(product.id, quantity + 1, product.available_stock)}
                              className="p-1.5 text-[#141414] hover:text-[#666664] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Remove button desktop */}
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="hidden sm:inline-flex p-2 text-[#666664] hover:text-[#9E381A] transition-colors rounded-lg"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Line Item Total */}
                        <div className="text-right">
                          <span className="text-body font-semibold text-[#141414]">
                            {formatINR(product.selling_price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Back to Shopping link */}
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-body font-semibold text-[#666664] hover:text-[#141414] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue browsing</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary Panel */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white border border-[#E7E5E4] rounded-lg p-6 sm:p-8 space-y-6 sticky top-28 shadow-card">
                <h2 className="text-caption uppercase font-semibold text-[#141414] tracking-wider border-b border-[#E7E5E4] pb-4">
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-3 text-body">
                  <div className="flex justify-between text-[#666664]">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-semibold text-[#141414]">{formatINR(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[#666664]">
                    <span>Shipping</span>
                    <span className="font-semibold text-[#141414]">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-700 uppercase text-caption font-semibold">Free</span>
                      ) : (
                        formatINR(shippingFee)
                      )}
                    </span>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-[#9E381A] font-semibold">
                      <span>Discount ({appliedDiscount}%)</span>
                      <span>-{formatINR(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#666664]">
                    <span>Estimated Taxes (GST)</span>
                    <span className="text-[#666664] text-caption">Included</span>
                  </div>

                  <div className="border-t border-[#E7E5E4] pt-4 flex justify-between items-baseline text-[#141414]">
                    <span className="font-semibold text-body">Estimated Total</span>
                    <div className="text-right">
                      <span className="text-section font-semibold text-[#9E381A]">{formatINR(finalTotal)}</span>
                      <span className="text-caption text-[#666664] uppercase tracking-wider block">INR</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <form onSubmit={handleApplyPromo} className="pt-2 border-t border-[#E7E5E4] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. WRAP15)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-3 py-2 text-caption text-[#141414] uppercase placeholder:normal-case focus:outline-none focus:border-[#141414]"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      Apply
                    </Button>
                  </div>
                  {promoError && <p className="text-caption text-[#9E381A]">{promoError}</p>}
                  {promoSuccess && (
                    <p className="text-caption text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {promoSuccess}
                    </p>
                  )}
                </form>

                {/* Checkout Button */}
                <div className="pt-2 space-y-3">
                  <Button
                    variant="accent"
                    size="lg"
                    isFullWidth
                    isLoading={isCheckingOut}
                    disabled={hasStockWarnings}
                    onClick={handleProceedToCheckout}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {hasStockWarnings ? 'Remove out-of-stock items' : 'Proceed to Checkout'}
                  </Button>
                  <p className="text-caption text-center text-[#666664]">
                    Encrypted 256-bit SSL checkout. UPI &amp; Cards accepted.
                  </p>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-[#E7E5E4] space-y-2.5 text-caption text-[#666664]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#141414] shrink-0" />
                    <span>Lifetime guarantee against manufacturing defects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#141414] shrink-0" />
                    <span>30-day exchange and replacement window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#141414] shrink-0" />
                    <span>Express courier shipping across India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Sell Section: "Complete the ecosystem" */}
          <CrossSellSection
            onAdded={(prod) => showToast(`Added "${prod.name}" to your bag.`)}
          />
        </div>
      )}
    </main>
  );
}

export default CartPage;
