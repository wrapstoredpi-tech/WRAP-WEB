import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=75';

export function ImageGallery({ images = [], product, className = '' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

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
    }, 120);
  };

  const handleNext = () => {
    const nextIndex = (selectedIndex + 1) % displayImages.length;
    handleSelect(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (selectedIndex - 1 + displayImages.length) % displayImages.length;
    handleSelect(prevIndex);
  };

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK' || (product.available_stock ?? product.current_stock ?? 0) === 0;
  const hasDiscount = product.discount_percentage > 0;

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Main Image Frame (4:5 Aspect Ratio Locked) */}
      <div className="relative aspect-[4/5] w-full bg-[#F5F5F4] rounded-lg border border-[#E7E5E4] overflow-hidden group">
        <img
          src={currentImage}
          alt={`${product.name} view ${selectedIndex + 1}`}
          className={`
            w-full h-full object-cover object-center transition-opacity duration-150 ease-out
            ${isFading ? 'opacity-40' : 'opacity-100'}
            ${isOutOfStock ? 'grayscale opacity-50' : ''}
          `}
        />

        {!hasRealImages && (
          <div className="absolute bottom-3 inset-x-3 flex justify-center">
            <span className="text-[11px] bg-[#141414]/70 text-white px-2.5 py-1 rounded-md">
              No photo available
            </span>
          </div>
        )}

        {/* Quiet Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isOutOfStock ? (
            <Badge variant="outofstock" size="sm">
              Sold out
            </Badge>
          ) : hasDiscount ? (
            <Badge variant="discount" size="sm">
              -{product.discount_percentage}%
            </Badge>
          ) : null}
        </div>

        {/* Navigation Arrows */}
        {hasRealImages && displayImages.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-9 h-9 rounded-md bg-white/90 text-[#141414] shadow-sm hover:bg-white flex items-center justify-center transition-colors pointer-events-auto"
              aria-label="Previous view"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-9 h-9 rounded-md bg-white/90 text-[#141414] shadow-sm hover:bg-white flex items-center justify-center transition-colors pointer-events-auto"
              aria-label="Next view"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      {hasRealImages && displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {displayImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`
                  relative aspect-[4/5] bg-[#F5F5F4] rounded-lg overflow-hidden border transition-colors
                  ${
                    isSelected
                      ? 'border-[#141414] shadow-sm'
                      : 'border-[#E7E5E4] opacity-60 hover:opacity-100'
                  }
                `}
                aria-label={`View image ${idx + 1}`}
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
