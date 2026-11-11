import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { groupProductsByDesign } from '../../lib/models';
import { ProductCard } from './ProductCard';

export function ProductScrollRow({
  title,
  subtitle,
  viewAllLink,
  viewAllText = 'View all',
  products = [],
  isComboRow = false,
  outlinedButton = false,
  className = '',
}) {
  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Stock rule: If an item has zero stock across all models, do not show it.
  const eligibleProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = p.available_stock ?? p.current_stock ?? 0;
      const isOutOfStock = p.stock_status === 'OUT_OF_STOCK';
      return stock > 0 && !isOutOfStock;
    });
  }, [products]);

  // Data Rule 2: In grids and rows show ONE card per design with aggregated color dots
  const displayProducts = useMemo(() => {
    if (isComboRow) {
      return eligibleProducts;
    }
    return groupProductsByDesign(eligibleProducts);
  }, [eligibleProducts, isComboRow]);

  // Handle scroll progress
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
    } else {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    }
  }, []);

  const scrollByDirection = (dir) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.75 * (dir === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Combos rule: Hide entire section if combos count is 0
  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section aria-label={title} className={`w-full select-none group/scroll-row relative ${className}`}>
      {/* Header: Title Left + View All Link Right */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          {subtitle && (
            <p className="text-[13px] font-normal text-[#6B6B6B] mb-1">
              {subtitle}
            </p>
          )}
          <h2 className="text-[24px] sm:text-[30px] font-normal text-[#141414] font-serif tracking-tight">
            {title}
          </h2>
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-[13px] sm:text-[14px] font-medium text-[#6B6B6B] hover:text-[#B0521F] flex items-center gap-1 transition-colors pb-1.5 shrink-0"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Horizontal Scroll-Snap Container */}
      <div className="relative min-w-0 w-full">
        {/* Desktop Left Chevron Button */}
        <button
          type="button"
          onClick={() => scrollByDirection('left')}
          aria-label="Scroll left"
          className="hidden lg:flex absolute -left-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#141414] hover:text-[#B0521F] shadow-md border border-[#E5E5E3] items-center justify-center opacity-0 group-hover/scroll-row:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Desktop Right Chevron Button */}
        <button
          type="button"
          onClick={() => scrollByDirection('right')}
          aria-label="Scroll right"
          className="hidden lg:flex absolute -right-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#141414] hover:text-[#B0521F] shadow-md border border-[#E5E5E3] items-center justify-center opacity-0 group-hover/scroll-row:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') scrollByDirection('left');
            if (e.key === 'ArrowRight') scrollByDirection('right');
          }}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-1 focus:outline-none"
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="snap-start shrink-0 w-[72vw] sm:w-[45vw] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)]"
            >
              <ProductCard product={product} outlinedButton={outlinedButton} />
            </div>
          ))}
        </div>

        {/* Thin 2px scroll position progress bar */}
        {displayProducts.length > 1 && (
          <div className="w-24 sm:w-32 h-[2px] bg-[#E5E5E3] rounded-full mx-auto mt-6 overflow-hidden">
            <div
              className="h-full bg-[#141414] rounded-full transition-all duration-100"
              style={{
                width: `${Math.max(20, scrollProgress)}%`,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductScrollRow;

