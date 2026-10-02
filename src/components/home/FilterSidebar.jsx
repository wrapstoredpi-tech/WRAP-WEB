import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ColorSwatch } from '../ui/ColorSwatch';
import { PRICE_RANGES } from '../../lib/useProducts';

/**
 * FilterSidebar
 * Quiet, architectural filter panel for desktop sidebar or drawer.
 */
export function FilterSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  filterOptions = {},
  products = [],
  isOpen = false,
  onClose,
  isMobileDrawer = false,
}) {
  const {
    category = 'All Categories',
    category_id = null,
    subcategory = 'All Types',
    subcategory_id = null,
    brand = 'All Brands',
    selectedModel = '',
    priceRange = 'All Prices',
    selectedColor = '',
    inStockOnly = false,
  } = filters;

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

  const activeFilterCount = useMemo(() => {
    return [
      category !== 'All Categories' && category !== 'All',
      Boolean(subcategory_id) || (subcategory !== 'All Types' && subcategory !== 'All'),
      brand !== 'All Brands' && brand !== '',
      Boolean(selectedModel),
      priceRange !== 'All Prices',
      Boolean(selectedColor),
      inStockOnly,
    ].filter(Boolean).length;
  }, [category, subcategory_id, subcategory, brand, selectedModel, priceRange, selectedColor, inStockOnly]);

  const currentSubcategories = useMemo(() => {
    if (!category_id) {
      const found = categoryObjects.find((c) => c.name === category);
      if (found) return subcategoryMap[found.id] || [];
      return [];
    }
    return subcategoryMap[category_id] || [];
  }, [category_id, category, categoryObjects, subcategoryMap]);

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

  const brandOptions = useMemo(() => {
    return brands.filter((b) => b !== 'All Brands');
  }, [brands]);

  const content = (
    <div className="space-y-6">
      {/* ── Top Header / Reset ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#141414]">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#141414] text-white text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12px] text-[#666664] hover:text-[#141414] flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── 1. Device Fit ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight block">
          Device Compatibility
        </label>

        <div className="grid grid-cols-2 gap-1.5">
          {brandOptions.map((b) => {
            const isSelected = brand === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => {
                  onFilterChange('brand', isSelected ? 'All Brands' : b);
                  onFilterChange('selectedModel', '');
                }}
                className={`
                  h-9 px-3 text-[13px] rounded-lg border transition-colors flex items-center justify-between
                  ${
                    isSelected
                      ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                      : 'bg-white text-[#141414] border-[#E7E5E4] hover:border-[#D6D3D1] font-normal'
                  }
                `}
              >
                <span>{b}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>

        {availableModels.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="relative">
              <input
                type="text"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full text-[12px] bg-white border border-[#E7E5E4] rounded-lg py-1.5 pl-7 pr-2.5 text-[#141414] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#141414]"
              />
              <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-2 top-2 pointer-events-none" />
            </div>

            <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-1">
              {filteredModels.map((m) => {
                const isSelected = selectedModel === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onFilterChange('selectedModel', isSelected ? '' : m)}
                    className={`
                      w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors flex items-center justify-between
                      ${
                        isSelected
                          ? 'bg-[#141414] text-white font-semibold'
                          : 'text-[#141414] hover:bg-[#F5F5F4]'
                      }
                    `}
                  >
                    <span className="truncate">{m}</span>
                    {isSelected && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Category ───────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-[#E7E5E4]">
        <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight block">
          Category
        </label>
        <div className="space-y-1">
          {categories.map((cat) => {
            const isSelected =
              category === cat || (cat === 'All Categories' && (category === 'All' || category === 'All Categories'));

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterChange('category', cat === 'All Categories' ? 'All' : cat)}
                className={`
                  w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors flex items-center justify-between
                  ${
                    isSelected
                      ? 'bg-[#141414] text-white font-semibold'
                      : 'text-[#666664] hover:text-[#141414] hover:bg-[#F5F5F4]'
                  }
                `}
              >
                <span>{cat}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Price Range ────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-[#E7E5E4]">
        <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight block">
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
                  w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors flex items-center justify-between
                  ${
                    isSelected
                      ? 'bg-[#141414] text-white font-semibold'
                      : 'text-[#666664] hover:text-[#141414] hover:bg-[#F5F5F4]'
                  }
                `}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Color ──────────────────────────────────────────────────────── */}
      {allColors.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E7E5E4]">
          <label className="text-[11px] uppercase font-semibold text-[#A8A29E] tracking-tight block">
            Colour
          </label>
          <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1">
            {(isColorsExpanded ? allColors : allColors.slice(0, 6)).map((c) => {
              const isSelected = selectedColor.toLowerCase().trim() === c.toLowerCase().trim();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onFilterChange('selectedColor', isSelected ? '' : c)}
                  className={`
                    px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-1.5 transition-colors text-left truncate
                    ${
                      isSelected
                        ? 'bg-[#141414] text-white font-semibold'
                        : 'text-[#666664] hover:text-[#141414] hover:bg-[#F5F5F4]'
                    }
                  `}
                >
                  <ColorSwatch colors={[c]} size="xs" interactive={false} />
                  <span className="truncate">{c}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. In-Stock ───────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between">
        <span className="text-[13px] font-normal text-[#141414]">In-Stock Only</span>
        <button
          type="button"
          role="switch"
          aria-checked={inStockOnly}
          onClick={() => onFilterChange('inStockOnly', !inStockOnly)}
          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
            inStockOnly ? 'bg-[#141414]' : 'bg-[#D6D3D1]'
          }`}
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
              inStockOnly ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );

  if (isMobileDrawer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
          <h3 className="text-[17px] font-semibold text-[#141414]">Filters</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#666664] hover:text-[#141414] rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {content}
      </div>
    );
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 no-scrollbar">
      {content}
    </aside>
  );
}

export default FilterSidebar;
