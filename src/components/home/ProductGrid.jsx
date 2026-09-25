import React from 'react';
import { SlidersHorizontal, ArrowUpDown, PackageOpen, RotateCcw } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SORT_OPTIONS } from '../../lib/useProducts';

export function ProductGrid({
  products = [],
  isLoading = false,
  sortBy = 'newest',
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
  onResetFilters,
  onAddToCart,
  onQuickView,
}) {
  return (
    <div className="flex-1 min-w-0 space-y-6">
      
      {/* Grid Toolbar: Item count, Mobile Filter Trigger, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        
        {/* Left: Product count & active filter summary */}
        <div className="flex items-center gap-3">
          <span className="text-body-sm font-medium text-neutral-900">
            {isLoading ? (
              'Loading objects...'
            ) : (
              <span>
                Showing <strong className="font-semibold text-neutral-900">{products.length}</strong> {products.length === 1 ? 'Object' : 'Objects'}
              </span>
            )}
          </span>

          {/* Mobile Filter Button (< 1024px) */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 text-body-sm font-medium border border-neutral-300 bg-base-offwhite hover:border-neutral-900 transition-colors ml-auto sm:ml-0"
            aria-label="Filter products"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-700" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="accent" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </button>
        </div>

        {/* Right: Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="sort-select" className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial shrink-0">
            Sort:
          </label>
          <div className="relative">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="
                appearance-none bg-base-offwhite border border-neutral-300 text-body-sm font-medium
                text-neutral-900 py-1.5 pl-3 pr-8 focus:outline-none focus:border-accent
                cursor-pointer hover:border-neutral-900 transition-colors
              "
            >
              {(SORT_OPTIONS || [
                { label: 'Newest Arrivals', value: 'newest' },
                { label: 'Price: Low to High', value: 'price_asc' },
                { label: 'Price: High to Low', value: 'price_desc' },
              ]).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Grid Content: Loading Skeletons, Empty State, or Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3.5 gap-y-6 sm:gap-x-6 sm:gap-y-10">
          {Array.from({ length: 8 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 text-center max-w-md mx-auto space-y-4 bg-neutral-100/60 border border-neutral-200/80 p-8">
          <div className="w-12 h-12 bg-neutral-200/80 text-neutral-600 rounded-full flex items-center justify-center mx-auto">
            <PackageOpen className="w-6 h-6 stroke-1" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-h3 font-medium text-neutral-900">
              No matching objects found
            </h3>
            <p className="text-body-sm text-neutral-500">
              We couldn't find any products matching your active filters. Try loosening your selection or clear filters.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={onResetFilters}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      ) : (
        /* 4 col desktop / 2 col mobile */
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3.5 gap-y-6 sm:gap-x-6 sm:gap-y-10">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}

    </div>
  );
}

export default ProductGrid;
