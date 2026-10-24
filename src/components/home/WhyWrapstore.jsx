import React from 'react';
import { Link } from 'react-router-dom';
import { Smile, ShieldCheck, Truck, Headphones, ArrowRight } from 'lucide-react';

const WHY_CARDS = [
  {
    id: 'personalisation',
    title: 'Personalise your devices your way.',
    description: 'Discover a wide range of cases, skins and accessories to match your style.',
    icon: Smile,
    iconLabel: 'Personalisation',
    image: '/why/personalise.jpg',
    imageAlt: 'Three premium smartphone cases in warm cream, olive green, and matte black on natural stone with white background',
    link: '/?category=Mobile%20Cases',
    bg: '#FFFFFF',
    imageOffset: '-right-4 sm:-right-6',
  },
  {
    id: 'secure-payments',
    title: 'Secure Payments.',
    description: '100% safe and trusted transactions with multiple secure payment options.',
    icon: ShieldCheck,
    iconLabel: 'Secure Payments',
    image: '/why/secure-payments.jpg',
    imageAlt: 'Luxury matte black and champagne payment cards on natural stone with white background',
    link: '/terms',
    bg: '#FFFFFF',
    imageOffset: '-right-4 sm:-right-6',
  },
  {
    id: 'fast-delivery',
    title: 'Fast & Reliable Delivery.',
    description: 'Get your favourites delivered across India with trusted partners.',
    icon: Truck,
    iconLabel: 'Fast & Reliable Delivery',
    image: '/why/fast-delivery.jpg',
    imageAlt: 'Kraft shipping box with WRAPSTORE branding on natural stone with white background',
    link: '/shipping-returns',
    bg: '#FFFFFF',
    imageOffset: '-right-10 sm:-right-14',
  },
  {
    id: 'customer-support',
    title: 'Dedicated Customer Support.',
    description: 'Need help? Our team is here to assist you before and after your purchase.',
    icon: Headphones,
    iconLabel: 'Dedicated Customer Support',
    image: '/why/customer-support.jpg',
    imageAlt: 'Sleek matte black over-ear headphones on natural stone with white background',
    link: '/contact',
    bg: '#FFFFFF',
    imageOffset: '-right-10 sm:-right-12',
  },
];

export function WhyWrapstore() {
  return (
    <section
      aria-labelledby="why-wrapstore-title"
      className="w-full pt-6 sm:pt-8 pb-4 select-none"
    >
      {/* ─────────────────────────────────────────────────────────────────
          1. SECTION HEADER
          - Eyebrow: "WHY WRAPSTORE"
          - Large Heading: "More than just accessories. A better everyday experience."
          - Desktop CTA: "Explore More →" (pill button style matching View All Categories)
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6 sm:mb-10 lg:mb-12">
        {/* Left: Eyebrow + 2-Line Editorial Heading */}
        <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-none">
          <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.2em] text-[#737373] uppercase mb-2.5 sm:mb-3">
            WHY WRAPSTORE
          </p>
          <h2
            id="why-wrapstore-title"
            className="text-[28px] sm:text-[40px] md:text-[46px] lg:text-[48px] xl:text-[56px] 2xl:text-[62px] font-bold text-[#141414] tracking-[-0.03em] leading-[1.08] font-sans"
          >
            More than just accessories,
            A better everyday experience.
          </h2>
        </div>

        {/* Right: CTA (Desktop / Tablet only) */}
        <div className="hidden sm:block shrink-0 pb-1 sm:pb-2">
          <Link
            to="/?view=all"
            className="inline-flex items-center justify-center gap-2 bg-[#141414] hover:bg-black text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-[13px] sm:text-[14px] font-medium transition-all duration-200 shadow-sm shrink-0 group focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 active:scale-[0.98]"
          >
            <span>Explore More</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. FOUR FEATURE CARDS
          - Mobile (< 640px): Horizontally scrollable next to next, 15% smaller
          - Tablet (640px - 1023px): 2 columns grid
          - Desktop (>= 1024px): 4 columns grid
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6 overflow-x-auto sm:overflow-visible pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scroll-smooth snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {WHY_CARDS.map((card) => {
          const IconComponent = card.icon;
          return (
            <Link
              key={card.id}
              to={card.link}
              aria-label={`${card.title} - ${card.description}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[18px] sm:rounded-[22px] bg-white border border-[#E8E5DF] w-[78vw] sm:w-auto max-w-[285px] sm:max-w-none shrink-0 sm:shrink snap-start min-h-[408px] sm:min-h-[500px] lg:min-h-[490px] xl:min-h-[510px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2"
            >
              {/* Top Content: Badge, Heading, Subtitle (15% smaller on mobile) */}
              <div className="relative z-10 p-5 sm:p-7 space-y-2.5 sm:space-y-3.5">
                {/* Circular Ivory / Cream Icon Badge */}
                <div
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#F5F2EB] border border-black/[0.04] flex items-center justify-center text-[#141414] shadow-sm group-hover:scale-105 transition-transform duration-300"
                  aria-hidden="true"
                >
                  <IconComponent className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-[#141414]" strokeWidth={2} />
                </div>

                {/* Bold Heading */}
                <h3 className="text-[17px] sm:text-[21px] xl:text-[22px] font-bold text-[#141414] tracking-[-0.02em] leading-[1.22] font-sans">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-[12px] sm:text-[14px] text-[#68645F] leading-[1.45] max-w-[95%] sm:max-w-[88%] font-normal">
                  {card.description}
                </p>
              </div>

              {/* Bottom Row & Product Photography Right-Aligned to Card */}
              <div className="relative w-full h-[215px] sm:h-[270px] lg:h-[260px] xl:h-[275px] mt-auto overflow-hidden bg-white">
                <img
                  src={card.image}
                  alt={card.imageAlt}
                  width={600}
                  height={600}
                  loading="lazy"
                  className={`absolute ${card.imageOffset || '-right-6'} -bottom-1 w-[130%] max-w-none h-[130%] object-contain object-right-bottom transition-transform duration-500 ease-out group-hover:scale-[1.05] group-hover:-translate-y-1`}
                />

                {/* Circular Arrow Button anchored Bottom-Left */}
                <div className="absolute left-5 bottom-5 sm:left-6 sm:bottom-6 z-20">
                  <div
                    className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full bg-[#F5F2EB] border border-black/[0.05] shadow-sm flex items-center justify-center text-[#141414] group-hover:bg-[#141414] group-hover:text-white transition-all duration-300"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          3. MOBILE-ONLY CTA BUTTON PLACED AFTER ALL CARDS
          - Style matches "View All Categories" button
          ───────────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex sm:hidden justify-center">
        <Link
          to="/?view=all"
          className="w-full inline-flex items-center justify-center gap-2 bg-[#141414] hover:bg-black text-white px-6 py-3 rounded-full text-[14px] font-medium transition-all duration-200 shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 active:scale-[0.98]"
        >
          <span>Explore More</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

export default WhyWrapstore;
