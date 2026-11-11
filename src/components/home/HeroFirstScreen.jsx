import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useIntro } from '../../context/IntroContext';
import { useIntroReveal } from '../../hooks/useIntroReveal';
import { getHeroSlides, fetchHeroSlides } from '../../lib/heroSlides';
import { modelToSlug } from '../../lib/models';

/**
 * Rewrites old query-string link URLs (?category=..., ?subcategory=...) to modern routes.
 */
export function rewriteHeroLinkUrl(rawUrl = '') {
  if (!rawUrl) return '/cases';
  try {
    const queryIdx = rawUrl.indexOf('?');
    if (queryIdx !== -1) {
      const queryPart = rawUrl.substring(queryIdx);
      const params = new URLSearchParams(queryPart);
      const cat = (params.get('category') || '').toLowerCase();
      const brand = (params.get('brand') || '').toLowerCase();
      const model = params.get('model');
      const series = params.get('series');

      if (cat.includes('case') || cat.includes('phone') || brand.includes('apple') || brand.includes('samsung')) {
        const targetBrand = brand.includes('samsung') ? 'samsung' : 'apple';
        if (model) {
          return `/cases/${targetBrand}/${modelToSlug(model)}`;
        }
        if (series) {
          return `/cases?brand=${targetBrand === 'apple' ? 'Apple' : 'Samsung'}&series=${encodeURIComponent(series)}`;
        }
        return `/cases?brand=${targetBrand === 'apple' ? 'Apple' : 'Samsung'}`;
      }

      if (cat.includes('accessor')) {
        const sub = params.get('subcategory');
        if (sub) return `/?category=Accessories&subcategory=${encodeURIComponent(sub)}`;
        return '/?category=Accessories';
      }

      if (cat.includes('combo')) {
        return '/combos';
      }
    }
  } catch (err) {
    console.warn('Error rewriting hero link:', err);
  }
  return rawUrl;
}

export function getHeroButtonText(linkUrl) {
  if (!linkUrl) return 'Shop now';
  const urlLower = String(linkUrl).toLowerCase();

  // 1. Case links: 'Shop cases'
  if (
    urlLower.includes('/cases') ||
    urlLower.includes('category=mobile%20cases') ||
    urlLower.includes('category=cases')
  ) {
    return 'Shop cases';
  }

  // 2. Accessory subcategory links: 'Shop <subcategory>'
  if (urlLower.includes('subcategory=')) {
    try {
      const parsed = new URL(linkUrl, 'https://wrapstore.in');
      const sub = parsed.searchParams.get('subcategory');
      if (sub) {
        return `Shop ${sub.toLowerCase()}`;
      }
    } catch {
      const match = linkUrl.match(/subcategory=([^&]+)/i);
      if (match) {
        return `Shop ${decodeURIComponent(match[1]).toLowerCase()}`;
      }
    }
  }

  if (urlLower.startsWith('/accessories/')) {
    const subSlug = linkUrl.split('/accessories/')[1]?.split('?')[0];
    if (subSlug) {
      const subName = decodeURIComponent(subSlug).replace(/-/g, ' ');
      return `Shop ${subName.toLowerCase()}`;
    }
  }

  // 3. Anything else: 'Shop now'
  return 'Shop now';
}

