import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { ProductGrid } from '../components/home/ProductGrid';
import { FilterBottomSheet } from '../components/home/FilterBottomSheet';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import { deriveFilterOptions, PRICE_RANGES } from '../lib/useProducts';
import { formatINR } from '../../src/lib/currency';
import { Smartphone } from 'lucide-react';

const INITIAL_FILTERS = {
  category: 'All',
  category_id: null,
  subcategory: 'All Types',
  subcategory_id: null,
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

  const {
    products: liveProducts = [],
    categories: liveCategories = [],
    subcategories: liveSubcategories = [],
    isLoading = false,
  } = useProductsContext();

  const { savedPhone, openPhoneSheet } = usePhoneContext();

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
        subcategory: 'All Types',
        subcategory_id: null,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        category: 'All',
        category_id: null,
        subcategory: 'All Types',
        subcategory_id: null,
      }));
    }
  }, [searchParams, activeCategoryNav, liveCategories]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'category') {
        if (value === 'All' || value === 'All Categories') {
          next.category = 'All';
          next.category_id = null;
          next.subcategory = 'All Types';
          next.subcategory_id = null;
          setSearchParams({});
        } else {
          const matched = liveCategories.find((c) => c.name === value);
          next.category = value;
          next.category_id = matched?.id || null;
          next.subcategory = 'All Types';
          next.subcategory_id = null;
          setSearchParams({ category: value });
        }
      }

      if (key === 'subcategory') {
        if (value === 'All Types' || value === 'All') {
          next.subcategory = 'All Types';
          next.subcategory_id = null;
        } else {
          const subObj = liveSubcategories.find((s) => s.name === value);
          next.subcategory = value;
          next.subcategory_id = subObj?.id || null;
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

  const isCompatibleWithPhone = (product, phone) => {
    if (!phone || !phone.model) return true;
    const models = product.compatible_models || [];
    if (models.length === 0 || models.includes('Universal') || product.mobile_brand === 'Universal') {
      return true;
    }
    const target = phone.model.toLowerCase().trim();
    return models.some((m) => m.toLowerCase().trim() === target);
  };

  const madeForYourPhoneProducts = useMemo(() => {
    if (!savedPhone) return [];
    return liveProducts
      .filter((p) => {
        const models = p.compatible_models || [];
        if (models.length === 0 || models.includes('Universal')) return false;
        return models.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim());
      })
      .slice(0, 4);
  }, [liveProducts, savedPhone]);

  const filteredProducts = useMemo(() => {
    let result = [...liveProducts];

    if (savedPhone && !showAllDesigns) {
      result = result.filter((p) => isCompatibleWithPhone(p, savedPhone));
    }

    if (filters.brand && filters.brand !== 'All Brands') {
      result = result.filter(
        (p) =>
          p.mobile_brand === filters.brand ||
          p.mobile_brand === 'Universal' ||
          (p.compatible_models || []).includes('Universal')
      );
    }

    if (filters.selectedModel) {
      const targetM = filters.selectedModel.toLowerCase().trim();
      result = result.filter((p) => {
        const models = p.compatible_models || [];
        if (models.includes('Universal') || p.mobile_brand === 'Universal') return true;
        return models.some((m) => m.toLowerCase().trim() === targetM);
      });
    }

    if (filters.category !== 'All' && filters.category !== 'All Categories') {
      if (filters.category_id) {
        result = result.filter((p) => p.category_id === filters.category_id);
      } else {
        result = result.filter((p) => p.category === filters.category);
      }
    }

    if (filters.subcategory_id || (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All')) {
      result = result.filter((p) =>
        filters.subcategory_id
          ? p.subcategory_id === filters.subcategory_id
          : p.subcategory === filters.subcategory
      );
    }

    if (filters.priceRange && filters.priceRange !== 'All Prices') {
      const range = PRICE_RANGES.find((r) => r.label === filters.priceRange);
      if (range) {
        result = result.filter((p) => p.selling_price >= range.min && p.selling_price <= range.max);
      }
    }

    if (filters.selectedColor) {
      const targetColor = filters.selectedColor.toLowerCase().trim();
      result = result.filter((p) =>
        p.color_variants?.some((c) => {
          const name = typeof c === 'string' ? c.trim() : (c?.name || c?.color || String(c)).trim();
          return name.toLowerCase() === targetColor;
        })
      );
    }

    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock_status !== 'OUT_OF_STOCK' && p.available_stock > 0);
    }

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
      Boolean(filters.subcategory_id) || (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All'),
      filters.brand && filters.brand !== 'All Brands',
      Boolean(filters.selectedModel),
      filters.priceRange !== 'All Prices',
      Boolean(filters.selectedColor),
      filters.inStockOnly,
    ].filter(Boolean).length;
  }, [filters]);

  const activeSubcategories = useMemo(() => {
    if (!filters.category_id && filters.category !== 'All') {
      const found = liveCategories.find((c) => c.name === filters.category);
      if (found) return filterOptions.subcategoryMap?.[found.id] || [];
    }
    if (filters.category_id) {
      return filterOptions.subcategoryMap?.[filters.category_id] || [];
    }
    return [];
  }, [filters.category_id, filters.category, liveCategories, filterOptions.subcategoryMap]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9]">
      {/* Full-bleed Hero Banner Section */}
      <HeroSection
        onShopClick={(cat) => {
          handleFilterChange('category', cat || 'All');
          if (productSectionRef.current) {
            productSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full">
        
        {/* ── Section 1: "Made for your phone" row (If phone is saved) ────── */}
        {savedPhone && madeForYourPhoneProducts.length > 0 && (
          <section className="p-4 sm:p-6 bg-[#141414] text-white rounded-lg space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-white/10 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] sm:text-[16px] font-semibold text-white">Fitted for your {savedPhone.model}</h3>
                  <p className="text-[12px] text-[#A8A29E] font-normal">Precision cutouts and verified geometry</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openPhoneSheet}
                className="text-[13px] text-[#D6D3D1] hover:text-white font-normal underline transition-colors"
              >
                Change
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {madeForYourPhoneProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-[#262624] rounded-lg p-3 cursor-pointer hover:bg-[#383836] transition-colors flex flex-col justify-between space-y-2 border border-[#383836]"
                >
                  <div className="aspect-[4/5] rounded-md overflow-hidden bg-[#141414]">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-white line-clamp-1">{p.name}</h4>
                    <p className="text-[13px] text-[#D6D3D1] font-normal pt-0.5">
                      {formatINR(p.selling_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 2: Main Product Listing ─────────────────────────────── */}
        <section ref={productSectionRef} className="space-y-4 sm:space-y-5">
          {/* Horizontal Category Navigation Tabs Bar */}
          <div className="space-y-2 sm:space-y-2.5 pb-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => handleFilterChange('category', 'All')}
                className={`h-9 sm:h-10 px-4 rounded-lg font-semibold text-[13px] shrink-0 transition-colors ${
                  filters.category === 'All'
                    ? 'bg-[#141414] text-white'
                    : 'bg-white text-[#141414] border border-[#E7E5E4] hover:border-[#141414]'
                }`}
              >
                All Objects
              </button>

              {liveCategories.map((cat) => {
                const isSelected = filters.category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFilterChange('category', cat.name)}
                    className={`h-9 sm:h-10 px-4 rounded-lg font-semibold text-[13px] shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#141414] text-white'
                        : 'bg-white text-[#141414] border border-[#E7E5E4] hover:border-[#141414]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Subcategory Chips Row */}
            {activeSubcategories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <button
                  type="button"
                  onClick={() => handleFilterChange('subcategory', 'All Types')}
                  className={`h-7 sm:h-8 px-3 rounded-md text-[12px] shrink-0 transition-colors ${
                    !filters.subcategory_id || filters.subcategory === 'All Types'
                      ? 'bg-[#141414] text-white font-semibold'
                      : 'bg-white text-[#666664] border border-[#E7E5E4] hover:border-[#D6D3D1]'
                  }`}
                >
                  All Sub-types
                </button>
                {activeSubcategories.map((sub) => {
                  const isSubSelected = filters.subcategory_id === sub.id || filters.subcategory === sub.name;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleFilterChange('subcategory', sub.name)}
                      className={`h-7 sm:h-8 px-3 rounded-md text-[12px] shrink-0 transition-colors ${
                        isSubSelected
                          ? 'bg-[#141414] text-white font-semibold'
                          : 'bg-white text-[#666664] border border-[#E7E5E4] hover:border-[#D6D3D1]'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={filteredProducts}
            totalAllProducts={liveProducts.length}
            isLoading={isLoading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenMobileFilters={() => setIsFilterSheetOpen(true)}
            activeFilterCount={activeFilterCount}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onAddToCart={onAddToCart}
            showAllToggle={Boolean(savedPhone)}
            onToggleShowAll={() => setShowAllDesigns((prev) => !prev)}
            showingAllDesigns={showAllDesigns}
          />
        </section>
      </div>

      {/* Filter Bottom Sheet / Modal */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        filterOptions={filterOptions}
        products={liveProducts}
        totalResultsCount={filteredProducts.length}
      />
    </div>
  );
}

export default HomePage;
