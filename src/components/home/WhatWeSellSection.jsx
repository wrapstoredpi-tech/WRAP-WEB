import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeConfig } from '../../config/home';
import { useProductsContext } from '../../context/ProductsContext';
import { isEligibleInStock } from '../../lib/productRowAdapter';
import { getSubcategoryImageUrl } from '../../lib/subcategoryImages';

export function WhatWeSellSection() {
  const navigate = useNavigate();
  const { products = [], subcategories = [] } = useProductsContext();
  const config = homeConfig.whatWeSell || {};

  // Build the list of groups according to spec:
  // 1. iPhone cases (if at least one in-stock product)
  // 2. Samsung cases (if at least one in-stock product)
  // 3. Each accessory subcategory that has at least one in-stock product
  // Each tile uses a real product photo from that group. Empty groups are hidden.
  const groups = useMemo(() => {
    const result = [];

    // ── 1. iPhone cases ──────────────────────────────────────────────────────
    const inStockIphoneCases = products.filter((p) => {
      if (!isEligibleInStock(p)) return false;
      const isCase = (p.category || '').toLowerCase().includes('case');
      const isApple =
        (p.mobile_brand || '').toLowerCase().includes('apple') ||
        (p.subcategory || '').toLowerCase().includes('iphone') ||
        (p.compatible_models || []).some((m) => m.toLowerCase().includes('iphone'));
      return isCase && isApple;
    });

    if (inStockIphoneCases.length > 0) {
      // Pick first in-stock product with a real photo
      const sampleProd =
        inStockIphoneCases.find((p) => p.hasRealImages && p.image_url) || inStockIphoneCases[0];

      result.push({
        id: 'iphone-cases',
        caption: config.captions?.iphone || 'iPhone Cases',
        imageUrl: sampleProd.image_url || '/subcategories/iphone.jpg',
        alt: 'iPhone protective cases',
        link: '/?category=Mobile%20Cases&brand=Apple',
      });
    }

    // ── 2. Samsung cases ─────────────────────────────────────────────────────
    const inStockSamsungCases = products.filter((p) => {
      if (!isEligibleInStock(p)) return false;
      const isCase = (p.category || '').toLowerCase().includes('case');
      const isSamsung =
        (p.mobile_brand || '').toLowerCase().includes('samsung') ||
        (p.subcategory || '').toLowerCase().includes('samsung') ||
        (p.compatible_models || []).some((m) =>
          m.toLowerCase().includes('galaxy') || m.toLowerCase().includes('samsung')
        );
      return isCase && isSamsung;
    });

    if (inStockSamsungCases.length > 0) {
      const sampleProd =
        inStockSamsungCases.find((p) => p.hasRealImages && p.image_url) || inStockSamsungCases[0];

      result.push({
        id: 'samsung-cases',
        caption: config.captions?.samsung || 'Samsung Cases',
        imageUrl: sampleProd.image_url || '/subcategories/samsung.jpg',
        alt: 'Samsung Galaxy protective cases',
        link: '/?category=Mobile%20Cases&brand=Samsung',
      });
    }

    // ── 3. Accessory subcategories ───────────────────────────────────────────
    // Filter in-stock accessory products (non-case products)
    const inStockAccessories = products.filter((p) => {
      if (!isEligibleInStock(p)) return false;
      const cat = (p.category || '').toLowerCase();
      return !cat.includes('case');
    });

    // Group in-stock accessories by subcategory
    const subcatMap = new Map();
    inStockAccessories.forEach((p) => {
      const key = p.subcategory || 'Accessories';
      if (!subcatMap.has(key)) {
        subcatMap.set(key, []);
      }
      subcatMap.get(key).push(p);
    });

    // Add each accessory subcategory that has at least 1 in-stock product
    subcatMap.forEach((prods, subcatName) => {
      const matchingSub = subcategories.find(
        (s) => s.name?.toLowerCase() === subcatName.toLowerCase()
      );

      const sampleProd =
        prods.find((p) => p.hasRealImages && p.image_url) || prods[0];

      const fallbackImage = matchingSub
        ? getSubcategoryImageUrl(matchingSub)
        : '/subcategories/tempered-glass.jpg';

      result.push({
        id: `subcat-${subcatName}`,
        caption: subcatName,
        imageUrl: sampleProd.image_url || fallbackImage,
        alt: `${subcatName} accessories`,
        link: `/?category=Accessories&subcategory=${encodeURIComponent(subcatName)}`,
      });
    });

    return result;
  }, [products, subcategories, config.captions]);

  if (groups.length === 0) return null;

  return (
    <section className="space-y-5" aria-labelledby="what-we-sell-title">
      <div className="space-y-1">
        <h2 id="what-we-sell-title" className="text-[24px] sm:text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          {config.heading || 'What we sell'}
        </h2>
        <p className="text-[14px] text-[#6B6B6B]">
          {config.subtext || 'Protective cases and essential mobile accessories in stock.'}
        </p>
      </div>

      {/* Large rectangular photo tiles with plain captions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => navigate(group.link)}
            className="group block w-full rounded-[6px] overflow-hidden border border-[#E5E5E3] bg-white hover:border-[#141414] transition-colors text-left cursor-pointer"
          >
            {/* Rectangular aspect ratio 16:10 */}
            <div className="aspect-[16/10] w-full overflow-hidden bg-[#FAFAF9]">
              <img
                src={group.imageUrl}
                alt={group.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>

            {/* Plain caption */}
            <div className="p-3.5 bg-white border-t border-[#E5E5E3] flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#141414] truncate">
                {group.caption}
              </span>
              <span className="text-[12px] font-semibold text-[#B0521F] shrink-0 ml-2" aria-hidden="true">
                Explore →
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default WhatWeSellSection;
