import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { ProductGrid } from '../components/home/ProductGrid';
import { FilterBottomSheet } from '../components/home/FilterBottomSheet';
import { PhoneBar } from '../components/layout/PhoneBar';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import { deriveFilterOptions, PRICE_RANGES } from '../lib/useProducts';
import { Smartphone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const INITIAL_FILTERS = {
  category: 'All',
  category_id: null,
  subcategory: 'All Types',
  subcategory_id: null,
  priceRange: 'All Prices',
  selectedColor: '',
  inStockOnly: false,
};

export function HomePage({ onAddToCart, activeCategoryNav }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const productSectionRef = useRef(null);

  const {
    products: liveProducts = [],
    categories: liveCategories = [],
    subcategories: liveSubcategories = [],
    isLoading = false,
  } = useProductsContext();

  const { savedPhone, openPhoneSheet } = usePhoneContext();

  // Filter options
  const filterOptions = useMemo(
    () => deriveFilterOptions(liveProducts, liveCategories, liveSubcategories),
    [liveProducts, liveCategories, liveSubcategories]
  );

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showAllDesigns, setShowAllDesigns] = useState(false);

  // Sync category from URL or nav selection
  useEffect(() => {
    const catQuery = searchParams.get('category');
    const targetCat = catQuery || (activeCategoryNav !== 'New Arrivals' ? activeCategoryNav : 'All');
    
    if (targetCat && targetCat !== 'All') {
      const matched = liveCategories.find((c) => c.name === targetCat);
      setFilters((prev) => ({
        ...prev,
        category: targetCat,
        category_id: matched?.id || null,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        category: 'All',
        category_id: null,
      }));
    }
  }, [searchParams, activeCategoryNav, liveCategories]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'category') {
        if (value === 'All') {
          next.category_id = null;
          setSearchParams({});
        } else {
          const matched = liveCategories.find((c) => c.name === value);
          next.category_id = matched?.id || null;
          setSearchParams({ category: value });
        }
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setShowAllDesigns(true);
    setSearchParams({});
  };

  // Helper check for phone compatibility
  const isCompatibleWithPhone = (product, phone) => {
    if (!phone || !phone.model) return true;
    const models = product.compatible_models || [];
    if (models.length === 0 || models.includes('Universal') || product.mobile_brand === 'Universal') {
      return true; // Accessories & Gadgets with no models always show!
    }
    const target = phone.model.toLowerCase().trim();
    return models.some((m) => m.toLowerCase().trim() === target);
  };

  // Products filtered for "Made for your phone" row
  const madeForYourPhoneProducts = useMemo(() => {
    if (!savedPhone) return [];
    return liveProducts.filter((p) => {
      const models = p.compatible_models || [];
      if (models.length === 0 || models.includes('Universal')) return false; // Show cases only
      return models.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim());
    }).slice(0, 4);
  }, [liveProducts, savedPhone]);

  // Main listing filtered products
  const filteredProducts = useMemo(() => {
    let result = [...liveProducts];

    // Phone compatibility default filter
    if (savedPhone && !showAllDesigns) {
      result = result.filter((p) => isCompatibleWithPhone(p, savedPhone));
    }

    // Category filter
    if (filters.category !== 'All') {
      if (filters.category_id) {
        result = result.filter((p) => p.category_id === filters.category_id);
      } else {
        result = result.filter((p) => p.category === filters.category);
      }
    }

    // Subcategory filter
    if (filters.subcategory_id || (filters.subcategory && filters.subcategory !== 'All Types')) {
      result = result.filter((p) =>
        filters.subcategory_id
          ? p.subcategory_id === filters.subcategory_id
          : p.subcategory === filters.subcategory
      );
    }

    // Price range
    if (filters.priceRange !== 'All Prices') {
      const range = PRICE_RANGES.find((r) => r.label === filters.priceRange);
      if (range) {
        result = result.filter((p) => p.selling_price >= range.min && p.selling_price <= range.max);
      }
    }

    // Color tag
    if (filters.selectedColor) {
      result = result.filter((p) =>
        p.color_variants?.some((c) => c.toLowerCase() === filters.selectedColor.toLowerCase())
      );
    }

    // In stock only
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock_status !== 'OUT_OF_STOCK' && p.available_stock > 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.selling_price - b.selling_price;
      if (sortBy === 'price_desc') return b.selling_price - a.selling_price;
      if (sortBy === 'discount') return (b.discount_percentage || 0) - (a.discount_percentage || 0);
      if (sortBy === 'in_stock') {
        if (a.stock_status === 'OUT_OF_STOCK') return 1;
        if (b.stock_status === 'OUT_OF_STOCK') return -1;
        return 0;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [liveProducts, savedPhone, showAllDesigns, filters, sortBy]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.category !== 'All',
      filters.subcategory_id !== null || filters.subcategory !== 'All Types',
      filters.priceRange !== 'All Prices',
      Boolean(filters.selectedColor),
      filters.inStockOnly,
    ].filter(Boolean).length;
  }, [filters]);

  return (
    <div className="flex flex-col min-h-screen bg-base-offwhite">
      {/* Slim Persistent Phone Bar under Header */}
      <PhoneBar />

      {/* Hero Banner Section */}
      <HeroSection
        onShopClick={(cat) => {
          handleFilterChange('category', cat || 'All');
          if (productSectionRef.current) {
            productSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 w-full">
        
        {/* Category Tiles (Real categories from Supabase) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-body font-semibold text-neutral-900">Explore Categories</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {liveCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleFilterChange('category', cat.name)}
                className={`p-4 sm:p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[110px] transition-all ${
                  filters.category === cat.name
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                    : 'border-neutral-200/90 bg-white text-neutral-900 hover:border-neutral-400'
                }`}
              >
                <span className="text-xs uppercase tracking-wide font-semibold text-neutral-400">Category</span>
                <div className="flex items-center justify-between w-full pt-2">
                  <span className="text-body font-semibold">{cat.name}</span>
                  <ArrowRight className="w-4 h-4 opacity-60" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* "Made for your phone" row (Only if phone is saved) */}
        {savedPhone && madeForYourPhoneProducts.length > 0 && (
          <section className="p-6 bg-neutral-900 text-white rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-body font-semibold text-white">Made for your {savedPhone.model}</h3>
                  <p className="text-xs text-neutral-400">Guaranteed precise fit &amp; cutouts</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openPhoneSheet}
                className="text-xs text-accent hover:text-white font-semibold underline"
              >
                Change Phone
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {madeForYourPhoneProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-neutral-800 rounded-xl p-3 cursor-pointer hover:bg-neutral-750 transition-colors flex flex-col justify-between space-y-2 border border-neutral-700"
                >
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-neutral-900">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-white line-clamp-1">{p.name}</h4>
                    <p className="text-xs text-neutral-300 font-medium pt-0.5">₹{p.selling_price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Product Listing Section */}
        <section ref={productSectionRef} className="space-y-6 pt-4">
          {/* Horizontal Category Tab Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-neutral-200">
            <button
              type="button"
              onClick={() => handleFilterChange('category', 'All')}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-body-sm shrink-0 transition-colors ${
                filters.category === 'All'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              All Designs
            </button>

            {liveCategories.map((cat) => {
              const isSelected = filters.category === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleFilterChange('category', cat.name)}
                  className={`min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-body-sm shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Product Grid Component */}
          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenMobileFilters={() => setIsFilterSheetOpen(true)}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
            onAddToCart={onAddToCart}
            showAllToggle={Boolean(savedPhone)}
            onToggleShowAll={() => setShowAllDesigns((prev) => !prev)}
            showingAllDesigns={showAllDesigns}
          />
        </section>
      </div>

      {/* Filter Bottom Sheet Modal */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        filterOptions={filterOptions}
        totalResultsCount={filteredProducts.length}
      />
    </div>
  );
}

export default HomePage;
