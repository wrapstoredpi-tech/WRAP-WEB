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
    selectedModel = '',
    series = '',
    priceRange = 'All Prices',
    selectedColor = '',
    inStockOnly = false,
  } = filters;

  const [modelSearch, setModelSearch] = useState('');

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
      Boolean(selectedModel),
      priceRange !== 'All Prices',
      Boolean(selectedColor),
      inStockOnly,
    ].filter(Boolean).length;
  }, [category, subcategory, brand, series, selectedModel, priceRange, selectedColor, inStockOnly]);

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
                  onFilterChange('selectedModel', '');
                }}
                className="w-4 h-4 accent-[#B0521F]"
              />
              <span>{b === 'Apple' ? 'Apple (iPhone)' : b}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Phone Model Search & List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#141414]">
            Compatible Model
          </h3>
          {selectedModel && (
            <button
              type="button"
              onClick={() => onFilterChange('selectedModel', '')}
              className="text-[12px] text-[#B0521F] hover:underline"
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

        <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1">
          {filteredModels.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onFilterChange('selectedModel', selectedModel === m ? '' : m)}
              className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] flex items-center justify-between transition-colors ${
                selectedModel === m
                  ? 'bg-white border border-[#141414] font-semibold text-[#141414]'
                  : 'hover:bg-white text-[#6B6B6B] hover:text-[#141414]'
              }`}
            >
              <span className="truncate">{m}</span>
              {selectedModel === m && <Check className="w-3.5 h-3.5 text-[#B0521F]" />}
            </button>
          ))}
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
