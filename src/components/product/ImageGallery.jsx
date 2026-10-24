import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';

const FALLBACK_PLACEHOLDER = '/subcategories/iphone.jpg';

export function ImageGallery({ images = [], product, className = '' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef(null);
  const thumbnailsContainerRef = useRef(null);
  const mobileScrollerRef = useRef(null);

  // Normalize images array
  const displayImages = React.useMemo(() => {
    if (images && images.length > 0) return images;
    if (product?.images && product.images.length > 0) return product.images;
    if (product?.image_url) return [product.image_url];
    return [FALLBACK_PLACEHOLDER];
  }, [images, product]);

  const currentImage = displayImages[Math.min(selectedIndex, displayImages.length - 1)] || FALLBACK_PLACEHOLDER;

  // Handle ESC key for fullscreen lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (isFullscreen) {
        if (e.key === 'ArrowRight') {
          setSelectedIndex((prev) => (prev + 1) % displayImages.length);
        } else if (e.key === 'ArrowLeft') {
          setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, displayImages.length]);

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    handleSelectImage((selectedIndex + 1) % displayImages.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    handleSelectImage((selectedIndex - 1 + displayImages.length) % displayImages.length);
  };

  const handleSelectImage = (idx) => {
    setSelectedIndex(idx);
    if (mobileScrollerRef.current && mobileScrollerRef.current.children[idx]) {
      mobileScrollerRef.current.children[idx].scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest',
      });
    }
  };

  const handleMobileScroll = (e) => {
    const el = e.currentTarget;
    if (el.clientWidth > 0) {
      const newIndex = Math.round(el.scrollLeft / el.clientWidth);
      if (newIndex >= 0 && newIndex < displayImages.length && newIndex !== selectedIndex) {
        setSelectedIndex(newIndex);
      }
    }
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailsContainerRef.current) {
      thumbnailsContainerRef.current.scrollBy({
        top: direction === 'down' ? 100 : -100,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* ───────────────────────────────────────────────────────────────────────
          MOBILE VIEW (< sm): Native Touch Swipeable Scroller + Horizontal Strip
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="block sm:hidden w-full space-y-2.5">
        {/* Swipeable Main Carousel Stage */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#EBEAE5] bg-[#F5F4F0] shadow-xs">
          <div
            ref={mobileScrollerRef}
            onScroll={handleMobileScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
          >
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                className="w-full shrink-0 snap-center aspect-[4/4.25] relative flex items-center justify-center select-none"
              >
                <img
                  src={img}
                  alt={`${product?.name || 'Product'} - image ${idx + 1}`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Floating Image Counter (e.g. 1 / 3) */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium pointer-events-none select-none">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/95 text-[#141414] shadow-md border border-[#E5E5E3] flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
            aria-label="View fullscreen image"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Horizontally Scrollable Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="flex overflow-x-auto gap-2 pt-1 pb-1 no-scrollbar">
            {displayImages.map((img, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  className={`relative w-14 h-16 rounded-xl overflow-hidden bg-[#F5F4F0] shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-[#141414] border-2 border-[#141414] shadow-xs opacity-100'
                      : 'border border-[#E5E5E3] opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          DESKTOP / TABLET VIEW (sm: and up): Vertical Thumbnails + Main Stage
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex flex-row gap-3 sm:gap-4 lg:gap-4.5 items-start">
        {/* Desktop Vertical Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="flex flex-col items-center shrink-0 w-16 sm:w-18 md:w-20">
            <div
              ref={thumbnailsContainerRef}
              className="flex flex-col gap-2 max-h-[460px] lg:max-h-[500px] overflow-y-auto no-scrollbar scroll-smooth py-1"
            >
              {displayImages.map((img, idx) => {
                const isSelected = selectedIndex === idx;
                const isVideo = idx === 4 && displayImages.length >= 5;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectImage(idx)}
                    className={`relative w-16 sm:w-18 md:w-20 aspect-[4/4.25] rounded-xl overflow-hidden bg-[#F5F4F0] transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'ring-2 ring-[#141414] border-2 border-[#141414] shadow-xs'
                        : 'border border-[#E5E5E3] hover:border-[#737373] opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`View product image ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${product?.name || 'Product'} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-white/90 text-[#141414] flex items-center justify-center shadow-xs">
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Down Hint Button if more than 4 thumbnails */}
            {displayImages.length > 4 && (
              <button
                type="button"
                onClick={() => scrollThumbnails('down')}
                className="mt-2 w-7 h-7 rounded-full bg-white border border-[#E5E5E3] hover:border-[#141414] flex items-center justify-center text-[#737373] hover:text-[#141414] transition-colors cursor-pointer"
                aria-label="Scroll thumbnails down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Primary Large Image Stage (Desktop) */}
        <div className="flex-1 w-full min-w-0 relative">
          <div
            ref={imageContainerRef}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-[4/4.25] w-full max-h-[calc(100vh-210px)] lg:max-h-[500px] xl:max-h-[540px] bg-[#F5F4F0] rounded-2xl sm:rounded-3xl border border-[#EBEAE5] overflow-hidden select-none cursor-crosshair group flex items-center justify-center shadow-xs"
          >
            <img
              src={currentImage}
              alt={product?.name || 'Product Image'}
              loading="eager"
              className={`w-full h-full object-cover transition-transform duration-200 will-change-transform ${
                isZoomed ? 'scale-135 sm:scale-150' : 'scale-100'
              }`}
              style={
                isZoomed
                  ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                  : undefined
              }
            />

            {/* Carousel Arrows on hover if multiple images */}
            {displayImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-[#141414] rounded-full flex items-center justify-center shadow-md border border-[#E5E5E3] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-[#141414] rounded-full flex items-center justify-center shadow-md border border-[#E5E5E3] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Circular Expand / Fullscreen Button (Matching Mockup bottom-right) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
              className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-[#141414] shadow-md border border-[#E5E5E3] flex items-center justify-center hover:scale-105 transition-all cursor-pointer z-10"
              aria-label="View fullscreen image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          FULLSCREEN LIGHTBOX MODAL (Both Desktop & Mobile)
          ─────────────────────────────────────────────────────────────────────── */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            aria-label="Close fullscreen view"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={product?.name || 'Product Fullscreen'}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {/* Navigation buttons */}
            {displayImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
