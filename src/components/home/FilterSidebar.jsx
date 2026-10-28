import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { PRICE_RANGES } from '../../lib/useProducts';

export function FilterSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  filterOptions = {},
}) {
  const {
    category = 'All',
    subcategory = 'All Types',
    brand = 'All Brands',
    selectedModel = [],
    series = '',
    priceRange = 'All Prices',
    selectedColor = '',
    inStockOnly = false,
  } = filters;

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
    categories = ['All Categories'],
    categoryObjects = [],
    subcategoryMap = {},
    brands = ['All Brands', 'Apple', 'Samsung'],
    allColors = [],
    brandModelsMap = {},
  } = filterOptions;

  const activeFilterCount = useMemo(() => {
    return [
      category !== 'All' && category !== 'All Categories',
      subcategory !== 'All Types' && subcategory !== 'All',
      brand !== 'All Brands' && brand !== '',
      Boolean(series),
      selectedModels.length > 0,
      priceRange !== 'All Prices',
      Boolean(selectedColor),
      inStockOnly,
    ].filter(Boolean).length;
  }, [category, subcategory, brand, series, selectedModels, priceRange, selectedColor, inStockOnly]);

  // Models available based on selected brand
  const availableModels = useMemo(() => {
    if (!brand || brand === 'All Brands') {
      return Array.from(new Set(Object.values(brandModelsMap).flat()));
    }
    return brandModelsMap[brand] || [];
  }, [brand, brandModelsMap]);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels.slice(0, 10);
    return availableModels
      .filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase().trim()))
      .slice(0, 15);
  }, [availableModels, modelSearch]);

  return (
    <aside className="w-full space-y-6 select-none" aria-label="Product filters">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
        <h2 className="text-[16px] font-semibold text-[#141414]">
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12px] font-semibold text-[#B0521F] hover:underline cursor-pointer"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Active Series Indicator */}
      {series && (
        <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] text-[12px]">
          <span className="text-[#141414]">Series: <strong>{series}</strong></span>
          <button
            type="button"
            onClick={() => onFilterChange('series', '')}
            className="text-[#B0521F] hover:underline font-semibold cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Brand Selection */}
      <div className="space-y-2">
        <h3 className="text-[14px] font-semibold text-[#141414]">
          Brand
        </h3>
        <div className="space-y-1">
          {['All Brands', 'Apple', 'Samsung'].map((b) => (
            <label
              key={b}
              className="flex items-center gap-2.5 py-1 text-[14px] text-[#141414] cursor-pointer hover:text-[#B0521F]"
            >
              <input
                type="radio"
                name="brand"
                checked={brand === b || (b === 'All Brands' && (!brand || brand === 'All Brands'))}
                onChange={() => {
                  onFilterChange('brand', b);
                  onFilterChange('selectedModel', []);
                }}
                className="w-4 h-4 accent-[#B0521F]"
              />
              <span>{b === 'Apple' ? 'Apple (iPhone)' : b}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Phone Model Search & List (Multi-Select Radio Button) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#141414]">
            Compatible Model {selectedModels.length > 0 && `(${selectedModels.length})`}
          </h3>
          {selectedModels.length > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('selectedModel', [])}
              className="text-[12px] text-[#B0521F] hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter models..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            className="w-full bg-white border border-[#E5E5E3] rounded-[6px] pl-8 pr-3 py-1.5 text-[12px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414]"
          />
        </div>

        <div className="max-h-[190px] overflow-y-auto space-y-1 pr-1">
          {filteredModels.map((m) => {
            const isSelected = selectedModels.includes(m);
            return (
              <label
                key={m}
                className="flex items-center gap-2.5 py-1 text-[13px] text-[#141414] cursor-pointer hover:text-[#B0521F] select-none"
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

      {/* Price Range */}
      <div className="space-y-2 pt-2 border-t border-[#E5E5E3]">
        <h3 className="text-[14px] font-semibold text-[#141414]">
          Price
        </h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-2.5 py-1 text-[14px] text-[#141414] cursor-pointer hover:text-[#B0521F]"
            >
              <input
                type="radio"
                name="priceRange"
                checked={priceRange === range.label}
                onChange={() => onFilterChange('priceRange', range.label)}
                className="w-4 h-4 accent-[#B0521F]"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* In-Stock Filter */}
      <div className="pt-2 border-t border-[#E5E5E3]">
        <label className="flex items-center gap-2.5 py-1 text-[14px] font-semibold text-[#141414] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
            className="w-4 h-4 accent-[#B0521F] rounded-[4px]"
          />
          <span>In-stock only</span>
        </label>
      </div>
    </aside>
  );
}

export default FilterSidebar;