export function HeroFirstScreen() {
  const { isIntroDone } = useIntro();
  const heroRevealStyle = useIntroReveal(80);

  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Sync slides from DB on mount and listen to updates
  useEffect(() => {
    let isMounted = true;
    fetchHeroSlides().then((dbSlides) => {
      if (isMounted && Array.isArray(dbSlides) && dbSlides.length > 0) {
        setSlides(dbSlides);
      }
    });

    const handleUpdate = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setSlides(e.detail);
        setActiveIndex(0);
      }
    };
    window.addEventListener('wrapstore:hero_slides_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('wrapstore:hero_slides_updated', handleUpdate);
    };
  }, []);

  // Inspect and report any base64 image sizes
  useEffect(() => {
    if (Array.isArray(slides)) {
      slides.forEach((s, idx) => {
        if (s.image && typeof s.image === 'string' && s.image.startsWith('data:')) {
          const sizeKb = Math.round((s.image.length * 3) / 4 / 1024);
          console.info(`[Hero Slide ${idx + 1}] Base64 image payload size: ~${sizeKb} KB`);
        }
      });
    }
  }, [slides]);

  const navigate = useNavigate();
  const videoRefs = useRef({});

  // Clamp activeIndex safely
  const safeIndex = slides.length > 0 ? Math.min(activeIndex, slides.length - 1) : 0;

  // Autoplay timer: advances slides every 5000ms unless paused
  useEffect(() => {
    if (!isIntroDone) return;
    if (paused || slides.length <= 1) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

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
  const isSwipingRef = useRef(false);

  const handleTouchStart = (e) => {
    isSwipingRef.current = false;
    setPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
    if (Math.abs(touchStartXRef.current - touchEndXRef.current) > 10) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    setPaused(false);
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 150);
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[safeIndex] || slides[0] || {};
  const rewrittenLink = rewriteHeroLinkUrl(currentSlide.link_url || currentSlide.link || '/cases');

  return (
    <div className="w-full">
      <section
        aria-label="Hero Carousel"
        style={heroRevealStyle}
        className="w-full select-none"
      >
        {/* Keyframe style for the 5s filling progress bar */}
        <style>{`
          @keyframes fillProgressBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>

        {/* ─────────────────────────────────────────────────────────────────
            Full-Bleed Hero Banner (Desktop 21:8, Mobile 4:5, object-fit: cover)
            ───────────────────────────────────────────────────────────────── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="group relative w-full aspect-[4/5] md:aspect-[21/8] min-h-[380px] md:min-h-[440px] max-h-[640px] overflow-hidden bg-[#141414]"
        >
          {/* Slides Track */}
          <div
            className="flex w-full h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {slides.map((slide, idx) => {
              const isVideo = slide.type === 'video' || Boolean(slide.video);
              const destination = rewriteHeroLinkUrl(slide.link_url || slide.link || '/cases');

              return (
                <div
                  key={slide.id || idx}
                  className="w-full h-full shrink-0 relative bg-neutral-900 block"
                >
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
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : 'auto'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                    />
                  )}

                  {/* Dark gradient scrim on bottom for readability */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              Text Bottom-Left Aligned to Shared Container
              Headline (DM Serif Display), tag_subtitle as one line, one button
              ───────────────────────────────────────────────────────────────── */}
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end">
            <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-7 sm:pb-10 pointer-events-auto">
              <div className="max-w-xl text-left space-y-1.5 sm:space-y-2">
                {currentSlide.tag && (
                  <h1 className="text-white text-[28px] sm:text-[38px] lg:text-[44px] font-normal font-serif tracking-tight leading-[1.1] drop-shadow-md">
                    {currentSlide.tag}
                  </h1>
                )}
                {currentSlide.tagSubtitle && (
                  <p className="text-white/90 text-[13px] sm:text-[15px] font-normal truncate drop-shadow-sm max-w-lg">
                    {currentSlide.tagSubtitle}
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    to={rewrittenLink}
                    className="inline-flex items-center justify-center px-6 py-2.5 sm:py-3 bg-[#B0521F] hover:bg-[#964317] text-white text-[13px] sm:text-[14px] font-semibold rounded-[6px] transition-colors shadow-md cursor-pointer"
                  >
                    {getHeroButtonText(rewrittenLink)}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              Short Line Indicators Bottom-Right (Active line fills over 5s)
              ───────────────────────────────────────────────────────────────── */}
          {slides.length > 1 && (
            <div
              className="absolute right-4 sm:right-8 md:right-12 bottom-7 sm:bottom-10 z-20 flex items-center gap-2"
              role="tablist"
              aria-label="Slide progress indicators"
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
                    className="w-7 sm:w-10 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer transition-colors hover:bg-white/50 relative block p-0"
                  >
                    {isActive ? (
                      <span
                        key={safeIndex}
                        className="block h-full bg-white rounded-full"
                        style={{
                          animation: paused ? 'none' : 'fillProgressBar 5000ms linear forwards',
                          width: paused ? '100%' : undefined,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              Desktop Plain Chevrons at Left & Right Edges on Hover
              ───────────────────────────────────────────────────────────────── */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="hidden lg:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer z-20 shadow-md border border-white/10"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="hidden lg:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer z-20 shadow-md border border-white/10"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Optional Audio Toggle for Video Slides */}
          {(currentSlide.type === 'video' || currentSlide.video) && (
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-colors cursor-pointer border border-white/15 shadow-md"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white/90" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default HeroFirstScreen;
