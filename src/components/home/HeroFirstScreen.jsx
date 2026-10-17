import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { homeConfig } from '../../config/home';
import { store } from '../../config/store';
import { usePhoneContext } from '../../context/PhoneContext';
import { useIntro } from '../../context/IntroContext';
import { useIntroReveal } from '../../hooks/useIntroReveal';

export function HeroFirstScreen() {
  const { openPhoneSheet } = usePhoneContext();
  const { isIntroDone } = useIntro();
  const heroTextRevealStyle = useIntroReveal(80);
  const heroPhotoRevealStyle = useIntroReveal(160);

  const slides = homeConfig.heroSlider?.slides || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Touch swipe support
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const sliderRef = useRef(null);

  // Autoplay timer: does not start until intro:done, starts immediately if intro never ran
  useEffect(() => {
    if (!isIntroDone) return;
    if (paused || slides.length <= 1) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, homeConfig.heroSlider?.autoplayIntervalMs || 5000);

    return () => clearTimeout(timer);
  }, [activeIndex, paused, slides.length, isIntroDone]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handleTouchStart = (e) => {
    setPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setPaused(false);
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const whatsappHref = store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : null;

  return (
    <section
      aria-label="Welcome to WrapStore"
      className="w-full pt-2 sm:pt-4"
    >
      {/* ─────────────────────────────────────────────────────────────────
          12-Column Grid (Desktop) / Stacked (Mobile)
          Desktop: Left 5 columns (Copy + Actions + Facts) | Right 7 columns (Photo slider)
          ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: 5 columns on desktop */}
        <div style={heroTextRevealStyle} className="lg:col-span-5 flex flex-col justify-center space-y-5 order-1">
          
          {/* H1 in the display font (DM Serif Display 400, 56/60 desktop, 36/40 mobile) */}
          <h1 className="font-display font-normal text-[36px] sm:text-[46px] lg:text-[56px] leading-[1.1] tracking-[-0.01em] text-[#141414]">
            {homeConfig.firstScreen?.headline || 'Cases for iPhone and Samsung'}
          </h1>

          {/* Hero subtext in the sans: 16px desktop (15px mobile), line-height 1.6 */}
          <p className="font-sans font-normal text-[15px] sm:text-[16px] text-[#525252] leading-[1.6]">
            {homeConfig.firstScreen?.subtext ||
              'Cases for iPhone and Samsung, plus everyday accessories. Choose your phone, pick a design, pay securely online.'}
          </p>

          {/* Primary Action Button + Find Your Phone Link */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
            <Link
              to={homeConfig.firstScreen?.primaryButtonLink || '/?category=Mobile%20Cases'}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#141414] hover:bg-[#383836] text-white font-semibold text-[14px] rounded-[6px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 text-center cursor-pointer"
            >
              {homeConfig.firstScreen?.primaryButtonText || 'Shop cases'}
            </Link>

            <button
              type="button"
              onClick={openPhoneSheet}
              className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 text-[14px] font-semibold text-[#141414] hover:text-[#B0521F] underline underline-offset-4 cursor-pointer transition-colors"
              aria-label="Open phone model selector"
            >
              {homeConfig.firstScreen?.findPhoneText || 'Find your phone'}
            </button>
          </div>

          {/* Facts row separated by thin dividers, no icons */}
          <div className="hidden sm:flex items-center text-[12px] lg:text-[13px] text-[#6B6B6B] pt-4 border-t border-[#E5E5E3] select-none">
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#141414] transition-colors hover:underline"
            >
              {store.addressShort}
            </a>
            <span className="w-px h-3.5 bg-[#E5E5E3] mx-3" aria-hidden="true" />
            <span>Secure online payment</span>
            <span className="w-px h-3.5 bg-[#E5E5E3] mx-3" aria-hidden="true" />
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#141414] transition-colors hover:underline"
              >
                WhatsApp support
              </a>
            ) : (
              <span>WhatsApp support</span>
            )}
          </div>
        </div>

        {/* Right Column: 7 columns on desktop (Photo slider only, nothing sits on top of photos) */}
        <div style={heroPhotoRevealStyle} className="lg:col-span-7 order-2">
          
          {/* Slider Container (Fixed ratio 3:2, rounded-[6px], overflow-hidden, no shadow) */}
          <div
            ref={sliderRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="group relative aspect-[3/2] w-full rounded-[6px] overflow-hidden bg-[#E5E5E3] select-none"
            role="region"
            aria-label="Showroom photo gallery"
          >
            {/* Photo Slides: Eager on first image, lazy on subsequent, object-fit: cover, 6px radius */}
            <div
              className="flex w-full h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {slides.map((slide, idx) => (
                <div key={slide.id || idx} className="w-full h-full shrink-0 relative">
                  <img
                    src={slide.image}
                    alt={slide.alt || 'WrapStore showroom'}
                    width={slide.width || 1800}
                    height={slide.height || 1200}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchpriority={idx === 0 ? 'high' : 'auto'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Slider arrows: plain white chevrons with no circle or background, 32px, desktop only, visible on hover and keyboard focus */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hidden md:flex items-center justify-center cursor-pointer p-0 bg-transparent border-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                >
                  <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hidden md:flex items-center justify-center cursor-pointer p-0 bg-transparent border-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                >
                  <ChevronRight className="w-8 h-8" strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>

          {/* Thin line indicators with no container */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-0.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex
                      ? 'w-6 bg-[#141414]'
                      : 'w-3 bg-[#D4D4D2] hover:bg-[#A3A3A0]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Mobile Facts Row */}
          <div className="flex sm:hidden items-center justify-between text-[11px] text-[#6B6B6B] pt-3 mt-3 border-t border-[#E5E5E3] select-none">
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#141414] hover:underline"
            >
              {store.addressShort}
            </a>
            <span className="w-px h-3 bg-[#E5E5E3]" aria-hidden="true" />
            <span>Secure payment</span>
            <span className="w-px h-3 bg-[#E5E5E3]" aria-hidden="true" />
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#141414] hover:underline"
              >
                WhatsApp
              </a>
            ) : (
              <span>Support</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroFirstScreen;
