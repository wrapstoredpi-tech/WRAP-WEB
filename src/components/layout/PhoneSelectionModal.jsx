import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { useProductsContext } from '../../context/ProductsContext';

export function PhoneSelectionModal() {
  const { isPhoneSheetOpen, closePhoneSheet, selectPhone, savedPhone } = usePhoneContext();
  const { products } = useProductsContext();

  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct compatible models by brand from products
  const modelsByBrand = useMemo(() => {
    const appleSet = new Set();
    const samsungSet = new Set();
    const otherSet = new Set();

    for (const p of products) {
      const brand = (p.mobile_brand || '').trim();
      const models = p.compatible_models || [];

      for (const m of models) {
        if (!m || m === 'Universal') continue;
        if (brand.toLowerCase().includes('apple') || m.toLowerCase().includes('iphone')) {
          appleSet.add(m);
        } else if (brand.toLowerCase().includes('samsung') || m.toLowerCase().includes('galaxy')) {
          samsungSet.add(m);
        } else {
          otherSet.add(m);
        }
      }
    }

    // Curated fallbacks if catalog is loading or has few rows
    if (appleSet.size === 0) {
      [
        'iPhone 16 Pro Max',
        'iPhone 16 Pro',
        'iPhone 16 Plus',
        'iPhone 16',
        'iPhone 15 Pro Max',
        'iPhone 15 Pro',
        'iPhone 15 Plus',
        'iPhone 15',
        'iPhone 14 Pro Max',
        'iPhone 14 Pro',
        'iPhone 14',
        'iPhone 13',
      ].forEach((m) => appleSet.add(m));
    }
    if (samsungSet.size === 0) {
      [
        'Samsung Galaxy S24 Ultra',
        'Samsung Galaxy S24+',
        'Samsung Galaxy S24',
        'Samsung Galaxy S23 Ultra',
        'Samsung Galaxy S23+',
        'Samsung Galaxy S23',
        'Samsung Galaxy Z Fold 5',
        'Samsung Galaxy Z Flip 5',
      ].forEach((m) => samsungSet.add(m));
    }

    return {
      Apple: Array.from(appleSet).sort(),
      Samsung: Array.from(samsungSet).sort(),
      Other: Array.from(otherSet).sort(),
    };
  }, [products]);

  if (!isPhoneSheetOpen) return null;

  const currentModels =
    selectedBrand === 'All'
      ? [...modelsByBrand.Apple, ...modelsByBrand.Samsung, ...modelsByBrand.Other]
      : modelsByBrand[selectedBrand] || [];

  const filteredModels = searchQuery.trim()
    ? currentModels.filter((m) => m.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : currentModels;

  const handleSelectModel = (modelName) => {
    selectPhone(selectedBrand, modelName);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/50"
      onClick={closePhoneSheet}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-modal-title"
    >
      <div
        className="w-full max-w-[480px] bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] subtle-elevation overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between">
          <div>
            <h2 id="phone-modal-title" className="text-[20px] font-semibold text-[#141414]">
              Select your phone
            </h2>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">
              Choose your phone to filter compatible cases.
            </p>
          </div>

          <button
            type="button"
            onClick={closePhoneSheet}
            className="w-11 h-11 flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] rounded-[6px] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Brand Switcher */}
          <div className="flex gap-2">
            {['Apple', 'Samsung'].map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  setSelectedBrand(brand);
                  setSearchQuery('');
                }}
                className={`flex-1 min-h-[44px] text-[14px] font-semibold rounded-[6px] border transition-colors ${
                  selectedBrand === brand
                    ? 'bg-[#141414] text-white border-[#141414]'
                    : 'bg-white text-[#141414] border-[#E5E5E3] hover:border-[#141414]'
                }`}
              >
                {brand === 'Apple' ? 'iPhone (Apple)' : 'Samsung Galaxy'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${selectedBrand} models...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E5E3] rounded-[6px] pl-10 pr-4 py-2.5 min-h-[44px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414] transition-colors"
            />
          </div>

          {/* Models List */}
          <div className="space-y-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => {
                const isSelected = savedPhone?.model === model;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleSelectModel(model)}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-[6px] text-left text-[14px] flex items-center justify-between border transition-colors ${
                      isSelected
                        ? 'bg-white border-[#141414] font-semibold text-[#141414]'
                        : 'bg-white border-[#E5E5E3] text-[#141414] hover:border-[#141414]'
                    }`}
                  >
                    <span>{model}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#B0521F]" />}
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-[14px] text-[#6B6B6B]">
                No models found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between">
          <button
            type="button"
            onClick={closePhoneSheet}
            className="text-[12px] text-[#6B6B6B] hover:text-[#141414] underline underline-offset-2 min-h-[44px] flex items-center"
          >
            Browse all models without saving
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhoneSelectionModal;
