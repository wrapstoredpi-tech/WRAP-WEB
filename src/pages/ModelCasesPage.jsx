import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X, MessageCircle, ArrowRight, Check } from 'lucide-react';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import {
  slugToModel,
  getLiveModelsWithCases,
  modelToSlug,
  groupProductsByDesign,
  isComboEligible,
  getComboImage,
} from '../lib/models';
import { ProductCard } from '../components/home/ProductCard';
import { setPageMeta } from '../lib/seo';
import { store } from '../config/store';

const PRICE_RANGES = [
  { label: 'All prices', min: 0, max: Infinity },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: 'Over ₹1,000', min: 1000, max: Infinity },
];

export function ModelPageSkeleton({ isAccessory = false }) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#141414] py-6 sm:py-8">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-48 bg-[#E5E5E3] rounded-[4px] animate-pulse" />

        {/* 1. Centred Title in Display Serif Skeleton */}
        <div className="text-center py-4 space-y-3">
          <div className="h-10 w-64 sm:w-80 bg-[#E5E5E3] rounded-[6px] mx-auto animate-pulse" />
          <div className="h-4 w-72 sm:w-96 bg-[#E5E5E3] rounded-[4px] mx-auto animate-pulse" />
        </div>

        {/* 2. Round Chips Skeleton (Row of circular chips) */}
        {!isAccessory && (
          <div className="py-6 flex items-center justify-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-[72px] h-[72px] rounded-full bg-[#E5E5E3] animate-pulse" />
                <div className="h-3 w-12 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* 3. Bar Skeleton */}
        <div className="border-t border-b border-[#E5E5E3] py-3.5 flex items-center justify-between">
          <div className="h-9 w-24 bg-[#E5E5E3] rounded-[6px] animate-pulse" />
          <div className="h-9 w-32 bg-[#E5E5E3] rounded-[6px] animate-pulse" />
        </div>

        {/* 4. 8 Product Card Skeletons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex flex-col bg-white border border-[#E5E5E3] rounded-[6px] overflow-hidden p-2.5 sm:p-3 space-y-3"
            >
              <div className="w-full aspect-[4/5] bg-[#E5E5E3] rounded-[4px] animate-pulse" />
              <div className="space-y-1.5 pt-1">
                <div className="h-4 w-3/4 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
                <div className="h-3.5 w-1/3 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
              </div>
              <div className="h-9 w-full bg-[#E5E5E3] rounded-[6px] animate-pulse mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ModelCasesPage({ isAccessoryPage = false }) {
  const { brand: brandSlug, model: modelSlug, subcategory: subcategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products = [], isLoading } = useProductsContext();
  const { savedPhone, selectPhone } = usePhoneContext();

  const brandCap = useMemo(() => {
    if (!brandSlug) return 'Apple';
    const lower = brandSlug.toLowerCase();
    return lower === 'samsung' ? 'Samsung' : 'Apple';
  }, [brandSlug]);

  // Distinct live models for this brand
  const liveModels = useMemo(() => {
    return getLiveModelsWithCases(products, brandCap);
  }, [products, brandCap]);

  // Resolve model slug against live model list
  const resolvedModel = useMemo(() => {
    if (isAccessoryPage) return null;
    return slugToModel(modelSlug, liveModels);
  }, [isAccessoryPage, modelSlug, liveModels]);

  // Subcategory resolution if on an accessory page
  const resolvedSubcategory = useMemo(() => {
    if (!isAccessoryPage) return null;
    if (!subcategorySlug) return 'Accessories';
    // Match against product subcategories
    const normSlug = subcategorySlug.toLowerCase().replace(/-/g, ' ');
    const matchedProduct = products.find(
      (p) => (p.subcategory || '').toLowerCase().replace(/-/g, ' ') === normSlug
    );
    if (matchedProduct?.subcategory) return matchedProduct.subcategory;
    // Fallback: title-case slug
    return subcategorySlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [isAccessoryPage, subcategorySlug, products]);

  // Set browser title only once the model resolves; never show "Model cases"
  useEffect(() => {
    if (isAccessoryPage) {
      if (resolvedSubcategory) {
        setPageMeta({
          title: `${resolvedSubcategory} | WrapStore`,
          description: `Everyday essentials and accessories for ${resolvedSubcategory}.`,
        });
      }
    } else if (resolvedModel) {
      setPageMeta({
        title: `${resolvedModel} cases | WrapStore`,
        description: `Cases, screen protection and combos for ${resolvedModel}.`,
      });
    } else if (!isLoading && !resolvedModel) {
      setPageMeta({
        title: 'Model not found | WrapStore',
        description: 'Cases and accessories for phone models at WrapStore.',
      });
    }
  }, [isAccessoryPage, resolvedSubcategory, resolvedModel, isLoading]);

  // Filter state
  const [activeChip, setActiveChip] = useState('all'); // 'all' | 'cases' | 'screen' | 'combos'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc'
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  const filterDropdownRef = useRef(null);

  // Close desktop filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);

  // 1. Collect all products for this model
  const { casesList, screenList, combosList, allModelProducts } = useMemo(() => {
    if (isAccessoryPage) {
      const accs = products.filter((p) => {
        if (!p) return false;
        const sub = (p.subcategory || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const matchesSub = resolvedSubcategory ? sub === resolvedSubcategory.toLowerCase() : true;
        const isAcc = cat.includes('accessor') || sub.includes('protector') || sub.includes('cable');
        return isAcc && matchesSub;
      });
      return {
        casesList: [],
        screenList: accs,
        combosList: [],
        allModelProducts: accs,
      };
    }

    if (!resolvedModel) {
      return { casesList: [], screenList: [], combosList: [], allModelProducts: [] };
    }

    const targetModel = resolvedModel.toLowerCase().trim();

    const cases = [];
    const screens = [];
    const combos = [];

    products.forEach((p) => {
      if (!p) return;
      const compModels = (p.compatible_models || []).map((m) => (m || '').toLowerCase().trim());
      const fitsThisModel = compModels.includes(targetModel);
      const isUniversal = compModels.length === 0 || compModels.includes('universal');

      const isCombo = Boolean(p.is_combo || p.product_type === 'combo');
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      const isCase =
        !isCombo &&
        (cat.includes('case') || sub.includes('case') || sub.includes('iphone') || sub.includes('samsung'));
      const isScreen =
        !isCombo &&
        (sub.includes('glass') ||
          sub.includes('screen') ||
          sub.includes('lens') ||
          cat.includes('glass') ||
          cat.includes('screen'));

      if (isCombo) {
        if (isComboEligible(p) && (fitsThisModel || isUniversal)) {
          combos.push(p);
        }
      } else if (isCase && fitsThisModel) {
        cases.push(p);
      } else if (isScreen && (fitsThisModel || isUniversal)) {
        screens.push(p);
      }
    });

    // Item 4: Model page "All" order: cases, then screen protection, then combos
    const all = [...cases, ...screens, ...combos];

    return {
      casesList: cases,
      screenList: screens,
      combosList: combos,
      allModelProducts: all,
    };
  }, [products, resolvedModel, isAccessoryPage, resolvedSubcategory]);

  // 2. Build Round Chips Data (72px circle with real photo on #F4F3F0; Only chips with items)
  const chips = useMemo(() => {
    if (isAccessoryPage) return [];

    const getThumbnail = (item) => {
      if (!item) return '/subcategories/iphone.jpg';
      if (item.is_combo || item.product_type === 'combo') {
        return getComboImage(item);
      }
      return item.image_url || (Array.isArray(item.images) && item.images[0]) || '/subcategories/iphone.jpg';
    };

    const list = [];

    if (allModelProducts.length > 0) {
      list.push({
        id: 'all',
        label: 'All',
        count: allModelProducts.length,
        image: getThumbnail(allModelProducts[0]),
      });
    }

    if (casesList.length > 0) {
      list.push({
        id: 'cases',
        label: 'Cases',
        count: casesList.length,
        image: getThumbnail(casesList[0]),
      });
    }

    if (screenList.length > 0) {
      list.push({
        id: 'screen',
        label: 'Screen protection',
        count: screenList.length,
        image: getThumbnail(screenList[0]),
      });
    }

    if (combosList.length > 0) {
      list.push({
        id: 'combos',
        label: 'Combos',
        count: combosList.length,
        image: getThumbnail(combosList[0]),
      });
    }

    return list;
  }, [isAccessoryPage, allModelProducts, casesList, screenList, combosList]);

  // 3. Filter products by active chip
  const activeProducts = useMemo(() => {
    if (isAccessoryPage) return allModelProducts;
    if (activeChip === 'cases') return casesList;
    if (activeChip === 'screen') return screenList;
    if (activeChip === 'combos') return combosList;
    return allModelProducts;
  }, [isAccessoryPage, activeChip, allModelProducts, casesList, screenList, combosList]);

  // 4. Distinct colors for filter sheet/dropdown
  const availableColors = useMemo(() => {
    const set = new Set();
    activeProducts.forEach((p) => {
      (p.color_variants || []).forEach((c) => {
        const name = typeof c === 'string' ? c.trim() : (c?.name || c?.color || '').trim();
        if (name) set.add(name);
      });
    });
    return Array.from(set).sort();
  }, [activeProducts]);

  // 5. Apply filters & sort, then group by design (Rule 12: cases first, then screen protection, then combos)
  const displayedDesigns = useMemo(() => {
    const filterAndSortGroup = (items) => {
      let filtered = [...items];

      // Filter: In stock only
      if (inStockOnly) {
        filtered = filtered.filter((p) => {
          const isOutOfStock = p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) <= 0;
          return !isOutOfStock;
        });
      }

      // Filter: Color
      if (selectedColor) {
        const targetColor = selectedColor.toLowerCase();
        filtered = filtered.filter((p) => {
          return (p.color_variants || []).some((c) => {
            const name = typeof c === 'string' ? c.trim() : (c?.name || c?.color || '').trim();
            return name.toLowerCase() === targetColor;
          });
        });
      }

      // Filter: Price range
      const priceFilter = PRICE_RANGES[selectedPriceRange];
      if (priceFilter && selectedPriceRange > 0) {
        filtered = filtered.filter((p) => {
          const price = p.selling_price || 0;
          return price >= priceFilter.min && price <= priceFilter.max;
        });
      }

      // Sort products before grouping
      filtered.sort((a, b) => {
        if (sortBy === 'price_asc') return (a.selling_price || 0) - (b.selling_price || 0);
        if (sortBy === 'price_desc') return (b.selling_price || 0) - (a.selling_price || 0);
        // Newest
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      return groupProductsByDesign(filtered);
    };

    if (activeChip === 'all' && !isAccessoryPage) {
      // Per Item 4: cases first, then screen protection, then combos; sorting applies within each group
      const casesGrouped = filterAndSortGroup(casesList);
      const screensGrouped = filterAndSortGroup(screenList);
      const combosGrouped = filterAndSortGroup(combosList);

      const isInStock = (p) => (p.available_stock ?? p.current_stock ?? 0) > 0 && p.stock_status !== 'OUT_OF_STOCK';
      const isOutOfStock = (p) => !isInStock(p);

      const inStock = [
        ...casesGrouped.filter(isInStock),
        ...screensGrouped.filter(isInStock),
        ...combosGrouped.filter(isInStock),
      ];
      const outOfStock = [
        ...casesGrouped.filter(isOutOfStock),
        ...screensGrouped.filter(isOutOfStock),
        ...combosGrouped.filter(isOutOfStock),
      ];
      return [...inStock, ...outOfStock];
    } else {
      const grouped = filterAndSortGroup(activeProducts);
      const inStock = grouped.filter((p) => (p.available_stock ?? p.current_stock ?? 0) > 0 && p.stock_status !== 'OUT_OF_STOCK');
      const outOfStock = grouped.filter((p) => (p.available_stock ?? p.current_stock ?? 0) <= 0 || p.stock_status === 'OUT_OF_STOCK');
      return [...inStock, ...outOfStock];
    }
  }, [activeChip, isAccessoryPage, casesList, screenList, combosList, activeProducts, inStockOnly, selectedColor, selectedPriceRange, sortBy]);

  // Universal accessories for the 0-cases scenario (Rule 9 & 10: exclude non-phone, group by design)
  const universalAccessories = useMemo(() => {
    const nonPhoneSubcats = ['watch strap', 'watch cases', 'ipad case', 'ipad temper', 'airpods cases'];
    const candidates = products.filter((p) => {
      if (!p) return false;
      const sub = (p.subcategory || '').toLowerCase();
      if (nonPhoneSubcats.includes(sub)) return false;
      const comp = p.compatible_models || [];
      const isUniversal = comp.length === 0 || comp.includes('Universal') || comp.includes('universal');
      const isCase = (p.category || '').toLowerCase().includes('case');
      return isUniversal && !isCase;
    });
    return groupProductsByDesign(candidates).slice(0, 4);
  }, [products]);

  const activeFiltersCount = (inStockOnly ? 1 : 0) + (selectedColor ? 1 : 0) + (selectedPriceRange > 0 ? 1 : 0);

  const handleResetFilters = () => {
    setInStockOnly(false);
    setSelectedColor(null);
    setSelectedPriceRange(0);
  };

  // 1. While loading products, show skeletons (title, chips and 8 cards)
  if (isLoading) {
    return <ModelPageSkeleton isAccessory={isAccessoryPage} />;
  }

  // 2. Show "Model not found" only after products have finished loading and slug still does not match
  if (!isAccessoryPage && !resolvedModel) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#FAFAF9] text-[#141414] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center border border-[#E5E5E3] bg-white rounded-[6px] p-8 sm:p-10 shadow-xs space-y-4">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#141414]">
            Model not found
          </h1>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            The phone model in your link could not be identified. Please choose from our available models.
          </p>
          <div className="pt-2">
            <Link
              to="/cases"
              className="inline-flex items-center justify-center min-h-[46px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white font-semibold text-[14px] rounded-[6px] transition-colors shadow-xs"
            >
              Browse all models
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasCases = casesList.length > 0;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FAFAF9] text-[#141414] pb-20 pt-4 sm:pt-6">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#141414] transition-colors">WrapStore</Link>
          <span>/</span>
          {isAccessoryPage ? (
            <>
              <Link to="/?category=Accessories" className="hover:text-[#141414] transition-colors">Accessories</Link>
              <span>/</span>
              <span className="text-[#141414] font-medium">{resolvedSubcategory}</span>
            </>
          ) : (
            <>
              <Link to="/cases" className="hover:text-[#141414] transition-colors">Cases</Link>
              <span>/</span>
              <Link to={`/cases?brand=${brandCap}`} className="hover:text-[#141414] transition-colors">{brandCap}</Link>
              <span>/</span>
              <span className="text-[#141414] font-medium">{resolvedModel}</span>
            </>
          )}
        </nav>

        {/* 1. Centred Title in Display Serif */}
        <div className="text-center py-4">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#141414]">
            {isAccessoryPage ? resolvedSubcategory : `${resolvedModel} cases`}
          </h1>
          <p className="text-[14px] text-[#6B6B6B] mt-2 max-w-md mx-auto">
            {isAccessoryPage
              ? `Daily essentials and accessories for ${resolvedSubcategory.toLowerCase()}.`
              : `Cases, screen protection and combos for ${resolvedModel}.`}
          </p>
        </div>

        {/* 2. Centred Row of Round Chips (72px circle with real photo on #F4F3F0; only chips with items) */}
        {!isAccessoryPage && hasCases && chips.length > 1 && (
          <div className="py-6 flex items-center justify-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar max-w-full">
            {chips.map((chip) => {
              const isActive = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveChip(chip.id)}
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-[72px] h-[72px] rounded-full overflow-hidden bg-[#F4F3F0] p-1 border transition-all flex items-center justify-center ${
                      isActive
                        ? 'ring-2 ring-[#B0521F] border-[#B0521F]'
                        : 'border-[#E5E5E3] group-hover:border-[#141414]'
                    }`}
                  >
                    <img
                      src={chip.image}
                      alt={chip.label}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className={`text-[13px] text-center transition-colors ${
                      isActive ? 'font-semibold text-[#141414]' : 'text-[#6B6B6B] group-hover:text-[#141414]'
                    }`}
                  >
                    {chip.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── SCENARIO A: MODEL HAS CASES ─── */}
        {(hasCases || isAccessoryPage) ? (
          <div className="space-y-6">
            
            {/* 3. Bar: "Filters" button on left, sort on right. Under it: "Model: <model> ›" */}
            <div className="border-t border-b border-[#E5E5E3] py-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                
                {/* Left: Filters Button */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.innerWidth >= 1024) {
                        setIsFilterDropdownOpen((prev) => !prev);
                      } else {
                        setIsFilterSheetOpen(true);
                      }
                    }}
                    className={`min-h-[40px] px-4 rounded-[6px] border text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                      activeFiltersCount > 0
                        ? 'border-[#B0521F] bg-[#B0521F]/5 text-[#B0521F]'
                        : 'border-[#E5E5E3] bg-white text-[#141414] hover:border-[#141414]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#B0521F] text-white text-[11px] font-semibold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Dropdown Panel */}
                  {isFilterDropdownOpen && (
                    <div className="hidden lg:block absolute left-0 top-[calc(100%+8px)] w-[320px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg p-5 z-30 space-y-5 animate-fadeIn">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
                        <span className="font-semibold text-[14px] text-[#141414]">Filters</span>
                        {activeFiltersCount > 0 && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="text-[12px] text-[#B0521F] hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* In stock only toggle */}
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-[13px] text-[#141414]">In stock only</span>
                        <input
                          type="checkbox"
                          checked={inStockOnly}
                          onChange={(e) => setInStockOnly(e.target.checked)}
                          className="w-4 h-4 accent-[#B0521F] cursor-pointer"
                        />
                      </label>

                      {/* Price Range */}
                      <div className="space-y-2">
                        <span className="text-[12px] font-semibold text-[#6B6B6B] uppercase tracking-wider block">
                          Price
                        </span>
                        <div className="space-y-1.5">
                          {PRICE_RANGES.map((rng, idx) => (
                            <label key={rng.label} className="flex items-center gap-2.5 text-[13px] text-[#141414] cursor-pointer">
                              <input
                                type="radio"
                                name="desktop_price"
                                checked={selectedPriceRange === idx}
                                onChange={() => setSelectedPriceRange(idx)}
                                className="w-4 h-4 accent-[#B0521F] cursor-pointer"
                              />
                              <span>{rng.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Colors */}
                      {availableColors.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#E5E5E3]">
                          <span className="text-[12px] font-semibold text-[#6B6B6B] uppercase tracking-wider block">
                            Colour
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {availableColors.map((col) => {
                              const isSel = selectedColor === col;
                              return (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => setSelectedColor(isSel ? null : col)}
                                  className={`px-2.5 py-1 text-[12px] rounded-[4px] border transition-colors cursor-pointer ${
                                    isSel
                                      ? 'border-[#B0521F] bg-[#B0521F] text-white font-medium'
                                      : 'border-[#E5E5E3] bg-[#F4F3F0] text-[#141414] hover:border-[#141414]'
                                  }`}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Sort Button */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[13px] text-[#6B6B6B]">Sort by:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort products by"
                      className="bg-white border border-[#E5E5E3] hover:border-[#141414] rounded-[6px] pl-3 pr-8 py-2 min-h-[40px] text-[13px] font-medium text-[#141414] appearance-none cursor-pointer focus:outline-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price low to high</option>
                      <option value="price_desc">Price high to low</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Under filter bar: "Model: <model> ›" which opens the picker (only on model pages) */}
              {!isAccessoryPage && resolvedModel && (
                <div className="pt-1">
                  <Link
                    to="/cases"
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#6B6B6B] hover:text-[#B0521F] transition-colors"
                  >
                    <span>Model: <strong className="text-[#141414] font-semibold">{resolvedModel}</strong></span>
                    <span className="text-[#B0521F] font-semibold">›</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Filter Bottom Sheet */}
            {isFilterSheetOpen && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-fadeIn"
                onClick={() => setIsFilterSheetOpen(false)}
              >
                <div
                  className="bg-white rounded-t-[12px] p-6 max-h-[85vh] overflow-y-auto space-y-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
                    <h3 className="font-serif text-xl font-normal text-[#141414]">Filter cases</h3>
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(false)}
                      className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-[#141414]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* In stock only */}
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-[15px] font-medium text-[#141414]">In stock only</span>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-5 h-5 accent-[#B0521F] cursor-pointer"
                    />
                  </label>

                  {/* Price */}
                  <div className="space-y-3 pt-2 border-t border-[#E5E5E3]">
                    <span className="text-[12px] font-semibold text-[#6B6B6B] uppercase tracking-wider block">
                      Price range
                    </span>
                    <div className="space-y-2">
                      {PRICE_RANGES.map((rng, idx) => (
                        <label key={rng.label} className="flex items-center gap-3 text-[14px] text-[#141414] cursor-pointer">
                          <input
                            type="radio"
                            name="mobile_price"
                            checked={selectedPriceRange === idx}
                            onChange={() => setSelectedPriceRange(idx)}
                            className="w-4 h-4 accent-[#B0521F] cursor-pointer"
                          />
                          <span>{rng.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  {availableColors.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-[#E5E5E3]">
                      <span className="text-[12px] font-semibold text-[#6B6B6B] uppercase tracking-wider block">
                        Colours
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map((col) => {
                          const isSel = selectedColor === col;
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setSelectedColor(isSel ? null : col)}
                              className={`px-3 py-1.5 text-[13px] rounded-[6px] border transition-colors ${
                                isSel
                                  ? 'border-[#B0521F] bg-[#B0521F] text-white font-medium'
                                  : 'border-[#E5E5E3] bg-[#F4F3F0] text-[#141414]'
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="flex-1 h-[48px] border border-[#E5E5E3] rounded-[6px] text-[14px] font-medium text-[#141414]"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(false)}
                      className="flex-1 h-[48px] bg-[#B0521F] text-white rounded-[6px] text-[14px] font-medium"
                    >
                      Apply filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Grid: 2 columns mobile, 3 tablet, 4 desktop. Same card as Home. Out-of-stock designs at end, greyed with "Sold out" */}
            {displayedDesigns.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {displayedDesigns.map((product) => {
                  const isOutOfStock = (product.available_stock ?? product.current_stock ?? 0) <= 0 || product.stock_status === 'OUT_OF_STOCK';
                  return (
                    <div
                      key={product.id}
                      className={isOutOfStock ? 'opacity-65 filter grayscale contrast-90 relative' : ''}
                    >
                      <ProductCard product={product} contextModel={resolvedModel} />
                      {isOutOfStock && (
                        <div className="absolute top-2 left-2 z-10 bg-[#141414]/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded-[4px]">
                          Sold out
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-[#E5E5E3] rounded-[6px] bg-white p-12 text-center my-8">
                <p className="text-[15px] text-[#6B6B6B]">
                  No products found matching your active filter criteria.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-[#B0521F] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#964317] transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}

          </div>
        ) : (
          /* ─── SCENARIO B: MODEL WITH NO CASES ─── */
          <div className="py-8 space-y-12">
            <div className="max-w-xl mx-auto border border-[#E5E5E3] bg-white rounded-[6px] p-8 text-center shadow-xs space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#141414]">
                No cases for {resolvedModel} yet
              </h2>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                We don't have cases for {resolvedModel} online yet. Ask us on WhatsApp and we'll check the store.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Prefilled WhatsApp Button */}
                <a
                  href={`https://wa.me/${store.whatsappNumber || '918122747947'}?text=Hi%2C%20do%20you%20have%20cases%20for%20${encodeURIComponent(resolvedModel)}%3F`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-h-[46px] px-5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Ask on WhatsApp</span>
                </a>

                {/* Choose another model button */}
                <Link
                  to="/cases"
                  className="w-full sm:w-auto min-h-[46px] px-5 border border-[#E5E5E3] hover:border-[#141414] bg-white text-[#141414] text-[14px] font-medium rounded-[6px] transition-colors flex items-center justify-center cursor-pointer"
                >
                  Choose another model
                </Link>
              </div>
            </div>

            {/* Universal accessories shown below */}
            {universalAccessories.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-[#E5E5E3]">
                <div className="text-center">
                  <h3 className="font-serif text-2xl font-normal text-[#141414]">
                    Universal accessories
                  </h3>
                  <p className="text-[13px] text-[#6B6B6B] mt-1">
                    Everyday essentials and add-ons
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {universalAccessories.map((product) => (
                    <ProductCard key={product.id} product={product} contextModel={resolvedModel} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default ModelCasesPage;
