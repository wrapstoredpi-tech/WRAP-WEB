import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ImageGallery({ images = [], product, className = '' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const rawImages = images && images.length > 0 ? images : [product.image_url];
  const imageList = rawImages
    .map((img) => (typeof img === 'object' && img !== null ? img.url : img))
    .filter(Boolean);
  const currentImage = imageList[selectedIndex] || imageList[0] || product.image_url;

  const handleSelect = (index) => {
    if (index === selectedIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setSelectedIndex(index);
      setIsFading(false);
    }, 150);
  };

  const handleNext = () => {
    const nextIndex = (selectedIndex + 1) % imageList.length;
    handleSelect(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (selectedIndex - 1 + imageList.length) % imageList.length;
    handleSelect(prevIndex);
  };

  const isOutOfStock = product.current_stock === 0;
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
          ) : product.is_primary ? (
            <Badge variant="new" size="md">
              Featured Edition
            </Badge>
          ) : null}
        </div>

        {/* Navigation Arrows for multi-image galleries (desktop hover) */}
        {imageList.length > 1 && (
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

        {/* Pagination Dots Indicator on Mobile */}
        {imageList.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 sm:hidden">
            {imageList.map((_, idx) => (
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

      {/* Thumbnails Strip */}
      {imageList.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
          {imageList.map((img, idx) => {
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
