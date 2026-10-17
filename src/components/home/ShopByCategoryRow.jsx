import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeConfig } from '../../config/home';

export function ShopByCategoryRow({ products = [], subcategories = [], categories = [] }) {
  const navigate = useNavigate();

  // Derive up to 8 category tiles with real product photos
  const tiles = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Pre-calculate live products by brand / subcategory
    const appleCases = products.filter((p) => {
      const isCase = (p.category || '').toLowerCase().includes('case');
      const isApple = (p.mobile_brand || '').toLowerCase().includes('apple') ||
        (p.compatible_models || []).some((m) => m.toLowerCase().includes('iphone'));
      return isCase && isApple && (p.primary_image || p.image_url);
    });

    const samsungCases = products.filter((p) => {
      const isCase = (p.category || '').toLowerCase().includes('case');
      const isSamsung = (p.mobile_brand || '').toLowerCase().includes('samsung') ||
        (p.compatible_models || []).some((m) => m.toLowerCase().includes('galaxy') || m.toLowerCase().includes('samsung'));
      return isCase && isSamsung && (p.primary_image || p.image_url);
    });

    // Candidates list
    const candidateTiles = [
      {
        id: 'iphone-cases',
        name: 'iPhone Cases',
        image: appleCases[0]?.primary_image || appleCases[0]?.image_url || '/subcategories/iphone.jpg',
        count: appleCases.length,
        params: { brand: 'Apple', category: 'Mobile Cases' },
      },
      {
        id: 'samsung-cases',
        name: 'Samsung Cases',
        image: samsungCases[0]?.primary_image || samsungCases[0]?.image_url || '/subcategories/samsung.jpg',
        count: samsungCases.length,
        params: { brand: 'Samsung', category: 'Mobile Cases' },
      },
    ];

    // Known subcategories with search terms
    const accessorySubs = [
      { name: 'Tempered Glass', query: 'temper' },
      { name: 'Lens Protectors', query: 'lens' },
      { name: 'Cables', query: 'cable' },
      { name: 'Power Banks', query: 'power' },
      { name: 'Watch Straps', query: 'watch' },
      { name: 'AirPods Cases', query: 'airpod' },
      { name: 'Adapters', query: 'adapter' },
      { name: 'Stickers & Skins', query: 'skin' },
    ];

    for (const sub of accessorySubs) {
      const matchingProducts = products.filter((p) => {
        const subName = (p.subcategory || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const matchesQuery = subName.includes(sub.query) || pName.includes(sub.query);
        return matchesQuery && (p.primary_image || p.image_url);
      });

      if (matchingProducts.length > 0) {
        candidateTiles.push({
          id: sub.name.toLowerCase().replace(/\s+/g, '-'),
          name: sub.name,
          image: matchingProducts[0].primary_image || matchingProducts[0].image_url,
          count: matchingProducts.length,
          params: { subcategory: matchingProducts[0].subcategory || sub.name, category: 'Accessories' },
        });
      }
    }

    // Filter out any tile with 0 products
    const activeTiles = candidateTiles.filter((t) => t.count > 0 && t.image);
    return activeTiles.slice(0, homeConfig.categoriesSection?.maxTiles || 8);
  }, [products]);

  // Hide row if fewer than 4 categories
  if (tiles.length < 4) {
    return null;
  }

  const handleTileClick = (tile) => {
    const searchParams = new URLSearchParams(tile.params);
    navigate(`/?${searchParams.toString()}`);
  };

  return (
    <section
      aria-label="Shop by category"
      className="w-full pt-4 pb-2 select-none"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#141414] tracking-normal font-sans">
          {homeConfig.categoriesSection?.heading || 'Shop by category'}
        </h2>
      </div>

      {/* Horizontally scrollable row on mobile, clean responsive grid on desktop */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-4 md:grid-cols-8">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onClick={() => handleTileClick(tile)}
            className="group flex flex-col items-center text-center shrink-0 w-[84px] sm:w-auto p-1.5 rounded-[6px] hover:bg-white border border-transparent hover:border-[#E5E5E3] transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#141414]"
          >
            {/* Rounded-square real product photo */}
            <div className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-[6px] overflow-hidden bg-[#F5F5F3] border border-[#E5E5E3] mb-2 shrink-0 group-hover:scale-102 transition-transform">
              <img
                src={tile.image}
                alt={tile.name}
                width={84}
                height={84}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Plain caption */}
            <span className="text-[12px] sm:text-[13px] font-medium text-[#141414] group-hover:text-[#B0521F] line-clamp-2 leading-tight transition-colors">
              {tile.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ShopByCategoryRow;
