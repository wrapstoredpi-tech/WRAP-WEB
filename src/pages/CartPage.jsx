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
  Tag,
  Check,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductCard } from '../components/home/ProductCard';

export function CartPage() {
  const { itemCount, updateQuantity, removeItem, clearCart, addItem } = useCart();
  const { products } = useProductsContext();

  // Hydrate cart stubs with live product data (includes stockWarning flag)
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

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'WRAP15' || code === 'EDITION15') {
      setAppliedDiscount(15);
      setPromoSuccess('15% Studio discount applied!');
    } else if (code === 'FREESHIP') {
      setAppliedDiscount(10);
      setPromoSuccess('Special promotion applied!');
    } else {
      setPromoError('Invalid promotional code. Try code "WRAP15".');
    }
  };

  const discountAmount = (subtotal * appliedDiscount) / 100;
  const finalTotal = Math.max(0, estimatedTotal - discountAmount);

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  // Recommended products: featured / online_featured products from live data
  const recommendedProducts = products
    .filter((p) => p.online_featured && p.stock_status !== 'OUT_OF_STOCK')
    .slice(0, 4)
    .concat(
      // Pad with any in-stock products if featured list is short
      products.filter((p) => !p.online_featured && p.stock_status !== 'OUT_OF_STOCK')
    )
    .slice(0, 4);

  // Check if any cart item went out of stock (Realtime warning)
  const hasStockWarnings = items.some((item) => item.stockWarning);

  return (
    <main className="flex-grow max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-16 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial">
            Checkout &amp; Overview
          </span>
          <h1 className="text-h1 sm:text-display font-medium text-neutral-900 tracking-tight">
            Shopping Bag
          </h1>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-4 text-body-sm">
            <span className="text-neutral-500">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-neutral-400 hover:text-accent flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Bag</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Realtime Stock Warning Banner ─────────────────────────────────── */}
      {hasStockWarnings && (
        <div className="mt-4 mb-2 flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Stock update — action required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              One or more items in your bag are now out of stock (the POS just sold the last units).
              Please remove them before proceeding to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="py-16 sm:py-24 text-center space-y-8">
          <div className="max-w-md mx-auto space-y-4 bg-neutral-100/60 border border-neutral-200 p-8 sm:p-12 shadow-subtle-card">
            <div className="w-16 h-16 bg-neutral-200/80 text-neutral-600 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7 stroke-1" />
            </div>
            <div className="space-y-2">
              <h2 className="text-h2 font-medium text-neutral-900">
                Your shopping bag is empty
              </h2>
              <p className="text-body text-neutral-500 max-w-sm mx-auto">
                Explore our minimal collection of leather enclosures, precision sleeves, and desk surfaces.
              </p>
            </div>
            <div className="pt-3">
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

          {/* Curated Recommendations */}
          {recommendedProducts.length > 0 && (
            <div className="pt-12 text-left space-y-6">
              <div className="border-b border-neutral-200 pb-3">
                <span className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial">
                  Featured Carry
                </span>
                <h3 className="text-h2 font-medium text-neutral-900">
                  Recommended Objects
                </h3>
              </div>
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={(p) => addItem(p, 1)}
                    onQuickView={(p) => navigate(`/product/${p.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Active Cart Layout: 2 Columns on Desktop */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-8">

          {/* Left Column: Line Items List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* Free Shipping Banner */}
            <div className="p-4 bg-neutral-100 border border-neutral-200 text-body-sm">
              {isFreeShipping ? (
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your order qualifies for <strong>Complimentary Express Shipping</strong>.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-neutral-700">
                    <span>Add <strong>₹{amountToFreeShipping.toFixed(0)}</strong> more for free shipping</span>
                    <span className="text-neutral-500 font-mono text-xs">{Math.round((subtotal / freeShippingThreshold) * 100)}%</span>
                  </div>
                  <div className="w-full bg-neutral-300 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {items.map(({ id, product, quantity, selectedColor, stockWarning }) => {
                const isMaxStock = quantity >= (product.available_stock || 1);
                const originalPrice = product.discount_percentage > 0
                  ? (product.selling_price / (1 - product.discount_percentage / 100)).toFixed(0)
                  : null;

                return (
                  <div
                    key={id}
                    className={`py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 ${stockWarning ? 'opacity-60' : ''}`}
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/product/${product.id}`}
                      className="w-24 sm:w-28 aspect-[4/5] bg-neutral-200 shrink-0 overflow-hidden shadow-subtle-card group"
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-metadata uppercase text-neutral-400 tracking-editorial font-semibold">
                          {product.category} &bull; {product.mobile_brand}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id, selectedColor)}
                          className="sm:hidden text-neutral-400 hover:text-neutral-900 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <Link
                        to={`/product/${product.id}`}
                        className="text-h3 font-medium text-neutral-900 hover:text-accent transition-colors block truncate"
                      >
                        {product.name}
                      </Link>

                      <p className="text-body-sm text-neutral-500">
                        {product.mobile_model} &bull; {product.subcategory}
                        {selectedColor && ` · ${selectedColor}`}
                      </p>

                      {/* Unit Price */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-body-sm font-semibold text-neutral-900">
                          ₹{product.selling_price.toLocaleString()}
                        </span>
                        {originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">₹{originalPrice}</span>
                        )}
                        {product.discount_percentage > 0 && (
                          <Badge variant="discount" size="sm">Save {product.discount_percentage}%</Badge>
                        )}
                      </div>

                      {/* Stock warning — Realtime: product sold out while in cart */}
                      {stockWarning ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 mt-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="font-medium">Now out of stock — please remove to continue.</span>
                        </div>
                      ) : isMaxStock ? (
                        <p className="text-[11px] text-accent font-medium pt-1">
                          Maximum available stock reached ({product.available_stock} max)
                        </p>
                      ) : null}
                    </div>

                    {/* Stepper and Line Total */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                      <div className="flex items-center gap-3">
                        {/* Stepper */}
                        <div className="inline-flex items-center border border-neutral-300 bg-base-offwhite h-9 px-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1, selectedColor, product.available_stock)}
                            className="p-1 text-neutral-600 hover:text-neutral-900 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 font-semibold text-xs text-neutral-900 font-mono">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isMaxStock || stockWarning}
                            onClick={() => updateQuantity(product.id, quantity + 1, selectedColor, product.available_stock)}
                            className="p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove button desktop */}
                        <button
                          type="button"
                          onClick={() => removeItem(product.id, selectedColor)}
                          className="hidden sm:inline-flex p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right">
                        <span className="text-body font-semibold text-neutral-900 font-sans">
                          ₹{(product.selling_price * quantity).toLocaleString()}
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
                className="inline-flex items-center gap-2 text-body-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue browsing catalog</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-neutral-100 border border-neutral-200 p-6 sm:p-8 space-y-6 sticky top-28 shadow-subtle-card">

              <h2 className="text-metadata uppercase font-semibold text-neutral-900 tracking-editorial border-b border-neutral-200 pb-4">
                Order Summary
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-3.5 text-body-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-neutral-900 font-sans">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Shipping</span>
                  <span className="font-medium text-neutral-900 font-sans">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase text-xs font-semibold">Free</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-accent font-medium">
                    <span>Studio Promotion ({appliedDiscount}%)</span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Taxes (GST)</span>
                  <span className="text-neutral-400 text-xs">Calculated at checkout</span>
                </div>

                <div className="border-t border-neutral-200 pt-4 flex justify-between items-baseline text-neutral-900">
                  <span className="font-semibold text-body">Estimated Total</span>
                  <div className="text-right">
                    <span className="text-h2 font-semibold font-sans">₹{finalTotal.toLocaleString()}</span>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-editorial block">INR</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <form onSubmit={handleApplyPromo} className="pt-2 border-t border-neutral-200 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code (e.g. WRAP15)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 bg-base-offwhite border border-neutral-300 px-3 py-2 text-xs text-neutral-900 uppercase placeholder:normal-case focus:outline-none focus:border-accent"
                  />
                  <Button type="submit" variant="secondary" size="sm">Apply</Button>
                </div>
                {promoError && <p className="text-[11px] text-rose-600">{promoError}</p>}
                {promoSuccess && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> {promoSuccess}
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
                  {hasStockWarnings ? 'Remove out-of-stock items first' : 'Proceed to Checkout'}
                </Button>
                <p className="text-[11px] text-center text-neutral-500">
                  Encrypted 256-bit SSL transaction. UPI &amp; Card accepted.
                </p>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-neutral-200/80 space-y-2.5 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0" />
                  <span>Lifetime guarantee against stitching flaws.</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-neutral-700 shrink-0" />
                  <span>30 days return &amp; exchange window.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-700 shrink-0" />
                  <span>Carbon-neutral logistics packaging.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CartPage;
