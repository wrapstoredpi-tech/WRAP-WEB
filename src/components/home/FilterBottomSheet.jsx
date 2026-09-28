import React from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { PRICE_RANGES } from '../../lib/useProducts';

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  filterOptions,
  totalResultsCount,
}) {
  if (!isOpen) return null;

  const colorOptions = filterOptions?.colors || ['Black', 'Brown', 'Navy', 'Tan', 'Grey', 'Clear'];
  const subcategoryOptions = filterOptions?.subcategories || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Filter products"
    >
      <div
        className="w-full max-w-lg bg-base-offwhite rounded-t-2xl sm:rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-body font-semibold text-neutral-900">Filter Collection</h2>
            <p className="text-xs text-neutral-500">{totalResultsCount} products matching</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 rounded-full"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Subcategories */}
          {subcategoryOptions.length > 0 && (
            <div>
              <label className="block text-xs uppercase font-semibold text-neutral-400 mb-2.5">
                Subcategory
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFilterChange('subcategory', 'All Types')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    !filters.subcategory_id && filters.subcategory === 'All Types'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  All Types
                </button>
                {subcategoryOptions.map((sub) => {
                  const isSelected = filters.subcategory_id === sub.id || filters.subcategory === sub.name;
                  return (
                    <button
                      key={sub.id || sub.name}
                      type="button"
                      onClick={() => onFilterChange('subcategory', sub.name)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <label className="block text-xs uppercase font-semibold text-neutral-400 mb-2.5">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onFilterChange('priceRange', 'All Prices')}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filters.priceRange === 'All Prices'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                All Prices
              </button>
              {PRICE_RANGES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => onFilterChange('priceRange', r.label)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    filters.priceRange === r.label
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-xs uppercase font-semibold text-neutral-400 mb-2.5">
              Color Tag
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onFilterChange('selectedColor', '')}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  !filters.selectedColor
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                Any Color
              </button>
              {colorOptions.map((c) => {
                const isSelected = filters.selectedColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onFilterChange('selectedColor', c)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <span>{c}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* In Stock Only toggle */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-body-sm font-semibold text-neutral-900">In-Stock Only</span>
              <p className="text-xs text-neutral-500">Hide out-of-stock designs</p>
            </div>
            <button
              type="button"
              onClick={() => onFilterChange('inStockOnly', !filters.inStockOnly)}
              className={`w-12 h-7 rounded-full transition-colors relative focus-visible:outline-neutral-900 ${
                filters.inStockOnly ? 'bg-neutral-900' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  filters.inStockOnly ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-neutral-200 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[44px] px-4 py-2 text-body-sm font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-body-sm flex-1 max-w-[200px]"
          >
            Show Results ({totalResultsCount})
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBottomSheet;
