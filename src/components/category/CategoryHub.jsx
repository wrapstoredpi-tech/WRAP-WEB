import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getSubcategoryImageUrl } from '../../lib/subcategoryImages';

export function CategoryHub({
  category,
  subcategories = [],
  products = [],
  onSelectSubcategory,
  onBackToAllProducts,
}) {
  if (!category) return null;

  // Filter subcategories belonging to this category and sort by sort_order ASC, then name ASC
  const categorySubcategories = subcategories
    .filter((s) => s.category_id === category.id)
    .sort((a, b) => {
      const orderA = a.sort_order ?? 0;
      const orderB = b.sort_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });

  // Find products belonging to this category
  const categoryProducts = products.filter(
    (p) => p.category_id === category.id || p.category === category.name
  );

  // Map subcategories to tile data
  const subcategoryTiles = categorySubcategories.map((sub) => {
    // Products belonging to this subcategory
    const subProducts = categoryProducts.filter(
      (p) => p.subcategory_id === sub.id || p.subcategory === sub.name
    );

    // Rule: Prefer real uploaded product images from DB over generated placeholder
    const inStockWithImg = subProducts.find(
      (p) => p.stock_status !== 'OUT_OF_STOCK' && p.hasRealImages
    );
    const anyWithImg = subProducts.find((p) => p.hasRealImages);
    const realDbImage = (inStockWithImg || anyWithImg)?.image_url || null;

    const hasProducts = subProducts.length > 0;
    // Permanent generated image or DB tile_image_url
    const permanentImage = getSubcategoryImageUrl(sub);
    const imageUrl = realDbImage || permanentImage || null;

    return {
      ...sub,
      hasProducts,
      productCount: subProducts.length,
      imageUrl,
      isComingSoon: !hasProducts,
    };
  });

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12 animate-fade-in">
      
      {/* ── Breadcrumb & Category Title Header ──────────────────────────── */}
      <div className="space-y-3 border-b border-[#E7E5E4] pb-6 sm:pb-8">
        <nav aria-label="Breadcrumb" className="text-[13px] text-[#666664]">
          <ol className="flex items-center space-x-2 truncate font-normal">
            <li>
              <button
                type="button"
                onClick={onBackToAllProducts}
                className="hover:text-[#141414] transition-colors focus-visible:outline-none cursor-pointer"
              >
                All Products
              </button>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
            </li>
            <li className="text-[#141414] font-semibold truncate" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        <div className="pt-1">
          <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-semibold text-[#141414] tracking-tight leading-[1.15]">
            {category.name}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#666664] mt-1.5 font-normal max-w-xl">
            Select a sub-category to explore curated designs and device fits.
          </p>
        </div>
      </div>

      {/* ── Visual Tile Grid (Instant load, permanent clean photography) ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 justify-items-center">
          {subcategoryTiles.map((sub) => {
            if (sub.isComingSoon) {
              return (
                <div
                  key={sub.id}
                  className="flex flex-col items-center text-center cursor-default opacity-90 select-none w-full max-w-[200px]"
                  aria-label={`${sub.name} - Coming Soon`}
                >
                  {/* Circular real photography crop with subtle coming soon styling */}
                  <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-[#F5F5F4] border border-[#E7E5E4] overflow-hidden relative shadow-2xs">
                    {sub.imageUrl ? (
                      <img
                        src={sub.imageUrl}
                        alt={sub.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E7E5E4]/60" />
                    )}
                    <div className="absolute inset-0 bg-[#141414]/5" />
                  </div>

                  <div className="mt-3.5 sm:mt-4 space-y-1">
                    <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#78716C] leading-snug">
                      {sub.name}
                    </h3>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#78716C] bg-[#E7E5E4]/80 px-2.5 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubcategory(sub)}
                className="group flex flex-col items-center text-center cursor-pointer transition-transform duration-200 focus-visible:outline-none w-full max-w-[200px]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSubcategory(sub);
                  }
                }}
                aria-label={`Browse ${sub.name} in ${category.name}`}
              >
                {/* Circular real product / permanent photo crop */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-[#F5F5F4] border border-[#E7E5E4] overflow-hidden relative shadow-xs group-hover:shadow-md group-hover:border-[#141414] transition-all duration-300 ring-2 ring-transparent group-hover:ring-[#141414] group-hover:ring-offset-2">
                  {sub.imageUrl ? (
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#E7E5E4]/60" />
                  )}
                </div>

                <div className="mt-3.5 sm:mt-4 space-y-0.5">
                  <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#141414] group-hover:text-[#9E381A] transition-colors leading-snug">
                    {sub.name}
                  </h3>
                  <p className="text-[12px] text-[#666664] font-normal">
                    {sub.productCount} {sub.productCount === 1 ? 'design' : 'designs'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CategoryHub;
