import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { homeConfig } from '../../config/home';
import { useIntro } from '../../context/IntroContext';
import { useIntroReveal } from '../../hooks/useIntroReveal';
import { getHeroSlides } from '../../lib/heroSlides';

export function HeroFirstScreen() {
  const { isIntroDone } = useIntro();
  const heroRevealStyle = useIntroReveal(80);

  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Sync slides if updated via admin or custom/storage events
  useEffect(() => {
    const handleUpdate = (e) => {
      if (Array.isArray(e.detail)) {
        setSlides(e.detail);
        setActiveIndex(0);
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'wrapstore_hero_slides_v4') {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          if (Array.isArray(parsed)) {
            setSlides(parsed);
            setActiveIndex(0);
          }
        } catch {}
      }
    };
    window.addEventListener('wrapstore:hero_slides_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('wrapstore:hero_slides_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Video element refs
  const videoRefs = useRef({});

  // Clamp activeIndex safely
  const safeIndex = slides.length > 0 ? Math.min(activeIndex, slides.length - 1) : 0;

  // Play active video when slide changes
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const currentSlide = slides[safeIndex];
    if (currentSlide?.type === 'video' || currentSlide?.video) {
      const vid = videoRefs.current[safeIndex];
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {
          // Autoplay policy fallback: ensure muted
          vid.muted = true;
          vid.play().catch(() => {});
        });
      }
    }
  }, [safeIndex, slides]);

  // Autoplay timer: advances slides every 6 seconds unless paused
  useEffect(() => {
    if (!isIntroDone) return;
    if (paused || slides.length <= 1) return;

    const interval = homeConfig.heroSlider?.autoplayIntervalMs || 6000;
    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearTimeout(timer);
  }, [safeIndex, paused, slides.length, isIntroDone]);

  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    if (slides.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Touch swipe handling
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

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

  // If there are no slides configured, completely hide the hero section!
  if (!slides || slides.length === 0) {
    return null;
  }

  const currentSlide = slides[safeIndex] || slides[0] || {};

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <section
        aria-label="Hero Spotlight Banner"
        style={heroRevealStyle}
        className="w-full pt-2 sm:pt-3 select-none"
      >
        {/* ─────────────────────────────────────────────────────────────────
            Full-Width Hero Banner
            Matches design:
            - Full-width modern banner with rounded corners
            - Video / High-res media display
            - Centered pill badge: Tag (White Pill) + Subtitle/CTA
            - Bottom dots pagination
            - Sleek hover chevrons & optional sound toggle
            ───────────────────────────────────────────────────────────────── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="group relative w-full h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] xl:h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#141414] shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        >
          {/* Slides Track */}
          <div
            className="flex w-full h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {slides.map((slide, idx) => {
              const isVideo = slide.type === 'video' || Boolean(slide.video);
              return (
                <div key={slide.id || idx} className="w-full h-full shrink-0 relative bg-neutral-900">
                  {isVideo ? (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current[idx] = el;
                      }}
                      src={slide.video}
                      poster={slide.image}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={slide.image}
                      alt={slide.alt || slide.tag || 'Hero banner'}
                      width={slide.width || 1800}
                      height={slide.height || 1200}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchpriority={idx === 0 ? 'high' : 'auto'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Subtle vignette shadow on bottom and edges for badge readability */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              Center-Aligned Pill Badge (Rendered only if tag or tagSubtitle exists)
              ───────────────────────────────────────────────────────────────── */}
          {(currentSlide.tag || currentSlide.tagSubtitle) && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-11 lg:bottom-12 z-20 pointer-events-auto max-w-[90%]">
              <Link
                to={currentSlide.link || '/?category=Mobile%20Cases'}
                className="group/badge inline-flex flex-col items-center text-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                aria-label={`${currentSlide.tag || 'Hero slide'} - ${currentSlide.tagSubtitle || 'Explore'}`}
              >
                {/* Top White Pill */}
                {currentSlide.tag && (
                  <div className="bg-white text-[#141414] px-5 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.22)] flex items-center justify-center gap-2 whitespace-nowrap">
                    <span className="font-extrabold text-[17px] sm:text-[22px] lg:text-[25px] tracking-tight leading-none text-[#141414]">
                      {currentSlide.tag}
                    </span>
                  </div>
                )}

                {/* Subtitle / CTA Line */}
                {currentSlide.tagSubtitle && (
                  <div className="bg-white/95 group-hover/badge:bg-white backdrop-blur-md text-[#141414] px-4 sm:px-5 py-1 rounded-full text-[12px] sm:text-[14px] font-semibold tracking-normal transition-colors shadow-md flex items-center justify-center gap-1.5 mt-1 border border-black/5 whitespace-nowrap">
                    <span>{currentSlide.tagSubtitle}</span>
                    <span className="text-[12px] opacity-75 group-hover/badge:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                )}
              </Link>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              Pagination Dots: Centered bottom
              ───────────────────────────────────────────────────────────────── */}
          {slides.length > 1 && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-2.5 sm:bottom-3.5 z-20 flex items-center gap-2 bg-black/35 backdrop-blur-sm px-3 py-1.5 rounded-full"
              role="tablist"
              aria-label="Slide indicators"
            >
              {slides.map((_, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      isActive
                        ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                        : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              Navigation Chevrons (Previous / Next) on Desktop Hover
              ───────────────────────────────────────────────────────────────── */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer z-20 shadow-lg border border-white/10"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer z-20 shadow-lg border border-white/10"
              >
                <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              Optional Audio Toggle for Video Slides (Top Right)
              ───────────────────────────────────────────────────────────────── */}
          {(currentSlide.type === 'video' || currentSlide.video) && (
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer border border-white/15 shadow-md"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default HeroFirstScreen;
