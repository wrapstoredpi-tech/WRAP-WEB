import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, ArrowRight } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';
import { groupProductsByDesign, isComboEligible, getComboImage } from '../../lib/models';
import { combosOrderable } from '../../config/store';

/**
 * CompleteYourSetup Component
 *
 * Displays up to 4 compact rows under price/details of compatible accessories or combos from `products`
 * that fit the chosen model.
 *
 * Quick-add rules (Amendment 2):
 * - Universal products (no model list): add directly.
 * - Model-specific products: add directly only when the model is known (the product page's
 *   chosen model, or the saved phone) AND the product fits it; save it as selected_model.
 *   Otherwise the button reads "Choose model" and opens the product page.
 * - Combos: if combosOrderable is false, the button reads "View" and opens the combo page.
 *   If true, apply the same model rule as above.
 * - Never show an item already in the bag. Respect stock: hide out-of-stock items.
 * - Data source: read ONLY from `products` (accessory categories / combos). Never read accessory_variants.
 */
export function CompleteYourSetup({ currentProduct, selectedModel }) {
  const navigate = useNavigate();
  const { products } = useProductsContext();
  const { cartItems, addItem } = useCart();
  const { savedPhone } = usePhoneContext();

  const [addedMap, setAddedMap] = useState({});

  // Determine active target model
  const effectiveModel = selectedModel || savedPhone?.model || null;

  // Filter compatible add-ons (Rule 9: exclude non-phone, Rule 10: group by design)
  const addOns = useMemo(() => {
    if (!products || !currentProduct) return [];

    const inCartIds = new Set(
      (cartItems || []).map((item) => String(item.productId || item.id))
    );

    // Rule: Never suggest a product that is already a component of the combo being viewed
    const comboComponentIds = new Set();
    const isCurrentCombo = Boolean(
      currentProduct.is_combo || currentProduct.product_type === 'combo'
    );
    if (isCurrentCombo) {
      (currentProduct.combo_items || currentProduct.items || []).forEach((c) => {
        if (c.product_id) comboComponentIds.add(String(c.product_id).toLowerCase());
        if (c.id) comboComponentIds.add(String(c.id).toLowerCase());
        if (c.product_code) comboComponentIds.add(String(c.product_code).toLowerCase());
      });
    }

    const NON_PHONE_SUBCATS = [
      'watch strap',
      'watch cases',
      'ipad case',
      'ipad temper',
      'airpods cases',
    ];

    const candidates = products.filter((p) => {
      // 1. Not the current product
      if (String(p.id) === String(currentProduct.id)) return false;

      // 2. Not already in bag
      if (inCartIds.has(String(p.id))) return false;

      // 3. Never suggest a component of the combo being viewed
      if (
        comboComponentIds.has(String(p.id).toLowerCase()) ||
        (p.product_id && comboComponentIds.has(String(p.product_id).toLowerCase()))
      ) {
        return false;
      }

      // 4. Must be in stock
      const isOutOfStock =
        p.stock_status === 'OUT_OF_STOCK' ||
        (p.available_stock !== undefined && p.available_stock === 0) ||
        (p.current_stock !== undefined && p.current_stock === 0);
      if (isOutOfStock) return false;

      const sub = (p.subcategory || '').toLowerCase();
      // Rule 9: Phone add-ons exclude non-phone subcategories
      if (NON_PHONE_SUBCATS.includes(sub)) return false;

      const isCombo = Boolean(p.is_combo || p.product_type === 'combo');
      if (isCombo && (!isComboEligible(p, effectiveModel) || p.empty_intersection)) return false;

      const categoryLower = (p.category || '').toLowerCase();
      const isAccessory =
        categoryLower.includes('accessor') ||
        (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes('accessor'))) ||
        sub.includes('protector') ||
        sub.includes('glass') ||
        sub.includes('lens') ||
        sub.includes('cable') ||
        sub.includes('charger') ||
        sub.includes('power bank');

      if (!isAccessory && !isCombo) return false;

      // 5. Model compatibility
      const compModels = Array.isArray(p.compatible_models) ? p.compatible_models : [];
      const isUniversal =
        compModels.length === 0 ||
        compModels.includes('Universal') ||
        compModels.includes('universal');

      if (isUniversal) return true;

      // If item is model-specific and we have a model context
      if (effectiveModel) {
        return compModels.includes(effectiveModel);
      }

      return true;
    });

    // Rule 10: Group colour siblings (one entry per design)
    const grouped = groupProductsByDesign(candidates);

    // Sort: exact model matches first, then universal accessories
    grouped.sort((a, b) => {
      const aComp =
        Array.isArray(a.compatible_models) &&
        effectiveModel &&
        a.compatible_models.includes(effectiveModel);
      const bComp =
        Array.isArray(b.compatible_models) &&
        effectiveModel &&
        b.compatible_models.includes(effectiveModel);
      if (aComp && !bComp) return -1;
      if (!aComp && bComp) return 1;
      return (Number(a.selling_price) || 0) - (Number(b.selling_price) || 0);
    });

    return grouped.slice(0, 4);
  }, [products, currentProduct, cartItems, effectiveModel]);

  if (!addOns || addOns.length === 0) return null;

  const handleQuickAdd = (p) => {
    const isCombo = Boolean(p.is_combo || p.product_type === 'combo');
    const isOrderable = isCombo ? Boolean(combosOrderable) : true;
    const compModels = Array.isArray(p.compatible_models) ? p.compatible_models : [];
    const isUniversal = compModels.length === 0;

    // Combos not orderable -> View
    if (isCombo && !isOrderable) {
      navigate(`/product/${p.id}`);
      return;
    }

    // Universal product -> add directly
    if (isUniversal) {
      addItem(p, 1, 'Universal', null);
      setAddedMap((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [p.id]: false }));
      }, 2500);
      return;
    }

    // Model-specific product
    if (effectiveModel && compModels.includes(effectiveModel)) {
      addItem(p, 1, effectiveModel, null);
      setAddedMap((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [p.id]: false }));
      }, 2500);
      return;
    }

    // Model unknown or not fitting -> Open product page
    navigate(`/product/${p.id}`);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#141414] tracking-tight">
          Complete your setup
        </h3>
        {effectiveModel && (
          <span className="text-[12px] text-[#6B6B6B]">
            Fits {effectiveModel}
          </span>
        )}
      </div>

      <div className="border border-[#E5E5E3] rounded-[6px] bg-white divide-y divide-[#E5E5E3] overflow-hidden">
        {addOns.map((p) => {
          const compModels = Array.isArray(p.compatible_models) ? p.compatible_models : [];
          const isUniversal = compModels.length === 0;
          const isCombo = Boolean(p.is_combo || p.product_type === 'combo');
          const isOrderable = isCombo ? Boolean(combosOrderable) : true;

          let buttonText = 'Add';
          let isDirectAdd = true;

          if (isCombo && !isOrderable) {
            buttonText = 'View';
            isDirectAdd = false;
          } else if (!isUniversal && (!effectiveModel || !compModels.includes(effectiveModel))) {
            buttonText = 'Choose model';
            isDirectAdd = false;
          }

          const isAdded = Boolean(addedMap[p.id]);

          const thumb = isCombo
            ? getComboImage(p)
            : p.image_url ||
              (Array.isArray(p.images) && p.images[0]) ||
              '/subcategories/iphone.jpg';

          return (
            <div
              key={p.id}
              className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAFAF9] transition-colors"
            >
              {/* Thumbnail + Details */}
              <div
                onClick={() => !isDirectAdd && navigate(`/product/${p.id}`)}
                className={`flex items-center gap-3 min-w-0 flex-1 ${!isDirectAdd ? 'cursor-pointer' : ''}`}
              >
                <div className="w-11 h-11 rounded-[6px] bg-[#F4F3F0] border border-[#E5E5E3] overflow-hidden shrink-0">
                  <img
                    src={thumb}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#141414] truncate leading-snug">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[13px] font-semibold text-[#141414] tabular-nums">
                      {formatINR(p.selling_price)}
                    </span>
                    {p.mrp > p.selling_price && (
                      <span className="text-[11px] text-[#6B6B6B] line-through tabular-nums">
                        {formatINR(p.mrp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleQuickAdd(p)}
                className={`min-h-[34px] px-3 py-1 text-[12px] font-semibold rounded-[6px] shrink-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isAdded
                    ? 'bg-[#16A34A] text-white border border-[#16A34A]'
                    : isDirectAdd
                    ? 'border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white active:scale-95'
                    : 'border border-[#E5E5E3] bg-[#F4F3F0] text-[#141414] hover:border-[#141414]'
                }`}
                aria-label={`${buttonText} ${p.name}`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    {isDirectAdd ? <Plus className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{buttonText}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CompleteYourSetup;

