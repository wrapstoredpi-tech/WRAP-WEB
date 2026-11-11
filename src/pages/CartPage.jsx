import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePhoneContext } from '../context/PhoneContext';
import { ComboThumbnail } from '../components/cart/ComboThumbnail';
import { ComboIncludedItems } from '../components/cart/ComboIncludedItems';
import { ProductScrollRow } from '../components/home/ProductScrollRow';
import { formatINR } from '../lib/currency';
import { policies } from '../config/policies';
import { setPageMeta } from '../lib/seo';

/**
 * CartPage (Shopping bag - PART G)
 *
 * Rules:
 * - Reduced header on this page and checkout: logo and account only (no nav, no search).
 * - Centred title "Shopping bag" (display serif).
 * - Desktop: two columns split by a 1px vertical line; items left, summary right and sticky.
 * - Mobile: one column with a sticky Checkout bar.
 * - Item: 96px photo on #F4F3F0, name, "Model: <model>", colour, price with MRP, a stepper
 *   (trash icon at quantity 1), "Move to favourites" text link (guests sign in through the
 *   existing pendingAction flow without losing the bag). Combo lines keep their included-items list.
 * - Summary: item count, subtotal, "You save Rs X" (total MRP minus total price, only when positive),
 *   shipping as configured, total "Inclusive of taxes", the delivery lines from policies config,
 *   and the Checkout button (accent #B0521F, full width).
 * - Below: "You may also like", a full-width row of compatible products with outlined "Add to bag"
 *   buttons (quick-add rules apply).
 * - Empty bag: "Your bag is empty" (display serif), "Find your model" and "Continue shopping".
 */
