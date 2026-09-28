import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=75';

/**
 * ImageGallery
 *
 * Props:
 *   images   — string[]  — already-resolved public URLs from normaliseProduct().images
 *              (may be empty if the product truly has no images in the DB)
 *   product  — normalised product object (used for name, badges, hasRealImages)
 *   className — string
 *
 * Behaviour:
 *  - If images is non-empty, shows all of them in order (main + thumbnails).
 *  - If images is empty (product.hasRealImages === false), shows the placeholder
 *    in the main view without thumbnails — clearly indicating no product photo yet.
 */
export function ImageGallery({ images = [], product, className = '' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Resolve the list of displayable URLs
  // images[] already contains public_url strings from normaliseProduct.
  // Fall back to placeholder ONLY when there are truly no images.
  const imageList = images.length > 0 ? images : [];
  const hasRealImages = imageList.length > 0;
  const displayImages = hasRealImages ? imageList : [PLACEHOLDER_IMG];

  const currentImage = displayImages[Math.min(selectedIndex, displayImages.length - 1)];

  const handleSelect = (index) => {
    if (index === selectedIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setSelectedIndex(index);
      setIsFading(false);
    }, 150);
  };

  const handleNext = () => {
    const nextIndex = (selectedIndex + 1) % displayImages.length;
    handleSelect(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (selectedIndex - 1 + displayImages.length) % displayImages.length;
    handleSelect(prevIndex);
  };

  // Use stock_status from products_with_availability view
  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || (product.available_stock ?? product.current_stock ?? 0) === 0;
  const hasDiscount = product.discount_percentage > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Frame (4:5 Aspect Ratio) */}
      <div className="relative aspect-[4/5] w-full bg-neutral-200/80 overflow-hidden shadow-subtle-card group">
        <img
          src={currentImage}
          alt={`${product.name} - View ${selectedIndex + 1}`}
          className={`
            w-full h-full object-cover object-center transition-opacity duration-200 ease-out
            ${isFading ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'}
            ${isOutOfStock ? 'grayscale-[35%] opacity-75' : ''}
          `}
        />

        {/* Placeholder notice */}
        {!hasRealImages && (
          <div className="absolute bottom-3 inset-x-3 flex justify-center">
            <span className="text-[10px] bg-neutral-900/60 text-white px-2 py-1 rounded-sm backdrop-blur-sm">
              No product photo yet
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {isOutOfStock ? (
            <Badge variant="outofstock" size="md">
              Out of Stock
            </Badge>
          ) : hasDiscount ? (
            <Badge variant="discount" size="md">
              Save {product.discount_percentage}%
            </Badge>
          ) : product.online_featured ? (
            <Badge variant="new" size="md">
              Featured Edition
            </Badge>
          ) : null}
        </div>

        {/* Navigation Arrows — only when multiple real images */}
        {hasRealImages && displayImages.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="p-2 bg-base-offwhite/90 text-neutral-900 shadow-md hover:bg-white transition-all pointer-events-auto"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="p-2 bg-base-offwhite/90 text-neutral-900 shadow-md hover:bg-white transition-all pointer-events-auto"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Pagination Dots on Mobile — only with multiple real images */}
        {hasRealImages && displayImages.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 sm:hidden">
            {displayImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selectedIndex === idx ? 'w-5 bg-accent' : 'w-1.5 bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails Strip — only when there are ≥2 real images */}
      {hasRealImages && displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
          {displayImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`
                  relative aspect-[4/5] bg-neutral-200 overflow-hidden transition-all duration-200
                  focus-visible:outline-accent
                  ${
                    isSelected
                      ? 'ring-2 ring-accent ring-offset-2 ring-offset-base-offwhite opacity-100'
                      : 'opacity-60 hover:opacity-100'
                  }
                `}
                aria-label={`Select image ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
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
