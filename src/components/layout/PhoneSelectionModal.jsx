import React, { useState, useMemo } from 'react';
import { X, Search, Check, Smartphone } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { useProductsContext } from '../../context/ProductsContext';

export function PhoneSelectionModal() {
  const { isPhoneSheetOpen, closePhoneSheet, selectPhone, skipPhoneSelection, savedPhone } =
    usePhoneContext();
  const { products } = useProductsContext();

  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [searchQuery, setSearchQuery] = useState('');

  // Build searchable model dictionary from live catalog
  const modelsByBrand = useMemo(() => {
    const appleSet = new Set();
    const samsungSet = new Set();
    const otherSet = new Set();

    for (const p of products) {
      const brand = (p.mobile_brand || '').trim();
      const models = p.compatible_models || [];

      for (const m of models) {
        if (!m || m === 'Universal') continue;
        if (brand === 'Apple' || m.toLowerCase().includes('iphone')) {
          appleSet.add(m);
        } else if (brand === 'Samsung' || m.toLowerCase().includes('galaxy') || m.toLowerCase().includes('samsung')) {
          samsungSet.add(m);
        } else {
          otherSet.add(m);
        }
      }
    }

    if (appleSet.size === 0) {
      ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 13'].forEach(m => appleSet.add(m));
    }
    if (samsungSet.size === 0) {
      ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy Z Flip 5'].forEach(m => samsungSet.add(m));
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
    ? currentModels.filter((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentModels;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#141414]/35 backdrop-blur-xs animate-fade-in"
      onClick={closePhoneSheet}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-sheet-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-t-lg sm:rounded-lg border border-[#E7E5E4] shadow-modal overflow-hidden flex flex-col max-h-[85vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#E7E5E4] flex items-start justify-between gap-4">
          <div>
            <h2 id="phone-sheet-title" className="text-[18px] font-semibold text-[#141414] tracking-tight">
              Select Device
            </h2>
            <p className="text-[13px] text-[#666664] mt-1 leading-normal">
              Filter cases engineered for your exact model.
            </p>
          </div>

          <button
            type="button"
            onClick={closePhoneSheet}
            className="w-8 h-8 flex items-center justify-center text-[#666664] hover:text-[#141414] rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Brand Buttons */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight mb-2">
              Brand
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedBrand('Apple')}
                className={`
                  h-11 px-4 rounded-lg border text-left flex items-center justify-between text-[13px] transition-colors
                  ${
                    selectedBrand === 'Apple'
                      ? 'border-[#141414] bg-[#141414] text-white font-semibold'
                      : 'border-[#E7E5E4] bg-[#FAFAF9] text-[#141414] hover:border-[#D6D3D1] font-normal'
                  }
                `}
              >
                <span>Apple iPhone</span>
                {selectedBrand === 'Apple' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBrand('Samsung')}
                className={`
                  h-11 px-4 rounded-lg border text-left flex items-center justify-between text-[13px] transition-colors
                  ${
                    selectedBrand === 'Samsung'
                      ? 'border-[#141414] bg-[#141414] text-white font-semibold'
                      : 'border-[#E7E5E4] bg-[#FAFAF9] text-[#141414] hover:border-[#D6D3D1] font-normal'
                  }
                `}
              >
                <span>Samsung Galaxy</span>
                {selectedBrand === 'Samsung' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
          </div>

          {/* Search Model */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight mb-2">
              Model
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${selectedBrand} models...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-3.5 py-2.5 pl-9 text-[13px] text-[#141414] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#141414] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[12px] text-[#666664] hover:text-[#141414]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Model List */}
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((modelName) => {
                const isSelected = savedPhone?.model === modelName;
                return (
                  <button
                    key={modelName}
                    type="button"
                    onClick={() => selectPhone(selectedBrand, modelName)}
                    className={`
                      w-full h-10 px-3.5 rounded-lg border text-left flex items-center justify-between transition-colors text-[13px]
                      ${
                        isSelected
                          ? 'border-[#141414] bg-[#141414] text-white font-semibold'
                          : 'border-transparent bg-transparent text-[#141414] hover:bg-[#FAFAF9]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#A8A29E]'}`} />
                      <span>{modelName}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })
            ) : (
              <p className="text-[13px] text-[#666664] py-4 text-center font-normal">
                No matching models found.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
          <button
            type="button"
            onClick={skipPhoneSelection}
            className="text-[13px] text-[#666664] hover:text-[#141414] transition-colors"
          >
            Skip selection
          </button>

          <span className="text-[11px] text-[#A8A29E]">
            Editable anytime
          </span>
        </div>
      </div>
    </div>
  );
}

export default PhoneSelectionModal;
