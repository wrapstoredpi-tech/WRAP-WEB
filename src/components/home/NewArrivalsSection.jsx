import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { homeConfig } from '../../config/home';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from '../ui/Skeleton';
import { buildNewArrivalsRow } from '../../lib/productRowAdapter';

export function NewArrivalsSection({
  products = [],
  excludedProductIds = new Set(),
  isLoading: isCatalogLoading = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  const config = homeConfig.newArrivals || {};

  // Lazy observation with IntersectionObserver so initial screen stays fast
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Build row using productRowAdapter:
  // - newest by created_at
  // - excludes anything shown in Featured
  // - quiet New tag only within last 14 days
  // - hide row if fewer than 4 products
  const newArrivals = buildNewArrivalsRow(
    products,
    excludedProductIds,
    config.limit || 8,
    config.minProductsToShow || 4,
    config.newTagThresholdDays || 14
  );

  // Skeletons matching final card size
  if (isCatalogLoading || (!isVisible && products.length === 0)) {
    return (
      <section ref={containerRef} className="space-y-5" aria-label="Loading new arrivals">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
          <div className="h-4 w-16 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Hide row entirely if fewer than 4 products
  if (newArrivals.length < (config.minProductsToShow || 4)) {
    return <div ref={containerRef} className="hidden" />;
  }

  return (
    <section ref={containerRef} className="space-y-5" aria-labelledby="new-arrivals-title">
      {/* Heading & View All link */}
      <div className="flex items-center justify-between">
        <h2 id="new-arrivals-title" className="font-display font-normal text-[30px] sm:text-[40px] leading-[1.1] tracking-[-0.01em] text-[#141414]">
          {config.heading || 'New arrivals'}
        </h2>
        <Link
          to={config.viewAllLink || '/?view=all'}
          className="text-[14px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{config.viewAllText || 'View all'}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Grid of up to 8 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default NewArrivalsSection;
