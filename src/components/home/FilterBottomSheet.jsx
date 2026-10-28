import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { PRICE_RANGES } from '../../lib/useProducts';

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  filterOptions = {},
}) {
  const {
    brand = 'All Brands',
    series = '',
    selectedModel = [],
    priceRange = 'All Prices',
    inStockOnly = false,
  } = filters || {};

  const [modelSearch, setModelSearch] = useState('');

  const selectedModels = useMemo(() => {
    if (Array.isArray(selectedModel)) return selectedModel;
    if (typeof selectedModel === 'string' && selectedModel.trim()) {
      return selectedModel.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [selectedModel]);

  const toggleModel = (m) => {
    let next;
    if (selectedModels.includes(m)) {
      next = selectedModels.filter((item) => item !== m);
    } else {
      next = [...selectedModels, m];
    }
    onFilterChange('selectedModel', next);
  };

  const {
    brands = ['All Brands', 'Apple', 'Samsung'],
    brandModelsMap = {},
  } = filterOptions;

  const availableModels = useMemo(() => {
    if (!brand || brand === 'All Brands') {
      return Array.from(new Set(Object.values(brandModelsMap).flat()));
    }
    return brandModelsMap[brand] || [];
  }, [brand, brandModelsMap]);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels.slice(0, 15);
    return availableModels
      .filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase().trim()))
      .slice(0, 20);
  }, [availableModels, modelSearch]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#141414]/50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filters-title"
    >
      <div
        className="w-full sm:max-w-md bg-[#FAFAF9] rounded-t-[6px] sm:rounded-[6px] border border-[#E5E5E3] subtle-elevation overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between">
          <h2 id="mobile-filters-title" className="text-[20px] font-semibold text-[#141414]">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] rounded-[6px]"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Active Series Indicator */}
          {series && (
            <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-white border border-[#E5E5E3] text-[12px]">
              <span className="text-[#141414]">Series: <strong>{series}</strong></span>
              <button
                type="button"
                onClick={() => onFilterChange('series', '')}
                className="text-[#B0521F] hover:underline font-semibold"
              >
                Clear
              </button>
            </div>
          )}

          {/* Brand */}
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#141414]">
              Brand
            </h3>
            <div className="flex gap-2">
              {['All Brands', 'Apple', 'Samsung'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onFilterChange('brand', b);
                    onFilterChange('selectedModel', []);
                  }}
                  className={`flex-1 min-h-[44px] px-3 text-[14px] font-semibold rounded-[6px] border transition-colors ${
                    brand === b || (b === 'All Brands' && (!brand || brand === 'All Brands'))
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white text-[#141414] border-[#E5E5E3]'
                  }`}
                >
                  {b === 'Apple' ? 'Apple' : b === 'Samsung' ? 'Samsung' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Model search (Multi-Select Radio Button) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-[#141414]">
                Compatible Model {selectedModels.length > 0 && `(${selectedModels.length})`}
              </h3>
              {selectedModels.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFilterChange('selectedModel', [])}
                  className="text-[12px] text-[#B0521F] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search phone models..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full bg-white border border-[#E5E5E3] rounded-[6px] pl-9 pr-3 py-2 min-h-[44px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414]"
              />
            </div>

            <div className="max-h-[190px] overflow-y-auto space-y-1">
              {filteredModels.map((m) => {
                const isSelected = selectedModels.includes(m);
                return (
                  <label
                    key={m}
                    className="flex items-center gap-3 py-2 px-2 text-[14px] text-[#141414] rounded-[6px] cursor-pointer hover:bg-white transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModel(m)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#B0521F] bg-white ring-1 ring-[#B0521F]'
                          : 'border-[#767676] bg-white hover:border-[#141414]'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#B0521F]" />}
                    </span>
                    <span className="truncate">{m}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-[#141414]">
              Price
            </h3>
            <div className="space-y-1.5">
              {PRICE_RANGES.map((range) => (
                <label
                  key={range.label}
                  className="flex items-center gap-3 py-2 text-[14px] text-[#141414] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="mobilePriceRange"
                    checked={priceRange === range.label}
                    onChange={() => onFilterChange('priceRange', range.label)}
                    className="w-5 h-5 accent-[#B0521F]"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* In-Stock Only */}
          <div className="pt-2 border-t border-[#E5E5E3]">
            <label className="flex items-center gap-3 py-2 text-[14px] font-semibold text-[#141414] cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
                className="w-5 h-5 accent-[#B0521F] rounded-[4px]"
              />
              <span>In-stock only</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E5E3] bg-[#FAFAF9] flex items-center gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex-1 min-h-[44px] bg-white border border-[#E5E5E3] text-[14px] font-semibold text-[#141414] rounded-[6px]"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] bg-[#B0521F] text-white text-[14px] font-semibold rounded-[6px]"
          >
            Show results ({totalResultsCount})
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBottomSheet;
