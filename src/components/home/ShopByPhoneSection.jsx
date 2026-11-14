import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { useProductsContext } from '../../context/ProductsContext';
import { getLiveModelsWithCases, sortModels, modelToSlug } from '../../lib/models';
import { PhoneBack } from './PhoneBack';

const BASE_IPHONE_MODELS = [
  'iPhone 17 Pro Max',
  'iPhone 17 Pro',
  'iPhone 17',
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13 mini',
  'iPhone 13',
];

const BASE_SAMSUNG_MODELS = [
  'Samsung Galaxy S25 Ultra',
  'Samsung Galaxy S25+',
  'Samsung Galaxy S25',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24+',
  'Samsung Galaxy S24',
];

export function ShopByPhoneSection() {
  const navigate = useNavigate();
  const { savedPhone, selectPhone } = usePhoneContext();
  const { products = [] } = useProductsContext();
  const scrollContainerRef = useRef(null);

  // Default brand: saved phone brand else 'Apple'
  const initialBrand = useMemo(() => {
    if (savedPhone?.brand) {
      return savedPhone.brand.toLowerCase() === 'samsung' ? 'Samsung' : 'Apple';
    }
    return 'Apple';
  }, [savedPhone]);

  const [activeBrand, setActiveBrand] = useState(initialBrand);

  // Models for Apple
  const appleModels = useMemo(() => {
    const live = getLiveModelsWithCases(products, 'Apple');
    const combined = new Set([...live, ...BASE_IPHONE_MODELS]);
    return sortModels(Array.from(combined));
  }, [products]);

  // Models for Samsung
  const samsungModels = useMemo(() => {
    const live = getLiveModelsWithCases(products, 'Samsung');
    const combined = new Set([...live, ...BASE_SAMSUNG_MODELS]);
    return sortModels(Array.from(combined));
  }, [products]);

  const activeModels = activeBrand === 'Samsung' ? samsungModels : appleModels;
  const hasSamsungModels = samsungModels.length > 0;

  // Scroll left/right buttons for desktop
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleModelClick = (model) => {
    selectPhone({ brand: activeBrand, model });
    const brandSlug = activeBrand.toLowerCase();
    const slug = modelToSlug(model);
    navigate(`/cases/${brandSlug}/${slug}`);
  };

  return (
    <section
      aria-label="Shop by phone"
      className="w-full bg-white border-b border-[#E7E5E0] select-none"
    >
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-14">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[26px] sm:text-[30px] font-semibold text-[#141414] tracking-[-0.025em] leading-tight">
              Shop by phone
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#5A5A5A] mt-1">
              {activeBrand === 'Samsung'
                ? 'Tap your Galaxy. Everything after this fits it.'
                : 'Tap your iPhone. Everything after this fits it.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <Link
              to="/cases"
              className="text-[14px] font-medium text-[#141414] underline underline-offset-4 decoration-1 hover:text-[#B0521F] transition-colors"
            >
              All models
            </Link>

            {/* Desktop 44px Round Scroll Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Scroll phone models left"
                className="w-11 h-11 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] transition-colors cursor-pointer bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Scroll phone models right"
                className="w-11 h-11 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] transition-colors cursor-pointer bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Pill Switch (iPhone / Samsung) */}
        <div className="mb-6">
          <div
            role="tablist"
            aria-label="Phone brand"
            className="inline-flex p-1 bg-[#F4F2EE] rounded-full gap-1 border border-[#E7E5E0]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeBrand === 'Apple'}
              onClick={() => setActiveBrand('Apple')}
              className={`px-5 py-2 text-[14px] font-medium rounded-full transition-all cursor-pointer ${
                activeBrand === 'Apple'
                  ? 'bg-[#141414] text-white shadow-2xs'
                  : 'text-[#5A5A5A] hover:text-[#141414]'
              }`}
            >
              iPhone
            </button>

            {hasSamsungModels && (
              <button
                type="button"
                role="tab"
                aria-selected={activeBrand === 'Samsung'}
                onClick={() => setActiveBrand('Samsung')}
                className={`px-5 py-2 text-[14px] font-medium rounded-full transition-all cursor-pointer ${
                  activeBrand === 'Samsung'
                    ? 'bg-[#141414] text-white shadow-2xs'
                    : 'text-[#5A5A5A] hover:text-[#141414]'
                }`}
              >
                Samsung
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Scroll-Snap Row of Phone Tiles */}
        <div
          ref={scrollContainerRef}
          className="flex items-start gap-4 overflow-x-auto scroll-smooth pb-4 pt-1 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {activeModels.map((model) => {
            const brandSlug = activeBrand.toLowerCase();
            const slug = modelToSlug(model);
            const isSelected = savedPhone?.model === model;

            return (
              <div
                key={model}
                className="w-[132px] flex-shrink-0 flex flex-col items-center group cursor-pointer"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Link
                  to={`/cases/${brandSlug}/${slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleModelClick(model);
                  }}
                  className={`w-[132px] h-[156px] bg-[#EFECE6] rounded-[18px] border transition-all duration-200 overflow-hidden flex flex-col items-center justify-end p-2 relative shadow-2xs ${
                    isSelected
                      ? 'border-[#141414] ring-1 ring-[#141414]'
                      : 'border-[#E7E5E0] hover:border-[#141414] group-hover:-translate-y-1'
                  }`}
                  aria-label={`Shop cases for ${model}`}
                >
                  {/* Phone SVG Illustration cropped at bottom */}
                  <div className="w-[104px] h-[150px] translate-y-3 transition-transform duration-200 group-hover:scale-102 flex items-start justify-center overflow-hidden">
                    <PhoneBack model={model} brand={activeBrand} className="w-full h-auto drop-shadow-xs" />
                  </div>
                </Link>

                {/* Model name under tile */}
                <span className="mt-2.5 text-[14px] font-medium text-[#141414] text-center line-clamp-2 leading-snug group-hover:text-[#B0521F] transition-colors">
                  {model}
                </span>
              </div>
            );
          })}

          {/* Last Tile: Dashed-border "Find your model" -> /cases */}
          <div
            className="w-[132px] flex-shrink-0 flex flex-col items-center group cursor-pointer"
            style={{ scrollSnapAlign: 'start' }}
          >
            <Link
              to="/cases"
              className="w-[132px] h-[156px] rounded-[18px] border-2 border-dashed border-[#E7E5E0] hover:border-[#141414] bg-[#EFECE6] transition-all duration-200 flex flex-col items-center justify-center p-3 text-center gap-2 shadow-2xs group-hover:-translate-y-1"
              aria-label="Find your phone model in our catalog"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141414] border border-[#E7E5E0] group-hover:border-[#141414] transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-[12px] font-semibold text-[#141414] leading-tight">
                Find your model
              </span>
            </Link>

            <span className="mt-2.5 text-[14px] font-medium text-[#5A5A5A] text-center line-clamp-1">
              All models
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShopByPhoneSection;
