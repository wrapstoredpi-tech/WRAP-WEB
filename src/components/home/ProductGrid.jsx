import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products = [],
  title = 'All Products',
  breadcrumb,
  isLoading = false,
  sortBy = 'newest',
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
  filters = {},
  onFilterChange,
  onResetFilters,
}) {
  const [displayCount, setDisplayCount] = useState(12);

  // Collect active filter tags for one-click removal
  const activeTags = [];

  if (filters.brand && filters.brand !== 'All Brands' && filters.brand !== '') {
    activeTags.push({
      key: 'brand',
      label: `Brand: ${filters.brand}`,
      onRemove: () => {
        onFilterChange('brand', 'All Brands');
        onFilterChange('selectedModel', '');
      },
    });
  }

  if (filters.series) {
    activeTags.push({
      key: 'series',
      label: `Series: ${filters.series}`,
      onRemove: () => onFilterChange('series', ''),
    });
  }

  if (filters.selectedModel) {
    activeTags.push({
      key: 'selectedModel',
      label: `Model: ${filters.selectedModel}`,
      onRemove: () => onFilterChange('selectedModel', ''),
    });
  }

  if (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All') {
    activeTags.push({
      key: 'subcategory',
      label: `Type: ${filters.subcategory}`,
      onRemove: () => onFilterChange('subcategory', 'All Types'),
    });
  }

  if (filters.priceRange && filters.priceRange !== 'All Prices') {
    activeTags.push({
      key: 'priceRange',
      label: `Price: ${filters.priceRange}`,
      onRemove: () => onFilterChange('priceRange', 'All Prices'),
    });
  }

  if (filters.inStockOnly) {
    activeTags.push({
      key: 'inStockOnly',
      label: 'In-stock only',
      onRemove: () => onFilterChange('inStockOnly', false),
    });
  }

  if (filters.selectedColor) {
    activeTags.push({
      key: 'selectedColor',
      label: `Colour: ${filters.selectedColor}`,
      onRemove: () => onFilterChange('selectedColor', ''),
    });
  }

  const visibleProducts = products.slice(0, displayCount);
  const hasMore = displayCount < products.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 12);
  };

  return (
    <div className="w-full space-y-5">
      {/* Optional Breadcrumb */}
      {breadcrumb && (
        <nav aria-label="Breadcrumb" className="text-[12px] text-[#6B6B6B]">
          {breadcrumb}
        </nav>
      )}

      {/* Title with product count in plain text & Sort aligned right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E3]">
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden min-h-[44px] px-3.5 rounded-[6px] border border-[#E5E5E3] bg-white text-[14px] font-semibold text-[#141414] flex items-center gap-2"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-[12px] text-[#B0521F]">({activeFilterCount})</span>
            )}
          </button>

          <div>
            <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
              {title} <span className="text-[16px] font-normal text-[#6B6B6B]">({products.length})</span>
            </h1>
          </div>
        </div>

        {/* Sort aligned right */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="sort-dropdown" className="text-[14px] text-[#6B6B6B]">
            Sort:
          </label>
          <div className="relative">
            <select
              id="sort-dropdown"
              value={sortBy}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="bg-white border border-[#E5E5E3] rounded-[6px] pl-3 pr-8 py-2 min-h-[40px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] appearance-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Discount</option>
              <option value="in_stock">In Stock First</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active filters as removable chips above grid */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
          {activeTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E5E3] rounded-[6px] text-[12px] text-[#141414]"
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.onRemove}
                className="hover:text-[#B0521F] p-0.5 cursor-pointer"
                aria-label={`Remove filter ${tag.label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12px] font-semibold text-[#B0521F] hover:underline ml-2 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grid of Cards: 3 columns desktop, 2 columns mobile */}
      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-[6px] border border-[#E5E5E3] p-8 space-y-3">
          <p className="text-[16px] font-semibold text-[#141414]">No products match the selected filters.</p>
          <p className="text-[14px] text-[#6B6B6B]">Try adjusting your device model or clearing some filters.</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="min-h-[44px] px-5 py-2 bg-[#141414] text-white text-[14px] font-semibold rounded-[6px]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Load More at bottom */}
      {hasMore && (
        <div className="pt-8 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="min-h-[44px] px-8 py-2.5 bg-white border border-[#E5E5E3] hover:border-[#141414] text-[14px] font-semibold text-[#141414] rounded-[6px] transition-colors"
          >
            Load more ({products.length - displayCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductGrid;
