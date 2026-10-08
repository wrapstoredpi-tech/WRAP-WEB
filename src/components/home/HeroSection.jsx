import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Smartphone } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { heroSlides } from '../../config/hero';
import { useHeroSlider } from './useHeroSlider';

/**
 * WrapStore Home Hero Section with Accessible Carousel Slider
 * 
 * Config-driven from src/config/hero.js
 * Full-bleed canvas with left-aligned reading column
 * 5-second horizontal auto-scroll with manual reset, pause-on-hover/focus/tab-hidden,
 * CSS scroll-snap touch swiping, 44px arrow controls, 44px slide dots, and accessible pause toggle.
 */
export function HeroSection({ onShopClick, slides = heroSlides }) {
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  const {
    currentIndex,
    slideCount,
    isMultiSlide,
    isPaused,
    isManualPaused,
    isManualNav,
    prefersReducedMotion,
    resetKey,
    containerRef,
    scrollTrackRef,
    goToSlide,
    nextSlide,
    prevSlide,
    togglePause,
    handleScroll,
    handleKeyDown,
    handleMouseDown,
    handleMouseMove,
    handleMouseLeave,
    handleMouseUpOrLeave,
    handleMouseEnter,
    handleFocus,
    handleBlur,
  } = useHeroSlider({ slides, autoScrollInterval: 5000 });

  const currentSlide = slides[currentIndex] || slides[0] || {};

  return (
    <section
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Collections and Dharmapuri Store Highlights"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="group relative w-full bg-[#141414] text-white overflow-hidden border-b border-[#262624] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E381A]"
    >
      {/* Accessible live region for announcing slide changes */}
      <div
        className="sr-only"
        aria-live={isManualNav ? 'polite' : 'off'}
        aria-atomic="true"
      >
        {currentSlide.title ? `Slide ${currentIndex + 1} of ${slideCount}: ${currentSlide.title}` : ''}
      </div>

      {/* Horizontal Scroll-Snap Track (CSS Scroll-Snap + Touch + Drag) */}
      <div
        ref={scrollTrackRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing touch-pan-x"
        style={{
          scrollSnapType: 'x mandatory',
          scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, index) => {
          const isFirst = index === 0;
          return (
            <div
              key={slide.id || index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slideCount}`}
              aria-hidden={index !== currentIndex}
              className="relative min-w-full w-full shrink-0 snap-start snap-always min-h-[480px] sm:min-h-[520px] md:min-h-[560px] flex items-center"
            >
              {/* Slide Background Image with Fixed Aspect & Zero CLS */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                <img
                  src={slide.image}
                  alt={slide.alt || slide.title || 'WrapStore Hero Slide'}
                  loading={isFirst ? 'eager' : 'lazy'}
                  fetchPriority={isFirst ? 'high' : 'auto'}
                  className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-700 ease-out"
                />

                {/* Left-heavy directional dark gradient for high contrast reading column */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40 sm:from-black/90 sm:via-black/70 sm:to-black/30"
                  aria-hidden="true"
                />
                {/* Vertical gradient for top/bottom edge integration */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"
                  aria-hidden="true"
                />
              </div>

              {/* Constrained Left-Aligned Reading Column */}
              <div className="relative z-10 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 flex flex-col justify-center">
                <div className="max-w-[620px] space-y-4 sm:space-y-5">
                  
                  {/* Small-caps, letter-spaced kicker + Fitted Phone Badge */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[12px] uppercase font-semibold text-[#D6D3D1] tracking-[0.12em] bg-white/10 px-2.5 py-0.5 rounded-sm backdrop-blur-xs border border-white/10">
                      {slide.kicker || 'WRAPSTORE'}
                    </span>
                    {savedPhone && (
                      <>
                        <span className="text-white/30 text-[12px]">•</span>
                        <span className="text-[12px] text-[#E7E5E4] bg-white/10 px-2.5 py-0.5 rounded-sm font-normal border border-white/10 backdrop-blur-xs">
                          Fitted for {savedPhone.model}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Poppins Semibold Display Headline (28-42px) */}
                  <h1 className="text-[28px] sm:text-[36px] md:text-[42px] font-semibold text-white tracking-[-0.03em] leading-[1.15]">
                    {slide.title}
                  </h1>

                  {/* Muted Subtext */}
                  <p className="text-[14px] sm:text-[15px] font-normal text-[#D6D3D1] leading-relaxed max-w-[540px]">
                    {slide.description}
                  </p>

                  {/* Action Buttons (46px height, 10px radius) */}
                  <div className="pt-2 sm:pt-3 flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onShopClick && onShopClick(slide.primaryCta?.category || 'All')}
                      className="group h-[46px] px-6 py-3 rounded-lg bg-[#9E381A] hover:bg-[#882F15] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors duration-200 focus-visible:outline-white cursor-pointer shadow-lg shadow-black/40"
                    >
                      <span>{slide.primaryCta?.text || 'Explore Catalog'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>

                    {!savedPhone ? (
                      <button
                        type="button"
                        onClick={openPhoneSheet}
                        className="h-[46px] px-6 py-3 rounded-lg bg-black/40 hover:bg-black/60 text-white font-normal text-[14px] border border-white/20 backdrop-blur-xs transition-colors duration-200 flex items-center justify-center gap-2 focus-visible:outline-white cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-[#D6D3D1]" />
                        <span>Select Your Phone</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openPhoneSheet}
                        className="h-[46px] px-5 py-3 rounded-lg bg-black/30 hover:bg-black/50 text-[#D6D3D1] hover:text-white font-normal text-[13px] border border-white/10 backdrop-blur-xs transition-colors duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-white cursor-pointer"
                      >
                        <span>Change ({savedPhone.model})</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slider Controls (Displayed ONLY when 2 or more slides exist) */}
      {isMultiSlide && (
        <>
          {/* Desktop Left Previous Arrow (44px target) */}
          <button
            type="button"
            onClick={() => prevSlide(true)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition-all duration-200 hidden sm:flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-105 focus-visible:opacity-100 cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Desktop Right Next Arrow (44px target) */}
          <button
            type="button"
            onClick={() => nextSlide(true)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition-all duration-200 hidden sm:flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-105 focus-visible:opacity-100 cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Bar: Dots Navigation and Accessible Pause/Play Button */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-20 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-none">
            
            {/* Dots and Pause/Play Control Bar */}
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 pointer-events-auto shadow-lg">
              
              {/* Slide Dots (44px touch targets) */}
              <div className="flex items-center" role="tablist" aria-label="Slide Selector">
                {slides.map((_, index) => {
                  const isActive = index === currentIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => goToSlide(index, true)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center p-0 bg-transparent border-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-full"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          isActive
                            ? 'w-6 h-2 bg-white shadow-xs'
                            : 'w-2 h-2 bg-white/40 group-hover:bg-white/80 group-hover:scale-125'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-4 bg-white/20 mx-0.5" aria-hidden="true" />

              {/* Pause/Play Toggle Button (44px target) */}
              <button
                type="button"
                onClick={togglePause}
                aria-label={isManualPaused ? 'Play slide rotation' : 'Pause slide rotation'}
                title={isManualPaused ? 'Play' : 'Pause'}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-white cursor-pointer"
              >
                {isManualPaused ? (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            </div>

            {/* Slide Index Counter Badge (e.g. 1 / 3) */}
            <div className="hidden sm:flex items-center bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-[12px] font-semibold text-[#D6D3D1] tracking-wider pointer-events-auto">
              <span>{currentIndex + 1}</span>
              <span className="text-white/30 mx-1">/</span>
              <span>{slideCount}</span>
            </div>
          </div>

          {/* 5-Second Horizontal Progress Bar Line (along bottom edge of hero) */}
          {!prefersReducedMotion && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15 z-20 overflow-hidden"
              aria-hidden="true"
            >
              <div
                key={`${currentIndex}-${resetKey}`}
                className="h-full w-full bg-[#9E381A] animate-hero-progress origin-left"
                style={{
                  animationPlayState: isPaused ? 'paused' : 'running',
                  animationDuration: '5000ms',
                }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default HeroSection;
