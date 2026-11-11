import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Truck,
  Check,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePurchaseSheet } from '../../context/PurchaseSheetContext';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';
import { resolveColorStyle, getValidColors } from '../../lib/colors';
import { policies } from '../../config/policies';
import { combosOrderable, store } from '../../config/store';
import { CompleteYourSetup } from './CompleteYourSetup';
import { ProductAccordions } from './ProductAccordions';

export function ProductInfoPanel({
  product,
  onAddToCart,
  buyButtonRef,
  selectedModel,
  setSelectedModel,
  modelError,
  setModelError,
  modelSelectRef,
  isModelSelected,
  needsModelSelection,
}) {
  const navigate = useNavigate();
  const { products } = useProductsContext();
  const { addItem, cartItems } = useCart();
  const { openSheet } = usePurchaseSheet();
  const { selectPhone } = usePhoneContext();

  const isOutOfStock =
    product.stock_status === 'OUT_OF_STOCK' ||
    (product.available_stock !== undefined && product.available_stock === 0) ||
    (product.current_stock !== undefined && product.current_stock === 0);

  const availableQty = Math.max(0, product.available_stock ?? product.current_stock ?? 99);
  const sellingPrice = Number(product.selling_price) || 0;
  const rawMrp = Number(product.raw_mrp ?? product.mrp);
  const mrp =
    rawMrp > 0
      ? rawMrp
      : product.discount_percentage > 0
      ? Math.round(sellingPrice / (1 - product.discount_percentage / 100))
      : 0;
  const hasDiscount = mrp > sellingPrice;
  const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  const compatibleModels = product.compatible_models || [];
  const isCombo = Boolean(product?.is_combo || product?.product_type === 'combo');

  const comboItems = useMemo(() => {
    if (!isCombo) return [];
    if (Array.isArray(product?.combo_items) && product.combo_items.length > 0) {
      return product.combo_items;
    }
    if (Array.isArray(product?.items) && product.items.length > 0) {
      return product.items;
    }
    return [];
  }, [isCombo, product]);

  // ─── COLOUR SIBLINGS ────────────────────────────────────────────────────────
  // Products with the same name (trimmed, case-insensitive) in the same subcategory
  const colourSiblings = useMemo(() => {
    if (!product) return [];
    const currentName = (product.name || '').trim().toLowerCase();
    const currentSub = (product.subcategory || product.category || '').trim().toLowerCase();

    const matches = (products || []).filter((p) => {
      const pName = (p.name || '').trim().toLowerCase();
      const pSub = (p.subcategory || p.category || '').trim().toLowerCase();
      return pName === currentName && pSub === currentSub;
    });

    if (matches.length <= 1) {
      // If no distinct siblings by name, check color_variants or colors
      return [product];
    }
    return matches;
  }, [products, product]);

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Check if item is already in cart
  const isItemInCart = useMemo(() => {
    if (!Array.isArray(cartItems) || !product?.id) return false;
    if (needsModelSelection) {
      if (!selectedModel) return false;
      return cartItems.some(
        (item) =>
          (String(item.productId) === String(product.id) || String(item.id) === String(product.id)) &&
          String(item.selected_model) === String(selectedModel)
      );
    }
    return cartItems.some(
      (item) => String(item.productId) === String(product.id) || String(item.id) === String(product.id)
    );
  }, [cartItems, product?.id, needsModelSelection, selectedModel]);

  const showGoToCart = Boolean(added || isItemInCart);

  useEffect(() => {
    setAdded(false);
  }, [selectedModel]);

  const handleSiblingClick = (sibling) => {
    if (sibling.id === product.id) return;
    const modelQuery = selectedModel ? `?model=${encodeURIComponent(selectedModel)}` : '';
    navigate(`/product/${sibling.id}${modelQuery}`);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    if (showGoToCart) {
      navigate('/cart');
      return;
    }

    if (needsModelSelection && !isModelSelected) {
      setModelError(true);
      if (modelSelectRef.current) {
        modelSelectRef.current.focus();
        modelSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsAdding(true);
    const chosenColor = (product.color_variants && product.color_variants[0]) || product.color || null;
    const modelToSave = selectedModel || 'Universal';

    addItem(product, 1, modelToSave, chosenColor);

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      openSheet({
        product,
        quantity: 1,
        selectedModel: modelToSave,
        selectedColor: chosenColor,
      });
      if (onAddToCart) {
        onAddToCart(product, 1, modelToSave, chosenColor);
      }
    }, 200);
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* 1. Name (Poppins 600, 24px) */}
      <h1 className="font-sans font-semibold text-[24px] text-[#141414] leading-snug tracking-tight">
        {product.name}
      </h1>

      {/* 2. Price row (price, struck-through MRP, "N% off" in accent, "Inclusive of all taxes" muted) */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 tabular-nums flex-wrap">
          <span className="font-sans text-[24px] font-semibold text-[#141414]">
            {formatINR(sellingPrice)}
          </span>
          {hasDiscount && (
            <span className="font-sans text-[15px] text-[#6B6B6B] line-through font-normal">
              {formatINR(mrp)}
            </span>
          )}
          {hasDiscount && (
            <span className="text-[14px] font-semibold text-[#B0521F]">
              {discountPercent}% off
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6B6B6B] font-normal">
          Inclusive of all taxes
        </p>
      </div>

      {/* 3. The existing required model dropdown (prefilled from saved phone when compatible) */}
      {needsModelSelection && (
        <div className="space-y-2">
          <label
            htmlFor="phone-model-select"
            className="block text-[13px] font-medium text-[#141414]"
          >
            Select phone model <span className="text-[#B0521F]">*</span>
          </label>
          <div className="relative">
            <select
              id="phone-model-select"
              ref={modelSelectRef}
              value={selectedModel}
              onChange={(e) => {
                const newModel = e.target.value;
                setSelectedModel(newModel);
                setModelError(false);
                if (newModel && selectPhone) {
                  selectPhone(product.mobile_brand || 'Apple', newModel);
                }
              }}
              className={`w-full bg-white border rounded-[6px] px-3.5 py-3 min-h-[48px] text-[14px] text-[#141414] transition-all appearance-none cursor-pointer pr-10 focus:outline-none ${
                modelError
                  ? 'border-[#B0521F] ring-1 ring-[#B0521F]'
                  : 'border-[#E5E5E3] hover:border-[#141414] focus:border-[#141414]'
              }`}
            >
              <option value="">Choose your phone model</option>
              {compatibleModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B6B6B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {isModelSelected ? (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#141414] pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#141414]" />
              <span>Compatible with {selectedModel}</span>
            </div>
          ) : modelError ? (
            <p className="text-[12px] text-[#B0521F] font-normal pt-0.5">
              Please choose your phone model to add to bag.
            </p>
          ) : (
            <p className="text-[12px] text-[#6B6B6B] font-normal pt-0.5">
              Choose your model to add to bag
            </p>
          )}
        </div>
      )}

      {/* 4. COLOUR: Swatches for every colour sibling with the name under each
          (Hidden for combos; the current one has an accent ring; tapping another opens that sibling's page,
          keeping the chosen model; sold-out siblings are crossed out) */}
      {!isCombo && colourSiblings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#6B6B6B]">Colour:</span>
            <span className="font-semibold text-[#141414]">
              {getValidColors(product.color_variants || product.color)[0] || product.color || 'Standard'}
            </span>
          </div>

          <div className="flex items-start gap-4 flex-wrap">
            {colourSiblings.map((sibling) => {
              const isCurrent = sibling.id === product.id;
              const sibColor =
                getValidColors(sibling.color_variants || sibling.color)[0] ||
                sibling.color ||
                'Standard';
              const style = resolveColorStyle(sibColor);
              const sibOutOfStock =
                sibling.stock_status === 'OUT_OF_STOCK' ||
                (sibling.available_stock !== undefined && sibling.available_stock <= 0);

              return (
                <button
                  key={sibling.id}
                  type="button"
                  onClick={() => handleSiblingClick(sibling)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                  aria-label={`Select ${sibColor} colour`}
                >
                  <div
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center p-0.5 transition-all ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 ring-[#B0521F]'
                        : 'border border-[#E5E5E3] hover:scale-105'
                    }`}
                  >
                    <span
                      className="w-full h-full rounded-full border border-black/10 shadow-2xs block"
                      style={style}
                    />
                    {/* Sold out cross-out */}
                    {sibOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-full h-[1.5px] bg-[#141414] rotate-45 transform" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      isCurrent
                        ? 'text-[#141414] font-semibold'
                        : sibOutOfStock
                        ? 'text-[#6B6B6B] line-through'
                        : 'text-[#6B6B6B] group-hover:text-[#141414]'
                    }`}
                  >
                    {sibColor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Combo: Included in this combo list */}
      {isCombo && comboItems.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#141414] tracking-tight">
              Included in this combo
            </h3>
            <span className="text-[12px] text-[#6B6B6B]">
              {comboItems.length} {comboItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="border border-[#E5E5E3] rounded-[6px] bg-white divide-y divide-[#E5E5E3] overflow-hidden">
            {comboItems.map((c, idx) => {
              const qty = Number(c.qty_per_combo ?? c.unit_quantity ?? c.quantity ?? 1) || 1;
              const name = c.product_name || c.name || 'Component item';
              const photo = c.image || c.image_url || '/subcategories/iphone.jpg';
              const isModelSpecific =
                (c.mobile_model && c.mobile_model !== 'Universal') ||
                (c.category || '').toLowerCase().includes('case') ||
                (c.subcategory || '').toLowerCase().includes('iphone') ||
                (c.subcategory || '').toLowerCase().includes('samsung');
              const modelDisplay = isModelSpecific
                ? (selectedModel || c.mobile_model || 'Universal')
                : null;

              return (
                <div key={c.product_id || idx} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-[6px] bg-[#F4F3F0] border border-[#E5E5E3] overflow-hidden shrink-0">
                      <img
                        src={photo}
                        alt={name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/subcategories/iphone.jpg';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#141414] leading-snug truncate">
                        {name}
                      </p>
                      {modelDisplay && (
                        <p className="text-[12px] text-[#6B6B6B] truncate pt-0.5">
                          Model: {modelDisplay}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 pl-2 text-right">
                    <span className="inline-block px-2 py-0.5 bg-[#F4F3F0] border border-[#E5E5E3] rounded-[4px] text-[12px] font-medium text-[#141414] tabular-nums">
                      Qty: {qty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Stock line */}
      <div className="pt-0.5">
        {isOutOfStock ? (
          <p className="text-[13px] text-[#B0521F] font-medium">Currently out of stock</p>
        ) : availableQty <= 5 ? (
          <p className="text-[13px] text-[#B0521F] font-medium">Only {availableQty} left in stock</p>
        ) : (
          <p className="text-[13px] text-[#141414] font-medium">In stock</p>
        )}
      </div>

      {/* 6. Full-width Add to Bag (accent #B0521F, 52px; or in-store WhatsApp CTA for view-only combos)
          (Visible on desktop inside right column; mobile uses the sticky bar) */}
      <div ref={buyButtonRef} className="hidden lg:block pt-1">
        {isCombo && !combosOrderable ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-[#F4F3F0] border border-[#E5E5E3] rounded-[6px] text-center">
              <p className="text-[14px] font-medium text-[#141414]">
                Coming soon online – available in store
              </p>
            </div>
            <a
              href={`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
                `Hi WrapStore, I would like to inquire about the ${product.name} combo.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-[52px] min-h-[52px] rounded-[6px] text-[15px] font-semibold bg-[#141414] hover:bg-[#B0521F] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        ) : (
          <button
            type="button"
            disabled={isOutOfStock || (needsModelSelection && !isModelSelected)}
            onClick={handleAddToCart}
            className={`w-full h-[52px] min-h-[52px] rounded-[6px] text-[15px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isOutOfStock
                ? 'bg-[#E5E5E3] text-[#6B6B6B] cursor-not-allowed'
                : needsModelSelection && !isModelSelected
                ? 'bg-[#E5E5E3] text-[#6B6B6B] cursor-not-allowed'
                : showGoToCart
                ? 'bg-[#141414] hover:bg-[#262626] text-white active:scale-[0.99]'
                : 'bg-[#B0521F] hover:bg-[#964317] text-white active:scale-[0.99]'
            }`}
          >
            {isAdding ? (
              <span>Adding to bag...</span>
            ) : isOutOfStock ? (
              <span>Out of stock</span>
            ) : needsModelSelection && !isModelSelected ? (
              <span>Select a phone model above</span>
            ) : showGoToCart ? (
              <>
                <span>Go to Bag</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 7. The delivery line from policies config */}
      <div className="pt-1 border-t border-[#E5E5E3]">
        <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B]">
          <Truck className="w-4 h-4 text-[#141414] shrink-0" />
          <span>
            {policies.delivery.tn.text} in {policies.delivery.tn.label}.
          </span>
        </div>
      </div>

      {/* 8. "Complete your setup": up to 4 compact rows of screen protection for chosen model,
          then universal accessories, then combos with this product */}
      <CompleteYourSetup
        currentProduct={product}
        selectedModel={selectedModel}
      />

      {/* 9. Accordions: Product details, Compatible models, Delivery and returns */}
      <div className="pt-2">
        <ProductAccordions product={product} />
      </div>

    </div>
  );
}

export default ProductInfoPanel;
