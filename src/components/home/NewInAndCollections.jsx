import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { groupProductsByDesign } from '../../lib/models';
import { formatINR } from '../../lib/currency';
import { ProductCard } from './ProductCard';
import { collections } from '../../config/collections';

export function NewInAndCollections() {
  const { products = [], isLoading } = useProductsContext();
  const [activePill, setActivePill] = useState('all');

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
  const activeCollections = useMemo(() => {
    return collections
      .map((col) => {
        const matches = inStockProducts.filter((p) => {
          const isCase =
            (p.category || '').toLowerCase().includes('case') ||
            (p.subcategory || '').toLowerCase().includes('iphone') ||
            (p.subcategory || '').toLowerCase().includes('samsung');
          if (!isCase) return false;

          const pName = (p.name || '').toLowerCase();
          const pDesc = (p.description || '').toLowerCase();
          const pCol = (p.collection || '').toLowerCase();
          return col.match.some(
            (k) =>
              pName.includes(k.toLowerCase()) ||
              pDesc.includes(k.toLowerCase()) ||
              pCol.includes(k.toLowerCase())
          );
        });

        if (matches.length === 0) return null;

        const minPrice = matches.reduce(
          (min, p) => (p.selling_price && p.selling_price < min ? p.selling_price : min),
          matches[0].selling_price || 299
        );

        // Take up to 2 unique product images for overlapping preview
        const img1 =
          matches[0]?.image_url ||
          (Array.isArray(matches[0]?.images) && matches[0].images[0]) ||
          '/subcategories/iphone.jpg';
        const img2 =
          matches[1]?.image_url ||
          (Array.isArray(matches[1]?.images) && matches[1].images[0]) ||
          img1;

        return {
          ...col,
          count: matches.length,
          minPrice,
          image1: img1,
          image2: img2,
        };
      })
      .filter(Boolean);
  }, [inStockProducts]);

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

            <Link
              to="/?sortBy=newest"
              className="text-[14px] font-medium text-[#141414] underline underline-offset-4 decoration-1 hover:text-[#B0521F] transition-colors self-start sm:self-auto"
            >
              View all new
            </Link>
          </div>

          {/* Filter Pills */}
          {availablePills.length > 1 && (
            <div className="mb-6">
              <div
                role="tablist"
                aria-label="New in categories"
                className="inline-flex p-1 bg-[#F4F2EE] rounded-full gap-1 border border-[#E7E5E0] overflow-x-auto max-w-full no-scrollbar"
              >
                {availablePills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    role="tab"
                    aria-selected={activePill === pill.id}
                    onClick={() => setActivePill(pill.id)}
                    className={`px-4 py-2 text-[13px] sm:text-[14px] font-medium rounded-full transition-all cursor-pointer whitespace-nowrap ${
                      activePill === pill.id
                        ? 'bg-[#141414] text-white shadow-2xs'
                        : 'text-[#5A5A5A] hover:text-[#141414]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
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

            {/* 3 Large Cards Row (Desktop grid, Mobile swipe row) */}
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto scroll-smooth pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
              {activeCollections.map((col) => {
                const isDark = col.dark === true;

                return (
                  <Link
                    key={col.slug}
                    to={`/collection/${col.slug}`}
                    className={`w-[85vw] sm:w-[360px] md:w-auto shrink-0 snap-start min-h-[440px] rounded-[18px] p-6 sm:p-8 flex flex-col justify-between group overflow-hidden relative border transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer ${
                      isDark
                        ? 'border-[#3D3E44] text-white hover:border-white'
                        : 'border-[#E7E5E0] text-[#141414] hover:border-[#141414]'
                    }`}
                    style={{ backgroundColor: col.bg }}
                    aria-label={`Collection: ${col.name}, From Rs ${col.minPrice}`}
                  >
                    {/* Top Overlapping Images Area */}
                    <div className="relative h-[220px] w-full flex items-center justify-center pt-2">
                      {/* Secondary image behind left */}
                      <div className="absolute left-6 top-3 w-[140px] h-[175px] rounded-[14px] overflow-hidden bg-white/70 shadow-md rotate-[-8deg] group-hover:rotate-[-12deg] transition-transform duration-300 border border-black/5 p-1">
                        <img
                          src={col.image2}
                          alt=""
                          className="w-full h-full object-cover rounded-[10px]"
                          onError={(e) => {
                            e.currentTarget.src = '/subcategories/iphone.jpg';
                          }}
                        />
                      </div>

                      {/* Primary image front right */}
                      <div className="absolute right-6 top-6 w-[150px] h-[185px] rounded-[14px] overflow-hidden bg-white shadow-xl rotate-[6deg] group-hover:rotate-[2deg] group-hover:scale-102 transition-transform duration-300 border border-black/10 p-1 z-10">
                        <img
                          src={col.image1}
                          alt={col.name}
                          className="w-full h-full object-cover rounded-[10px]"
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
                          {col.tagline || col.description} · from {formatINR(col.minPrice)}
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
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default NewInAndCollections;
