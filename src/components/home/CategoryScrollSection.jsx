import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import {
  getLiveModelsWithCases,
  getModelCaseDesigns,
  getLiveAccessorySubcategories,
  getLiveCombos,
  getComboImage,
  modelToSlug,
} from '../../lib/models';
import { formatINR } from '../../lib/currency';
import { ComboThumbnail } from '../cart/ComboThumbnail';

export function CategoryScrollSection({
  products = [],
  categories = [],
  subcategories = [],
}) {
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'accessories' | 'combos'
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef(null);

  // 1. Cases Items: 1 tile per model with in-stock cases + 1 final "Find your model" tile
  const liveAppleModels = useMemo(() => {
    return getLiveModelsWithCases(products, 'Apple');
  }, [products]);

  const caseItems = useMemo(() => {
    const usedImages = new Set();
    const modelTiles = liveAppleModels.map((model) => {
      const { designsCount, slug } = getModelCaseDesigns(products, model, 'Apple');

      // Find in-stock case products for this model
      const mLower = model.toLowerCase().trim();
      const nonPhone = ['watch strap', 'watch cases', 'ipad case', 'ipad temper', 'airpods cases'];
      const matching = products.filter((p) => {
        if (!p || p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) <= 0) return false;
        if (p.is_active === false || p.online_visible === false) return false;
        const sub = (p.subcategory || '').toLowerCase();
        if (nonPhone.includes(sub)) return false;
        const isCase =
          p.category === 'Mobile Cases' ||
          (Array.isArray(p.categories) && p.categories.includes('Mobile Cases')) ||
          sub === 'iphone' ||
          sub === 'samsung';
        if (!isCase) return false;
        const comp = (p.compatible_models || []).map((cm) => (cm || '').toLowerCase().trim());
        return comp.includes(mLower);
      });

      // Per audit rule 14: choose a different representative photo for each model when one exists
      let chosen = matching.find((p) => p.image_url && !usedImages.has(p.image_url)) || matching[0];
      if (chosen?.image_url) {
        usedImages.add(chosen.image_url);
      }

      const photo =
        chosen?.image_url ||
        (Array.isArray(chosen?.images) && chosen.images[0]) ||
        '/subcategories/iphone.jpg';

      return {
        id: `model-${slug}`,
        name: model,
        caption: `${designsCount} ${designsCount === 1 ? 'design' : 'designs'}`,
        image: photo,
        link: `/cases/apple/${slug}`,
        isActionTile: false,
      };
    });

    // Add final "Find your model" tile if we have any models
    if (modelTiles.length > 0) {
      modelTiles.push({
        id: 'find-your-model',
        name: 'Find your model',
        caption: 'Browse all iPhone and Samsung models',
        image: null,
        link: '/cases',
        isActionTile: true,
      });
    }

    return modelTiles;
  }, [liveAppleModels, products]);

  // 2. Accessories Items: 1 tile per subcategory with products
  const liveAccessorySubs = useMemo(() => {
    return getLiveAccessorySubcategories(products, subcategories);
  }, [products, subcategories]);

  const accessoryItems = useMemo(() => {
    return liveAccessorySubs.map((sub) => ({
      id: `acc-sub-${sub.id || sub.name}`,
      name: sub.name,
      caption: `${sub.productCount} ${sub.productCount === 1 ? 'product' : 'products'}`,
      image: sub.image,
      link: `/?category=Accessories&subcategory=${encodeURIComponent(sub.name)}`,
      isActionTile: false,
    }));
  }, [liveAccessorySubs]);

  // 3. Combos Items: 1 tile per combo
  const liveCombosList = useMemo(() => {
    return getLiveCombos(products, 12);
  }, [products]);

  const comboItems = useMemo(() => {
    return liveCombosList.map((combo) => ({
      id: `combo-${combo.id}`,
      name: combo.name,
      caption: formatINR(combo.selling_price),
      combo,
      image: getComboImage(combo),
      link: `/product/${combo.id}`,
      isActionTile: false,
    }));
  }, [liveCombosList]);

  // Determine available tabs
  const hasCases = caseItems.length > 0;
  const hasAccessories = accessoryItems.length > 0;
  const hasCombos = comboItems.length > 0;

  // Active items based on selected tab
  const activeItems = useMemo(() => {
    if (activeTab === 'cases' && hasCases) return caseItems;
    if (activeTab === 'accessories' && hasAccessories) return accessoryItems;
    if (activeTab === 'combos' && hasCombos) return comboItems;
    if (hasCases) return caseItems;
    if (hasAccessories) return accessoryItems;
    if (hasCombos) return comboItems;
    return [];
  }, [activeTab, hasCases, hasAccessories, hasCombos, caseItems, accessoryItems, comboItems]);

  const viewAllLink = useMemo(() => {
    if (activeTab === 'cases') return '/cases';
    if (activeTab === 'accessories') return '/?category=Accessories';
    if (activeTab === 'combos') return '/combos';
    return '/cases';
  }, [activeTab]);

  // Handle scroll event for 2px progress bar
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
    } else {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    }
  }, []);

  const scrollByDirection = (dir) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.75 * (dir === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Reset scroll on tab change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setScrollProgress(0);
    }
  }, [activeTab]);

  // Rule: Hide section when it would be empty or have fewer than 4 items
  if (activeItems.length < 4) {
    return null;
  }

  return (
    <section aria-label="Shop by category" className="w-full select-none group/category-row relative">
      {/* Top Header: Title Left, Pill Tabs + View All Link Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[24px] sm:text-[30px] font-semibold text-[#141414] tracking-[-0.025em]">
            Shop by category
          </h2>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
          {/* Pill tabs (active pill filled #141414 with white text) */}
          <div className="flex items-center gap-2 p-1 bg-[#F4F3F0] rounded-full border border-[#E5E5E3]">
            {hasCases && (
              <button
                type="button"
                onClick={() => setActiveTab('cases')}
                className={`px-4 py-1.5 text-[13px] font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'cases'
                    ? 'bg-[#141414] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                Cases
              </button>
            )}

            {hasAccessories && (
              <button
                type="button"
                onClick={() => setActiveTab('accessories')}
                className={`px-4 py-1.5 text-[13px] font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'accessories'
                    ? 'bg-[#141414] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                Accessories
              </button>
            )}

            {hasCombos && (
              <button
                type="button"
                onClick={() => setActiveTab('combos')}
                className={`px-4 py-1.5 text-[13px] font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'combos'
                    ? 'bg-[#141414] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                Combos
              </button>
            )}
          </div>

          {/* View All on Right */}
          <Link
            to={viewAllLink}
            className="text-[13px] sm:text-[14px] font-medium text-[#6B6B6B] hover:text-[#B0521F] flex items-center gap-1 transition-colors shrink-0"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scroll-Snap Row of Photo Cards */}
      <div className="relative min-w-0 w-full">
        {/* Desktop Left Chevron Button */}
        {activeItems.length > 4 && (
          <button
            type="button"
            onClick={() => scrollByDirection('left')}
            aria-label="Scroll left"
            className="hidden lg:flex absolute -left-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#141414] hover:text-[#B0521F] shadow-md border border-[#E5E5E3] items-center justify-center opacity-0 group-hover/category-row:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Right Chevron Button */}
        {activeItems.length > 4 && (
          <button
            type="button"
            onClick={() => scrollByDirection('right')}
            aria-label="Scroll right"
            className="hidden lg:flex absolute -right-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#141414] hover:text-[#B0521F] shadow-md border border-[#E5E5E3] items-center justify-center opacity-0 group-hover/category-row:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') scrollByDirection('left');
            if (e.key === 'ArrowRight') scrollByDirection('right');
          }}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-1 focus:outline-none"
        >
          {activeItems.map((item) => {
            if (item.isActionTile) {
              return (
                <Link
                  key={item.id}
                  to={item.link}
                  className="snap-start shrink-0 w-[72vw] sm:w-[45vw] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] group block"
                >
                  <div className="w-full aspect-[4/5] bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] group-hover:border-[#141414] p-5 flex flex-col justify-between transition-all">
                    <div className="space-y-1.5 my-auto text-center">
                      <span className="text-[12px] font-medium text-[#6B6B6B] block">Looking for more?</span>
                      <h3 className="font-semibold text-[17px] text-[#141414] leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-[12px] text-[#6B6B6B] leading-relaxed max-w-[200px] mx-auto">
                        {item.caption}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#E5E5E3]">
                      <span className="w-full py-2.5 px-3 bg-[#141414] text-white group-hover:bg-[#B0521F] rounded-[6px] text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5">
                        <span>Select phone</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 invisible">
                    <h3 className="font-medium text-[15px]">&nbsp;</h3>
                    <p className="text-[12px]">&nbsp;</p>
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.link}
                className="snap-start shrink-0 w-[72vw] sm:w-[45vw] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] group block"
              >
                {/* Photo Card: 4:5 ratio, background #F4F3F0, 6px radius */}
                <div className="w-full aspect-[4/5] bg-[#F4F3F0] rounded-[6px] overflow-hidden border border-[#E5E5E3] relative">
                  {item.combo ? (
                    <div className="w-full h-full p-2 flex items-center justify-center">
                      <ComboThumbnail combo={item.combo} className="w-full h-full" />
                    </div>
                  ) : (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/subcategories/iphone.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Caption under card: Name in Poppins 500, small caption */}
                <div className="mt-2.5">
                  <h3 className="font-medium text-[15px] sm:text-[16px] text-[#141414] group-hover:text-[#B0521F] transition-colors truncate">
                    {item.name}
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#6B6B6B] mt-0.5">
                    {item.caption}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Thin 2px scroll position progress bar */}
        {activeItems.length > 1 && (
          <div className="w-24 sm:w-32 h-[2px] bg-[#E5E5E3] rounded-full mx-auto mt-6 overflow-hidden">
            <div
              className="h-full bg-[#141414] rounded-full transition-all duration-100"
              style={{
                width: `${Math.max(20, scrollProgress)}%`,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default CategoryScrollSection;
