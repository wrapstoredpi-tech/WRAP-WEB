import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeConfig } from '../../config/home';
import { usePhoneContext } from '../../context/PhoneContext';
import { useProductsContext } from '../../context/ProductsContext';

/**
 * Extract series label from a phone model string.
 * Example:
 *   "iPhone 17 Pro Max" -> "iPhone 17 Series"
 *   "Samsung Galaxy S25 Ultra" -> "Samsung S25 Series"
 */
function getSeriesFromModel(modelStr, brand) {
  if (!modelStr) return null;
  const str = modelStr.trim();
  const lower = str.toLowerCase();

  if (brand === 'Apple' || lower.includes('iphone')) {
    const match = str.match(/iphone\s*(\d+)/i);
    if (match) {
      return `iPhone ${match[1]} Series`;
    }
    if (lower.includes('se')) return 'iPhone SE Series';
    if (lower.includes('iphone x')) return 'iPhone X Series';
    return null;
  }

  if (brand === 'Samsung' || lower.includes('samsung') || lower.includes('galaxy')) {
    const sMatch = str.match(/s(\d+)/i);
    if (sMatch) {
      return `Samsung S${sMatch[1]} Series`;
    }
    if (lower.includes('z fold') || lower.includes('z flip') || lower.includes('galaxy z')) {
      return 'Samsung Galaxy Z Series';
    }
    const aMatch = str.match(/a(\d+)/i);
    if (aMatch) {
      return `Samsung A${aMatch[1]} Series`;
    }
    return null;
  }

  return null;
}

export function ShopByPhoneSection({ onSelectSeries }) {
  const navigate = useNavigate();
  const { openPhoneSheet } = usePhoneContext();
  const { products = [] } = useProductsContext();
  const [selectedBrand, setSelectedBrand] = useState('Apple');

  const config = homeConfig.shopByPhone || {};

  // Derive series from live products' compatible_models
  const seriesByBrand = useMemo(() => {
    const appleSeriesSet = new Set();
    const samsungSeriesSet = new Set();

    for (const p of products) {
      const pBrand = (p.mobile_brand || '').trim();
      const models = p.compatible_models || [];

      for (const m of models) {
        if (!m || m === 'Universal') continue;

        const appleSeries = getSeriesFromModel(m, 'Apple');
        if (appleSeries && (pBrand.toLowerCase().includes('apple') || m.toLowerCase().includes('iphone'))) {
          appleSeriesSet.add(appleSeries);
        }

        const samsungSeries = getSeriesFromModel(m, 'Samsung');
        if (samsungSeries && (pBrand.toLowerCase().includes('samsung') || m.toLowerCase().includes('galaxy') || m.toLowerCase().includes('samsung'))) {
          samsungSeriesSet.add(samsungSeries);
        }
      }
    }

    // Sort series descending by version number
    const sortSeries = (list) => {
      return Array.from(list).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
        return numB - numA;
      });
    };

    // If a brand has no live products with compatible models in DB, provide realistic series from catalog schema
    let appleList = sortSeries(appleSeriesSet);
    if (appleList.length === 0) {
      appleList = [
        'iPhone 18 Series',
        'iPhone 17 Series',
        'iPhone 16 Series',
        'iPhone 15 Series',
        'iPhone 14 Series',
        'iPhone 13 Series',
      ];
    }

    let samsungList = sortSeries(samsungSeriesSet);
    if (samsungList.length === 0) {
      samsungList = [
        'Samsung S25 Series',
        'Samsung S24 Series',
        'Samsung S23 Series',
        'Samsung Galaxy Z Series',
      ];
    }

    return {
      Apple: appleList,
      Samsung: samsungList,
    };
  }, [products]);

  const activeSeriesList = seriesByBrand[selectedBrand] || [];

  const handleChipClick = (seriesName) => {
    if (onSelectSeries) {
      onSelectSeries(selectedBrand, seriesName);
    } else {
      navigate(
        `/?brand=${selectedBrand}&series=${encodeURIComponent(seriesName)}&category=Mobile%20Cases`
      );
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="shop-by-phone-title">
      {/* Heading & Subtext */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="shop-by-phone-title" className="text-[24px] sm:text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
            {config.heading || 'Shop by phone'}
          </h2>
          <p className="text-[14px] text-[#6B6B6B]">
            {config.subtext || 'Select your phone brand and series to see compatible cases.'}
          </p>
        </div>

        {/* Text link "Find my exact model" */}
        <button
          type="button"
          onClick={openPhoneSheet}
          className="text-[14px] font-semibold text-[#B0521F] hover:underline cursor-pointer inline-flex items-center gap-1 self-start sm:self-auto min-h-[44px]"
        >
          <span>{config.findExactModelText || 'Find my exact model'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* iPhone / Samsung Brand Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedBrand('Apple')}
          className={`min-h-[44px] px-5 py-2 text-[14px] font-semibold rounded-[6px] border transition-colors cursor-pointer ${
            selectedBrand === 'Apple'
              ? 'bg-[#141414] text-white border-[#141414]'
              : 'bg-white text-[#141414] border-[#E5E5E3] hover:border-[#141414]'
          }`}
          aria-pressed={selectedBrand === 'Apple'}
        >
          iPhone
        </button>

        <button
          type="button"
          onClick={() => setSelectedBrand('Samsung')}
          className={`min-h-[44px] px-5 py-2 text-[14px] font-semibold rounded-[6px] border transition-colors cursor-pointer ${
            selectedBrand === 'Samsung'
              ? 'bg-[#141414] text-white border-[#141414]'
              : 'bg-white text-[#141414] border-[#E5E5E3] hover:border-[#141414]'
          }`}
          aria-pressed={selectedBrand === 'Samsung'}
        >
          Samsung
        </button>
      </div>

      {/* Horizontally scrollable row of series chips */}
      <div className="relative">
        <div className="overflow-x-auto no-scrollbar flex items-center gap-2 sm:gap-3 py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {activeSeriesList.map((seriesName) => (
            <button
              key={seriesName}
              type="button"
              onClick={() => handleChipClick(seriesName)}
              className="text-[14px] font-normal text-[#141414] bg-white border border-[#E5E5E3] hover:border-[#141414] px-4 py-2.5 rounded-[6px] transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
            >
              {seriesName}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ShopByPhoneSection;
