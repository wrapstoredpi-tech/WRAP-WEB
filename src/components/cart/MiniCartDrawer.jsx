import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Trash2, Check, Sparkles } from 'lucide-react';
import { useCart, useHydratedCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function MiniCartDrawer() {
  const { itemCount, isMiniCartOpen, closeMiniCart, lastAddedItem, removeItem } = useCart();
  const { products } = useProductsContext();

  const {
    items,
    subtotal,
    amountToFreeShipping,
    freeShippingThreshold,
    isFreeShipping,
  } = useHydratedCart(products);

  const navigate = useNavigate();

  // Close drawer on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMiniCart();
    };
    if (isMiniCartOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMiniCartOpen, closeMiniCart]);

  if (!isMiniCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeMiniCart}
        aria-hidden="true"
      />

      {/* Slide-out Drawer from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 sm:pl-16">
        <div className="w-screen max-w-md bg-base-offwhite border-l border-neutral-300 shadow-2xl flex flex-col justify-between animate-drawer-in p-6 sm:p-7">
          {/* Drawer Header */}
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-neutral-900" />
                <span className="font-sans font-bold text-base tracking-widest uppercase text-neutral-900">
                  Your Bag ({itemCount})
                </span>
              </div>
              <button
                type="button"
                onClick={closeMiniCart}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 focus-visible:outline-accent"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Just Added Confirmation Banner */}
            {lastAddedItem && (
              <div className="mt-4 p-3 bg-accent-light border border-accent-border flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-medium text-accent">
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span>Just added to your selection</span>
                </div>
                <Badge variant="accent" size="sm">+{lastAddedItem.quantity}</Badge>
              </div>
            )}

            {/* Free Shipping Progress */}
            <div className="mt-4 p-3 bg-neutral-100 border border-neutral-200 text-xs">
              {isFreeShipping ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>You have unlocked complimentary express shipping!</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-600">
                    <span>Add <strong>₹{amountToFreeShipping.toFixed(0)}</strong> more for Free Delivery</span>
                    <span>{Math.round((subtotal / freeShippingThreshold) * 100)}%</span>
                  </div>
                  <div className="w-full bg-neutral-300 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="mt-6 max-h-[42vh] overflow-y-auto space-y-4 pr-1">
              {items.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-2">
                  <p className="text-body-sm font-medium">Your shopping bag is empty.</p>
                  <Link
                    to="/"
                    onClick={closeMiniCart}
                    className="text-xs text-accent hover:underline font-semibold"
                  >
                    Discover Objects
                  </Link>
                </div>
              ) : (
                items.map(({ id, product, quantity, selectedColor, stockWarning }) => (
                  <div
                    key={id}
                    className={`flex items-center gap-3.5 pb-4 border-b border-neutral-200/70 ${stockWarning ? 'opacity-50' : ''}`}
                  >
                    <Link
                      to={`/product/${product.id}`}
                      onClick={closeMiniCart}
                      className="w-16 h-20 bg-neutral-200 shrink-0 aspect-[4/5] overflow-hidden"
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        to={`/product/${product.id}`}
                        onClick={closeMiniCart}
                        className="text-body-sm font-medium text-neutral-900 hover:text-accent truncate block"
                      >
                        {product.name}
                      </Link>
                      {stockWarning ? (
                        <p className="text-[10px] text-amber-700 font-semibold">⚠ Out of stock</p>
                      ) : (
                        <p className="text-metadata text-neutral-500 uppercase tracking-editorial">
                          Qty: {quantity} &bull; ₹{product.selling_price.toLocaleString()}
                        </p>
                      )}
                      <p className="text-body-sm font-semibold text-neutral-900">
                        ₹{(product.selling_price * quantity).toLocaleString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(product.id, selectedColor)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-800 transition-colors"
                      aria-label={`Remove ${product.name} from bag`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="pt-6 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between text-body font-semibold text-neutral-900">
              <span className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial">
                Subtotal
              </span>
              <span className="text-h3 font-sans">₹{subtotal.toLocaleString()} INR</span>
            </div>

            <p className="text-[11px] text-neutral-500">
              Shipping &amp; taxes calculated at checkout.
            </p>

            <div className="space-y-2 pt-1">
              <Button
                variant="accent"
                size="lg"
                isFullWidth
                disabled={items.length === 0}
                onClick={() => { closeMiniCart(); navigate('/cart'); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="secondary"
                size="md"
                isFullWidth
                onClick={() => { closeMiniCart(); navigate('/cart'); }}
              >
                View Full Bag ({itemCount})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiniCartDrawer;
