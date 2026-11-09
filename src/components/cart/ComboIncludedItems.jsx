import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Package } from 'lucide-react';

function ComponentImage({ src, alt = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-[#FAFAF9] text-[#A3A3A3]"
        aria-hidden="true"
      >
        <Package className="w-3.5 h-3.5 stroke-[1.4]" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  );
}

export function ComboIncludedItems({
  components = [],
  comboQuantity = 1,
  selectedModel = null,
  comboName = 'Combo',
}) {
  // Mobile check: collapsed when > 3 items on mobile; expanded on desktop when <= 4 items
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return components.length <= 3;
    }
    return true;
  });

  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(components) || components.length === 0) {
    return null;
  }

  const displayedComponents = showAll ? components : components.slice(0, 4);

  return (
    <div className="pt-2 text-[14px]">
      {/* Header with Accordion Toggle Button */}
      <div className="flex items-center justify-between min-h-[36px]">
        <span className="text-[13px] font-medium text-[#141414]">
          Included in this combo ({components.length} {components.length === 1 ? 'item' : 'items'})
        </span>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="min-h-[44px] px-2.5 py-1 text-[13px] font-semibold text-[#B0521F] hover:text-[#994518] inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isOpen ? 'Hide items' : 'Show items'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expanded Items List */}
      {isOpen && (
        <div className="mt-2 space-y-3">
          <ul
            aria-label={`Items included in ${comboName}`}
            className="border-l border-[#E5E5E3] ml-2 pl-3 sm:pl-4 space-y-2.5"
          >
            {displayedComponents.map((c, idx) => {
              const totalQty = (c.allotted_qty || 1) * (comboQuantity || 1);
              const isModelSpecific =
                (c.mobile_model && c.mobile_model !== 'Universal') ||
                (c.category || '').toLowerCase().includes('case') ||
                (c.subcategory || '').toLowerCase().includes('iphone') ||
                (c.subcategory || '').toLowerCase().includes('samsung');

              const modelToShow = isModelSpecific
                ? (selectedModel && selectedModel !== 'Universal' ? selectedModel : c.mobile_model)
                : null;

              return (
                <li
                  key={c.product_id || idx}
                  className="flex items-center justify-between gap-3 text-[14px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Fixed ratio thumbnail: 36px mobile, 40px desktop */}
                    <div className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] aspect-square rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] overflow-hidden shrink-0">
                      <ComponentImage src={c.image} alt="" />
                    </div>

                    {/* Component Info */}
                    <div className="min-w-0 flex-1">
                      {c.product_id ? (
                        <Link
                          to={`/product/${c.product_id}`}
                          className="text-[13px] sm:text-[14px] text-[#141414] hover:text-[#B0521F] font-medium line-clamp-2 leading-tight transition-colors"
                        >
                          {c.name}
                        </Link>
                      ) : (
                        <span className="text-[13px] sm:text-[14px] text-[#141414] font-medium line-clamp-2 leading-tight">
                          {c.name}
                        </span>
                      )}

                      {modelToShow && (
                        <span className="text-[12px] text-[#737373] block mt-0.5 truncate">
                          Model: {modelToShow}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity at the right (never wraps awkwardly) */}
                  <span className="text-[13px] sm:text-[14px] text-[#737373] font-medium shrink-0 pl-2 tabular-nums whitespace-nowrap">
                    × {totalQty}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Show all / Show fewer toggle when more than 4 items */}
          {components.length > 4 && (
            <div className="pl-3 sm:pl-4">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="min-h-[44px] py-1 text-[12px] font-semibold text-[#B0521F] hover:text-[#994518] hover:underline cursor-pointer inline-flex items-center"
              >
                {showAll
                  ? 'Show fewer items'
                  : `Show all ${components.length} items`}
              </button>
            </div>
          )}

          {/* Caption */}
          <p className="text-[12px] text-[#737373] pt-0.5 pl-1 italic">
            Combo items are sold together. Remove the combo to change it.
          </p>
        </div>
      )}
    </div>
  );
}

export default ComboIncludedItems;

