import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { formatINR } from '../../lib/currency';

export function ShopByCategoryBento() {
  const { products = [] } = useProductsContext();

  // Dynamic minimum price for cases if available
  const casesMinPrice = React.useMemo(() => {
    const caseProds = products.filter((p) => {
      if (!p || p.is_active === false || p.online_visible === false) return false;
      const stock = p.available_stock ?? p.current_stock ?? 0;
      if (stock <= 0 || p.stock_status === 'OUT_OF_STOCK') return false;
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      return cat.includes('case') || sub.includes('iphone') || sub.includes('samsung');
    });
    if (caseProds.length === 0) return 299;
    return caseProds.reduce((min, p) => (p.selling_price && p.selling_price < min ? p.selling_price : min), 299);
  }, [products]);

  return (
    <section aria-label="Shop by category" className="w-full select-none py-10 md:py-16">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-[26px] sm:text-[30px] font-semibold text-[#141414] tracking-[-0.025em] leading-tight">
            Shop by category
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#5A5A5A] mt-1">
            Protect it, power it, finish the look.
          </p>
        </div>

        {/* ─── DESKTOP BENTO GRID (2 Equal Columns: Left Large Card, Right 2x2 Grid) ─── */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 lg:gap-5">
          {/* Card 1: Phone cases (Full height left side) */}
          <Link
            to="/cases"
            className="relative h-[430px] lg:h-[460px] rounded-[24px] overflow-hidden group shadow-2xs border border-[#E7E5E0] hover:border-[#141414] transition-all cursor-pointer block bg-[#E8E2EE]"
            aria-label="Shop Phone cases"
          >
            {/* Background Image */}
            <img
              src="/category_image/phone_case.png"
              alt="Phone cases"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
            />

            {/* Subtle dark gradient scrim at the bottom for crystal-clear readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

            {/* Bottom Content & Round White Arrow Button */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-white text-[26px] sm:text-[28px] font-semibold leading-tight group-hover:text-white/95 transition-colors">
                  Phone cases
                </h3>
                <p className="text-white/85 text-[13px] sm:text-[14px] mt-1 font-normal">
                  Clear, leather, carbon and printed · from {formatINR(casesMinPrice || 299)}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141414] group-hover:scale-105 transition-transform shrink-0 shadow-md">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Right 2x2 Grid of 4 Accessory Cards */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3.5 sm:gap-4 h-[430px] lg:h-[460px]">
            {/* Card 2: Screen protection */}
            <Link
              to="/accessories/tempered-glass"
              className="relative h-full rounded-[24px] p-5 sm:p-6 border border-[#E7E5E0] hover:border-[#141414] transition-all overflow-hidden flex flex-col justify-between group shadow-2xs cursor-pointer block bg-[#EEF3F8]"
              aria-label="Shop Screen protection"
            >
              <img
                src="/category_image/screen.png"
                alt="Screen protection"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 pointer-events-none"
              />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#141414] leading-snug">
                    Screen protection
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#666666] mt-0.5">
                    Tempered glass from ₹299
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Card 3: Power banks */}
            <Link
              to="/accessories/power-bank"
              className="relative h-full rounded-[24px] p-5 sm:p-6 border border-[#E7E5E0] hover:border-[#141414] transition-all overflow-hidden flex flex-col justify-between group shadow-2xs cursor-pointer block bg-[#F6EFEA]"
              aria-label="Shop Power banks"
            >
              <img
                src="/category_image/powerbank.png"
                alt="Power banks"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 pointer-events-none"
              />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#141414] leading-snug">
                    Power banks
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#666666] mt-0.5">
                    Magnetic, MagSafe-ready
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Card 4: Cables */}
            <Link
              to="/accessories/cables"
              className="relative h-full rounded-[24px] p-5 sm:p-6 border border-[#E7E5E0] hover:border-[#141414] transition-all overflow-hidden flex flex-col justify-between group shadow-2xs cursor-pointer block bg-[#FAF5EE]"
              aria-label="Shop Cables"
            >
              <img
                src="/category_image/cables.png"
                alt="Cables"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 pointer-events-none"
              />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#141414] leading-snug">
                    Cables
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#666666] mt-0.5">
                    Fast charging from ₹249
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Card 5: Watch straps */}
            <Link
              to="/accessories/watch-strap"
              className="relative h-full rounded-[24px] p-5 sm:p-6 border border-[#E7E5E0] hover:border-[#141414] transition-all overflow-hidden flex flex-col justify-between group shadow-2xs cursor-pointer block bg-[#FAF3EE]"
              aria-label="Shop Watch straps"
            >
              <img
                src="/category_image/strap.png"
                alt="Watch straps"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 pointer-events-none"
              />
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#141414] leading-snug">
                    Watch straps
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#666666] mt-0.5">
                    Magnetic · 3 colours
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ─── MOBILE VIEW: Phone cases full width (4:3), 4 accessory cards in 2x2 grid ─── */}
        <div className="md:hidden space-y-3.5">
          {/* Card 1: Phone cases */}
          <Link
            to="/cases"
            className="relative aspect-[4/3] w-full rounded-[22px] overflow-hidden group shadow-2xs border border-[#E7E5E0] active:scale-[0.99] transition-all block bg-[#E8E2EE]"
            aria-label="Shop Phone cases"
          >
            <img
              src="/category_image/phone_case.png"
              alt="Phone cases"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-white text-[22px] sm:text-[24px] font-semibold leading-tight">
                  Phone cases
                </h3>
                <p className="text-white/85 text-[12px] sm:text-[13px] mt-1 font-normal">
                  Clear, leather, carbon and printed · from {formatINR(casesMinPrice || 299)}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#141414] shrink-0 shadow-sm">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* 2-Column Grid for Accessories */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Screen protection */}
            <Link
              to="/accessories/tempered-glass"
              className="relative aspect-[4/3] rounded-[18px] p-4 border border-[#E7E5E0] overflow-hidden flex flex-col justify-between shadow-2xs active:scale-[0.98] transition-transform block bg-[#EEF3F8]"
              aria-label="Shop Screen protection"
            >
              <img
                src="/category_image/screen.png"
                alt="Screen protection"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
              <div className="flex items-start justify-between gap-1.5 relative z-10">
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#141414] leading-snug">
                    Screen protection
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-tight">
                    Tempered glass from ₹299
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>

            {/* Power banks */}
            <Link
              to="/accessories/power-bank"
              className="relative aspect-[4/3] rounded-[18px] p-4 border border-[#E7E5E0] overflow-hidden flex flex-col justify-between shadow-2xs active:scale-[0.98] transition-transform block bg-[#F6EFEA]"
              aria-label="Shop Power banks"
            >
              <img
                src="/category_image/powerbank.png"
                alt="Power banks"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
              <div className="flex items-start justify-between gap-1.5 relative z-10">
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#141414] leading-snug">
                    Power banks
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-tight">
                    Magnetic, MagSafe-ready
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>

            {/* Cables */}
            <Link
              to="/accessories/cables"
              className="relative aspect-[4/3] rounded-[18px] p-4 border border-[#E7E5E0] overflow-hidden flex flex-col justify-between shadow-2xs active:scale-[0.98] transition-transform block bg-[#FAF5EE]"
              aria-label="Shop Cables"
            >
              <img
                src="/category_image/cables.png"
                alt="Cables"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
              <div className="flex items-start justify-between gap-1.5 relative z-10">
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#141414] leading-snug">
                    Cables
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-tight">
                    Fast charging from ₹249
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>

            {/* Watch straps */}
            <Link
              to="/accessories/watch-strap"
              className="relative aspect-[4/3] rounded-[18px] p-4 border border-[#E7E5E0] overflow-hidden flex flex-col justify-between shadow-2xs active:scale-[0.98] transition-transform block bg-[#FAF3EE]"
              aria-label="Shop Watch straps"
            >
              <img
                src="/category_image/strap.png"
                alt="Watch straps"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
              <div className="flex items-start justify-between gap-1.5 relative z-10">
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#141414] leading-snug">
                    Watch straps
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-tight">
                    Magnetic · 3 colours
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#141414] shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShopByCategoryBento;
