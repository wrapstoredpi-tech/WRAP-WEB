import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { FilterSidebar } from '../components/home/FilterSidebar';
import { ProductGrid } from '../components/home/ProductGrid';
import { Badge } from '../components/ui/Badge';
import { deriveFilterOptions, PRICE_RANGES } from '../lib/useProducts';
import { useProductsContext } from '../context/ProductsContext';
import { RefreshCw, Smartphone, X, AlertTriangle } from 'lucide-react';

const INITIAL_FILTERS = {
  category: 'All Categories',
  subcategory: 'All Types',
  brand: 'All Brands',
  selectedModel: '',
  priceRange: 'All Prices',
  selectedColor: '',
  inStockOnly: false,
};

export function HomePage({ onAddToCart, activeCategoryNav }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const productSectionRef = useRef(null);

  // ── Live data from Supabase ────────────────────────────────────────────────
  const { products: liveProducts = [], isLoading = false, error = null, refetch = () => {} } = useProductsContext();


  // Derive filter options from whatever products are returned by RLS
  const filterOptions = useMemo(() => deriveFilterOptions(liveProducts), [liveProducts]);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(() => {
    const catQuery = searchParams.get('category');
    const modelQuery = searchParams.get('model');
    const brandQuery = searchParams.get('brand');
    const colorQuery = searchParams.get('color');
    return {
      ...INITIAL_FILTERS,
      category: catQuery || 'All Categories',
      brand: brandQuery || 'All Brands',
      selectedModel: modelQuery || '',
      selectedColor: colorQuery || '',
    };
  });

  const [sortBy, setSortBy] = useState('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // React to URL category param changes or Header nav clicks
  useEffect(() => {
    const catQuery = searchParams.get('category');
    if (catQuery) {
      setFilters((prev) => ({ ...prev, category: catQuery }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeCategoryNav) {
      if (activeCategoryNav === 'New Arrivals' || activeCategoryNav === 'Archive') {
        setFilters((prev) => ({ ...prev, category: 'All Categories' }));
      } else {
        setFilters((prev) => ({ ...prev, category: activeCategoryNav }));
      }
    }
  }, [activeCategoryNav]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'category') {
        if (value !== 'All Categories') {
          setSearchParams({ category: value });
        } else {
          setSearchParams({});
        }
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchParams({});
  };

  // ── Client-side filter + sort (data already RLS-filtered on server) ────────
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...liveProducts];

    // 1. Phone model compatibility filter
    if (filters.selectedModel) {
      result = result.filter((p) => {
        if (p.compatible_models && p.compatible_models.length > 0) {
          return p.compatible_models.includes(filters.selectedModel);
        }
        return false;
      });
    } else if (filters.brand && filters.brand !== 'All Brands') {
      result = result.filter((p) => {
        if (filters.brand === 'Universal') {
          return !p.mobile_brand || p.mobile_brand === 'Universal';
        }
        return p.mobile_brand === filters.brand;
      });
    }

    // 2. Category filter
    if (filters.category !== 'All Categories') {
      result = result.filter((p) => p.category === filters.category);
    }

    // 3. Color variants filter
    if (filters.selectedColor) {
      result = result.filter((p) =>
        p.color_variants?.some(
          (c) => c.toLowerCase() === filters.selectedColor.toLowerCase()
        )
      );
    }

    // 4. Price range filter
    if (filters.priceRange !== 'All Prices') {
      const selectedRange = PRICE_RANGES.find((r) => r.label === filters.priceRange);
      if (selectedRange) {
        result = result.filter(
          (p) =>
            p.selling_price >= selectedRange.min &&
            p.selling_price <= selectedRange.max
        );
      }
    }

    // 5. In-stock filter — use stock_status from the view
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock_status !== 'OUT_OF_STOCK');
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.selling_price - b.selling_price;
      if (sortBy === 'price_desc') return b.selling_price - a.selling_price;
      if (sortBy === 'discount') return (b.discount_percentage || 0) - (a.discount_percentage || 0);
      if (sortBy === 'in_stock') {
        if (a.stock_status === 'OUT_OF_STOCK' && b.stock_status !== 'OUT_OF_STOCK') return 1;
        if (b.stock_status === 'OUT_OF_STOCK' && a.stock_status !== 'OUT_OF_STOCK') return -1;
        return 0;
      }
      // Default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [liveProducts, filters, sortBy]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.category !== 'All Categories',
      filters.brand !== 'All Brands' && filters.brand !== '',
      Boolean(filters.selectedModel),
      filters.priceRange !== 'All Prices',
      Boolean(filters.selectedColor),
      filters.inStockOnly,
    ].filter(Boolean).length;
  }, [filters]);

  // Quick-pick most-common models from live data
  const quickPickModels = useMemo(() => {
    const allModels = liveProducts.flatMap((p) => p.compatible_models || []);
    const freq = allModels.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([model]) => ({ model, brand: model.toLowerCase().includes('samsung') ? 'Samsung' : 'Apple' }));
  }, [liveProducts]);

  return (
    <div className="flex flex-col">
      {/* Hero Promotional Banner */}
      <HeroSection
        onShopClick={(targetCategory) => {
          if (targetCategory && targetCategory !== 'All Categories') {
            handleFilterChange('category', targetCategory);
          }
          if (productSectionRef.current) {
            productSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Main Catalog Area */}
      <main
        ref={productSectionRef}
        className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-8 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial">
                Catalog &bull; {filters.category}
              </span>
              {activeFilterCount > 0 && (
                <Badge variant="accent" size="sm">
                  {activeFilterCount} Active
                </Badge>
              )}
            </div>
            <h2 className="text-h1 font-medium text-neutral-900 tracking-tight">
              Essential Devices &amp; Carry
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refetch}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 hover:border-neutral-900 bg-base-offwhite transition-colors"
              title="Refresh catalog from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent' : ''}`} />
              <span>Refresh Catalog</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Could not load catalog: {error}. <button onClick={refetch} className="underline font-medium">Retry</button></span>
          </div>
        )}

        {/* Guided Phone Model Prompt Banner */}
        {!filters.selectedModel ? (
          <div className="bg-neutral-100 border border-neutral-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-light text-accent flex items-center justify-center shrink-0 border border-accent-border">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-body-sm font-semibold text-neutral-900">
                  Select your phone model to see compatible cases
                </p>
                <p className="text-xs text-neutral-500">
                  Pick your brand &amp; device from the filter panel on the left to show only guaranteed fits.
                </p>
              </div>
            </div>

            {/* Quick-Pick chips — derived from live data */}
            {quickPickModels.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="text-[11px] text-neutral-400 uppercase tracking-editorial font-bold">
                  Quick pick:
                </span>
                {quickPickModels.map(({ model, brand }) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, brand, selectedModel: model }))}
                    className="text-xs px-2.5 py-1 bg-base-offwhite border border-neutral-300 hover:border-neutral-900 transition-colors font-medium text-neutral-800"
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900 text-base-offwhite p-3.5 px-5 flex items-center justify-between gap-3 mb-8 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5 text-xs sm:text-body-sm">
              <Smartphone className="w-4 h-4 text-accent shrink-0" />
              <span className="text-neutral-300">Showing guaranteed fits for:</span>
              <span className="font-semibold text-white bg-neutral-800 px-2.5 py-0.5 border border-neutral-700">
                {filters.selectedModel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleFilterChange('selectedModel', '')}
              className="text-xs text-accent hover:text-white underline font-medium transition-colors"
            >
              Show all phone cases &times;
            </button>
          </div>
        )}

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-2 pb-6">
            <span className="text-xs text-neutral-400 uppercase tracking-editorial font-semibold">
              Applied Filters:
            </span>
            {filters.category !== 'All Categories' && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 border border-neutral-300">
                <span>Category: {filters.category}</span>
                <button onClick={() => handleFilterChange('category', 'All Categories')} className="hover:text-accent font-bold">&times;</button>
              </span>
            )}
            {filters.brand !== 'All Brands' && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 border border-neutral-300">
                <span>Brand: {filters.brand}</span>
                <button onClick={() => { handleFilterChange('brand', 'All Brands'); handleFilterChange('selectedModel', ''); }} className="hover:text-accent font-bold">&times;</button>
              </span>
            )}
            {filters.selectedModel && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-accent-light text-accent px-2.5 py-1 border border-accent-border font-semibold">
                <span>Model: {filters.selectedModel}</span>
                <button onClick={() => handleFilterChange('selectedModel', '')} className="hover:text-neutral-900 font-bold">&times;</button>
              </span>
            )}
            {filters.selectedColor && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 border border-neutral-300">
                <span>Color: {filters.selectedColor}</span>
                <button onClick={() => handleFilterChange('selectedColor', '')} className="hover:text-accent font-bold">&times;</button>
              </span>
            )}
            {filters.priceRange !== 'All Prices' && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 border border-neutral-300">
                <span>{filters.priceRange}</span>
                <button onClick={() => handleFilterChange('priceRange', 'All Prices')} className="hover:text-accent font-bold">&times;</button>
              </span>
            )}
            {filters.inStockOnly && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 border border-emerald-300">
                <span>In-Stock Only</span>
                <button onClick={() => handleFilterChange('inStockOnly', false)} className="hover:text-emerald-950 font-bold">&times;</button>
              </span>
            )}
            <button onClick={handleResetFilters} className="text-xs text-neutral-500 hover:text-accent underline font-medium ml-1">
              Reset all
            </button>
          </div>
        )}

        {/* Layout: Sidebar + Product Grid */}
        <div className="flex items-start gap-6 lg:gap-8 xl:gap-10">
          {/* Desktop Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalResultsCount={filteredAndSortedProducts.length}
            filterOptions={filterOptions}
          />

          {/* Product Grid Area */}
          <ProductGrid
            products={filteredAndSortedProducts}
            isLoading={isLoading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
            onAddToCart={onAddToCart}
            onQuickView={(p) => navigate(`/product/${p.id}`)}
          />
        </div>
      </main>

      {/* Mobile Filters Slide-over Modal (< 1024px) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div
            className="
              fixed inset-y-0 right-0 w-full max-w-sm bg-base-offwhite
              shadow-2xl border-l border-neutral-200 flex flex-col justify-between
              animate-drawer-in p-6 z-10 overflow-y-auto
            "
          >
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalResultsCount={filteredAndSortedProducts.length}
              filterOptions={filterOptions}
              isMobileDrawer
              onClose={() => setIsMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
