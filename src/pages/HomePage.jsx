import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HeroFirstScreen } from '../components/home/HeroFirstScreen';
import { ShopByCategoryRow } from '../components/home/ShopByCategoryRow';
import { WhyWrapstore } from '../components/home/WhyWrapstore';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { NewArrivalsSection } from '../components/home/NewArrivalsSection';
import { HomeAboutBlock } from '../components/home/HomeAboutBlock';
import { StoreDetailsSection } from '../components/home/StoreDetailsSection';
import { HomeSEO } from '../components/home/HomeSEO';
import { FilterSidebar } from '../components/home/FilterSidebar';
import { FilterBottomSheet } from '../components/home/FilterBottomSheet';
import { ProductGrid } from '../components/home/ProductGrid';
import { useProductsContext } from '../context/ProductsContext';
import { deriveFilterOptions, PRICE_RANGES } from '../lib/useProducts';
import { fetchBestSellersMap } from '../lib/productRowAdapter';
import { ChevronRight } from 'lucide-react';

const INITIAL_FILTERS = {
  category: 'All',
  subcategory: 'All Types',
  brand: 'All Brands',
  series: '',
  selectedModel: '',
  priceRange: 'All Prices',
  selectedColor: '',
  inStockOnly: false,
};

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    products: liveProducts = [],
    categories: liveCategories = [],
    subcategories: liveSubcategories = [],
    isLoading = false,
  } = useProductsContext();

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
  const catQuery = searchParams.get('category');
  const subQuery = searchParams.get('subcategory');
  const brandQuery = searchParams.get('brand');
  const seriesQuery = searchParams.get('series');
  const searchQuery = searchParams.get('search');
  const viewQuery = searchParams.get('view');
  const featuredQuery = searchParams.get('featured') === '1';

  // Determine if we should show Listing mode instead of Home mode
  const isListingMode = Boolean(
    catQuery || subQuery || brandQuery || seriesQuery || searchQuery || viewQuery === 'all' || featuredQuery
  );

  // Sync state from URL params
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: catQuery || 'All',
      subcategory: subQuery || 'All Types',
      brand: brandQuery || (seriesQuery?.toLowerCase().includes('galaxy') ? 'Samsung' : seriesQuery?.toLowerCase().includes('iphone') ? 'Apple' : 'All Brands'),
      series: seriesQuery || '',
      selectedModel: searchParams.get('model') || '',
    }));
  }, [catQuery, subQuery, brandQuery, seriesQuery, searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };

      // Update URL search parameters
      const params = new URLSearchParams(searchParams);
      if (value && value !== 'All' && value !== 'All Types' && value !== 'All Brands' && value !== 'All Prices') {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      setSearchParams(params);
      return next;
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
          p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.subcategory || '').toLowerCase().includes(q) ||
          (p.mobile_brand || '').toLowerCase().includes(q) ||
          (p.compatible_models || []).some((m) => m.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'All' && filters.category !== 'All Categories') {
      result = result.filter((p) => p.category?.toLowerCase() === filters.category.toLowerCase());
    }

    // Subcategory filter
    if (filters.subcategory && filters.subcategory !== 'All Types' && filters.subcategory !== 'All') {
      result = result.filter(
        (p) => p.subcategory?.toLowerCase() === filters.subcategory.toLowerCase()
      );
    }

    // Brand filter
    if (filters.brand && filters.brand !== 'All Brands') {
      result = result.filter((p) => {
        const isCase = (p.category || '').toLowerCase().includes('case');
        if (!isCase) return true; // Accessories remain visible
        const pBrand = (p.mobile_brand || '').toLowerCase();
        const targetB = filters.brand.toLowerCase();
        return pBrand.includes(targetB) || (p.compatible_models || []).some((m) => m.toLowerCase().includes(targetB));
      });
    }

    // Series filter (e.g. "iPhone 16 Series")
    if (filters.series) {
      const sLower = filters.series.toLowerCase();
      const numMatch = sLower.match(/\d+/);
      const number = numMatch ? numMatch[0] : '';

      result = result.filter((p) => {
        const isCase = (p.category || '').toLowerCase().includes('case');
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

    // Selected model filter
    if (filters.selectedModel) {
      const targetM = filters.selectedModel.toLowerCase().trim();
      result = result.filter((p) => {
        const isCase = (p.category || '').toLowerCase().includes('case');
        if (!isCase) return true;
        const models = p.compatible_models || [];
        return models.some((m) => m.toLowerCase().trim() === targetM);
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

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 1: HOME PAGE (Strict Home Order with 96px desktop / 64px mobile spacing)
  // Order: Info bar, Header, First screen, Shop by category, Deal of the day,
  //        Featured, New arrivals, About us, Contact and store, Footer.
  // ───────────────────────────────────────────────────────────────────────────
  if (!isListingMode) {
    return (
      <>
        {/* Page SEO title, meta description, OG tags */}
        <HomeSEO />

        <main className="flex-1 w-full bg-[#FAFAF9] pb-16 sm:pb-24">
          <div className="space-y-16 lg:space-y-24">
            
            {/* 1. First Screen: Hero Full-Width Banner Slider (Completely hidden if no slides) */}
            <HeroFirstScreen />

            {/* 2. Shop by Category: Row directly under first screen */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <ShopByCategoryRow
                products={liveProducts}
                subcategories={liveSubcategories}
                categories={liveCategories}
              />
            </div>

            {/* Featured Products: Handpicked for a Better Everyday */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <FeaturedProductsSection />
            </div>

            {/* 2.5 Why WrapStore: Editorial 4-card feature row */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <WhyWrapstore />
            </div>



            {/* 5. New arrivals: Grid of up to 8, excluding Deal and Featured products */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <NewArrivalsSection
                products={liveProducts}
                excludedProductIds={excludedProductIds}
                isLoading={isLoading}
              />
            </div>

            {/* 6. About us: 2-column block */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <HomeAboutBlock />
            </div>

            {/* 7. Contact and store: Store details, hours, map CTA */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
              <StoreDetailsSection />
            </div>
          </div>
        </main>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 2: LISTING PAGE (Breadcrumb, Sidebar filters, Sort right, Product Cards grid)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
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
