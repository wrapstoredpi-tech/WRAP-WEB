import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Bento Grid Category definitions matching approved Wrapstore visual reference
 */
const BENTO_CATEGORIES = [
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    description: "Discover what's new at Wrapstore.",
    image: '/bento/new-arrivals.jpg',
    alt: "New Arrivals - Premium olive green MagSafe case on stone",
    link: '/?view=all&sort=newest',
    isLarge: true,
  },
  {
    id: 'screen-protectors',
    title: 'Screen Protectors',
    description: 'Crystal clear. Stay protected.',
    image: '/bento/screen-protectors.jpg',
    alt: 'Screen Protectors - Transparent tempered glass protector',
    link: '/?category=Accessories&subcategory=Tempered%20Glass',
  },
  {
    id: 'chargers-adapters',
    title: 'Chargers & Adapters',
    description: 'Fast charging for your day.',
    image: '/bento/chargers-adapters.jpg',
    alt: 'Chargers and Adapters - Dual fast charging wall adapter',
    link: '/?category=Accessories&subcategory=Adapters',
  },
  {
    id: 'cables',
    title: 'Cables',
    description: 'Durable cables. Always reliable.',
    image: '/bento/cables.jpg',
    alt: 'Cables - Heavy duty braided USB-C cable',
    link: '/?category=Accessories&subcategory=Cables',
  },
  {
    id: 'audio',
    title: 'Audio',
    description: 'Immerse in better sound.',
    image: '/bento/audio.jpg',
    alt: 'Audio - Wireless earbuds in charging case',
    link: '/?category=Accessories&subcategory=AirPods%20Cases',
  },
  {
    id: 'power-banks',
    title: 'Power Banks',
    description: 'Power on the go.',
    image: '/bento/power-banks.jpg',
    alt: 'Power Banks - Sleek digital display power bank',
    link: '/?category=Accessories&subcategory=Power%20Bank',
  },
  {
    id: 'ipad-case',
    title: 'iPad Case',
    description: 'Protection for bigger possibilities.',
    image: '/bento/ipad-case.jpg',
    alt: 'iPad Case - Premium tablet with magnetic folio cover and stylus',
    link: '/?category=Accessories&subcategory=iPad%20Case',
  },
  {
    id: 'other-accessories',
    title: 'Other Accessories',
    description: 'All your essentials in one place.',
    image: '/bento/other-accessories.jpg',
    alt: 'Other Accessories - Desktop phone stand and smartwatch band',
    link: '/?category=Accessories',
  },
];

/**
 * Bento Grid Category Card Component
 */
function BentoCard({
  category,
  className = '',
  headingSize = 'normal',
}) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // If not clicking a native link
    if (!e.defaultPrevented) {
      navigate(category.link);
    }
  };

  return (
    <Link
      to={category.link}
      onClick={handleCardClick}
      className={`group relative rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#F3EFEA] border border-[#EBE5DE] p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 ${className}`}
      aria-label={`${category.title} - ${category.description}`}
    >
      {/* Background Product Photography with realistic lighting & sand/stone texture */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <img
          src={category.image}
          alt={category.alt}
          width={800}
          height={600}
          loading="lazy"
          className="w-full h-full object-cover object-right-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {/* Subtle cream gradient in top-left to keep text and button 100% readable */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#F4EFEA]/85 via-[#F4EFEA]/30 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Top Left: Title, Description & Circular Action Button */}
      <div className="relative z-10 flex flex-col items-start pointer-events-none">
        <h3
          className={`font-sans font-bold text-[#141414] leading-[1.12] tracking-tight ${
            headingSize === 'large'
              ? 'text-[22px] sm:text-[26px] lg:text-[28px]'
              : 'text-[17px] sm:text-[19px] lg:text-[20px]'
          }`}
        >
          {category.title}
        </h3>
        <p className="text-[12px] sm:text-[13px] text-[#555555] font-normal mt-1 sm:mt-1.5 leading-snug max-w-[170px] sm:max-w-[210px]">
          {category.description}
        </p>

        {/* Circular Arrow Button matching reference image */}
        <div
          className="mt-3.5 sm:mt-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#141414] transition-all duration-200 group-hover:translate-x-1 group-hover:bg-[#141414] group-hover:text-white"
          aria-hidden="true"
        >
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
    </Link>
  );
}

