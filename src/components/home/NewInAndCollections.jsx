import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { groupProductsByDesign } from '../../lib/models';
import { formatINR } from '../../lib/currency';
import { ProductCard } from './ProductCard';
import { collectionNameToSlug } from '../../config/collections';
import { CollectionModelModal } from '../collection/CollectionModelModal';

export function NewInAndCollections() {
  const navigate = useNavigate();
  const { products = [], isLoading } = useProductsContext();
  const { savedPhone, selectPhone } = usePhoneContext();
  const [activePill, setActivePill] = useState('all');
  const [selectedCollectionForModal, setSelectedCollectionForModal] = useState(null);

  // Category pill horizontal scrolling controls (matching Featured Products)
  const pillContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update category scroll button visibility
  const updateScrollButtons = useCallback(() => {
    const el = pillContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const handleScroll = (direction) => {
    const el = pillContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Filter in-stock only
  const inStockProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p || p.is_active === false || p.online_visible === false) return false;
      const stock = p.available_stock ?? p.current_stock ?? 0;
      return stock > 0 && p.stock_status !== 'OUT_OF_STOCK';
    });
  }, [products]);

  // Sort newest by created_at descending
  const sortedNewest = useMemo(() => {
    return [...inStockProducts].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
  }, [inStockProducts]);

  // Categories partition for New In
  const newCases = useMemo(() => {
    return sortedNewest.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      return (
        !p.is_combo &&
        (cat.includes('case') ||
          sub.includes('iphone') ||
          sub.includes('samsung') ||
          cat.includes('mobile cases'))
      );
    });
  }, [sortedNewest]);

  const newScreen = useMemo(() => {
    return sortedNewest.filter((p) => {
      const sub = (p.subcategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        !p.is_combo &&
        (sub.includes('glass') ||
          sub.includes('screen') ||
          sub.includes('lens') ||
          name.includes('tempered') ||
          name.includes('protector'))
      );
    });
  }, [sortedNewest]);

  const newPower = useMemo(() => {
    return sortedNewest.filter((p) => {
      const sub = (p.subcategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        !p.is_combo &&
        (sub.includes('power') ||
          sub.includes('cable') ||
          sub.includes('charger') ||
          sub.includes('adapter') ||
          name.includes('power bank') ||
          name.includes('cable') ||
          name.includes('charger'))
      );
    });
  }, [sortedNewest]);

  const newWatch = useMemo(() => {
    return sortedNewest.filter((p) => {
      const sub = (p.subcategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        !p.is_combo &&
        (sub.includes('watch') || name.includes('strap') || name.includes('watch case'))
      );
    });
  }, [sortedNewest]);

  // Eligible filter pills (only show groups that have products)
  const availablePills = useMemo(() => {
    const list = [{ id: 'all', label: 'All', count: sortedNewest.length }];
    if (newCases.length > 0) list.push({ id: 'cases', label: 'Cases', count: newCases.length });
    if (newScreen.length > 0)
      list.push({ id: 'screen', label: 'Screen protection', count: newScreen.length });
    if (newPower.length > 0)
      list.push({ id: 'power', label: 'Power and charging', count: newPower.length });
    if (newWatch.length > 0) list.push({ id: 'watch', label: 'Watch', count: newWatch.length });
    return list;
  }, [sortedNewest, newCases, newScreen, newPower, newWatch]);

  useEffect(() => {
    const el = pillContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, availablePills]);

  // Selected pill products grouped by design (max 4 cards)
  const displayProducts = useMemo(() => {
    let source = sortedNewest;
    if (activePill === 'cases') source = newCases;
    else if (activePill === 'screen') source = newScreen;
    else if (activePill === 'power') source = newPower;
    else if (activePill === 'watch') source = newWatch;

    const grouped = groupProductsByDesign(source);
    return grouped.slice(0, 4);
  }, [activePill, sortedNewest, newCases, newScreen, newPower, newWatch]);

  // Helper to build custom info line for card
  const getCardInfoLine = (product) => {
    if (!product) return null;
    const siblingCount = product.allSiblings?.length || product.aggregatedColors?.length || 0;
    if (siblingCount > 1) {
      return `Available in ${siblingCount} colours`;
    }

    const models = Array.isArray(product.compatible_models)
      ? product.compatible_models.filter((m) => m && m !== 'Universal')
      : [];
    if (models.length === 1) {
      return `Fits ${models[0]}`;
    }
    if (models.length > 1) {
      return `Fits ${models[0]} to ${models[models.length - 1]}`;
    }

    if (product.subcategory_description) {
      return product.subcategory_description;
    }
    return product.subcategory || product.category || '';
  };

  // ─── Tier B: Trending Collections ──────────────────────────────────────────
  // Dynamically extract distinct collection names from products table
  const activeCollections = useMemo(() => {
    const colMap = new Map();

    inStockProducts.forEach((p) => {
      const isCase =
        !p.is_combo &&
        p.product_type !== 'combo' &&
        ((p.category || '').toLowerCase().includes('case') ||
          (p.subcategory || '').toLowerCase().includes('iphone') ||
          (p.subcategory || '').toLowerCase().includes('samsung') ||
          (p.category || '').toLowerCase().includes('mobile cases'));
      if (!isCase) return;

      const rawCol = (p.collection || '').trim();
      if (!rawCol || rawCol.toLowerCase().startsWith('combo')) return;

      const slug = collectionNameToSlug(rawCol);
      if (!colMap.has(slug)) {
        colMap.set(slug, {
          name: rawCol,
          slug,
          products: [],
        });
      }
      colMap.get(slug).products.push(p);
    });

    const palette = [
      { bg: '#F2F4F7', dark: false }, // Soft cool grey/slate
      { bg: '#FAF0E6', dark: false }, // Soft linen/sand
      { bg: '#EAE8E3', dark: false }, // Neutral stone
      { bg: '#E8F1F2', dark: false }, // Soft frost
      { bg: '#F6F3EE', dark: false }, // Warm ivory
    ];

    let idx = 0;
    return Array.from(colMap.values()).map((col) => {
      const pList = col.products;
      const minPrice = pList.reduce(
        (min, p) => (p.selling_price && p.selling_price < min ? p.selling_price : min),
        pList[0]?.selling_price || 299
      );

      // Primary case image from this collection
      const primaryImg =
        pList[0]?.image_url ||
        (Array.isArray(pList[0]?.images) && pList[0].images[0]) ||
        '/subcategories/iphone.jpg';

      const style = palette[idx % palette.length];
      idx++;

      return {
        name: col.name,
        slug: col.slug,
        count: pList.length,
        minPrice,
        image: primaryImg,
        bg: style.bg,
        dark: style.dark,
        products: pList,
      };
    });
  }, [inStockProducts]);

  const handleOpenCollectionModal = (col) => {
    setSelectedCollectionForModal(col);
  };

  const handleSelectModel = (brand, model) => {
    selectPhone(brand, model);
    const colSlug = selectedCollectionForModal?.slug;
    setSelectedCollectionForModal(null);
    if (colSlug) {
      navigate(`/collection/${colSlug}?model=${encodeURIComponent(model)}&brand=${encodeURIComponent(brand)}`);
    }
  };

  // If loading and no products, show skeleton
  if (isLoading && products.length === 0) {
    return (
      <section aria-label="New in and collections" className="w-full py-10 md:py-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="h-8 w-36 bg-[#EFECE6] rounded-[6px] mb-2 animate-pulse" />
          <div className="h-4 w-60 bg-[#EFECE6] rounded-[6px] mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[380px]">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#EFECE6] rounded-[12px] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Hide if no products
  if (displayProducts.length === 0 && activeCollections.length === 0) {
    return null;
  }

  return (
    <section aria-label="New in and trending collections" className="w-full select-none py-10 md:py-16">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        {/* ─── TIER A: NEW IN ──────────────────────────────────────────────── */}
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[26px] sm:text-[30px] font-semibold text-[#141414] tracking-[-0.025em] leading-tight">
                New in
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#5A5A5A] mt-1">
                The latest drops, sorted the way you shop.
              </p>
            </div>

            {/* View All New CTA (Desktop / Tablet) */}
            <Link
              to="/?sortBy=newest"
              className="hidden sm:inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white font-sans text-[14px] font-medium transition-colors duration-200 self-start md:self-auto shrink-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 cursor-pointer group"
            >
              <span>View All New</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Category Filter Bar with Horizontal Carousel Controls (matching Featured Products) */}
          {availablePills.length > 1 && (
            <div className="relative mb-6 sm:mb-8 flex items-center gap-3 min-w-0 w-full overflow-hidden">
              <div
                ref={pillContainerRef}
                role="tablist"
                aria-label="New in categories"
                className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 min-w-0 flex-1"
              >
                {availablePills.map((pill) => {
                  const isActive = activePill === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActivePill(pill.id)}
                      className={`px-4 sm:px-5 py-2 rounded-full font-sans text-[13px] sm:text-[14px] whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 ${
                        isActive
                          ? 'bg-[#141414] text-white font-medium shadow-sm'
                          : 'bg-[#EFEFEB] text-[#4A4A4A] hover:bg-[#E5E3DD] hover:text-[#141414] font-medium'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Scroll buttons */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-1">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Scroll categories left"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canScrollLeft
                      ? 'bg-[#EFEFEB] hover:bg-[#E5E3DD] text-[#4A4A4A] active:scale-90 cursor-pointer'
                      : 'bg-[#F5F5F3] text-[#B0AEA8] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Scroll categories right"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canScrollRight
                      ? 'bg-[#EFEFEB] hover:bg-[#E5E3DD] text-[#4A4A4A] active:scale-90 cursor-pointer'
                      : 'bg-[#F5F5F3] text-[#B0AEA8] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>
          )}

          {/* 4-Card Grid (4 cols desktop, 2 cols mobile) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                badge="New"
                infoLine={getCardInfoLine(product)}
              />
            ))}
          </div>

          {/* Mobile-only CTA button placed after all cards (matching Featured Products) */}
          <div className="mt-6 flex sm:hidden justify-center">
            <Link
              to="/?sortBy=newest"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white font-sans text-[14px] font-medium transition-colors duration-200 shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 active:scale-[0.98]"
            >
              <span>View All New</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ─── TIER B: TRENDING COLLECTIONS (72px below Tier A) ─────────────── */}
        {activeCollections.length > 0 && (
          <div className="mt-16 md:mt-[72px]">
            {/* Sub-header */}
            <div className="mb-6">
              <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#141414] leading-tight">
                Trending collections
              </h3>
              <p className="text-[14px] sm:text-[15px] text-[#5A5A5A] mt-1">
                Shop a look across every model.
              </p>
            </div>

            {/* Collection Cards Row (Separate tile for each collection from DB) */}
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto scroll-smooth pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
              {activeCollections.map((col) => {
                const isDark = col.dark === true;

                return (
                  <button
                    key={col.slug}
                    type="button"
                    onClick={() => handleOpenCollectionModal(col)}
                    className={`w-[85vw] sm:w-[340px] md:w-auto shrink-0 snap-start min-h-[400px] rounded-[18px] p-6 sm:p-7 flex flex-col justify-between group overflow-hidden relative border text-left transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer ${
                      isDark
                        ? 'border-[#3D3E44] text-white hover:border-white'
                        : 'border-[#E7E5E0] text-[#141414] hover:border-[#141414]'
                    }`}
                    style={{ backgroundColor: col.bg }}
                    aria-label={`Collection: ${col.name}, From Rs ${col.minPrice}. Click to select your phone model`}
                  >
                    {/* Top Case Image Area */}
                    <div className="relative h-[220px] w-full flex items-center justify-center pt-2">
                      <div className="w-[155px] h-[195px] rounded-[14px] overflow-hidden bg-white/90 shadow-md group-hover:scale-105 transition-transform duration-300 border border-black/5 p-2 flex items-center justify-center">
                        <img
                          src={col.image}
                          alt={col.name}
                          className="w-full h-full object-contain rounded-[10px]"
                          onError={(e) => {
                            e.currentTarget.src = '/subcategories/iphone.jpg';
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Details */}
                    <div className="mt-6 pt-4 border-t border-black/10 flex items-end justify-between gap-4">
                      <div>
                        <h4
                          className={`text-[20px] sm:text-[22px] font-semibold leading-tight ${
                            isDark ? 'text-white' : 'text-[#141414]'
                          }`}
                        >
                          {col.name}
                        </h4>
                        <p
                          className={`text-[13px] sm:text-[14px] mt-1 ${
                            isDark ? 'text-white/70' : 'text-[#5A5A5A]'
                          }`}
                        >
                          {col.count} {col.count === 1 ? 'design' : 'designs'} · from {formatINR(col.minPrice)}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <span
                          className={`text-[13px] font-semibold underline underline-offset-4 decoration-1 group-hover:translate-x-0.5 transition-transform ${
                            isDark ? 'text-white' : 'text-[#141414]'
                          }`}
                        >
                          Shop now
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Ask for mobile model before showing cases */}
      <CollectionModelModal
        isOpen={Boolean(selectedCollectionForModal)}
        onClose={() => setSelectedCollectionForModal(null)}
        collection={selectedCollectionForModal}
        selectedModel={savedPhone?.model}
        onSelectModel={handleSelectModel}
      />
    </section>
  );
}

export default NewInAndCollections;
