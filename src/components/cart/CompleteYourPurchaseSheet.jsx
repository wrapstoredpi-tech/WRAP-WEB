import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Check, X, Plus, ArrowRight } from 'lucide-react';
import { usePurchaseSheet } from '../../context/PurchaseSheetContext';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';
import { groupProductsByDesign, isComboEligible, getComboImage } from '../../lib/models';

/**
 * CompleteYourPurchaseSheet
 *
 * Appears immediately after tapping "Add to bag".
 * Rules (PART F):
 * - Short toast "Added to bag".
 * - If no add-on qualifies, show ONLY the toast with "View bag" link.
 * - If add-ons qualify:
 *   - Mobile (< 1024px): bottom sheet (max 85dvh, drag handle).
 *   - Desktop (>= 1024px): 420px right panel with dimmed backdrop.
 *   - Title: "Complete your purchase"
 *   - Top: added item (photo, name, model, price).
 *   - Up to 4 add-ons with "+ Add" (priority: screen protection for chosen model,
 *     universal accessories, combos with this product; quick-add rules apply).
 *   - Full-width "Go to bag" button (accent #B0521F) and "Continue shopping" link.
 */
export function CompleteYourPurchaseSheet() {
  const navigate = useNavigate();
  const {
    isOpen: contextIsOpen,
    addedItem: contextAddedItem,
    toast: contextToast,
    closeSheet,
    hideToast,
  } = usePurchaseSheet();
  const { cartItems, addItem } = useCart();
  const { products } = useProductsContext();
  const { savedPhone } = usePhoneContext();

  const isTestOpen = Boolean(typeof window !== 'undefined' && window.__TEST_PURCHASE_SHEET_OPEN__);
  const testItem = (typeof window !== 'undefined' && window.__TEST_PURCHASE_SHEET_ITEM__) || null;
  const testToast = typeof window !== 'undefined' && window.__TEST_TOAST__ ? window.__TEST_TOAST__ : null;

  const addedItem = contextAddedItem || testItem || null;
  const rawIsOpen = contextIsOpen || isTestOpen;
  const toast = contextToast || testToast || null;

  const [addedMap, setAddedMap] = useState({});
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);

  const sheetRef = useRef(null);

  // Auto-hide toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  // Active target model for recommendations
  const activeModel =
    addedItem?.selectedModel ||
    (addedItem?.product?.compatible_models?.length === 1 ? addedItem.product.compatible_models[0] : null) ||
    savedPhone?.model ||
    null;

  // Compute qualifying add-ons
  const recommendations = useMemo(() => {
    if (!products || !addedItem?.product) return [];

    const currentId = String(addedItem.product.id);
    const inCartIds = new Set(
      (cartItems || []).map((item) => String(item.productId || item.id || item.product_id))
    );

    const NON_PHONE_SUBCATS = [
      'watch strap',
      'watch cases',
      'ipad case',
      'ipad temper',
      'airpods cases',
    ];

    const candidates = products.filter((p) => {
      // 1. Not the item just added
      if (String(p.id) === currentId) return false;

      // 2. Not already in cart
      if (inCartIds.has(String(p.id))) return false;

      // 3. Must be in stock
      const isOutOfStock =
        p.stock_status === 'OUT_OF_STOCK' ||
        (p.available_stock !== undefined && p.available_stock === 0) ||
        (p.current_stock !== undefined && p.current_stock === 0);
      if (isOutOfStock) return false;

      // 4. Must be active and visible
      if (p.is_active === false || p.online_visible === false) return false;

      const sub = (p.subcategory || '').toLowerCase();
      // Rule 9: Phone add-ons exclude non-phone subcategories
      if (NON_PHONE_SUBCATS.includes(sub)) return false;

      const isCombo = Boolean(p.is_combo || p.product_type === 'combo');
      if (isCombo && !isComboEligible(p)) return false;

      // 5. Must be an accessory or combo
      const categoryLower = (p.category || '').toLowerCase();
      const isAccessory =
        categoryLower.includes('accessor') ||
        (Array.isArray(p.categories) && p.categories.some((c) => (c || '').toLowerCase().includes('accessor'))) ||
        sub.includes('protector') ||
        sub.includes('glass') ||
        sub.includes('lens') ||
        sub.includes('cable') ||
        sub.includes('charger') ||
        sub.includes('power bank');

      if (!isAccessory && !isCombo) return false;

      // 6. Compatibility
      const compModels = Array.isArray(p.compatible_models) ? p.compatible_models : [];
      const isUniversal =
        compModels.length === 0 || compModels.includes('Universal') || p.is_universal === true;

      if (isUniversal) return true;
      if (activeModel) return compModels.includes(activeModel);

      // If no active model, allow item so user can choose model
      return true;
    });

    // Rule 10: Group colour siblings (one entry per design)
    const grouped = groupProductsByDesign(candidates);

    // Priority sorting (same priority as Complete your setup):
    // 1. Screen protection for this model
    // 2. Universal accessories
    // 3. Combos containing this product (or fitting this model)
    // 4. Other accessories fitting this model
    // 5. Other accessories
    grouped.sort((a, b) => {
      const getPriority = (p) => {
        const sub = (p.subcategory || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const comp = Array.isArray(p.compatible_models) ? p.compatible_models : [];
        const isScreenProt =
          sub.includes('protector') ||
          sub.includes('glass') ||
          cat.includes('glass') ||
          cat.includes('protector');
        const isUni = comp.length === 0 || comp.includes('Universal') || p.is_universal === true;
        const isCombo = Boolean(p.is_combo || p.product_type === 'combo');

        if (isScreenProt && activeModel && comp.includes(activeModel)) return 1;
        if (isUni) return 2;
        if (isCombo) return 3;
        if (activeModel && comp.includes(activeModel)) return 4;
        return 5;
      };

      const scoreA = getPriority(a);
      const scoreB = getPriority(b);
      if (scoreA !== scoreB) return scoreA - scoreB;

      return (Number(a.selling_price) || 0) - (Number(b.selling_price) || 0);
    });

    return grouped.slice(0, 4);
  }, [products, addedItem, cartItems, activeModel]);

  const hasQualifyingAddons = recommendations.length > 0;

  // Rule: If no add-on qualifies, do NOT open the sheet. Show ONLY the toast with "View bag".
  const shouldShowSheet = rawIsOpen && (hasQualifyingAddons || isTestOpen);

  // Close on Escape key
  useEffect(() => {
    if (!shouldShowSheet) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeSheet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldShowSheet, closeSheet]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (shouldShowSheet) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [shouldShowSheet]);

  const handleQuickAdd = (p) => {
    const compModels = Array.isArray(p.compatible_models) ? p.compatible_models : [];
    const isUniversal =
      compModels.length === 0 || compModels.includes('Universal') || p.is_universal === true;
    const isCombo = Boolean(p.is_combo || p.product_type === 'combo');
    const isOrderable = p.combosOrderable !== false && p.orderable !== false;

    if (isCombo && !isOrderable) {
      closeSheet();
      navigate(`/product/${p.id}`);
      return;
    }

    if (isUniversal) {
      addItem(p, 1, 'Universal', null);
      setAddedMap((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [p.id]: false })), 2000);
      return;
    }

    if (activeModel && compModels.includes(activeModel)) {
      addItem(p, 1, activeModel, null);
      setAddedMap((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [p.id]: false })), 2000);
      return;
    }

    // Otherwise navigate to choose model
    closeSheet();
    navigate(`/product/${p.id}`);
  };

  // Touch gesture handlers for mobile bottom sheet
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragOffsetY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 80) {
      closeSheet();
    }
    setTouchStartY(null);
    setDragOffsetY(0);
  };

  const product = addedItem?.product;
  const quantity = addedItem?.quantity || 1;
  const selectedModel = addedItem?.selectedModel;
  const selectedColor = addedItem?.selectedColor;

  const itemThumb =
    product?.image_url ||
    (Array.isArray(product?.images) && product.images[0]) ||
    '/subcategories/iphone.jpg';

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────────────────
          1. SHORT TOAST "Added to bag"
          - If no add-ons qualify, shows "View bag" link.
          ─────────────────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] bg-white border border-[#E5E5E3] text-[#141414] px-4 py-2.5 rounded-[6px] shadow-lg flex items-center gap-3 animate-fadeIn text-[13px] font-medium pointer-events-auto select-none"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#141414] stroke-[2.5] shrink-0" />
            <span>{toast.message || 'Added to bag'}</span>
          </div>

          {(toast.showViewBag || !hasQualifyingAddons) && (
            <button
              type="button"
              onClick={() => {
                hideToast();
                closeSheet();
                navigate('/cart');
              }}
              className="ml-2 pl-3 border-l border-[#E5E5E3] text-[#B0521F] hover:underline font-semibold transition-colors cursor-pointer"
            >
              View bag
            </button>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          2. COMPLETE YOUR PURCHASE PANEL / BOTTOM SHEET
          - Only shown when shouldShowSheet && product exists.
          ─────────────────────────────────────────────────────────────────────────── */}
      {shouldShowSheet && product && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Complete your purchase"
          className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end select-none animate-fadeIn"
        >
          {/* Dimmed Backdrop */}
          <div
            onClick={closeSheet}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity cursor-pointer"
            aria-hidden="true"
          />

          {/* Sheet / Drawer Container */}
          <div
            ref={sheetRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
              transition: dragOffsetY === 0 ? 'transform 0.2s ease-out' : 'none',
            }}
            className="relative z-50 w-full lg:w-[420px] max-h-[85dvh] lg:max-h-full h-auto lg:h-full bg-[#FAFAF9] rounded-t-[12px] lg:rounded-none border-t lg:border-t-0 lg:border-l border-[#E5E5E3] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Mobile Drag Handle */}
            <div className="block lg:hidden pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[#D4D4D0] mx-auto" />
            </div>

            {/* Header: Title "Complete your purchase" */}
            <div className="px-5 py-4 border-b border-[#E5E5E3] flex items-center justify-between shrink-0 bg-white">
              <h2 className="text-[16px] font-semibold text-[#141414] tracking-tight">
                Complete your purchase
              </h2>

              <button
                type="button"
                onClick={closeSheet}
                className="w-8 h-8 rounded-[6px] hover:bg-[#F4F3F0] flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Body: Added item at top + Up to 4 add-ons */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
              {/* Added Item Card at Top */}
              <div className="border border-[#E5E5E3] rounded-[6px] bg-white p-3 flex items-center gap-3.5 shadow-2xs">
                <div className="w-14 h-14 rounded-[6px] bg-[#F4F3F0] border border-[#E5E5E3] overflow-hidden shrink-0">
                  <img
                    src={itemThumb}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#141414] truncate leading-snug">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B] truncate pt-0.5">
                    {selectedModel && <span>Model: {selectedModel}</span>}
                    {selectedColor && (
                      <>
                        <span>·</span>
                        <span>{selectedColor}</span>
                      </>
                    )}
                    {quantity > 1 && (
                      <>
                        <span>·</span>
                        <span>Qty: {quantity}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[13px] font-bold text-[#141414] tabular-nums pt-1">
                    {formatINR(product.selling_price)}
                  </p>
                </div>
              </div>

              {/* Up to 4 Add-ons */}
              {recommendations.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-[#141414] tracking-tight">
                      Recommended add-ons
                    </h3>
                    {activeModel && (
                      <span className="text-[11px] text-[#6B6B6B]">
                        Fits {activeModel}
                      </span>
                    )}
                  </div>

                  <div className="border border-[#E5E5E3] rounded-[6px] bg-white divide-y divide-[#E5E5E3] overflow-hidden">
                    {recommendations.map((rec) => {
                      const compModels = Array.isArray(rec.compatible_models) ? rec.compatible_models : [];
                      const isUniversal =
                        compModels.length === 0 || compModels.includes('Universal') || rec.is_universal === true;
                      const isCombo = Boolean(rec.is_combo || rec.product_type === 'combo');
                      const isOrderable = rec.combosOrderable !== false && rec.orderable !== false;

                      let buttonText = 'Add';
                      let isDirectAdd = true;

                      if (isCombo && !isOrderable) {
                        buttonText = 'View';
                        isDirectAdd = false;
                      } else if (!isUniversal && (!activeModel || !compModels.includes(activeModel))) {
                        buttonText = 'Choose model';
                        isDirectAdd = false;
                      }

                      const isAdded = Boolean(addedMap[rec.id]);
                      const recThumb = isCombo
                        ? getComboImage(rec)
                        : rec.image_url ||
                          (Array.isArray(rec.images) && rec.images[0]) ||
                          '/subcategories/iphone.jpg';

                      return (
                        <div
                          key={rec.id}
                          className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#FAFAF9] transition-colors"
                        >
                          <div
                            onClick={() => {
                              if (!isDirectAdd) {
                                closeSheet();
                                navigate(`/product/${rec.id}`);
                              }
                            }}
                            className={`flex items-center gap-2.5 min-w-0 flex-1 ${!isDirectAdd ? 'cursor-pointer' : ''}`}
                          >
                            <div className="w-11 h-11 rounded-[6px] bg-[#F4F3F0] border border-[#E5E5E3] overflow-hidden shrink-0">
                              <img
                                src={recThumb}
                                alt={rec.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-[#141414] truncate leading-tight">
                                {rec.name}
                              </p>
                              <span className="text-[12px] font-semibold text-[#141414] tabular-nums">
                                {formatINR(rec.selling_price)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(rec)}
                            className={`min-h-[32px] px-3 py-1 text-[11px] font-semibold rounded-[6px] shrink-0 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isAdded
                                ? 'bg-[#16A34A] text-white border border-[#16A34A]'
                                : isDirectAdd
                                ? 'border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white active:scale-95'
                                : 'border border-[#E5E5E3] bg-[#F4F3F0] text-[#141414] hover:border-[#141414]'
                            }`}
                            aria-label={`${buttonText} ${rec.name}`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                {isDirectAdd ? <Plus className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                                <span>{buttonText}</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Full-width "Go to bag" button + "Continue shopping" link */}
            <div className="p-5 border-t border-[#E5E5E3] bg-white space-y-2.5 shrink-0 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  closeSheet();
                  navigate('/cart');
                }}
                className="w-full h-[48px] bg-[#B0521F] hover:bg-[#964317] text-white font-semibold text-[14px] sm:text-[15px] rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <span>Go to bag</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={closeSheet}
                className="w-full py-1 text-[13px] font-medium text-[#6B6B6B] hover:text-[#141414] transition-colors cursor-pointer text-center"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CompleteYourPurchaseSheet;