export function ShopByCategoryRow() {
  const newArrivals = BENTO_CATEGORIES[0];
  const gridTopRight = BENTO_CATEGORIES.slice(1, 5); // Cards 2, 3, 4, 5
  const gridBottom = BENTO_CATEGORIES.slice(5, 8);   // Cards 6, 7, 8

  return (
    <section
      aria-label="Shop by Category Bento Grid"
      className="w-full max-w-[1440px] mx-auto pt-2 pb-4 select-none"
    >
      {/* ─────────────────────────────────────────────────────────────────
          1. SECTION HEADER
          - Eyebrow: "EXPLORE OUR RANGE"
          - Large Heading: "Shop by Category"
          - Supporting text: "Everything your device needs..."
          - CTA: "View All Categories →"
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 sm:gap-6 mb-7 sm:mb-9 lg:mb-11">
        {/* Left: Eyebrow + Heading */}
        <div>
          <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.2em] text-[#737373] uppercase mb-1.5 sm:mb-2">
            EXPLORE OUR RANGE
          </p>
          <h2 className="text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-[#141414] tracking-[-0.03em] leading-[1.08] font-sans">
            Shop by Category
          </h2>
        </div>

        {/* Middle / Right: Supporting Text & Pill CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-8">
          <p className="text-[13px] sm:text-[14px] text-[#666666] leading-relaxed max-w-sm">
            Everything your device needs — cases, protection, chargers, audio and more, all in one place.
          </p>
          <Link
            to="/?view=all"
            className="inline-flex items-center justify-center gap-2 bg-[#141414] hover:bg-black text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-[13px] sm:text-[14px] font-medium transition-all duration-200 shadow-sm shrink-0 group focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 active:scale-[0.98]"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. BENTO GRID LAYOUT
          Desktop (>= 1024px):
          - Top Tier: 12 cols total
            - Left: New Arrivals (5 cols, spans 2 rows)
            - Right: 4 smaller cards in 2x2 grid (7 cols total, 2 rows)
          - Bottom Tier: 12 cols total
            - Power Banks (3 cols)
            - iPad Case (5 cols, wide center)
            - Other Accessories (4 cols)

          Tablet & Mobile (<= 1023px):
          - Responsive 2-column grid with New Arrivals spanning 2 cols on top
          ───────────────────────────────────────────────────────────────── */}
      <div className="space-y-4 sm:space-y-5">
        
        {/* Tier 1: Top Bento Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Category 1: New Arrivals (Large Featured Card, spans 2 rows on desktop) */}
          <div className="sm:col-span-2 lg:col-span-5 min-h-[300px] sm:min-h-[360px] lg:min-h-[500px]">
            <BentoCard
              category={newArrivals}
              headingSize="large"
              className="h-full"
            />
          </div>

          {/* Right 2x2 Grid on Desktop (Categories 2 to 5: Screen Protectors, Chargers, Cables, Audio) */}
          <div className="sm:col-span-2 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {gridTopRight.map((cat) => (
              <BentoCard
                key={cat.id}
                category={cat}
                className="min-h-[200px] sm:min-h-[220px] lg:min-h-[238px]"
              />
            ))}
          </div>
        </div>

        {/* Tier 2: Bottom Bento Section (Categories 6, 7, 8: Power Banks, iPad Case, Other Accessories) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Category 6: Power Banks */}
          <div className="sm:col-span-1 lg:col-span-3 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]">
            <BentoCard
              category={gridBottom[0]}
              className="h-full"
            />
          </div>

          {/* Category 7: iPad Case (Wide Center Card) */}
          <div className="sm:col-span-1 lg:col-span-5 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]">
            <BentoCard
              category={gridBottom[1]}
              className="h-full"
            />
          </div>

          {/* Category 8: Other Accessories */}
          <div className="sm:col-span-2 lg:col-span-4 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]">
            <BentoCard
              category={gridBottom[2]}
              className="h-full"
            />
          </div>
        </div>

      </div>
    </section>
  );
}

export default ShopByCategoryRow;
