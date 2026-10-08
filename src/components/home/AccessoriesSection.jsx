import React, { useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Compass, 
  Check
} from 'lucide-react';

/**
 * Local comprehensive catalog of all WrapStore accessories & everyday carry essentials.
 * Uses permanent bundled local photography from /public/subcategories/*.jpg
 */
export const LOCAL_ACCESSORIES = [
  {
    id: 'acc-cables',
    name: 'Braided Fast Cables',
    category: 'Gadgets',
    subcategory: 'Cables',
    slug: 'cables',
    image: '/subcategories/cables.jpg',
    tagline: '240W USB-C & Lightning',
    badge: 'Ballistic Nylon',
    startingPrice: 399,
    group: 'power',
    description: 'Double-braided reinforced cables rated for 30,000+ bends and up to 240W ultra-fast Power Delivery.',
  },
  {
    id: 'acc-power-bank',
    name: 'MagSafe Power Banks',
    category: 'Gadgets',
    subcategory: 'Power Bank',
    slug: 'power-bank',
    image: '/subcategories/power-bank.jpg',
    tagline: 'Magnetic Snap & 20W PD',
    badge: '10,000 mAh',
    startingPrice: 1899,
    group: 'power',
    description: 'Ultra-slim wireless magnetic power bank with pass-through charging and aerospace-grade aluminum chassis.',
  },
  {
    id: 'acc-wallet',
    name: 'MagSafe Leather Wallets',
    category: 'Accessories',
    subcategory: 'Wallet',
    slug: 'wallet',
    image: '/subcategories/wallet.jpg',
    tagline: 'RFID-Shielded Slim Carry',
    badge: 'Full-Grain Leather',
    startingPrice: 699,
    group: 'magsafe',
    description: 'Minimalist 3-card magnetic wallet with integrated thumb slide and strong N52 neodymium array.',
  },
  {
    id: 'acc-airpods-cases',
    name: 'AirPods Armor Cases',
    category: 'Accessories',
    subcategory: 'AirPods Cases',
    slug: 'airpods-cases',
    image: '/subcategories/airpods-cases.jpg',
    tagline: 'Precision Silicone & Armor',
    badge: 'Drop Certified',
    startingPrice: 499,
    group: 'protection',
    description: 'Form-fitted tactile cases with carabiner attachment, visible charging LED, and lanyard support.',
  },
  {
    id: 'acc-watch-strap',
    name: 'Apple Watch Straps',
    category: 'Accessories',
    subcategory: 'Watch Strap',
    slug: 'watch-strap',
    image: '/subcategories/watch-strap.jpg',
    tagline: 'Silicone, Leather & Alpine',
    badge: 'All Watch Series',
    startingPrice: 599,
    group: 'wearables',
    description: 'Breathable sports silicone, rugged titanium-buckle nylon alpine loops, and vegetable-tanned leather bands.',
  },
  {
    id: 'acc-watch-cases',
    name: 'Smartwatch Armor Cases',
    category: 'Accessories',
    subcategory: 'Watch Cases',
    slug: 'watch-cases',
    image: '/subcategories/watch-cases.jpg',
    tagline: 'Full Edge Rim Defense',
    badge: 'Impact Guard',
    startingPrice: 349,
    group: 'wearables',
    description: 'Tempered glass integrated snap-on rim cases engineered for Ultra & standard Apple Watch sizes.',
  },
  {
    id: 'acc-phone-stand',
    name: 'Phone Stands & Grips',
    category: 'Accessories',
    subcategory: 'Phone Stand',
    slug: 'phone-stand',
    image: '/subcategories/phone-stand.jpg',
    tagline: 'Fold-Flat Origami Mag',
    badge: 'Dual Angle View',
    startingPrice: 549,
    group: 'magsafe',
    description: 'Ultra-thin foldable magnetic desk stand converting smoothly between portrait and landscape modes.',
  },
  {
    id: 'acc-adapters',
    name: 'GaN Fast Chargers',
    category: 'Gadgets',
    subcategory: 'Adapters',
    slug: 'adapters',
    image: '/subcategories/adapters.jpg',
    tagline: '65W Multi-Port GaN Tech',
    badge: 'Compact GaN III',
    startingPrice: 899,
    group: 'power',
    description: 'High-efficiency Gallium Nitride wall chargers powering phones, tablets, and laptops simultaneously.',
  },
  {
    id: 'acc-tempered-glass',
    name: '9H Tempered Glass',
    category: 'Accessories',
    subcategory: 'Tempered Glass',
    slug: 'tempered-glass',
    image: '/subcategories/tempered-glass.jpg',
    tagline: 'Oleophobic Edge Shield',
    badge: '9H Hardness',
    startingPrice: 299,
    group: 'protection',
    description: 'True 9H hardness tempered shield with oleophobic coating that repels oils and resists micro-scratches.',
  },
  {
    id: 'acc-lens-protector',
    name: 'Camera Lens Protectors',
    category: 'Accessories',
    subcategory: 'Lens Protector',
    slug: 'lens-protector',
    image: '/subcategories/lens-protector.jpg',
    tagline: 'Sapphire Optical Rings',
    badge: 'Zero Flash Flare',
    startingPrice: 399,
    group: 'protection',
    description: 'Independent anodized metal rings with AR anti-reflective coated sapphire glass for pure image clarity.',
  },
  {
    id: 'acc-ipad-case',
    name: 'iPad Smart Folios',
    category: 'Accessories',
    subcategory: 'iPad Case',
    slug: 'ipad-case',
    image: '/subcategories/ipad-case.jpg',
    tagline: 'Magnetic Sleep / Wake',
    badge: 'Pencil 2 Storage',
    startingPrice: 1199,
    group: 'protection',
    description: 'Slim origami magnetic folio case with built-in Apple Pencil charging slot and microfiber lining.',
  },
  {
    id: 'acc-ipad-temper',
    name: 'iPad Paper-Feel Glass',
    category: 'Accessories',
    subcategory: 'iPad Temper',
    slug: 'ipad-temper',
    image: '/subcategories/ipad-temper.jpg',
    tagline: 'Matte Anti-Glare Texture',
    badge: 'Drawing & Note',
    startingPrice: 599,
    group: 'protection',
    description: 'Specialized textured screen protector providing real paper friction for Apple Pencil writing and drawing.',
  },
  {
    id: 'acc-skin',
    name: '3M Precision Skins',
    category: 'Accessories',
    subcategory: 'Skin',
    slug: 'skin',
    image: '/subcategories/skin.jpg',
    tagline: 'Matte & Carbon Vinyl',
    badge: 'Zero Residue',
    startingPrice: 449,
    group: 'care',
    description: 'Laser-cut authentic 3M matrix vinyl skin wraps protecting backs and sides with zero added bulk.',
  },
  {
    id: 'acc-badge-stickers',
    name: 'Badges & Metallic Decals',
    category: 'Accessories',
    subcategory: 'Badge / Stickers',
    slug: 'badge-stickers',
    image: '/subcategories/badge-stickers.jpg',
    tagline: 'Embossed Metal Accents',
    badge: 'Custom Aesthetic',
    startingPrice: 199,
    group: 'care',
    description: 'Precision-cut metallic device emblems, waterproof typography decals, and tactile badge stickers.',
  },
  {
    id: 'acc-cleaning-kit',
    name: 'Precision Cleaning Kits',
    category: 'Accessories',
    subcategory: 'Cleaning Kit',
    slug: 'cleaning-kit',
    image: '/subcategories/cleaning-kit.jpg',
    tagline: '7-in-1 Port & Screen Kit',
    badge: 'Essential Care',
    startingPrice: 349,
    group: 'care',
    description: 'Multi-functional maintenance tools including flocking sponge, high-density brush, and lens cleaning pen.',
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Accessories', icon: Layers },
  { id: 'power', label: 'Power & Cables', icon: Zap },
  { id: 'magsafe', label: 'MagSafe & Stands', icon: Sparkles },
  { id: 'protection', label: 'Glass & Defense', icon: ShieldCheck },
  { id: 'wearables', label: 'Watch Bands & Cases', icon: Compass },
  { id: 'care', label: 'Skins & Care', icon: Check },
];

export function AccessoriesSection({ onSelectAccessory }) {
  const scrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredAccessories = activeTab === 'all'
    ? LOCAL_ACCESSORIES
    : LOCAL_ACCESSORIES.filter((item) => item.group === activeTab);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCardClick = (item) => {
    if (onSelectAccessory) {
      onSelectAccessory(item);
    }
  };

  return (
    <section 
      className="bg-white rounded-xl border border-[#E7E5E4] p-5 sm:p-7 shadow-xs space-y-6 transition-all animate-fade-in"
      aria-label="Everyday Tech Accessories"
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F5F5F4] pb-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9E381A] bg-[#FDF2EE] border border-[#ECCEC5] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#9E381A]" />
              Everyday Tech Essentials
            </span>
            <span className="text-[12px] text-[#A8A29E] font-medium hidden sm:inline">
              • {LOCAL_ACCESSORIES.length} Collections Available
            </span>
          </div>
          
          <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#141414] tracking-tight">
            Explore All Accessories
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#666664] font-normal leading-relaxed">
            Universal MagSafe mounts, high-speed ballistic cables, screen armor, and everyday lifestyle carry.
          </p>
        </div>

        {/* Navigation Carousel Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F5F5F4] hover:border-[#141414] text-[#141414] flex items-center justify-center transition-colors shadow-xs cursor-pointer active:scale-95"
            aria-label="Previous accessories"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-lg border border-[#E7E5E4] bg-white hover:bg-[#F5F5F4] hover:border-[#141414] text-[#141414] flex items-center justify-center transition-colors shadow-xs cursor-pointer active:scale-95"
            aria-label="Next accessories"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Category Quick Filter Chips ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 h-8 sm:h-9 px-3.5 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-[#F5F5F4] text-[#666664] hover:text-[#141414] hover:bg-[#E7E5E4] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#666664]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Horizontal Scrollable Accessories List ── */}
      <div 
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredAccessories.map((item) => (
          <div
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="group relative flex-none w-[220px] sm:w-[250px] bg-[#FAFAF9] hover:bg-white rounded-xl border border-[#E7E5E4] hover:border-[#141414] p-3 sm:p-3.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 snap-start"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(item);
              }
            }}
          >
            {/* Visual Thumbnail */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white border border-[#E7E5E4]/80">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Badge Tag */}
              <div className="absolute top-2 left-2 pointer-events-none">
                <span className="text-[10px] font-semibold bg-[#141414]/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                  {item.badge}
                </span>
              </div>

              {/* Hover Quick Action Indicator */}
              <div className="absolute bottom-2 right-2 w-7 h-7 rounded-md bg-white/95 text-[#141414] shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowUpRight className="w-4 h-4 text-[#141414]" />
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-[14px] font-semibold text-[#141414] group-hover:text-[#9E381A] transition-colors line-clamp-1">
                  {item.name}
                </h3>
              </div>

              <p className="text-[12px] text-[#666664] font-normal line-clamp-1">
                {item.tagline}
              </p>

              <div className="pt-1.5 flex items-center justify-between border-t border-[#E7E5E4]/60">
                <span className="text-[11px] font-medium text-[#A8A29E] uppercase tracking-wider">
                  Starting
                </span>
                <span className="text-[13px] font-semibold text-[#141414]">
                  ₹{item.startingPrice}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Summary & Quick Helper ── */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#A8A29E] border-t border-[#F5F5F4]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Universal Device Fit
          </span>
          <span>•</span>
          <span>Fast Dispatch within 24h</span>
          <span>•</span>
          <span>Precision Certified Quality</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onSelectAccessory) {
              onSelectAccessory({ category: 'Accessories', subcategory: 'All Types' });
            }
          }}
          className="text-[#141414] hover:text-[#9E381A] font-semibold flex items-center gap-1 transition-colors underline underline-offset-2 cursor-pointer self-start sm:self-auto"
        >
          <span>View All {LOCAL_ACCESSORIES.length} Accessories in Catalog</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}

export default AccessoriesSection;
