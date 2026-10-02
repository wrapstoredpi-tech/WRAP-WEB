import React, { useState } from 'react';
import { X, Check, RotateCcw, Search } from 'lucide-react';
import { PRICE_RANGES } from '../../lib/useProducts';
import { ColorSwatch } from '../ui/ColorSwatch';

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  filterOptions = {},
  products = [],
  totalResultsCount = 0,
}) {
  const [modelSearch, setModelSearch] = useState('');

  if (!isOpen) return null;

  const {
    categories = ['All Categories'],
    categoryObjects = [],
    subcategoryMap = {},
    brands = ['All Brands', 'Apple', 'Samsung'],
    allColors = [],
    brandModelsMap = {},
  } = filterOptions;

  const brandOptions = brands.filter((b) => b !== 'All Brands');

  // Available models for currently selected brand
  const availableModels = (!filters.brand || filters.brand === 'All Brands')
    ? Array.from(new Set(Object.values(brandModelsMap).flat()))
    : brandModelsMap[filters.brand] || [];

  const filteredModels = modelSearch.trim()
    ? availableModels.filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase().trim()))
    : availableModels;

  // Subcategories for current category
  const currentSubcategories = (() => {
    if (filters.category_id) {
      return subcategoryMap[filters.category_id] || [];
    }
    const catObj = categoryObjects.find((c) => c.name === filters.category);
    if (catObj) return subcategoryMap[catObj.id] || [];
    return [];
  })();

  const activeFilterCount = [
    filters.category !== 'All' && filters.category !== 'All Categories',
    Boolean(filters.subcategory_id) || (filters.subcategory && filters.subcategory !== 'All Types'),
    filters.brand && filters.brand !== 'All Brands',
    Boolean(filters.selectedModel),
    filters.priceRange && filters.priceRange !== 'All Prices',
    Boolean(filters.selectedColor),
    filters.inStockOnly,
  ].filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#141414]/35 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Filter products"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-lg sm:rounded-lg border border-[#E7E5E4] shadow-modal overflow-hidden flex flex-col max-h-[85vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header ────────────────────────────────────────────── */}
        <div className="p-5 border-b border-[#E7E5E4] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold text-[#141414] tracking-tight">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#141414] text-white text-[10px] font-semibold">
                  {activeFilterCount} Active
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#666664]">{totalResultsCount} products matching</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#666664] hover:text-[#141414] rounded-md transition-colors"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Filter Sections Scroll Body ───────────────────────────── */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 divide-y divide-[#E7E5E4]">
          
          {/* Section 1: Categories & Subcategories */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight">
                Categories
              </label>
              {filters.category !== 'All' && filters.category !== 'All Categories' && (
                <button
                  type="button"
                  onClick={() => onFilterChange('category', 'All')}
                  className="text-[11px] text-[#9E381A] hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected =
                  filters.category === cat ||
                  (cat === 'All Categories' && (filters.category === 'All' || filters.category === 'All Categories'));
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onFilterChange('category', cat === 'All Categories' ? 'All' : cat)}
                    className={`h-9 px-3.5 rounded-lg text-[13px] border transition-colors ${
                      isSelected
                        ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                        : 'bg-[#FAFAF9] text-[#141414] border-[#E7E5E4] hover:border-[#D6D3D1] font-normal'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Subcategories */}
            {currentSubcategories.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-semibold text-[#A8A29E] block mb-1.5">
                  Sub-types
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onFilterChange('subcategory', 'All Types')}
                    className={`h-8 px-3 rounded-md text-[12px] border transition-colors ${
                      !filters.subcategory_id || filters.subcategory === 'All Types'
                        ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                        : 'bg-white text-[#666664] border-[#E7E5E4] hover:border-[#D6D3D1]'
                    }`}
                  >
                    All Types
                  </button>
                  {currentSubcategories.map((sub) => {
                    const isSubSelected = filters.subcategory_id === sub.id || filters.subcategory === sub.name;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onFilterChange('subcategory', sub.name)}
                        className={`h-8 px-3 rounded-md text-[12px] border transition-colors ${
                          isSubSelected
                            ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                            : 'bg-white text-[#666664] border-[#E7E5E4] hover:border-[#D6D3D1]'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Phone Device Compatibility */}
          <div className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight">
                Device Compatibility
              </label>
              {(filters.brand !== 'All Brands' || filters.selectedModel) && (
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('brand', 'All Brands');
                    onFilterChange('selectedModel', '');
                  }}
                  className="text-[11px] text-[#9E381A] hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {brandOptions.map((b) => {
                const isSelected = filters.brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      onFilterChange('brand', isSelected ? 'All Brands' : b);
                      onFilterChange('selectedModel', '');
                    }}
                    className={`h-9 px-3 rounded-lg text-[13px] border transition-colors text-center ${
                      isSelected
                        ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                        : 'bg-[#FAFAF9] text-[#141414] border-[#E7E5E4] hover:border-[#D6D3D1]'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>

            {availableModels.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search phone model..."
                    className="w-full text-[13px] bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg py-2 pl-8 pr-3 text-[#141414] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#141414]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-2.5 top-2.5 pointer-events-none" />
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {filteredModels.map((m) => {
                    const isSelected = filters.selectedModel === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onFilterChange('selectedModel', isSelected ? '' : m)}
                        className={`h-7 px-2.5 rounded-md text-[12px] border transition-colors ${
                          isSelected
                            ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                            : 'bg-white text-[#666664] border-[#E7E5E4] hover:border-[#D6D3D1]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Price Range (₹ INR) */}
          <div className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight">
                Price Range
              </label>
              {filters.priceRange !== 'All Prices' && (
                <button
                  type="button"
                  onClick={() => onFilterChange('priceRange', 'All Prices')}
                  className="text-[11px] text-[#9E381A] hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((r) => {
                const isSelected = filters.priceRange === r.label;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => onFilterChange('priceRange', r.label)}
                    className={`h-9 px-3 rounded-lg text-[13px] border transition-colors text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                        : 'bg-[#FAFAF9] text-[#141414] border-[#E7E5E4] hover:border-[#D6D3D1]'
                    }`}
                  >
                    <span>{r.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Color Variants */}
          {allColors.length > 0 && (
            <div className="space-y-3 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight">
                  Colour
                </label>
                {filters.selectedColor && (
                  <button
                    type="button"
                    onClick={() => onFilterChange('selectedColor', '')}
                    className="text-[11px] text-[#9E381A] hover:underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {allColors.map((c) => {
                  const isSelected = filters.selectedColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onFilterChange('selectedColor', isSelected ? '' : c)}
                      className={`h-9 px-3 rounded-lg text-[13px] border flex items-center gap-2 transition-colors ${
                        isSelected
                          ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                          : 'bg-[#FAFAF9] text-[#141414] border-[#E7E5E4] hover:border-[#D6D3D1]'
                      }`}
                    >
                      <ColorSwatch colors={[c]} size="xs" interactive={false} />
                      <span className="truncate">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: In Stock Only */}
          <div className="pt-5 flex items-center justify-between">
            <div>
              <span className="text-[14px] font-semibold text-[#141414] block">In-Stock Only</span>
              <span className="text-[12px] text-[#666664]">Hide sold-out objects</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filters.inStockOnly}
              onClick={() => onFilterChange('inStockOnly', !filters.inStockOnly)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                filters.inStockOnly ? 'bg-[#141414]' : 'bg-[#D6D3D1]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── Sticky Bottom Actions ─────────────────────────────────── */}
        <div className="p-4 px-6 border-t border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="h-11 px-5 rounded-lg border border-[#E7E5E4] font-semibold text-[13px] text-[#666664] hover:text-[#141414] bg-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 bg-[#9E381A] hover:bg-[#832C13] text-white rounded-lg font-semibold text-[13px] flex-1 transition-colors"
          >
            Show {totalResultsCount} Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBottomSheet;
