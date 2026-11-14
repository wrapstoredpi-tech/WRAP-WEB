import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { useProductsContext } from '../../context/ProductsContext';
import { getLiveModelsWithCases, modelToSlug } from '../../lib/models';
import {
  IPHONE_MODELS,
  SAMSUNG_CATEGORIES,
  getPhoneImage,
} from '../../config/shopByPhoneData';

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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apple Models: Start with requested primary models, then merge any other live models from DB
  const appleModels = useMemo(() => {
    const live = getLiveModelsWithCases(products, 'Apple');
    const existingModelNames = new Set(IPHONE_MODELS.map((item) => item.model.toLowerCase()));
    
    // Add additional live models that have in-stock cases but aren't in default list
    const extraLiveItems = live
      .filter((m) => !existingModelNames.has(m.toLowerCase()))
      .map((m) => ({
        id: modelToSlug(m),
        model: m,
        brand: 'Apple',
        image: getPhoneImage(m, 'Apple'),
        alt: `Backside of ${m}`,
        url: `/cases/apple/${modelToSlug(m)}`,
      }));

    return [...IPHONE_MODELS, ...extraLiveItems];
  }, [products]);

  // Samsung Categories & Models
  const samsungModels = useMemo(() => {
    const live = getLiveModelsWithCases(products, 'Samsung');
    const existingModelNames = new Set(SAMSUNG_CATEGORIES.map((item) => item.model.toLowerCase()));

    const extraLiveItems = live
      .filter((m) => !existingModelNames.has(m.toLowerCase()))
      .map((m) => ({
        id: modelToSlug(m),
        model: m,
        brand: 'Samsung',
        image: getPhoneImage(m, 'Samsung'),
        alt: `Backside of ${m}`,
        url: `/cases/samsung/${modelToSlug(m)}`,
      }));

    return [...SAMSUNG_CATEGORIES, ...extraLiveItems];
  }, [products]);

  const activeModels = activeBrand === 'Samsung' ? samsungModels : appleModels;
  const hasSamsungModels = samsungModels.length > 0;

  // Handle smooth category switching
  const handleBrandChange = (brand) => {
    if (brand === activeBrand) return;
    setIsTransitioning(true);
    setActiveBrand(brand);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      setIsTransitioning(false);
    }, 200);
  };

  // Scroll left/right buttons for desktop carousel
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Navigate to corresponding phone-case collection or filter
  const handleModelClick = (item) => {
    selectPhone({ brand: activeBrand, model: item.model });
    if (item.url) {
      navigate(item.url);
      return;
    }
    const brandSlug = activeBrand.toLowerCase();
    const slug = modelToSlug(item.model);
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
                className="w-11 h-11 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] transition-colors cursor-pointer bg-white shadow-2xs hover:shadow-xs active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Scroll phone models right"
                className="w-11 h-11 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] transition-colors cursor-pointer bg-white shadow-2xs hover:shadow-xs active:scale-95"
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
              onClick={() => handleBrandChange('Apple')}
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
                onClick={() => handleBrandChange('Samsung')}
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

        {/* Horizontal Scroll-Snap Row of Realistic Phone Cards */}
        <div
          ref={scrollContainerRef}
          className={`flex items-start gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth pb-4 pt-1.5 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar transition-opacity duration-200 ease-out ${
            isTransitioning ? 'opacity-40' : 'opacity-100'
          }`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {activeModels.map((item) => {
            const isSelected = savedPhone?.model === item.model;

            return (
              <div
                key={item.id || item.model}
                className="w-[140px] sm:w-[152px] flex-shrink-0 flex flex-col items-center group cursor-pointer"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleModelClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleModelClick(item);
                    }
                  }}
                  className={`w-[140px] sm:w-[152px] h-[172px] sm:h-[184px] bg-[#F3F1ED] rounded-[24px] border transition-all duration-300 ease-out overflow-hidden flex flex-col items-center justify-center p-3 relative shadow-2xs ${
                    isSelected
                      ? 'border-[#141414] ring-2 ring-[#141414]/15 shadow-sm'
                      : 'border-[#E7E5E0] hover:border-[#141414] hover:shadow-md group-hover:-translate-y-1.5'
                  }`}
                  aria-label={`Shop cases for ${item.model}`}
                >
                  {/* Subtle brand tag for Series cards */}
                  {item.badge && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/90 text-[#141414] border border-[#E7E5E0] shadow-2xs">
                      {item.badge}
                    </span>
                  )}

                  {/* Centered realistic backside product image */}
                  <div className="w-full h-full flex items-center justify-center p-1">
                    <img
                      src={item.image}
                      alt={item.alt || `${item.model} realistic backside`}
                      loading="lazy"
                      className="max-h-[142px] sm:max-h-[154px] w-auto max-w-[88%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                </div>

                {/* Model name under card */}
                <span className="mt-2.5 text-[14px] font-medium text-[#141414] text-center line-clamp-2 leading-snug group-hover:text-[#B0521F] transition-colors max-w-[140px]">
                  {item.model}
                </span>
              </div>
            );
          })}

          {/* Last Tile: Dashed-border "Find your model" -> /cases */}
          <div
            className="w-[140px] sm:w-[152px] flex-shrink-0 flex flex-col items-center group cursor-pointer"
            style={{ scrollSnapAlign: 'start' }}
          >
            <Link
              to={`/cases?brand=${activeBrand}`}
              className="w-[140px] sm:w-[152px] h-[172px] sm:h-[184px] rounded-[24px] border-2 border-dashed border-[#E7E5E0] hover:border-[#141414] bg-[#F3F1ED] transition-all duration-300 ease-out flex flex-col items-center justify-center p-3 text-center gap-2.5 shadow-2xs group-hover:-translate-y-1.5 group-hover:shadow-md"
              aria-label="Find your phone model in our catalog"
            >
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141414] border border-[#E7E5E0] group-hover:border-[#141414] transition-colors shadow-2xs">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-[12px] font-semibold text-[#141414] leading-tight px-1">
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
