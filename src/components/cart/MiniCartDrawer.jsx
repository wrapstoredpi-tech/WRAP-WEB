import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useCart, useHydratedCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { Button } from '../ui/Button';

export function MiniCartDrawer() {
  const { itemCount, isMiniCartOpen, closeMiniCart, removeItem, updateQuantity } = useCart();
  const { products } = useProductsContext();
  const navigate = useNavigate();

  const { items, subtotal } = useHydratedCart(products);

  // Check if any line has stock issues (exceeds available_stock or out of stock)
  const hasStockIssues = items.some((item) => {
    const avail = item.product.available_stock || 0;
    return item.stockWarning || item.quantity > avail || item.product.stock_status === 'OUT_OF_STOCK';
  });

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
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeMiniCart}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-12">
        <div className="w-screen max-w-md bg-base-offwhite border-l border-neutral-300 shadow-2xl flex flex-col justify-between animate-drawer-in p-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-neutral-900" />
                <h2 className="text-body font-semibold text-neutral-900 uppercase tracking-wide">
                  Your Bag ({itemCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeMiniCart}
                className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amber warning note if stock issue exists */}
            {hasStockIssues && (
              <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Stock limit warning</p>
                  <p className="text-amber-800">
                    One or more items in your bag exceed available stock or are out of stock. Please adjust quantities before checkout.
                  </p>
                </div>
              </div>
            )}

            {/* Cart Item Lines */}
            <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-4 pr-1">
              {items.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-3">
                  <p className="text-body-sm">Your shopping bag is empty.</p>
                  <Link
                    to="/"
                    onClick={closeMiniCart}
                    className="inline-block text-xs font-semibold text-accent hover:underline"
                  >
                    Explore Designs &rarr;
                  </Link>
                </div>
              ) : (
                items.map(({ id, productId, product, quantity, selectedColor, stockWarning }) => {
                  const maxStock = product.available_stock || 0;
                  const isItemOverStock = quantity > maxStock || stockWarning || product.stock_status === 'OUT_OF_STOCK';

                  return (
                    <div
                      key={id}
                      className={`p-3 rounded-xl border flex gap-3 transition-all ${
                        isItemOverStock
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-20 object-cover rounded-lg bg-neutral-100 shrink-0"
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="text-body-sm font-semibold text-neutral-900 truncate">
                            {product.name}
                          </h3>
                          {selectedColor && (
                            <p className="text-xs text-neutral-500">
                              Colour: <span className="font-medium text-neutral-800">{selectedColor}</span>
                            </p>
                          )}
                          {isItemOverStock && (
                            <p className="text-[11px] font-semibold text-amber-800">
                              Max available: {maxStock} unit(s)
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Stepper */}
                          <div className="inline-flex items-center border border-neutral-300 rounded-lg bg-white h-8 px-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(productId, quantity - 1, selectedColor, maxStock)}
                              className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-900"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-semibold font-mono">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= maxStock}
                              onClick={() => updateQuantity(productId, quantity + 1, selectedColor, maxStock)}
                              className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-body-sm font-semibold text-neutral-900">
                              ₹{(product.selling_price * quantity).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(productId, selectedColor)}
                              className="text-neutral-400 hover:text-neutral-900 p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Subtotal & Checkout Button */}
          <div className="pt-4 border-t border-neutral-200 space-y-3 bg-base-offwhite">
            <div className="flex items-center justify-between text-body font-semibold text-neutral-900">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            <Button
              variant="accent"
              size="lg"
              isFullWidth
              disabled={items.length === 0 || hasStockIssues}
              onClick={() => {
                closeMiniCart();
                navigate('/checkout');
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {hasStockIssues ? 'Fix Stock Issues to Checkout' : 'Proceed to Checkout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiniCartDrawer;
