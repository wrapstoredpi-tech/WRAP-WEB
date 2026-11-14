import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { formatINR } from '../../lib/currency';

export function ShopByCategoryBento() {
  const { products = [], isLoading } = useProductsContext();

  // In-stock products only
  const inStockProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p || p.is_active === false || p.online_visible === false) return false;
      const stock = p.available_stock ?? p.current_stock ?? 0;
      return stock > 0 && p.stock_status !== 'OUT_OF_STOCK';
    });
  }, [products]);

  // 1. Phone cases stats
  const casesData = useMemo(() => {
    const caseProds = inStockProducts.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      return (
        cat.includes('case') ||
        sub.includes('iphone') ||
        sub.includes('samsung') ||
        cat.includes('mobile cases')
      );
    });

    const minPrice = caseProds.reduce(
      (min, p) => (p.selling_price && p.selling_price < min ? p.selling_price : min),
      caseProds[0]?.selling_price || 199
    );

    const newestImg =
      caseProds.find((p) => p.image_url)?.image_url ||
      '/bento/audio.jpg';

    return {
      count: caseProds.length,
      minPrice,
      image: newestImg,
    };
  }, [inStockProducts]);

  // 2. Accessory groups in exact required order:
  //    1. Screen protection (tempered glass + lens protectors merged)
  //    2. Power banks
  //    3. Cables / chargers
  //    4. Watch straps
  const accessoryTiles = useMemo(() => {
    const groupsDef = [
      {
        id: 'screen-protection',
        title: 'Screen protection',
        prefix: 'Tempered glass',
        subtext: 'Tempered glass & lens covers',
        slug: 'tempered-glass',
        link: '/accessories/tempered-glass',
        bg: '#EAEFF2',
        match: (p) => {
          const sub = (p.subcategory || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          return (
            sub.includes('glass') ||
            sub.includes('screen') ||
            sub.includes('lens') ||
            name.includes('tempered') ||
            name.includes('protector')
          );
        },
        fallbackImage: '/subcategories/tempered-glass.jpg',
      },
      {
        id: 'power-banks',
        title: 'Power banks',
        prefix: 'Magnetic & wireless',
        subtext: 'High capacity on-the-go charge',
        slug: 'power-bank',
        link: '/accessories/power-bank',
        bg: '#EFECE6',
        match: (p) => {
          const sub = (p.subcategory || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          return sub.includes('power') || name.includes('power bank');
        },
        fallbackImage: '/subcategories/power-bank.jpg',
      },
      {
        id: 'cables-chargers',
        title: 'Cables & chargers',
        prefix: 'Fast-charging',
        subtext: 'Fast-charging cords & adapters',
        slug: 'cables',
        link: '/accessories/cables',
        bg: '#F1EEE8',
        match: (p) => {
          const sub = (p.subcategory || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          return (
            sub.includes('cable') ||
            sub.includes('charger') ||
            sub.includes('adapter') ||
            name.includes('cable') ||
            name.includes('charger')
          );
        },
        fallbackImage: '/subcategories/cables.jpg',
      },
      {
        id: 'watch-straps',
        title: 'Watch straps',
        prefix: 'Silicone & alpine',
        subtext: 'Silicone, metal & alpine loops',
        slug: 'watch-strap',
        link: '/accessories/watch-strap',
        bg: '#EBF0EE',
        fullPhoto: true,
        match: (p) => {
          const sub = (p.subcategory || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          return sub.includes('watch') || name.includes('strap');
        },
        fallbackImage: '/subcategories/watch-strap.jpg',
      },
    ];

    const results = [];
    for (const def of groupsDef) {
      const matched = inStockProducts.filter(def.match);
      if (matched.length > 0) {
        const minPrice = matched.reduce(
          (min, p) => (p.selling_price && p.selling_price < min ? p.selling_price : min),
          matched[0].selling_price || 99
        );
        const newest = matched[0];
        const primaryImg =
          newest?.image_url ||
          (Array.isArray(newest?.images) && newest.images[0]) ||
          def.fallbackImage;

        results.push({
          ...def,
          count: matched.length,
          minPrice,
          image: primaryImg,
        });
      }
    }

    return results;
  }, [inStockProducts]);

  // If loading and no products, show skeleton
  if (isLoading && products.length === 0) {
    return (
      <section aria-label="Shop by category" className="w-full select-none py-10 md:py-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="h-8 w-48 bg-[#EFECE6] rounded-[6px] mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-[#EFECE6] rounded-[6px] mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]">
            <div className="col-span-2 row-span-2 bg-[#EFECE6] rounded-[18px] animate-pulse" />
            <div className="bg-[#EFECE6] rounded-[18px] animate-pulse" />
            <div className="bg-[#EFECE6] rounded-[18px] animate-pulse" />
            <div className="bg-[#EFECE6] rounded-[18px] animate-pulse" />
            <div className="bg-[#EFECE6] rounded-[18px] animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  // If no case products exist, hide section per rule: "Every section hides itself if it has no data"
  if (casesData.count === 0 && accessoryTiles.length === 0) {
    return null;
  }

  // Dynamic grid span if fewer than 4 accessory groups
  const getAccessoryColSpan = (index, total) => {
    if (total === 1) return 'col-span-2 row-span-2';
    if (total === 2) return 'col-span-2';
    if (total === 3 && index === 0) return 'col-span-2';
    return 'col-span-1';
  };

  return (
    <section aria-label="Shop by category" className="w-full select-none py-10 md:py-16">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-[26px] sm:text-[30px] font-semibold text-[#141414] tracking-[-0.025em] leading-tight">
            Shop by category
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#5A5A5A] mt-1">
            Protect it, power it, finish the look.
          </p>
        </div>

        {/* ─── DESKTOP BENTO GRID (4 cols x 2 rows, 300px rows) ─── */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-[300px_300px] gap-4">
          {/* Tile 1: Phone cases (spans 2 cols x 2 rows) */}
          <Link
            to="/cases"
            className="col-span-2 row-span-2 relative rounded-[18px] overflow-hidden group shadow-2xs border border-[#E7E5E0] hover:border-[#141414] transition-all cursor-pointer block"
            aria-label="Shop Phone cases, from Rs 199"
          >
            {/* Background Image */}
            <img
              src={casesData.image}
              alt="Phone cases collection"
              className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = '/bento/audio.jpg';
              }}
            />

            {/* Dark gradient scrim at the bottom for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

            {/* Top-right subtle badge */}
            <div className="absolute top-6 left-6 z-10">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[12px] font-medium rounded-full">
                All models
              </span>
            </div>

            {/* Bottom Content & Round White Arrow Button */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-white text-[28px] font-semibold leading-tight group-hover:text-white/90 transition-colors">
                  Phone cases
                </h3>
                <p className="text-white/80 text-[14px] mt-1 font-normal">
                  MagSafe, silicone, leather & protective · from {formatINR(casesData.minPrice)}
                </p>
              </div>

              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141414] group-hover:bg-[#141414] group-hover:text-white transition-colors shrink-0 shadow-md">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Accessory Tiles (Up to 4 tiles filling right 2 columns) */}
          {accessoryTiles.slice(0, 4).map((tile, idx) => {
            const spanClass = getAccessoryColSpan(idx, accessoryTiles.length);

            return (
              <Link
                key={tile.id}
                to={tile.link}
                className={`${spanClass} relative rounded-[18px] p-6 border border-[#E7E5E0] hover:border-[#141414] transition-all overflow-hidden flex flex-col justify-between group shadow-2xs cursor-pointer block`}
                style={{ backgroundColor: tile.bg }}
                aria-label={`Shop ${tile.title}, from Rs ${tile.minPrice}`}
              >
                {/* Full photo background with subtle top-to-bottom scrim if fullPhoto */}
                {tile.fullPhoto && (
                  <>
                    <img
                      src={tile.image}
                      alt={tile.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = tile.fallbackImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/40 to-transparent pointer-events-none" />
                  </>
                )}

                {/* Header within Tile: Title & Round Arrow */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div>
                    <h3 className="text-[19px] font-semibold text-[#141414] leading-snug group-hover:text-[#B0521F] transition-colors">
                      {tile.title}
                    </h3>
                    <p className="text-[13px] text-[#5A5A5A] mt-0.5">
                      {tile.prefix ? `${tile.prefix} from ${formatINR(tile.minPrice)}` : `From ${formatINR(tile.minPrice)}`}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-white/90 border border-[#E7E5E0] flex items-center justify-center text-[#141414] group-hover:bg-[#141414] group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Image if not fullPhoto */}
                {!tile.fullPhoto && (
                  <div className="mt-4 w-full h-[140px] flex items-end justify-center relative z-0 overflow-hidden">
                    <div className="w-full h-full rounded-[12px] overflow-hidden bg-white/60 border border-black/5 p-1 flex items-center justify-center shadow-xs">
                      <img
                        src={tile.image}
                        alt={tile.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = tile.fallbackImage;
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* ─── MOBILE VIEW: Phone cases full width (4:3), other tiles in 2-column grid ─── */}
        <div className="md:hidden space-y-3">
          {/* Tile 1: Phone cases 4:3 */}
          <Link
            to="/cases"
            className="relative aspect-[4/3] w-full rounded-[18px] overflow-hidden group shadow-2xs border border-[#E7E5E0] active:scale-[0.99] transition-all block"
            aria-label="Shop Phone cases"
          >
            <img
              src={casesData.image}
              alt="Phone cases"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = '/bento/audio.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-white text-[24px] font-semibold leading-tight">
                  Phone cases
                </h3>
                <p className="text-white/85 text-[13px] mt-1">
                  From {formatINR(casesData.minPrice)}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141414] shrink-0 shadow-sm">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* 2-Column Grid for Accessories */}
          <div className="grid grid-cols-2 gap-3">
            {accessoryTiles.map((tile) => (
              <Link
                key={tile.id}
                to={tile.link}
                className="relative rounded-[18px] p-4 border border-[#E7E5E0] overflow-hidden flex flex-col justify-between shadow-2xs active:scale-[0.98] transition-transform block"
                style={{ backgroundColor: tile.bg }}
                aria-label={`Shop ${tile.title}`}
              >
                {tile.fullPhoto && (
                  <>
                    <img
                      src={tile.image}
                      alt={tile.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = tile.fallbackImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/50 to-transparent pointer-events-none" />
                  </>
                )}

                <div className="relative z-10">
                  <h3 className="text-[15px] font-semibold text-[#141414] leading-snug">
                    {tile.title}
                  </h3>
                  <p className="text-[12px] text-[#5A5A5A] mt-0.5">
                    {tile.prefix ? `${tile.prefix} from ${formatINR(tile.minPrice)}` : `From ${formatINR(tile.minPrice)}`}
                  </p>
                </div>

                {!tile.fullPhoto && (
                  <div className="mt-3 w-full h-[90px] rounded-[10px] bg-white/70 border border-black/5 p-1 flex items-center justify-center overflow-hidden relative z-0">
                    <img
                      src={tile.image}
                      alt={tile.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = tile.fallbackImage;
                      }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShopByCategoryBento;
