import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const FALLBACK_PLACEHOLDER = '/subcategories/iphone.jpg';

export function ImageGallery({ images = [], product, className = '' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef(null);

  const displayImages = images && images.length > 0 ? images : (product?.image_url ? [product.image_url] : [FALLBACK_PLACEHOLDER]);
  const currentImage = displayImages[Math.min(selectedIndex, displayImages.length - 1)];

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Image Frame (4:5 Aspect Ratio Locked, with zoom on hover) */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-[4/5] w-full bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] overflow-hidden group select-none cursor-crosshair"
      >
        <img
          src={currentImage}
          alt={`${product?.name || 'Product'} image ${selectedIndex + 1}`}
          loading="eager"
          className={`w-full h-full object-cover transition-transform duration-150 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          style={
            isZoomed
              ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
              : undefined
          }
        />

        {/* Quiet Zoom Hint Icon */}
        <div className="absolute top-3 right-3 p-1.5 bg-white/80 rounded-[6px] text-[#6B6B6B] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
        </div>

        {/* Carousel Chevrons if multi-image */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-[#141414] rounded-[6px] flex items-center justify-center border border-[#E5E5E3] opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-[#141414] rounded-[6px] flex items-center justify-center border border-[#E5E5E3] opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {displayImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#141414]'
                    : 'border-[#E5E5E3] opacity-60 hover:opacity-100'
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
  );
}

export default ImageGallery;
