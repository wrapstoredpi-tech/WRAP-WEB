import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Truck, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'Autumn / Winter 2026',
    headline: 'BUILT FOR YOUR PHONE',
    subtext: 'Precision-molded phone cases in full-grain leather, aramid fiber & matte polymer. Form-fitted for Apple and Samsung flagships.',
    ctaText: 'SHOP NOW',
    categoryTarget: 'Mobile Cases',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1920&q=85',
    colorTheme: 'Amber & Charcoal Edition',
  },
  {
    id: 2,
    tag: 'Signature Patina Collection',
    headline: 'TACTILE SCANDINAVIAN LEATHER',
    subtext: 'Vegetable-tanned full grain leather designed to age organically. Features machined anodized aluminum buttons and MagSafe alignment.',
    ctaText: 'SHOP LEATHER CASES',
    categoryTarget: 'Mobile Cases',
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1920&q=85',
    colorTheme: 'Saddle Tan & Rust',
  },
  {
    id: 3,
    tag: 'Engineered Drop Defense',
    headline: 'MINIMAL ARMOR, 10FT PROTECTION',
    subtext: 'Perimeter air-pocket dampeners with a scratch-defying matte obsidian backplate. Ultra-slim 1.4mm profile with zero pocket friction.',
    ctaText: 'EXPLORE SLIM ARMOR',
    categoryTarget: 'Mobile Cases',
    imageUrl: 'https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1920&q=85',
    colorTheme: 'Matte Obsidian & Frost',
  },
  {
    id: 4,
    tag: 'Desk & Travel Carry',
    headline: 'EVERYDAY MODULAR ACCESSORIES',
    subtext: 'MagSafe origami snap stands, Bavarian Merino wool sleeves, and ballistic braided charging lines built for daily longevity.',
    ctaText: 'SHOP ACCESSORIES',
    categoryTarget: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1920&q=85',
    colorTheme: 'Desk & Carry Essentials',
  },
];

const TRUST_BADGES = [
  {
    icon: Users,
    label: '500+ Happy Customers',
    sub: 'Verified 4.9/5 Rating',
  },
  {
    icon: Truck,
    label: 'Same Day Dispatch',
    sub: 'Orders before 2 PM',
  },
  {
    icon: ShieldCheck,
    label: '18-Month Warranty',
    sub: 'Full Replacement Cover',
  },
  {
    icon: CheckCircle2,
    label: 'Precision Fit Guaranteed',
    sub: 'Exact Port & Button Alignment',
  },
];

export function HeroSection({ onShopClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = HERO_SLIDES.length;
  const timerRef = useRef(null);

  // Auto-advance every 5 seconds (5000ms), pauses when hovered
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slideCount]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section
      className="relative w-full bg-neutral-950 overflow-hidden select-none border-b border-neutral-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero Highlights"
    >
      {/* Full-width Image Canvas & Slides */}
      <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px] overflow-hidden">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`
                absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out
                ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}
              `}
              aria-hidden={!isActive}
            >
              {/* Full-Width Background Photography Flat-Lay */}
              <img
                src={slide.imageUrl}
                alt={slide.headline}
                className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Rich Layered Gradients for maximum contrast and legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/45 to-neutral-950/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/40 to-transparent" />
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* Top-Right Trust Badge Strip (Desktop & Tablet)                           */}
        {/* ========================================================================= */}
        <div className="absolute top-6 right-4 sm:right-6 lg:right-10 z-20 hidden md:flex items-center gap-4 lg:gap-6 bg-neutral-950/70 backdrop-blur-md px-4 py-2.5 border border-white/10 shadow-lg">
          {TRUST_BADGES.slice(0, 3).map((badge, bIdx) => {
            const Icon = badge.icon;
            return (
              <div key={bIdx} className="flex items-center gap-2 text-white">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-semibold text-white leading-tight font-sans tracking-tight">
                    {badge.label}
                  </p>
                  <p className="text-[9px] text-neutral-300 uppercase tracking-wider font-mono">
                    {badge.sub}
                  </p>
                </div>
                {bIdx < 2 && <div className="h-6 w-px bg-white/15 ml-3" />}
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* Bottom-Left Overlay Content Block                                        */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-12 sm:pb-16 lg:pb-20 pointer-events-none">
          <div className="max-w-xl space-y-4 pointer-events-auto animate-fade-in">
            {/* Tag / Season Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest bg-accent text-white border border-accent-border">
                <Sparkles className="w-3 h-3 text-white" />
                {activeSlide.tag}
              </span>
              <span className="text-[11px] text-neutral-300 uppercase tracking-editorial font-medium font-mono hidden sm:inline-block">
                &bull; {activeSlide.colorTheme}
              </span>
            </div>

            {/* Campaign Headline */}
            <h1 className="text-display sm:text-display lg:text-[4rem] font-bold text-white tracking-tight uppercase leading-[1.02] drop-shadow-md">
              {activeSlide.headline}
            </h1>

            {/* Subtext */}
            <p className="text-body sm:text-body-lg text-neutral-200 leading-relaxed font-sans max-w-lg drop-shadow-sm">
              {activeSlide.subtext}
            </p>

            {/* Single Black "SHOP NOW" Action Button */}
            <div className="pt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => onShopClick && onShopClick(activeSlide.categoryTarget)}
                className="
                  inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4
                  bg-neutral-900 text-white font-sans text-sm sm:text-base font-semibold uppercase
                  tracking-wider border border-white/30 hover:border-white hover:bg-black
                  shadow-2xl transition-all duration-200 active:scale-[0.98] group
                "
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Navigation Arrow Controls (Left / Right)                                 */}
        {/* ========================================================================= */}
        <div className="absolute inset-y-0 inset-x-3 sm:inset-x-6 z-20 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={handlePrev}
            className="
              p-2.5 sm:p-3 bg-neutral-950/60 hover:bg-neutral-950/90 text-white
              border border-white/20 hover:border-white/50 backdrop-blur-xs
              pointer-events-auto transition-all active:scale-95 shadow-lg
            "
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="
              p-2.5 sm:p-3 bg-neutral-950/60 hover:bg-neutral-950/90 text-white
              border border-white/20 hover:border-white/50 backdrop-blur-xs
              pointer-events-auto transition-all active:scale-95 shadow-lg
            "
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* Dot Indicators & Slide Counter                                           */}
        {/* ========================================================================= */}
        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 lg:right-10 z-20 flex items-center gap-3 bg-neutral-950/70 backdrop-blur-md px-3.5 py-1.5 border border-white/10">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide Selection">
            {HERO_SLIDES.map((_, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setCurrentSlide(idx)}
                  className={`
                    h-2 transition-all duration-300 rounded-full
                    ${isActive ? 'w-6 bg-accent' : 'w-2 bg-white/40 hover:bg-white/80'}
                  `}
                />
              );
            })}
          </div>

          <span className="text-[11px] font-mono text-neutral-300 pl-1 border-l border-white/20">
            0{currentSlide + 1} / 0{slideCount}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Mobile Trust Badges Bar (Visible on mobile < 768px below hero image)     */}
      {/* ========================================================================= */}
      <div className="md:hidden bg-neutral-900 border-t border-neutral-800 px-4 py-3 grid grid-cols-2 gap-3">
        {TRUST_BADGES.slice(0, 2).map((badge, bIdx) => {
          const Icon = badge.icon;
          return (
            <div key={bIdx} className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0">
                <Icon className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white truncate font-sans">
                  {badge.label}
                </p>
                <p className="text-[9px] text-neutral-400 truncate font-mono">
                  {badge.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default HeroSection;
