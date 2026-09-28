/**
 * src/components/layout/PhoneSelectionModal.jsx
 * ──────────────────────────────────────────────
 * Phone Selection Modal / Sheet ("Which phone do you have?")
 * Built from compatible models present in live Supabase products.
 */
import React, { useState, useMemo } from 'react';
import { X, Search, Check, Smartphone } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { useProductsContext } from '../../context/ProductsContext';

export function PhoneSelectionModal() {
  const { isPhoneSheetOpen, closePhoneSheet, selectPhone, skipPhoneSelection, savedPhone } =
    usePhoneContext();
  const { products } = useProductsContext();

  const [selectedBrand, setSelectedBrand] = useState('Apple'); // 'Apple' | 'Samsung' | 'All'
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

    // Default curated fallback lists if live catalog is small
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in"
      onClick={closePhoneSheet}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-sheet-title"
    >
      <div
        className="w-full max-w-lg bg-base-offwhite rounded-t-2xl sm:rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-200 flex items-start justify-between gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-editorial font-bold text-accent">
                Tailored Shopping
              </span>
            </div>
            <h2 id="phone-sheet-title" className="text-xl font-semibold text-neutral-900 tracking-tight">
              Which phone do you have?
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              We&apos;ll highlight designs guaranteed to fit your exact model.
            </p>
          </div>

          <button
            type="button"
            onClick={closePhoneSheet}
            className="p-2 -mr-2 text-neutral-400 hover:text-neutral-900 rounded-full focus-visible:outline-accent transition-colors"
            aria-label="Close phone selection sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Brand Buttons */}
          <div>
            <label className="block text-xs uppercase tracking-editorial font-semibold text-neutral-400 mb-2">
              1. Select Brand
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedBrand('Apple')}
                className={`
                  min-h-[48px] p-4 rounded-xl border-2 text-left flex items-center justify-between font-semibold text-body transition-all
                  ${
                    selectedBrand === 'Apple'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                  }
                `}
              >
                <span>Apple iPhone</span>
                {selectedBrand === 'Apple' && <Check className="w-4 h-4 text-accent" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBrand('Samsung')}
                className={`
                  min-h-[48px] p-4 rounded-xl border-2 text-left flex items-center justify-between font-semibold text-body transition-all
                  ${
                    selectedBrand === 'Samsung'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                  }
                `}
              >
                <span>Samsung Galaxy</span>
                {selectedBrand === 'Samsung' && <Check className="w-4 h-4 text-accent" />}
              </button>
            </div>
          </div>

          {/* Search Model */}
          <div>
            <label className="block text-xs uppercase tracking-editorial font-semibold text-neutral-400 mb-2">
              2. Choose Model
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${selectedBrand} models...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 pl-10 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-neutral-900"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Model List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((modelName) => {
                const isSelected = savedPhone?.model === modelName;
                return (
                  <button
                    key={modelName}
                    type="button"
                    onClick={() => selectPhone(selectedBrand, modelName)}
                    className={`
                      w-full min-h-[44px] px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all text-body-sm font-medium
                      ${
                        isSelected
                          ? 'border-accent bg-accent-light text-neutral-950 font-semibold shadow-2xs'
                          : 'border-neutral-200/80 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-neutral-400'}`} />
                      <span>{modelName}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-accent font-semibold flex items-center gap-1">
                        Active <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-neutral-500 py-4 text-center">
                No matching models found for &quot;{searchQuery}&quot;.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={skipPhoneSelection}
            className="text-body-sm text-neutral-500 hover:text-neutral-900 font-medium underline transition-colors min-h-[44px] flex items-center"
          >
            Skip for now
          </button>

          <p className="text-[11px] text-neutral-400">
            You can change this anytime from the top bar.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PhoneSelectionModal;
