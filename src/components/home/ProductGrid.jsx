import React from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from '../ui/Skeleton';

export function ProductGrid({
  products = [],
  isLoading = false,
  sortBy = 'newest',
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
  onResetFilters,
  onAddToCart,
  showAllToggle,
  onToggleShowAll,
  showingAllDesigns,
}) {
  return (
    <div className="w-full space-y-6">
      {/* Top Listing Bar: Filter Button, Show All Toggle, Sort Control */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          {/* Filter Button opening Bottom Sheet */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-900 font-semibold text-body-sm flex items-center gap-2 transition-colors shadow-2xs"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white font-semibold text-[11px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quiet "Show all designs" toggle */}
          {showAllToggle && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                showingAllDesigns
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {showingAllDesigns ? 'Showing All Designs' : 'Show All Designs'}
            </button>
          )}
        </div>

        {/* Sort Control Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by-select" className="sr-only">
            Sort by
          </label>
          <div className="relative">
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="min-h-[44px] bg-white border border-neutral-300 hover:border-neutral-900 rounded-xl px-3 py-2 pr-8 text-body-sm font-semibold text-neutral-900 focus:outline-none appearance-none cursor-pointer shadow-2xs transition-colors"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="in_stock">In Stock First</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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
        <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200/80 p-8 max-w-md mx-auto space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-body font-semibold text-neutral-900">No compatible designs found</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            There are no products matching your selected phone model and filters. Try clearing some filters or show all designs.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onResetFilters}
              className="min-h-[44px] px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-body-sm rounded-xl transition-colors"
            >
              Show all designs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductGrid;
