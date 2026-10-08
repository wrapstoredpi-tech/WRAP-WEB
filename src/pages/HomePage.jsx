import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { ShopByCategory } from '../components/home/ShopByCategory';
import { ProductGrid } from '../components/home/ProductGrid';
import { FilterBottomSheet } from '../components/home/FilterBottomSheet';
import { CategoryHub } from '../components/category/CategoryHub';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import { deriveFilterOptions, PRICE_RANGES, isProductCompatibleWithPhone } from '../lib/useProducts';
import { formatINR } from '../lib/currency';
import { Smartphone, ChevronRight, ArrowLeft } from 'lucide-react';

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

export function HomePage({ onAddToCart }) {
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

  // Read URL query parameters
  const catQuery = searchParams.get('category');
  const subQuery = searchParams.get('subcategory');

  const activeCategory = catQuery && catQuery !== 'All' ? catQuery : 'All';
  const matchedCategory = useMemo(() => {
    if (activeCategory === 'All') return null;
    return liveCategories.find((c) => c.name.toLowerCase() === activeCategory.toLowerCase()) || null;
  }, [activeCategory, liveCategories]);

  // Check if current category has subcategories in DB
  const categorySubcategories = useMemo(() => {
    if (!matchedCategory) return [];
    return liveSubcategories.filter((s) => s.category_id === matchedCategory.id);
  }, [matchedCategory, liveSubcategories]);

  // Determine whether to display Step 1 Hub Screen vs Step 2 Product Grid Screen
  const isHubView = Boolean(
    matchedCategory &&
    categorySubcategories.length > 0 &&
    !subQuery
  );

  // Sync category and subcategory from URL searchParams
  useEffect(() => {
    if (activeCategory !== 'All' && matchedCategory) {
      let resolvedSub = 'All Types';
      let resolvedSubId = null;

      if (subQuery && subQuery !== 'all' && subQuery !== 'All Types') {
        const matchedSub = liveSubcategories.find(
          (s) => s.category_id === matchedCategory.id && s.name.toLowerCase() === subQuery.toLowerCase()
        );
        if (matchedSub) {
          resolvedSub = matchedSub.name;
          resolvedSubId = matchedSub.id;
        } else {
          resolvedSub = subQuery;
        }
      }

      setFilters((prev) => ({
        ...prev,
        category: matchedCategory.name,
        category_id: matchedCategory.id,
        subcategory: resolvedSub,
        subcategory_id: resolvedSubId,
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
  }, [activeCategory, subQuery, matchedCategory, liveSubcategories]);

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
          // Navigating to category hub (Step 1)
          setSearchParams({ category: value });
        }
      }

      if (key === 'subcategory') {
        if (value === 'All Types' || value === 'All' || value === 'all') {
          next.subcategory = 'All Types';
          next.subcategory_id = null;
          if (next.category !== 'All') {
            setSearchParams({ category: next.category, subcategory: 'all' });
          }
        } else {
          const subObj = liveSubcategories.find((s) => s.name === value);
          next.subcategory = value;
          next.subcategory_id = subObj?.id || null;
          if (next.category !== 'All') {
            setSearchParams({ category: next.category, subcategory: value });
          }
        }
      }

      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      category: prev.category,
      category_id: prev.category_id,
      subcategory: prev.subcategory,
      subcategory_id: prev.subcategory_id,
    }));
    setShowAllDesigns(true);
  };

  const handleSelectCategoryTile = (tile) => {
    if (tile.category === 'All' || !tile.category) {
      handleFilterChange('category', 'All');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tile.category && tile.subcategory) {
      setSearchParams({ category: tile.category, subcategory: tile.subcategory });
    } else if (tile.category) {
      setSearchParams({ category: tile.category });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // "Made for your phone" products (shown on home page when phone model is selected)
  const madeForYourPhoneProducts = useMemo(() => {
    if (!savedPhone) return [];
    return liveProducts
      .filter((p) => {
        const isCase = (p.category || '').toLowerCase() === 'mobile cases';
        const models = p.compatible_models || [];
        if (!isCase || models.length === 0 || models.includes('Universal')) return false;
        return models.some((m) => m.toLowerCase().trim() === savedPhone.model.toLowerCase().trim());
      })
      .slice(0, 4);
  }, [liveProducts, savedPhone]);

  // Main filtered products for the Step 2 grid
  const filteredProducts = useMemo(() => {
    let result = [...liveProducts];

    // Phone compatibility filter (keeps all universal accessories and matching cases)
    if (savedPhone && !showAllDesigns) {
      result = result.filter((p) => isProductCompatibleWithPhone(p, savedPhone));
    }

    // Manual brand filter from bottom sheet
    if (filters.brand && filters.brand !== 'All Brands') {
      result = result.filter(
        (p) =>
          p.mobile_brand === filters.brand ||
          p.mobile_brand === 'Universal' ||
          (p.compatible_models || []).includes('Universal') ||
          (p.category && p.category.toLowerCase() !== 'mobile cases')
      );
    }

    // Manual model filter from bottom sheet
    if (filters.selectedModel) {
      const targetM = filters.selectedModel.toLowerCase().trim();
      result = result.filter((p) => {
        const models = p.compatible_models || [];
        if (
          models.includes('Universal') ||
          p.mobile_brand === 'Universal' ||
          (p.category && p.category.toLowerCase() !== 'mobile cases')
        ) {
          return true;
        }
        return models.some((m) => m.toLowerCase().trim() === targetM);
      });
    }

    // Category filter
    if (filters.category !== 'All' && filters.category !== 'All Categories') {
      if (filters.category_id) {
        result = result.filter((p) => p.category_id === filters.category_id);
      } else {
        result = result.filter((p) => p.category === filters.category);
      }
    }

    // Subcategory filter (if specific subcategory is selected)
    if (
      filters.subcategory_id ||
      (filters.subcategory &&
        filters.subcategory !== 'All Types' &&
        filters.subcategory !== 'All' &&
        filters.subcategory !== 'all')
    ) {
      result = result.filter((p) =>
        filters.subcategory_id
          ? p.subcategory_id === filters.subcategory_id
          : p.subcategory === filters.subcategory
      );
    }

    // Price range filter
    if (filters.priceRange && filters.priceRange !== 'All Prices') {
      const range = PRICE_RANGES.find((r) => r.label === filters.priceRange);
      if (range) {
        result = result.filter((p) => p.selling_price >= range.min && p.selling_price <= range.max);
      }
    }

    // Color filter
    if (filters.selectedColor) {
      const targetColor = filters.selectedColor.toLowerCase().trim();
      result = result.filter((p) =>
        p.color_variants?.some((c) => {
          const name = typeof c === 'string' ? c.trim() : (c?.name || c?.color || String(c)).trim();
          return name.toLowerCase() === targetColor;
        })
      );
    }

    // In-stock only filter
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock_status !== 'OUT_OF_STOCK' && p.available_stock > 0);
    }

    // Sort
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
      Boolean(filters.subcategory_id) ||
        (filters.subcategory &&
          filters.subcategory !== 'All Types' &&
          filters.subcategory !== 'All' &&
          filters.subcategory !== 'all'),
      filters.brand && filters.brand !== 'All Brands',
      Boolean(filters.selectedModel),
      filters.priceRange !== 'All Prices',
      Boolean(filters.selectedColor),
      filters.inStockOnly,
    ].filter(Boolean).length;
  }, [filters]);

  // ── 1. STEP 1: HUB SCREEN ──────────────────────────────────────────────────
  if (isHubView && matchedCategory) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAFAF9]">
        <CategoryHub
          category={matchedCategory}
          subcategories={liveSubcategories}
          products={liveProducts}
          onSelectSubcategory={(sub) => {
            setSearchParams({ category: matchedCategory.name, subcategory: sub.name });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToAllProducts={() => {
            setSearchParams({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // ── 2. STEP 2: PRODUCT GRID SCREEN ─────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9]">
      {/* Full-bleed Hero Banner Section (Only on All Products / Full Catalog) */}
      {activeCategory === 'All' && (
        <HeroSection
          onShopClick={(cat) => {
            if (cat && cat !== 'All') {
              handleFilterChange('category', cat);
            } else {
              setSearchParams({});
            }
            if (productSectionRef.current) {
              productSectionRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full">
        
        {/* ── SHOP BY CATEGORY (Placed between Banner & Fitted For Your Model) ── */}
        {activeCategory === 'All' && (
          <ShopByCategory onSelectTile={handleSelectCategoryTile} />
        )}

        {/* ── Optional: "Made for your phone" quick carousel on All Products ── */}
        {activeCategory === 'All' && savedPhone && madeForYourPhoneProducts.length > 0 && (
          <section className="p-4 sm:p-6 bg-[#141414] text-white rounded-lg space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-white/10 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] sm:text-[16px] font-semibold text-white">
                    Fitted for your {savedPhone.model}
                  </h3>
                  <p className="text-[12px] text-[#A8A29E] font-normal">
                    Precision cutouts and verified geometry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openPhoneSheet}
                className="text-[13px] text-[#D6D3D1] hover:text-white font-normal underline transition-colors cursor-pointer"
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

        {/* ── Main Product Listing Section ─────────────────────────────────── */}
        <section ref={productSectionRef} className="space-y-4 sm:space-y-5">
          
          {/* Breadcrumb & Return to Hub Back-link (When in Category Drill-down) */}
          {matchedCategory && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E5E4] animate-fade-in">
              <nav aria-label="Breadcrumb" className="text-[13px] text-[#666664]">
                <ol className="flex items-center space-x-2 truncate font-normal">
                  <li>
                    <button
                      type="button"
                      onClick={() => setSearchParams({})}
                      className="hover:text-[#141414] transition-colors cursor-pointer"
                    >
                      All Products
                    </button>
                  </li>
                  <li>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ category: matchedCategory.name })}
                      className="hover:text-[#141414] transition-colors font-semibold text-[#141414] underline underline-offset-4 decoration-[#D6D3D1] hover:decoration-[#141414] cursor-pointer"
                    >
                      {matchedCategory.name}
                    </button>
                  </li>
                  {subQuery && subQuery !== 'all' && (
                    <>
                      <li>
                        <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                      </li>
                      <li className="text-[#141414] font-semibold truncate" aria-current="page">
                        {filters.subcategory}
                      </li>
                    </>
                  )}
                  {subQuery === 'all' && (
                    <>
                      <li>
                        <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                      </li>
                      <li className="text-[#141414] font-semibold truncate" aria-current="page">
                        All Designs
                      </li>
                    </>
                  )}
                </ol>
              </nav>

              <button
                type="button"
                onClick={() => setSearchParams({ category: matchedCategory.name })}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#141414] hover:text-[#9E381A] bg-white border border-[#E7E5E4] hover:border-[#141414] px-3.5 py-1.5 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {matchedCategory.name} Hub</span>
              </button>
            </div>
          )}

          {/* Horizontal Category Tabs Bar (for All Products or category hopping) */}
          <div className="pb-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => handleFilterChange('category', 'All')}
                className={`h-9 sm:h-10 px-4 rounded-lg font-semibold text-[13px] shrink-0 transition-colors cursor-pointer ${
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
                    className={`h-9 sm:h-10 px-4 rounded-lg font-semibold text-[13px] shrink-0 transition-colors cursor-pointer ${
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
