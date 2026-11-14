import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { HeroFirstScreen } from '../components/home/HeroFirstScreen';
import { CategoryScrollSection } from '../components/home/CategoryScrollSection';
import { ShopByPhoneStrip } from '../components/home/ShopByPhoneStrip';
import { ProductScrollRow } from '../components/home/ProductScrollRow';
import { DealOfTheDaySection } from '../components/home/DealOfTheDaySection';
import { VisitOurStoreBanner } from '../components/home/VisitOurStoreBanner';
import { HomeSEO } from '../components/home/HomeSEO';
import { FilterSidebar } from '../components/home/FilterSidebar';
import { FilterBottomSheet } from '../components/home/FilterBottomSheet';
import { ProductGrid } from '../components/home/ProductGrid';
import { useProductsContext } from '../context/ProductsContext';
import { deriveFilterOptions, PRICE_RANGES } from '../lib/useProducts';
import { fetchBestSellersMap } from '../lib/productRowAdapter';
import { selectDealOfTheDay } from '../lib/dealFeaturedAdapter';
import { setPageMeta } from '../lib/seo';
import { isComboEligible } from '../lib/models';
import { ChevronRight } from 'lucide-react';

const INITIAL_FILTERS = {
  category: 'All',
  subcategory: 'All Types',
  brand: 'All Brands',
  series: '',
  selectedModel: [],
  priceRange: 'All Prices',
  selectedColor: '',
  inStockOnly: false,
};

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setPageMeta({
      title: 'WrapStore | Phone cases and accessories in Dharmapuri',
      description: 'Phone cases and accessories from Dharmapuri.',
    });
  }, []);

  const {
    products: liveProducts = [],
    categories: liveCategories = [],
    subcategories: liveSubcategories = [],
    isLoading = false,
    error,
    refetch,
  } = useProductsContext();

  // Deal of the day selection
  const dealData = useMemo(() => {
    return selectDealOfTheDay(liveProducts);
  }, [liveProducts]);

  // Derived Product Rows for Home Page (Featured, Combos, New Arrivals)
  // All in-stock only; each section hidden if fewer than 4 products
  const newArrivalProducts = useMemo(() => {
    return liveProducts
      .filter(
        (p) =>
          !p.is_combo &&
          p.stock_status !== 'OUT_OF_STOCK' &&
          (p.available_stock ?? p.current_stock ?? 0) > 0
      )
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [liveProducts]);

  const comboProducts = useMemo(() => {
    return liveProducts.filter(isComboEligible);
  }, [liveProducts]);

  const featuredProducts = useMemo(() => {
    return liveProducts.filter(
      (p) =>
        p.online_featured &&
        !p.is_combo &&
        p.stock_status !== 'OUT_OF_STOCK' &&
        (p.available_stock ?? p.current_stock ?? 0) > 0
    );
  }, [liveProducts]);

  // Bestsellers RPC map state
  const [bestSellerMap, setBestSellerMap] = useState(new Map());

  useEffect(() => {
    let isMounted = true;
    fetchBestSellersMap(16).then((map) => {
      if (isMounted) {
        setBestSellerMap(map);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Excluded product IDs for New Arrivals
  const excludedProductIds = useMemo(() => new Set(), []);

  const filterOptions = useMemo(
    () => deriveFilterOptions(liveProducts, liveCategories, liveSubcategories),
    [liveProducts, liveCategories, liveSubcategories]
  );

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // URL query parameters
  const location = useLocation();
  const isCombosRoute = location.pathname === '/combos';
  const catQuery = searchParams.get('category') || (isCombosRoute ? 'Combos' : null);
  const subQuery = searchParams.get('subcategory');
  const brandQuery = searchParams.get('brand');
  const seriesQuery = searchParams.get('series');
  const modelQuery = searchParams.get('model');
  const searchQuery = searchParams.get('search');
  const viewQuery = searchParams.get('view');
  const featuredQuery = searchParams.get('featured') === '1';

  // Determine if we should show Listing mode instead of Home mode
  const isListingMode = Boolean(
    isCombosRoute ||
    catQuery || subQuery || brandQuery || seriesQuery || modelQuery || searchQuery || viewQuery === 'all' || featuredQuery
  );

  // Sync state from URL params
  useEffect(() => {
    const modelParam = searchParams.get('model');
    const selectedModel = modelParam
      ? modelParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    setFilters((prev) => ({
      ...prev,
      category: catQuery || 'All',
      subcategory: subQuery || 'All Types',
      brand: brandQuery || (seriesQuery?.toLowerCase().includes('galaxy') ? 'Samsung' : seriesQuery?.toLowerCase().includes('iphone') ? 'Apple' : 'All Brands'),
      series: seriesQuery || '',
      selectedModel,
    }));
  }, [catQuery, subQuery, brandQuery, seriesQuery, searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    // Update URL search parameters
    setSearchParams((prevParams) => {
      const params = new URLSearchParams(prevParams);

      if (key === 'selectedModel') {
        const arr = Array.isArray(value)
          ? value
          : (typeof value === 'string' && value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);
        if (arr.length > 0) {
          params.set('model', arr.join(','));
        } else {
          params.delete('model');
        }
      } else if (value && value !== 'All' && value !== 'All Types' && value !== 'All Brands' && value !== 'All Prices') {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      return params;
    });
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchParams(isListingMode ? (featuredQuery ? { featured: '1' } : { view: 'all' }) : {});
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    let result = [...liveProducts];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes(q))) ||
          (p.subcategory || '').toLowerCase().includes(q) ||
          (Array.isArray(p.subcategories) && p.subcategories.some((s) => s.toLowerCase().includes(q))) ||
          (p.mobile_brand || '').toLowerCase().includes(q) ||
          (Array.isArray(p.brands) && p.brands.some((b) => b.toLowerCase().includes(q))) ||
          (p.compatible_models || []).some((m) => m.toLowerCase().includes(q)) ||
          (p.is_combo && 'combo'.includes(q))
      );
    }

    // Category filter (combos appear in all constituent categories)
    if (filters.category && filters.category !== 'All' && filters.category !== 'All Categories') {
      const targetCat = filters.category.toLowerCase();
      const isCombosFilter = targetCat === 'combos' || targetCat === 'combo';
      result = result.filter(
        (p) =>
          (isCombosFilter ? (p.is_combo || p.product_type === 'combo') : p.category?.toLowerCase() === targetCat) ||
          (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase() === targetCat))
      );
    }

    // Subcategory filter (combos appear in all constituent subcategories)
    if (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All') {
      const targetSub = filters.subcategory.toLowerCase();
      result = result.filter(
        (p) =>
          p.subcategory?.toLowerCase() === targetSub ||
          (Array.isArray(p.subcategories) && p.subcategories.some((s) => s.toLowerCase() === targetSub))
      );
    }

    // Brand filter
    if (filters.brand && filters.brand !== 'All Brands') {
      result = result.filter((p) => {
        const isCase =
          (p.category || '').toLowerCase().includes('case') ||
          (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes('case')));
        if (!isCase) return true; // Accessories remain visible
        const pBrand = (p.mobile_brand || '').toLowerCase();
        const pBrands = (p.brands || []).map((b) => b.toLowerCase());
        const targetB = filters.brand.toLowerCase();
        return (
          pBrand.includes(targetB) ||
          pBrands.some((b) => b.includes(targetB)) ||
          (p.compatible_models || []).some((m) => m.toLowerCase().includes(targetB))
        );
      });
    }

    // Series filter (e.g. "iPhone 16 Series")
    if (filters.series) {
      const sLower = filters.series.toLowerCase();
      const numMatch = sLower.match(/\d+/);
      const number = numMatch ? numMatch[0] : '';

      result = result.filter((p) => {
        const isCase =
          (p.category || '').toLowerCase().includes('case') ||
          (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes('case')));
        if (!isCase) return true;
        const models = p.compatible_models || [];
        return models.some((m) => {
          const mLower = m.toLowerCase();
          if (sLower.includes('galaxy') || sLower.includes('samsung')) {
            return mLower.includes('galaxy') && (!number || mLower.includes(number));
          }
          if (sLower.includes('iphone')) {
            return mLower.includes('iphone') && (!number || mLower.includes(number));
          }
          return mLower.includes(sLower);
        });
      });
    }

    // Selected model filter (supports multiple selected models)
    const activeModels = Array.isArray(filters.selectedModel)
      ? filters.selectedModel
      : filters.selectedModel
      ? filters.selectedModel.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (activeModels.length > 0) {
      const targetModels = activeModels.map((m) => m.toLowerCase().trim());
      result = result.filter((p) => {
        const isCase =
          (p.category || '').toLowerCase().includes('case') ||
          (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes('case')));
        if (!isCase) return true;
        const models = (p.compatible_models || []).map((m) => m.toLowerCase().trim());
        return targetModels.some((tm) => models.includes(tm));
      });
    }

    // Price range filter
    if (filters.priceRange && filters.priceRange !== 'All Prices') {
      const range = PRICE_RANGES.find((r) => r.label === filters.priceRange);
      if (range) {
        result = result.filter((p) => p.selling_price >= range.min && p.selling_price <= range.max);
      }
    }

    // In-stock only
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock_status !== 'OUT_OF_STOCK' && (p.available_stock ?? p.current_stock ?? 0) > 0);
    }

    // Color filter (matches real colors updated from POS)
    if (filters.selectedColor) {
      const targetC = filters.selectedColor.toLowerCase().trim();
      result = result.filter((p) =>
        (p.color_variants || []).some((c) => {
          const cName = typeof c === 'string' ? c : (c?.name || c?.color || String(c));
          return cName.toLowerCase().trim() === targetC;
        })
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.selling_price - b.selling_price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.selling_price - a.selling_price);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
    } else if (sortBy === 'in_stock') {
      result.sort((a, b) => (b.available_stock || 0) - (a.available_stock || 0));
    } else {
      // 'newest' (or featured-first when ?featured=1)
      if (featuredQuery) {
        result.sort((a, b) => {
          const aFeat = a.online_featured ? 1 : 0;
          const bFeat = b.online_featured ? 1 : 0;
          if (bFeat !== aFeat) return bFeat - aFeat;
          const aRank = bestSellerMap?.get(a.id)?.rank ?? 999;
          const bRank = bestSellerMap?.get(b.id)?.rank ?? 999;
          if (aRank !== bRank) return aRank - bRank;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
      } else {
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }
    }

    return result;
  }, [liveProducts, filters, sortBy, searchQuery, featuredQuery, bestSellerMap]);

  // Listing page title derivation
  const listingTitle = useMemo(() => {
    if (searchQuery) return `Search results for "${searchQuery}"`;
    if (featuredQuery) return 'Featured Products';
    if (filters.series) return filters.series;
    const activeModels = Array.isArray(filters.selectedModel)
      ? filters.selectedModel
      : filters.selectedModel
      ? filters.selectedModel.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (activeModels.length === 1) {
      return activeModels[0];
    }
    if (activeModels.length > 1) {
      return `${activeModels.length} Models Selected`;
    }
    if (filters.brand && filters.brand !== 'All Brands') {
      return filters.brand === 'Apple' ? 'iPhone Cases' : `${filters.brand} Cases`;
    }
    if (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All') {
      return filters.subcategory;
    }
    if (filters.category && filters.category !== 'All') {
      return filters.category;
    }
    return 'All Products';
  }, [filters, searchQuery, featuredQuery]);

  if (error && liveProducts.length === 0 && !isLoading) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-20 flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#141414]">
          Couldn't load products, retrying
        </h1>
        <p className="text-[14px] text-[#6B6B6B] max-w-md leading-relaxed">
          We are having trouble connecting to the product catalogue. Reconnecting automatically...
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center min-h-[46px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white font-semibold text-[14px] rounded-[6px] transition-colors shadow-xs"
        >
          Retry now
        </button>
      </main>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 1: HOME PAGE (Strict Data-Driven Flow per specifications)
  // Order: 1. Hero, 2. Shop by category, 3. Shop by phone strip,
  //        4. New arrivals, 5. Better together (combos), 6. Deal of the day,
  //        7. Featured, 8. Visit our store, 9. Footer (layout)
  // Each section hidden when empty or fewer than 4 items (except hero).
  // ───────────────────────────────────────────────────────────────────────────
  if (!isListingMode) {
    return (
      <>
        {/* Page SEO title, meta description, OG tags */}
        <HomeSEO />

        <main className="flex-1 w-full bg-[#FAFAF9] pb-24 sm:pb-0">
          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            
            {/* 1. HERO: Full-bleed carousel from hero_slides table */}
            <HeroFirstScreen />

            {/* 2. SHOP BY CATEGORY: Pill tabs + 4:5 portrait tiles row */}
            <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
              <CategoryScrollSection
                products={liveProducts}
                categories={liveCategories}
                subcategories={liveSubcategories}
              />
            </div>

            {/* 3. SHOP BY PHONE STRIP: Compact phone strip */}
            <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
              <ShopByPhoneStrip />
            </div>

            {/* 4. NEW ARRIVALS: Product row (hidden if < 4 items) */}
            {newArrivalProducts.length >= 4 && (
              <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
                <ProductScrollRow
                  title="New arrivals"
                  viewAllLink="/?view=all"
                  viewAllText="View all"
                  products={newArrivalProducts}
                />
              </div>
            )}

            {/* 5. BETTER TOGETHER (combos): Row of combo cards (Rendered if eligible combos exist) */}
            {comboProducts.length > 0 && (
              <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
                <ProductScrollRow
                  title="Better together"
                  subtitle="Protection bundles designed to work together"
                  viewAllLink="/combos"
                  viewAllText="View all combos"
                  products={comboProducts}
                  isComboRow={true}
                />
              </div>
            )}

            {/* 6. DEAL OF THE DAY: Existing layout and rules */}
            {dealData && (
              <div className="w-full">
                <DealOfTheDaySection dealData={dealData} />
              </div>
            )}

            {/* 7. FEATURED: Product row from online_featured (hidden if < 4 items) */}
            {featuredProducts.length >= 4 && (
              <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
                <ProductScrollRow
                  title="Featured products"
                  viewAllLink="/?featured=1"
                  viewAllText="View all"
                  products={featuredProducts}
                />
              </div>
            )}

            {/* 8. VISIT OUR STORE: Full-bleed store banner */}
            <VisitOurStoreBanner />

          </div>
        </main>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 2: LISTING PAGE (Breadcrumb, Sidebar filters, Sort right, Product Cards grid)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar on Desktop */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24 bg-white border border-[#E5E5E3] rounded-[6px] p-5">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalResultsCount={filteredProducts.length}
            filterOptions={filterOptions}
          />
        </div>

        {/* Right Column: Grid and Controls */}
        <div className="lg:col-span-9">
          <ProductGrid
            products={filteredProducts}
            title={listingTitle}
            breadcrumb={
              <div className="flex items-center gap-1.5 pb-2">
                <Link to="/" className="hover:text-[#141414] transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#141414] font-semibold">{listingTitle}</span>
              </div>
            }
            isLoading={isLoading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </div>
      </div>

      {/* Mobile Bottom Sheet Filters */}
      <FilterBottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredProducts.length}
        filterOptions={filterOptions}
      />
    </main>
  );
}

export default HomePage;
