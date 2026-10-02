import React from 'react';
import { SlidersHorizontal, ArrowUpDown, X, RotateCcw } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from '../ui/Skeleton';

export function ProductGrid({
  products = [],
  totalAllProducts = 0,
  isLoading = false,
  sortBy = 'newest',
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
  filters = {},
  onFilterChange,
  onResetFilters,
  onAddToCart,
  showAllToggle,
  onToggleShowAll,
  showingAllDesigns,
}) {
  // Collect active filter tags for one-click removal (excluding primary category tab)
  const activeTags = [];

  if (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All') {
    activeTags.push({
      key: 'subcategory',
      label: `Type: ${filters.subcategory}`,
      onRemove: () => onFilterChange && onFilterChange('subcategory', 'All Types'),
    });
  }

  if (filters.brand && filters.brand !== 'All Brands' && filters.brand !== '') {
    activeTags.push({
      key: 'brand',
      label: `Brand: ${filters.brand}`,
      onRemove: () => {
        onFilterChange && onFilterChange('brand', 'All Brands');
        onFilterChange && onFilterChange('selectedModel', '');
      },
    });
  }

  if (filters.selectedModel) {
    activeTags.push({
      key: 'selectedModel',
      label: `Model: ${filters.selectedModel}`,
      onRemove: () => onFilterChange && onFilterChange('selectedModel', ''),
    });
  }

  if (filters.priceRange && filters.priceRange !== 'All Prices') {
    activeTags.push({
      key: 'priceRange',
      label: `Price: ${filters.priceRange}`,
      onRemove: () => onFilterChange && onFilterChange('priceRange', 'All Prices'),
    });
  }

  if (filters.selectedColor) {
    activeTags.push({
      key: 'selectedColor',
      label: `Colour: ${filters.selectedColor}`,
      onRemove: () => onFilterChange && onFilterChange('selectedColor', ''),
    });
  }

  if (filters.inStockOnly) {
    activeTags.push({
      key: 'inStockOnly',
      label: 'In-Stock Only',
      onRemove: () => onFilterChange && onFilterChange('inStockOnly', false),
    });
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ── Top Bar: Filter Trigger, Results Count, Sort ──────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-[#E7E5E4]">
        
        {/* Left Side: Filter Control & Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-lg border text-[13px] font-semibold flex items-center gap-2 transition-colors ${
              activeFilterCount > 0
                ? 'bg-[#141414] text-white border-[#141414]'
                : 'bg-white text-[#141414] border-[#E7E5E4] hover:border-[#141414]'
            }`}
            aria-label="Filter products"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-4 px-1 rounded-full bg-white text-[#141414] font-semibold text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showAllToggle && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg text-[13px] border transition-colors ${
                showingAllDesigns
                  ? 'bg-[#141414] text-white border-[#141414] font-semibold'
                  : 'bg-white text-[#666664] border-[#E7E5E4] hover:border-[#D6D3D1] font-normal'
              }`}
            >
              {showingAllDesigns ? 'All Devices' : 'Show All Designs'}
            </button>
          )}
        </div>

        {/* Right Side: Results Count & Sort Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[13px] text-[#666664] font-normal hidden sm:inline-block">
            {products.length} {products.length === 1 ? 'object' : 'objects'}
          </span>

          <div className="relative">
            <label htmlFor="sort-by-select" className="sr-only">
              Sort by
            </label>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="h-9 sm:h-10 bg-white border border-[#E7E5E4] hover:border-[#D6D3D1] rounded-lg pl-3 pr-8 py-1.5 text-[13px] font-normal text-[#141414] focus:outline-none focus:border-[#141414] appearance-none cursor-pointer transition-colors"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="in_stock">In Stock First</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A8A29E] absolute right-2.5 top-3 sm:top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Active Filters Chips Bar (Shows ONLY when non-category filters are active) ── */}
      {activeTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-2.5 bg-white rounded-lg border border-[#E7E5E4] animate-fade-in">
          <span className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-tight mr-1">
            Filtered:
          </span>

          {activeTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAFAF9] text-[#141414] rounded-md text-[12px] font-semibold border border-[#E7E5E4]"
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.onRemove}
                className="text-[#666664] hover:text-[#141414] p-0.5"
                aria-label={`Remove ${tag.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12px] font-semibold text-[#666664] hover:text-[#9E381A] flex items-center gap-1 ml-auto px-2 py-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* ── Product Grid (Locked 4:5 ratios) ──────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-1">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 sm:py-24 text-center border border-dashed border-[#E7E5E4] rounded-lg bg-white p-8 space-y-3">
          <p className="text-[16px] font-semibold text-[#141414]">
            No objects match your criteria
          </p>
          <p className="text-[13px] text-[#666664] max-w-sm mx-auto">
            Try adjusting your search filters or clear your selection to explore the complete catalog.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 px-5 rounded-lg bg-[#141414] hover:bg-[#262624] text-white font-semibold text-[13px] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductGrid;
