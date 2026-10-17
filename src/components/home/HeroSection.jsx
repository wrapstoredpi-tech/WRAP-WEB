import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { homeConfig } from '../../config/home';

export function HeroSection({ onExploreClick }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const heroSettings = homeConfig.hero || {};
  const slides = heroSettings.slides && heroSettings.slides.length > 0 ? heroSettings.slides : [
    { id: '1', image: '/hero/slide-1.jpg', alt: 'WrapStore physical storefront' },
    { id: '2', image: '/hero/slide-2.jpg', alt: 'WrapStore cases display' },
    { id: '3', image: '/hero/slide-3.jpg', alt: 'WrapStore phone accessories showroom' },
  ];

  const total = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    },
    [prevSlide, nextSlide]
  );

  // Auto-advance timer (5s) with pause on hover/focus and prefers-reduced-motion check
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isPaused || total <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, total, currentIndex]);

  // Touch swipe handling
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <section
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden group select-none focus:outline-none"
      aria-roledescription="carousel"
      aria-label="Featured Collections"
    >
      {/* Slides Container - 4:5 on mobile, 21:8 on desktop */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[21/8] bg-[#141414] overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.image}
                alt={slide.alt || 'WrapStore phone cases and accessories'}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          );
        })}

        {/* Bottom-left to transparent scrim (max opacity 0.6, transparent by 60% of width) */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top right, rgba(20,20,20,0.6) 0%, rgba(20,20,20,0.5) 25%, rgba(20,20,20,0.2) 45%, rgba(20,20,20,0) 60%)',
          }}
        />

        {/* Fixed Text Block overlaid bottom-left (identical on every slide, aligned to header logo left edge) */}
        <div className="absolute inset-0 z-30 flex items-end">
          <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
            <div className="max-w-[620px] space-y-3">
              <h1 className="text-[28px] sm:text-[40px] font-semibold text-white tracking-[-0.02em] leading-tight">
                {heroSettings.headline || 'Cases for iPhone and Samsung'}
              </h1>
              <p className="text-[14px] sm:text-[16px] font-normal text-white/90 leading-snug">
                {heroSettings.subtext || 'Choose your phone and see the designs that fit.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onExploreClick) {
                      onExploreClick();
                    } else {
                      navigate(heroSettings.buttonLink || '/?category=Mobile%20Cases');
                    }
                  }}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#B0521F] hover:bg-[#994518] text-white text-[16px] font-semibold rounded-[6px] transition-colors cursor-pointer"
                >
                  {heroSettings.buttonText || 'Shop cases'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thin Line Indicators: 28x2px, bottom-right, no container, active fills over 5s */}
        <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-6 z-30 flex items-center gap-2">
          {slides.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="w-[28px] h-[2px] bg-white/40 overflow-hidden relative cursor-pointer"
              >
                {isActive && (
                  <span
                    key={currentIndex}
                    className={`absolute inset-0 bg-white ${
                      isPaused ? '' : 'animate-hero-fill'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Plain chevrons on desktop hover only */}
        <button
          type="button"
          onClick={prevSlide}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[6px]"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[6px]"
          aria-label="Next slide"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
