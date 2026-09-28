import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';

const HERO_SLIDES = [
  {
    id: 1,
    category: 'All',
    tag: 'Crafted Precision',
    headline: 'Cases Designed for Precision & Protection',
    subline: 'Lightweight, ultra-durable materials built specifically for your device.',
    cta: 'Explore Collection',
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    category: 'Phone Cases',
    tag: 'Minimalist Carry',
    headline: 'Protection Without the Bulk',
    subline: 'Engineered with soft tactile feel, precise camera cutouts, and drop defense.',
    cta: 'Shop Phone Cases',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    category: 'Accessories',
    tag: 'Daily Essentials',
    headline: 'Minimal Accessories for Desk & Pocket',
    subline: 'Elevate your daily carry setup with curated protective accessories.',
    cta: 'View Accessories',
    image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80',
  },
];

export function HeroSection({ onShopClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  // Slow 5-second carousel auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="w-full bg-base-offwhite border-b border-neutral-200">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="relative rounded-2xl overflow-hidden bg-neutral-900 text-white min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-12 shadow-sm">
          
          {/* Background Image with Fixed Aspect Ratio overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={activeSlide.image}
              alt={activeSlide.headline}
              className="w-full h-full object-cover opacity-45 transition-opacity duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide font-semibold text-accent bg-neutral-900/80 px-2.5 py-1 rounded-md border border-accent/30">
                {activeSlide.tag}
              </span>
              {savedPhone && (
                <span className="text-xs text-neutral-300 bg-neutral-800/80 px-2.5 py-1 rounded-md">
                  For {savedPhone.model}
                </span>
              )}
            </div>

            <h1 className="text-display font-semibold tracking-tight text-white leading-tight">
              {activeSlide.headline}
            </h1>

            <p className="text-body-sm sm:text-body text-neutral-300 line-clamp-2 max-w-lg">
              {activeSlide.subline}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onShopClick && onShopClick(activeSlide.category)}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-body-sm flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>{activeSlide.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!savedPhone && (
                <button
                  type="button"
                  onClick={openPhoneSheet}
                  className="min-h-[44px] px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-body-sm backdrop-blur-xs transition-colors hidden sm:block"
                >
                  Find for my phone
                </button>
              )}
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
              className="w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center border border-neutral-700 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5 px-2">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? 'w-6 bg-accent' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center border border-neutral-700 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