export function CartPage() {
  const { itemCount, updateQuantity, removeItem } = useCart();
  const { products } = useProductsContext();
  const { toggleFavorite } = useFavorites();
  const { savedPhone } = usePhoneContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    setPageMeta({
      title: 'Shopping bag | WrapStore',
      description: 'Review items in your WrapStore shopping bag.',
    });
  }, []);

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

  // Target model from items or saved phone
  const cartPhoneModel = useMemo(() => {
    const itemWithModel = items.find((i) => i.selected_model && i.selected_model !== 'Universal');
    return itemWithModel?.selected_model || savedPhone?.model || null;
  }, [items, savedPhone]);

  // Total MRP for "You save Rs X" calculation
  const totalMRP = useMemo(() => {
    return items.reduce((sum, item) => {
      const p = item.product || {};
      const lineMrp = p.mrp || p.raw_mrp || p.original_value || p.selling_price || 0;
      return sum + lineMrp * (item.quantity || 1);
    }, 0);
  }, [items]);

  const totalSavings = totalMRP - subtotal;

  // "You may also like" candidates from products
  const crossSellProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const inCartIds = new Set(
      items.map((i) => String(i.productId || i.id || i.product_id))
    );

    const candidates = products.filter((p) => {
      // Exclude items already in cart
      if (inCartIds.has(String(p.id))) return false;

      // In stock only
      const isOutOfStock =
        p.stock_status === 'OUT_OF_STOCK' ||
        (p.available_stock !== undefined && p.available_stock === 0) ||
        (p.current_stock !== undefined && p.current_stock === 0);
      if (isOutOfStock) return false;

      // Must be active and visible
      if (p.is_active === false || p.online_visible === false) return false;

      return true;
    });

    // Prioritize accessories matching the cart phone model
    candidates.sort((a, b) => {
      const aMatchesModel =
        cartPhoneModel &&
        Array.isArray(a.compatible_models) &&
        a.compatible_models.includes(cartPhoneModel);
      const bMatchesModel =
        cartPhoneModel &&
        Array.isArray(b.compatible_models) &&
        b.compatible_models.includes(cartPhoneModel);

      if (aMatchesModel && !bMatchesModel) return -1;
      if (!aMatchesModel && bMatchesModel) return 1;

      // Accessories first, then combos, then cases
      const aIsAcc = (a.category || '').toLowerCase().includes('accessor');
      const bIsAcc = (b.category || '').toLowerCase().includes('accessor');
      if (aIsAcc && !bIsAcc) return -1;
      if (!aIsAcc && bIsAcc) return 1;

      return (Number(b.selling_price) || 0) - (Number(a.selling_price) || 0);
    });

    return candidates.slice(0, 10);
  }, [products, items, cartPhoneModel]);

  // Handle Move to Favourites: Adds to favorites via pendingAction flow (preserving bag) and removes from cart
  const handleMoveToFavourites = (line) => {
    const prodId = line.productId || line.product?.id;
    if (prodId) {
      toggleFavorite(prodId, { returnUrl: '/cart' });
      removeItem(line.id);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPTY BAG VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-12 sm:py-20 text-center space-y-12">
        <div className="max-w-md mx-auto space-y-4 bg-white border border-[#E5E5E3] rounded-[6px] p-8 sm:p-10 shadow-2xs">
          <div className="w-14 h-14 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center mx-auto text-[#6B6B6B]">
            <ShoppingBag className="w-6 h-6 text-[#141414]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-serif text-[28px] sm:text-[32px] text-[#141414] tracking-tight">
              Your bag is empty
            </h1>
            <p className="text-[14px] text-[#6B6B6B] max-w-xs mx-auto">
              Explore phone cases, tempered glass, and daily essentials crafted for your phone.
            </p>
          </div>

          {/* Action buttons: "Find your model" and "Continue shopping" */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cases"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#B0521F] hover:bg-[#964317] text-white text-[14px] font-semibold rounded-[6px] transition-colors shadow-sm"
            >
              Find your model
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white text-[14px] font-semibold rounded-[6px] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        {/* Below: "You may also like" row */}
        {crossSellProducts.length > 0 && (
          <div className="pt-6 text-left border-t border-[#E5E5E3]">
            <ProductScrollRow
              title="You may also like"
              subtitle="Compatible additions and popular daily essentials."
              products={crossSellProducts}
              viewAllLink="/cases"
              viewAllText="View cases"
              outlinedButton={true}
            />
          </div>
        )}
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POPULATED BAG VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8 sm:py-12 space-y-10 pb-32 lg:pb-16 select-none">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. CENTRED TITLE (Display Serif)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <h1 className="font-serif text-[32px] sm:text-[38px] text-[#141414] tracking-tight">
          Shopping bag
        </h1>
        <p className="text-[13px] text-[#6B6B6B]">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag
        </p>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. TWO-COLUMN LAYOUT (Desktop: split by 1px vertical line)
          - Left: Items list
          - Middle: 1px vertical line (Desktop)
          - Right: Order summary (Sticky)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[1fr_1px_380px] xl:grid-cols-[1fr_1px_420px] gap-8 lg:gap-10 items-start">
        
        {/* LEFT COLUMN: Items List */}
        <div className="w-full space-y-4">
          {/* Stock Warnings Banner */}
          {hasStockWarnings && (
            <div className="p-3.5 bg-[#F9EDE7] border border-[#B0521F] rounded-[6px] text-[#141414] flex items-start gap-3">
              <AlertTriangle className="w-4.5 h-4.5 text-[#B0521F] shrink-0 mt-0.5" />
              <div className="text-[13px] space-y-0.5">
                <strong className="block font-semibold text-[#B0521F]">
                  Stock Alert
                </strong>
                <p className="text-[#141414]">
                  One or more items in your bag exceed available inventory. Please adjust quantities to proceed.
                </p>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="bg-white border border-[#E5E5E3] rounded-[6px] divide-y divide-[#E5E5E3] overflow-hidden">
            {items.map((line) => {
              if (line.isUnavailable) {
                return (
                  <div key={line.id || line.productId} className="p-4 sm:p-5 bg-[#FAFAF9]">
                    <div className="flex gap-4 items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[15px] font-semibold text-[#141414]">
                          {line.product.name}
                        </p>
                        <p className="text-[12px] text-[#B0521F]">
                          {line.unavailableMessage || 'This item is no longer available'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.id)}
                        className="px-3 py-1.5 text-[12px] font-semibold text-[#B0521F] border border-[#B0521F] rounded-[6px] hover:bg-[#B0521F] hover:text-white transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }

              const maxStock = line.availableStock ?? 99;
              const isQtyOne = line.quantity <= 1;
              const sellingPrice = Number(line.product.selling_price) || 0;
              const mrp =
                Number(line.product.mrp || line.product.raw_mrp || line.product.original_value) ||
                0;
              const hasDiscount = mrp > sellingPrice;
              const discountPercent = hasDiscount
                ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                : 0;

              return (
                <div key={line.id || line.productId} className="p-4 sm:p-5 space-y-3">
                  <div className="flex gap-4 items-start">
                    {/* 96px Photo on #F4F3F0 */}
                    {line.is_combo ? (
                      <div className="w-[96px] h-[96px] min-w-[96px] min-h-[96px] bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                        <ComboThumbnail
                          combo={line.product}
                          components={line.components}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-[96px] h-[96px] min-w-[96px] min-h-[96px] bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={
                            line.product.image_url ||
                            (line.product.images && line.product.images[0]) ||
                            '/subcategories/iphone.jpg'
                          }
                          alt={line.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div className="space-y-1">
                        {/* Name & Total Line Price */}
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={`/product/${line.product.id}`}
                            className="text-[15px] sm:text-[16px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors truncate block"
                          >
                            {line.product.name}
                          </Link>

                          {/* Line Price with MRP */}
                          <div className="text-right shrink-0">
                            <div className="flex items-baseline gap-1.5 justify-end">
                              <span className="text-[15px] sm:text-[16px] font-bold text-[#141414] tabular-nums">
                                {formatINR(sellingPrice * line.quantity)}
                              </span>
                            </div>
                            {hasDiscount && (
                              <div className="flex items-center gap-1.5 justify-end text-[12px]">
                                <span className="text-[#6B6B6B] line-through tabular-nums">
                                  {formatINR(mrp * line.quantity)}
                                </span>
                                <span className="font-semibold text-[#B0521F]">
                                  {discountPercent}% off
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Model & Colour lines */}
                        <div className="space-y-0.5 text-[12px] sm:text-[13px] text-[#6B6B6B]">
                          <p>
                            Model: <span className="font-medium text-[#141414]">{line.selected_model || 'Universal'}</span>
                          </p>
                          {!line.is_combo && line.selected_color && (
                            <p>
                              Colour: <span className="font-medium text-[#141414]">{line.selected_color}</span>
                            </p>
                          )}
                          <p className="text-[11px] text-[#737373]">
                            {formatINR(sellingPrice)} each
                          </p>
                        </div>
                      </div>

                      {/* Stepper with Trash icon at Qty 1 & "Move to favourites" text link */}
                      <div className="flex items-center justify-between pt-3 gap-3 flex-wrap">
                        {/* Stepper */}
                        <div className="inline-flex items-center border border-[#E5E5E3] rounded-[6px] bg-[#FAFAF9] min-h-[36px] select-none">
                          <button
                            type="button"
                            onClick={() => {
                              if (isQtyOne) {
                                removeItem(line.id);
                              } else {
                                updateQuantity(line.id, line.quantity - 1, maxStock);
                              }
                            }}
                            className="w-9 h-[36px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] transition-colors cursor-pointer"
                            aria-label={isQtyOne ? 'Remove item' : 'Decrease quantity'}
                            title={isQtyOne ? 'Remove item' : 'Decrease quantity'}
                          >
                            {isQtyOne ? (
                              <Trash2 className="w-3.5 h-3.5 text-[#B0521F]" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="w-8 text-center text-[13px] font-semibold text-[#141414] tabular-nums">
                            {line.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={line.quantity >= maxStock}
                            onClick={() => updateQuantity(line.id, line.quantity + 1, maxStock)}
                            className="w-9 h-[36px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* "Move to favourites" text link */}
                        <button
                          type="button"
                          onClick={() => handleMoveToFavourites(line)}
                          className="text-[12px] text-[#6B6B6B] hover:text-[#B0521F] underline transition-colors cursor-pointer"
                        >
                          Move to favourites
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Combo Included Items breakdown */}
                  {line.is_combo && Array.isArray(line.components) && line.components.length > 0 && (
                    <div className="pt-2">
                      <ComboIncludedItems
                        components={line.components}
                        comboQuantity={line.quantity}
                        selectedModel={line.selected_model}
                        comboName={line.product.name}
                      />
                    </div>
                  )}

                  {/* Line Stock Warning */}
                  {line.stockWarning && (
                    <div className="p-2 bg-[#F9EDE7] border border-[#B0521F] rounded-[6px] text-[12px] text-[#B0521F] flex items-center gap-2">
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
        </div>

        {/* MIDDLE: 1px Vertical Divider (Desktop only) */}
        <div className="hidden lg:block w-px bg-[#E5E5E3] self-stretch min-h-[440px]" aria-hidden="true" />

        {/* RIGHT COLUMN: Order Summary Card (Desktop: Sticky) */}
        <div className="w-full lg:sticky lg:top-[96px] self-start space-y-4 mt-6 lg:mt-0">
          <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-5 sm:p-6 space-y-5 shadow-2xs">
            <h2 className="text-[18px] font-semibold text-[#141414] pb-3 border-b border-[#E5E5E3]">
              Order summary
            </h2>

            <div className="space-y-3 text-[14px]">
              {/* Item count & Subtotal */}
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="text-[#141414] font-semibold tabular-nums">
                  {formatINR(subtotal)}
                </span>
              </div>

              {/* You save Rs X (total MRP minus total price, only when positive) */}
              {totalSavings > 0 && (
                <div className="flex justify-between items-center text-[#B0521F] font-medium">
                  <span>You save</span>
                  <span className="font-semibold tabular-nums">
                    {formatINR(totalSavings)}
                  </span>
                </div>
              )}

              {/* Shipping per audit rule 3 */}
              <div className="flex justify-between items-start text-[#6B6B6B]">
                <div>
                  <span className="block text-[#141414] font-medium">Shipping</span>
                  <span className="text-[11px] text-[#6B6B6B] block">
                    ₹55 in Tamil Nadu &amp; Puducherry · ₹85 in South India · ₹100 rest of India
                  </span>
                </div>
                <span className="text-[#6B6B6B] text-[13px] font-medium shrink-0">
                  Calculated at checkout
                </span>
              </div>

              {/* Total "Inclusive of taxes" */}
              <div className="pt-3 border-t border-[#E5E5E3] space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[16px] font-semibold text-[#141414]">Total (before shipping)</span>
                  <span className="text-[20px] font-bold text-[#B0521F] tabular-nums">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B6B6B]">Inclusive of all applicable taxes</p>
              </div>

              {/* Delivery lines from policies config */}
              <div className="pt-4 border-t border-[#E5E5E3] space-y-1.5 text-[12px] text-[#6B6B6B]">
                <p className="font-semibold text-[#141414]">Delivery estimates</p>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#141414] shrink-0" />
                    <span>{policies.delivery.tn.label}: {policies.delivery.tn.text}</span>
                  </p>
                  <p className="pl-5">
                    <span>{policies.delivery.other.label}: {policies.delivery.other.text}</span>
                  </p>
                  <p className="text-[11px] text-[#737373] pl-5 italic">
                    Counted from {policies.delivery.countedFrom}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Checkout button (accent, full width) */}
            <div className="pt-2 hidden lg:block">
              <button
                type="button"
                disabled={hasStockWarnings || items.length === 0}
                onClick={handleProceedToCheckout}
                className="w-full h-[48px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white text-[15px] font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 border-t border-[#E5E5E3] space-y-2 text-[12px] text-[#6B6B6B]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#141414] shrink-0" />
                <span>100% Prepaid via Razorpay</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#141414] shrink-0" />
                <span>Replacements for damaged items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. "YOU MAY ALSO LIKE" (Full width below items, outlined Add to bag buttons)
          ─────────────────────────────────────────────────────────────────────────── */}
      {crossSellProducts.length > 0 && (
        <div className="pt-10 border-t border-[#E5E5E3]">
          <ProductScrollRow
            title="You may also like"
            subtitle="Compatible additions and popular daily essentials."
            products={crossSellProducts}
            viewAllLink="/cases"
            viewAllText="View cases"
            outlinedButton={true}
          />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          4. MOBILE STICKY CHECKOUT BAR (< 1024px)
          Fixed at bottom of screen respecting safe area
          ─────────────────────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Checkout action bar"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E5E3] p-4 pb-[calc(16px+env(safe-area-inset-bottom))] lg:hidden shadow-lg select-none"
      >
        <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-[#6B6B6B] block">
              Total (before shipping)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-bold text-[#141414] tabular-nums">
                {formatINR(subtotal)}
              </span>
              <span className="text-[10px] text-[#6B6B6B]">incl. taxes</span>
            </div>
          </div>

          <button
            type="button"
            disabled={hasStockWarnings || items.length === 0}
            onClick={handleProceedToCheckout}
            className="h-[48px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white font-semibold text-[14px] rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </main>
  );
}

export default CartPage;
