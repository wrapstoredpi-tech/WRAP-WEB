import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Heart, Share2 } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

const FALLBACK_PLACEHOLDER = '/subcategories/iphone.jpg';

export function ImageGallery({ images = [], product, className = '', onShare }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const imageContainerRef = useRef(null);
  const mobileScrollerRef = useRef(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const isWishlisted = product?.id ? isFavorite(product.id) : false;

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
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
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

  const handleToggleHeart = (e) => {
    if (e) e.stopPropagation();
    if (product?.id) {
      toggleFavorite(product.id, { returnUrl: `/product/${product.id}` });
    }
  };

  const handleShareClick = (e) => {
    if (e) e.stopPropagation();
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: product?.name || 'WrapStore Case',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      
      {/* ───────────────────────────────────────────────────────────────────────
          MOBILE & TABLET VIEW (< lg): Full-width swipe gallery with line indicators and heart
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="block lg:hidden w-full space-y-3">
        <div className="relative w-full aspect-[4/5] rounded-none sm:rounded-[6px] overflow-hidden border-y sm:border border-[#E5E5E3] bg-[#F4F3F0]">
          <div
            ref={mobileScrollerRef}
            onScroll={handleMobileScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
          >
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                className="w-full h-full shrink-0 snap-center relative flex items-center justify-center select-none"
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

          {/* Heart icon on top-right of mobile gallery (Rule 19: white circle, #141414 icon, filled accent when saved) */}
          <button
            type="button"
            onClick={handleToggleHeart}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-10"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'text-[#B0521F] fill-[#B0521F]' : 'text-[#141414]'
              }`}
            />
          </button>
        </div>

        {/* Short Line Indicators below mobile gallery */}
        {displayImages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {displayImages.map((_, idx) => (
              <div
                key={idx}
                className={`h-[3px] rounded-full transition-all duration-200 ${
                  selectedIndex === idx ? 'w-6 bg-[#B0521F]' : 'w-2 bg-[#E5E5E3]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          DESKTOP VIEW (>= lg): Large #F4F3F0 image panel with plain chevrons,
          short line indicators below, and share and heart icons top-right; click to zoom
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-full">
        <div
          ref={imageContainerRef}
          onClick={() => setIsFullscreen(true)}
          onMouseMove={handleMouseMove}
          className="relative aspect-[4/5] w-full bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] overflow-hidden select-none cursor-zoom-in group flex items-center justify-center shadow-xs"
        >
          <img
            src={currentImage}
            alt={product?.name || 'Product Image'}
            loading="eager"
            className="w-full h-full object-cover transition-transform duration-200"
          />

          {/* Top-Right: Share & Heart Icons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={handleShareClick}
              className="w-10 h-10 rounded-[6px] bg-white/95 hover:bg-white text-[#141414] shadow-xs border border-[#E5E5E3] flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              aria-label="Share product"
            >
              <Share2 className="w-4 h-4 text-[#141414]" />
            </button>
            <button
              type="button"
              onClick={handleToggleHeart}
              className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isWishlisted ? 'text-[#B0521F] fill-[#B0521F]' : 'text-[#141414]'
                }`}
              />
            </button>
          </div>

          {/* Plain Chevrons Left and Right (visible on hover) */}
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-[#141414] rounded-[6px] flex items-center justify-center shadow-sm border border-[#E5E5E3] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-[#141414] rounded-[6px] flex items-center justify-center shadow-sm border border-[#E5E5E3] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Short Line Indicators below image panel */}
        {displayImages.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-3">
            {displayImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-[3px] rounded-full transition-all duration-200 cursor-pointer ${
                  selectedIndex === idx ? 'w-8 bg-[#B0521F]' : 'w-3 bg-[#E5E5E3] hover:bg-[#6B6B6B]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          FULLSCREEN LIGHTBOX MODAL
          ─────────────────────────────────────────────────────────────────────── */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-[6px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            aria-label="Close fullscreen view"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={product?.name || 'Product Fullscreen'}
              className="max-h-[85vh] max-w-full rounded-[6px] object-contain shadow-2xl"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[6px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[6px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-[13px] font-medium">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ImageGallery;
