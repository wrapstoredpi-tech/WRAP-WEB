import React, { useState, useMemo } from 'react';
import { X, RotateCcw, Check, Search, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ColorSwatch } from '../ui/ColorSwatch';
import { PRICE_RANGES } from '../../lib/useProducts';

/**
 * FilterSidebar
 * Props:
 *   filters        — current filter state (includes category, category_id, subcategory, subcategory_id)
 *   onFilterChange — (key, value) => void
 *   onResetFilters — () => void
 *   totalResultsCount — number
 *   filterOptions  — {
 *     categories,        // string[] starting with 'All Categories'
 *     categoryObjects,   // [{ id, name }]
 *     subcategoryMap,    // { [categoryId]: [{ id, name }] }
 *     brands, allColors, brandModelsMap
 *   }
 *   isMobileDrawer — boolean
 *   onClose        — () => void (only in drawer mode)
 */
export function FilterSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  filterOptions = {},
  isOpen = false,
  onClose,
  isMobileDrawer = false,
}) {
  const { category, category_id, subcategory, subcategory_id, brand, selectedModel, priceRange, selectedColor, inStockOnly } = filters;
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isColorsExpanded, setIsColorsExpanded] = useState(false);

  const {
    categories = ['All Categories'],
    categoryObjects = [],
    subcategoryMap = {},
    brands = ['All Brands', 'Apple', 'Samsung'],
    allColors = [],
    brandModelsMap = {},
  } = filterOptions;

  // Subcategories for the currently selected category
  const currentSubcategories = useMemo(() => {
    if (!category_id) return [];
    return subcategoryMap[category_id] || [];
  }, [category_id, subcategoryMap]);

  // Available models for the currently selected brand
  const availableModels = useMemo(() => {
    if (!brand || brand === 'All Brands') {
      return Array.from(new Set(Object.values(brandModelsMap).flat()));
    }
    return brandModelsMap[brand] || [];
  }, [brand, brandModelsMap]);

  const filteredModels = useMemo(() => {
    if (!modelSearchQuery.trim()) return availableModels;
    return availableModels.filter((model) =>
      model.toLowerCase().includes(modelSearchQuery.toLowerCase().trim())
    );
  }, [availableModels, modelSearchQuery]);

  const activeFilterCount = [
    category !== 'All Categories',
    Boolean(subcategory_id),
    brand !== 'All Brands' && brand !== '',
    Boolean(selectedModel),
    priceRange !== 'All Prices',
    Boolean(selectedColor),
    inStockOnly,
  ].filter(Boolean).length;

  const handleBrandSelect = (b) => {
    if (brand === b) {
      onFilterChange('brand', 'All Brands');
      onFilterChange('selectedModel', '');
    } else {
      onFilterChange('brand', b);
      onFilterChange('selectedModel', '');
    }
    setModelSearchQuery('');
  };

  const handleModelSelect = (m) => {
    onFilterChange('selectedModel', selectedModel === m ? '' : m);
  };

  const handleColorSelect = (c) => {
    onFilterChange('selectedColor', selectedColor === c ? '' : c);
  };

  const brandOptions = useMemo(() => {
    return brands.filter((b) => b !== 'All Brands');
  }, [brands]);

  const content = (
    <div className="space-y-7">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="text-metadata uppercase font-semibold text-neutral-900 tracking-editorial">
            Filters
          </span>
          {activeFilterCount > 0 && (
            <Badge variant="accent" size="sm">
              {activeFilterCount} Active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-neutral-500 hover:text-accent flex items-center gap-1 transition-colors font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PRIMARY FILTER: "Find cases for your phone"                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-100/90 border border-neutral-200 p-4 space-y-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-body-sm tracking-tight">
              <Smartphone className="w-4 h-4 text-accent" />
              <span>Find cases for your phone</span>
            </div>
            {selectedModel && (
              <Badge variant="accent" size="sm">
                Matched
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-neutral-500">
            Pick your device to filter by exact compatibility.
          </p>
        </div>

        {/* STEP 1: Pick Brand */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase tracking-editorial font-bold text-neutral-500 block">
            Step 1 &bull; Pick Brand
          </span>
          <div className={`grid gap-1.5 ${brandOptions.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {brandOptions.map((b) => {
              const isSelected = brand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBrandSelect(b)}
                  className={`
                    py-2 px-1.5 text-xs text-center font-medium border transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-base-offwhite text-neutral-700 border-neutral-300 hover:border-neutral-900'
                    }
                  `}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Pick Model */}
        <div className="space-y-2 pt-1 border-t border-neutral-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-editorial font-bold text-neutral-500">
              Step 2 &bull; Pick Model
            </span>
            {selectedModel && (
              <button
                type="button"
                onClick={() => onFilterChange('selectedModel', '')}
                className="text-[11px] text-accent hover:underline font-medium"
              >
                Clear model
              </button>
            )}
          </div>

          {availableModels.length > 4 && (
            <div className="relative">
              <input
                type="text"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                placeholder="Search phone model..."
                className="w-full text-xs bg-base-offwhite border border-neutral-300 py-1.5 pl-7 pr-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-accent"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2 pointer-events-none" />
            </div>
          )}

          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => {
                const isSelected = selectedModel === model;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleModelSelect(model)}
                    className={`
                      w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between border
                      ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-medium border-neutral-900'
                          : 'bg-base-offwhite text-neutral-700 border-neutral-200/80 hover:bg-neutral-200/60 hover:text-neutral-900'
                      }
                    `}
                  >
                    <span className="truncate">{model}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1.5" />}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-neutral-400 py-2 text-center">
                {availableModels.length === 0 ? 'Select a brand to see models.' : 'No matching models found.'}
              </p>
            )}
          </div>

          {selectedModel && (
            <div className="pt-1.5 flex items-center justify-between text-xs bg-accent-light text-accent p-2 border border-accent-border">
              <span className="font-medium truncate">Active: {selectedModel}</span>
              <button
                type="button"
                onClick={() => onFilterChange('selectedModel', '')}
                className="text-neutral-500 hover:text-neutral-900 font-bold ml-2"
                aria-label="Remove model filter"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECONDARY FILTERS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* 1. Category Filter (from real categories table) */}
      <div className="space-y-3">
        <label className="text-metadata uppercase font-semibold text-neutral-500 tracking-editorial block">
          Category
        </label>
        <div className="space-y-1">
          {categories.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterChange('category', cat)}
                className={`
                  w-full text-left px-2.5 py-2 text-body-sm transition-colors flex items-center justify-between border
                  ${
                    isSelected
                      ? 'bg-neutral-900 text-white font-medium border-neutral-900'
                      : 'bg-transparent text-neutral-700 border-transparent hover:bg-neutral-100 hover:text-neutral-900'
                  }
                `}
              >
                <span>{cat}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
              </button>
            );
          })}
        </div>

        {/* Nested subcategories when a category is selected */}
        {currentSubcategories.length > 0 && (
          <div className="ml-3 border-l border-neutral-200 pl-3 space-y-0.5 pt-1">
            <span className="text-[10px] uppercase tracking-editorial font-bold text-neutral-400 block mb-1">
              Sub-type
            </span>
            {/* All sub-types */}
            <button
              type="button"
              onClick={() => onFilterChange('subcategory', 'All Types')}
              className={`
                w-full text-left px-2 py-1.5 text-xs transition-colors flex items-center justify-between border
                ${
                  !subcategory_id
                    ? 'bg-neutral-800 text-white font-medium border-neutral-800'
                    : 'bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-900'
                }
              `}
            >
              <span>All Types</span>
              {!subcategory_id && <Check className="w-3 h-3 text-accent" />}
            </button>
            {currentSubcategories.map((sub) => {
              const isSubSelected = subcategory_id === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onFilterChange('subcategory', sub.name)}
                  className={`
                    w-full text-left px-2 py-1.5 text-xs transition-colors flex items-center justify-between border
                    ${
                      isSubSelected
                        ? 'bg-neutral-800 text-white font-medium border-neutral-800'
                        : 'bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-900'
                    }
                  `}
                >
                  <span>{sub.name}</span>
                  {isSubSelected && <Check className="w-3 h-3 text-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Color Filter */}
      {allColors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-metadata uppercase font-semibold text-neutral-500 tracking-editorial">
              Color Variant
            </label>
            {selectedColor && (
              <button
                type="button"
                onClick={() => onFilterChange('selectedColor', '')}
                className="text-[11px] text-accent hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>
          {selectedColor && (
            <div className="flex items-center gap-2 text-xs text-neutral-700 bg-neutral-100 px-2.5 py-1.5 border border-neutral-200">
              <span className="text-neutral-400">Filtering:</span>
              <strong className="font-semibold text-neutral-900">{selectedColor}</strong>
            </div>
          )}
          <div className="pt-1">
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {(isColorsExpanded ? allColors : allColors.slice(0, 8)).map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorSelect(c)}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 text-xs border text-left transition-colors
                      ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                          : 'border-neutral-200/80 bg-base-offwhite text-neutral-700 hover:border-neutral-400'
                      }
                    `}
                  >
                    <ColorSwatch colors={[c]} size="sm" interactive={false} />
                    <span className="truncate">{c}</span>
                  </button>
                );
              })}
            </div>
            {allColors.length > 8 && (
              <button
                type="button"
                onClick={() => setIsColorsExpanded(!isColorsExpanded)}
                className="mt-2 text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-medium transition-colors"
              >
                <span>{isColorsExpanded ? 'Show less colors' : `+${allColors.length - 8} more colors`}</span>
                {isColorsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Price Range Filter */}
      <div className="space-y-3">
        <label className="text-metadata uppercase font-semibold text-neutral-500 tracking-editorial block">
          Price Range
        </label>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isSelected = priceRange === range.label;
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => onFilterChange('priceRange', range.label)}
                className={`
                  w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between border
                  ${
                    isSelected
                      ? 'bg-neutral-900 text-white font-medium border-neutral-900'
                      : 'bg-transparent text-neutral-700 border-transparent hover:bg-neutral-100 hover:text-neutral-900'
                  }
                `}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Stock Availability Toggle */}
      <div className="pt-2 border-t border-neutral-200">
        <label className="flex items-center justify-between cursor-pointer select-none py-1">
          <span className="text-body-sm font-medium text-neutral-800">
            In-Stock Only
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
            className="w-4 h-4 accent-accent rounded-none cursor-pointer"
          />
        </label>
      </div>
    </div>
  );

  // Mobile drawer mode
  if (isMobileDrawer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-semibold text-h3 text-neutral-900">
              Filter Products
            </h3>
            {totalResultsCount !== undefined && (
              <span className="text-xs text-neutral-500">
                ({totalResultsCount} results)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-900"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {content}

        <div className="pt-4 border-t border-neutral-200 sticky bottom-0 bg-base-offwhite flex gap-3">
          <Button variant="secondary" size="md" isFullWidth onClick={onResetFilters}>
            Reset
          </Button>
          <Button variant="primary" size="md" isFullWidth onClick={onClose}>
            View Results ({totalResultsCount})
          </Button>
        </div>
      </div>
    );
  }

  // Standard Desktop Sticky Sidebar
  return (
    <aside className="w-64 xl:w-72 shrink-0 hidden lg:block sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      {content}
    </aside>
  );
}

export default FilterSidebar;
