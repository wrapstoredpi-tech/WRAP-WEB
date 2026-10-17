import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { homeConfig } from '../../config/home';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from '../ui/Skeleton';
import {
  buildFeaturedRow,
  fetchBestSellersMap,
} from '../../lib/productRowAdapter';

export function FeaturedSection({
  products = [],
  bestSellerMap: propBestSellerMap = null,
  isLoading: isCatalogLoading = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [internalBestSellerMap, setInternalBestSellerMap] = useState(new Map());
  const [isBestsellersLoaded, setIsBestsellersLoaded] = useState(false);
  const containerRef = useRef(null);

  const bestSellerMap = propBestSellerMap || internalBestSellerMap;

  const config = homeConfig.featured || {};

  // Lazy observation with IntersectionObserver so first screen stays fast
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

  // Fetch bestsellers map via secure RPC once section is near viewport
  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    async function loadBestsellers() {
      try {
        const map = await fetchBestSellersMap(16);
        if (isMounted) {
          setBestSellerMap(map);
          setIsBestsellersLoaded(true);
        }
      } catch {
        if (isMounted) {
          setIsBestsellersLoaded(true);
        }
      }
    }

    loadBestsellers();
    return () => {
      isMounted = false;
    };
  }, [isVisible]);

  // Build row using productRowAdapter:
  // - online_featured=true first, then bestsellers, then newest
  // - fill to 8
  // - hide row entirely if fewer than 4 products
  const featuredProducts = buildFeaturedRow(
    products,
    bestSellerMap,
    config.limit || 8,
    config.minProductsToShow || 4
  );

  // While catalog or initial intersection is resolving, render skeletons that match final card size
  if (isCatalogLoading || (!isVisible && products.length === 0)) {
    return (
      <section ref={containerRef} className="space-y-5" aria-label="Loading featured products">
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

  // Hide row entirely if it has fewer than 4 products
  if (featuredProducts.length < (config.minProductsToShow || 4)) {
    return <div ref={containerRef} className="hidden" />;
  }

  return (
    <section ref={containerRef} className="space-y-5" aria-labelledby="featured-products-title">
      {/* Heading & View All link */}
      <div className="flex items-center justify-between">
        <h2 id="featured-products-title" className="text-[24px] sm:text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          {config.heading || 'Featured products'}
        </h2>
        <Link
          to={config.viewAllLink || '/?category=Mobile%20Cases'}
          className="text-[14px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{config.viewAllText || 'View all'}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Grid of up to 8 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedSection;
