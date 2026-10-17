import React, { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Check, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';
import { storeConfig } from '../../config/store';
import { ColorSwatch, getValidColors } from '../ui/ColorSwatch';

export function ProductInfoPanel({ product, onAddToCart, buyButtonRef }) {
  const { addItem } = useCart();
  const { savedPhone } = usePhoneContext();

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || (product.available_stock ?? product.current_stock ?? 0) === 0;
  const availableQty = Math.max(0, product.available_stock ?? product.current_stock ?? 0);
  const isLowStock = !isOutOfStock && availableQty <= 5;
  const hasDiscount = product.mrp > product.selling_price;

  const compatibleModels = product.compatible_models || [];
  const isCase = (product.category || '').toLowerCase().includes('case');
  const needsModelSelection = isCase || compatibleModels.length > 0;

  // Prefill model if user's saved phone is in compatible list
  const prefilledModel = () => {
    if (savedPhone?.model && compatibleModels.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim())) {
      return savedPhone.model;
    }
    if (!needsModelSelection) {
      return 'Universal';
    }
    return '';
  };

  const [selectedModel, setSelectedModel] = useState(prefilledModel);
  const [quantity, setQuantity] = useState(availableQty > 0 ? 1 : 0);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('details'); // 'details' | 'models' | 'shipping' | null

  // Update selected model if savedPhone changes
  useEffect(() => {
    if (savedPhone?.model && compatibleModels.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim())) {
      setSelectedModel(savedPhone.model);
    }
  }, [savedPhone, compatibleModels]);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < availableQty) {
      setQuantity((q) => q + 1);
    }
  };

  const canAddToCart = !isOutOfStock && quantity > 0 && (!needsModelSelection || Boolean(selectedModel));
  const validColors = getValidColors(product);

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    setIsAdding(true);
    const chosenColor = validColors.length > 0 ? validColors[0] : null;
    const modelToSave = selectedModel || 'Universal';

    addItem(product, quantity, modelToSave, chosenColor);

    setTimeout(() => {
      setIsAdding(false);
      setAdded(true);
      if (onAddToCart) {
        onAddToCart(product, quantity);
      }
      setTimeout(() => setAdded(false), 2000);
    }, 200);
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* 1. Category line */}
      <nav aria-label="Category" className="text-[12px] text-[#6B6B6B]">
        <span>{product.category}</span>
        {product.subcategory && <span> / {product.subcategory}</span>}
      </nav>

      {/* 2. Title */}
      <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em] leading-tight">
        {product.name}
      </h1>

      {/* 3. Price with MRP and "Inclusive of taxes" */}
      <div className="space-y-1 pb-4 border-b border-[#E5E5E3]">
        <div className="flex items-baseline gap-3 tabular-nums">
          <span className="text-[20px] font-semibold text-[#141414]">
            {formatINR(product.selling_price)}
          </span>
          {hasDiscount && (
            <span className="text-[14px] text-[#6B6B6B] line-through font-normal">
              {formatINR(product.mrp)}
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6B6B6B]">
          Inclusive of taxes
        </p>
      </div>

      {/* 4. Stock status */}
      <div className="text-[14px]">
        {isOutOfStock ? (
          <span className="text-[#6B6B6B]">Out of stock</span>
        ) : isLowStock ? (
          <span className="text-[#B0521F] font-semibold">
            Only {availableQty} left
          </span>
        ) : (
          <span className="text-[#141414]">In stock</span>
        )}
      </div>

      {/* 5. REQUIRED model dropdown (prefilled from saved phone when compatible) */}
      {needsModelSelection && (
        <div className="space-y-1.5">
          <label htmlFor="model-select" className="block text-[14px] font-medium text-[#141414]">
            Select Phone Model <span className="text-[#B0521F]">*</span>
          </label>
          <div className="relative">
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-white border border-[#E5E5E3] rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] appearance-none cursor-pointer"
            >
              <option value="">Choose your exact phone model</option>
              {compatibleModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B6B6B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {!selectedModel && (
            <p className="text-[12px] text-[#B0521F]">
              Please choose your phone model to check exact fit.
            </p>
          )}
        </div>
      )}

      {/* 6. Colours (display only, not selectable) - only shown when POS updated colors */}
      {validColors.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-[#141414]">
              Colours:
            </span>
            <ColorSwatch colors={validColors} size="sm" />
            <span className="text-[14px] text-[#6B6B6B]">
              {validColors.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* 7. Quantity capped at available_stock & 8. Add to Bag */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center gap-3">
          {/* Stepper */}
          <div className="inline-flex items-center justify-between border border-[#E5E5E3] bg-white rounded-[6px] min-h-[44px] px-3 w-32 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={handleDecrement}
              className="w-8 h-8 flex items-center justify-center text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-[14px] font-semibold text-[#141414]">
              {quantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || quantity >= availableQty}
              onClick={handleIncrement}
              className="w-8 h-8 flex items-center justify-center text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Bag Button */}
          <div ref={buyButtonRef} className="flex-1">
            <button
              type="button"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
              className={`w-full min-h-[44px] px-6 py-2.5 rounded-[6px] text-[16px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                !canAddToCart
                  ? 'bg-[#E5E5E3] text-[#6B6B6B] cursor-not-allowed'
                  : 'bg-[#B0521F] hover:bg-[#994518] text-white'
              }`}
            >
              {isAdding ? (
                <span>Adding...</span>
              ) : added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of stock</span>
              ) : !selectedModel && needsModelSelection ? (
                <span>Select phone model</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag • {formatINR(product.selling_price * (quantity || 1))}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 9. One plain trust line from config */}
      <div className="pt-2">
        <p className="text-[12px] text-[#6B6B6B] leading-relaxed border-t border-[#E5E5E3] pt-3">
          {storeConfig.productTrustLine}
        </p>
      </div>

      {/* Accordions below: Details, Compatible models, Returns and shipping */}
      <div className="pt-4 border-t border-[#E5E5E3] space-y-2">
        
        {/* Accordion 1: Details */}
        <div className="border border-[#E5E5E3] rounded-[6px] overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
            className="w-full min-h-[44px] px-4 flex items-center justify-between text-[14px] font-semibold text-[#141414]"
          >
            <span>Details</span>
            <ChevronDown
              className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                openAccordion === 'details' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openAccordion === 'details' && (
            <div className="p-4 pt-1 border-t border-[#E5E5E3] text-[14px] text-[#6B6B6B] leading-relaxed">
              <p>{product.description || 'Precision-crafted phone case with reinforced edges and tactile responsive button covers.'}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-[12px]">
                <li>Precision port cutouts and microphone alignment</li>
                <li>Raised camera bezel for lens protection</li>
                <li>Scratch-resistant tactile outer finish</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 2: Compatible models */}
        <div className="border border-[#E5E5E3] rounded-[6px] overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpenAccordion(openAccordion === 'models' ? null : 'models')}
            className="w-full min-h-[44px] px-4 flex items-center justify-between text-[14px] font-semibold text-[#141414]"
          >
            <span>Compatible models</span>
            <ChevronDown
              className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                openAccordion === 'models' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openAccordion === 'models' && (
            <div className="p-4 pt-1 border-t border-[#E5E5E3] text-[14px] text-[#6B6B6B]">
              {compatibleModels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {compatibleModels.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] text-[12px] text-[#141414]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px]">Universal compatibility across standard devices.</p>
              )}
            </div>
          )}
        </div>

        {/* Accordion 3: Returns and shipping */}
        <div className="border border-[#E5E5E3] rounded-[6px] overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
            className="w-full min-h-[44px] px-4 flex items-center justify-between text-[14px] font-semibold text-[#141414]"
          >
            <span>Returns and shipping</span>
            <ChevronDown
              className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                openAccordion === 'shipping' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openAccordion === 'shipping' && (
            <div className="p-4 pt-1 border-t border-[#E5E5E3] text-[12px] text-[#6B6B6B] space-y-2 leading-relaxed">
              <p><strong>Shipping:</strong> {storeConfig.shippingPolicySummary}</p>
              <p><strong>Returns:</strong> {storeConfig.returnPolicySummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductInfoPanel;
