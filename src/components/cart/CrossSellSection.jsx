import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { useCart, useHydratedCart } from '../../context/CartContext';
import { formatINR } from '../../lib/currency';

export function CrossSellSection({ onAdded, className = '', title = 'Complete the ecosystem' }) {
  const { products = [] } = useProductsContext();
  const { addItem } = useCart();
  const { items = [] } = useHydratedCart(products);
  const [addedIds, setAddedIds] = useState(new Set());

  // 1. Extract distinct non-universal models from all lines in the bag
  const modelsInBag = useMemo(() => {
    const list = [];
    const seen = new Set();
    items.forEach((item) => {
      const m = item.selected_model;
      if (m && m !== 'Universal' && !seen.has(m)) {
        seen.add(m);
        list.push(m);
      }
    });
    return list;
  }, [items]);

  // Model of the most recently added line
  const mostRecentModel = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      const m = items[i].selected_model;
      if (m && m !== 'Universal') return m;
    }
    return modelsInBag[0] || null;
  }, [items, modelsInBag]);

  const [selectedModelFilter, setSelectedModelFilter] = useState('');

  // Default to most recently added line's model
  useEffect(() => {
    if (!selectedModelFilter || !modelsInBag.includes(selectedModelFilter)) {
      setSelectedModelFilter(mostRecentModel || modelsInBag[0] || '');
    }
  }, [mostRecentModel, modelsInBag, selectedModelFilter]);

  const activeModel = modelsInBag.includes(selectedModelFilter)
    ? selectedModelFilter
    : (mostRecentModel || modelsInBag[0] || null);

  // 2. Exclude any product in the bag AND any product included in a combo in the bag
  const excludedProductIds = useMemo(() => {
    const set = new Set();
    items.forEach((line) => {
      if (line.productId) set.add(line.productId);
      if (line.is_combo && Array.isArray(line.components)) {
        line.components.forEach((c) => {
          if (c.product_id) set.add(c.product_id);
        });
      }
    });
    return set;
  }, [items]);

  // 3. Filter cross-sell accessories (non-case products, matching activeModel or Universal)
  const crossSellProducts = useMemo(() => {
    const nonCaseProducts = products.filter((p) => {
      if (excludedProductIds.has(p.id)) return false;
      if (
        p.stock_status === 'OUT_OF_STOCK' ||
        (p.available_stock ?? p.current_stock ?? 0) === 0
      ) {
        return false;
      }
      const cat = (p.category || '').toLowerCase();
      return !cat.includes('case');
    });

    if (nonCaseProducts.length === 0) return [];

    let matching = [];

    if (activeModel) {
      const targetM = activeModel.toLowerCase().trim();

      matching = nonCaseProducts.filter((p) => {
        const isUniversal =
          p.mobile_brand === 'Universal' ||
          !p.compatible_models ||
          p.compatible_models.length === 0 ||
          p.compatible_models.includes('Universal');

        const modelMatch =
          Array.isArray(p.compatible_models) &&
          p.compatible_models.some((m) => m.toLowerCase().trim() === targetM);

        return modelMatch || isUniversal;
      });
    } else {
      // Universal accessories only
      matching = nonCaseProducts.filter((p) => {
        return (
          p.mobile_brand === 'Universal' ||
          !p.compatible_models ||
          p.compatible_models.length === 0 ||
          p.compatible_models.includes('Universal')
        );
      });
    }

    return matching.slice(0, 4);
  }, [products, excludedProductIds, activeModel]);

  // If none qualify, hide the section
  if (crossSellProducts.length === 0) {
    return null;
  }

  const handleAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const modelToSave = activeModel || 'Universal';
    const success = addItem(product, 1, modelToSave);
    if (success) {
      setAddedIds((prev) => new Set(prev).add(product.id));
      if (onAdded) onAdded(product);
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }, 2000);
    }
  };

  return (
    <section className={`pt-8 border-t border-[#E5E5E3] space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-[20px] font-semibold text-[#141414]">
            {title}
          </h2>
          <p className="text-[13px] text-[#6B6B6B]">
            {activeModel
              ? `Recommended add-ons for your ${activeModel}`
              : 'Essential chargers, screen guards and cables'}
          </p>
        </div>

        {/* Small select dropdown if multiple models in bag */}
        {modelsInBag.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="cross-sell-model-select" className="text-[12px] text-[#737373] font-medium">
              Device:
            </label>
            <select
              id="cross-sell-model-select"
              value={activeModel || ''}
              onChange={(e) => setSelectedModelFilter(e.target.value)}
              aria-label="Select device for recommendations"
              className="text-[12px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[4px] px-2.5 py-1 text-[#141414] font-medium focus:outline-none focus:border-[#141414] cursor-pointer"
            >
              {modelsInBag.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {crossSellProducts.map((p) => {
          const isJustAdded = addedIds.has(p.id);
          return (
            <div
              key={p.id}
              className="bg-white border border-[#E5E5E3] rounded-[6px] p-3 flex flex-col justify-between hover:border-[#141414] transition-colors"
            >
              <Link to={`/product/${p.id}`} className="space-y-2.5 block">
                <div className="aspect-[4/5] bg-white rounded-[6px] overflow-hidden">
                  <img
                    src={p.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#141414] line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[14px] text-[#141414] font-semibold pt-0.5">
                    {formatINR(p.selling_price)}
                  </p>
                </div>
              </Link>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => handleAdd(p, e)}
                  disabled={isJustAdded}
                  className={`w-full min-h-[44px] px-3 py-1.5 text-[12px] font-semibold rounded-[6px] border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isJustAdded
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white hover:bg-[#FAFAF9] text-[#141414] border-[#E5E5E3]'
                  }`}
                >
                  {isJustAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CrossSellSection;
