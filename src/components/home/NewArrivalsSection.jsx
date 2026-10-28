import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { homeConfig } from '../../config/home';
import { FeaturedProductCard, FeaturedProductSkeleton } from './FeaturedProductsSection';
import { buildNewArrivalsRow } from '../../lib/productRowAdapter';
import { useCart } from '../../context/CartContext';

export function NewArrivalsSection({
  products = [],
  excludedProductIds = new Set(),
  isLoading: isCatalogLoading = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  const { cartItems, addItem } = useCart();
  const [addedIds, setAddedIds] = useState(new Set());
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('wrapstore_wishlist_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Sync addedIds with cartItems
  useEffect(() => {
    if (Array.isArray(cartItems)) {
      setAddedIds(new Set(cartItems.map((item) => item.productId).filter(Boolean)));
    }
  }, [cartItems]);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const handleAddToCart = (product) => {
    if (!product || product.is_out_of_stock) return;

    const success = addItem(product, 1, 'Universal');
    if (success) {
      setAddedIds((prev) => new Set(prev).add(product.id));
      showToast({
        title: 'Added to cart',
        desc: product.name,
        actionText: 'View Cart',
        actionHref: '/cart',
      });
    }
  };

  const handleToggleWishlist = (productId) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyWishlisted = next.has(productId);
      if (isCurrentlyWishlisted) {
        next.delete(productId);
        showToast({ title: 'Removed from favorites' });
      } else {
        next.add(productId);
        showToast({ title: 'Saved to favorites' });
      }

      try {
        localStorage.setItem('wrapstore_wishlist_ids', JSON.stringify(Array.from(next)));
      } catch {
        // LocalStorage fallback handled silently
      }

      return next;
    });
  };

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
  // - strictly limit to 4 products only
  // - excludes anything shown in Featured
  // - quiet New tag only within last 14 days
  // - hide row if fewer than 4 products
  const newArrivals = buildNewArrivalsRow(
    products,
    excludedProductIds,
    4,
    config.minProductsToShow || 4,
    config.newTagThresholdDays || 14
  );

  // Skeletons matching final Featured Product card size
  if (isCatalogLoading || (!isVisible && products.length === 0)) {
    return (
      <section ref={containerRef} className="space-y-5" aria-label="Loading new arrivals">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
          <div className="h-4 w-16 bg-[#E5E5E3] rounded-[4px] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <FeaturedProductSkeleton key={i} />
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
    <section ref={containerRef} className="space-y-5 select-none" aria-labelledby="new-arrivals-title">
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

      {/* Grid of exactly 4 cards styled like Featured Products */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
        {newArrivals.slice(0, 4).map((product) => (
          <FeaturedProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlistIds.has(product.id)}
            onToggleWishlist={handleToggleWishlist}
            isAdded={
              addedIds.has(product.id) ||
              (Array.isArray(cartItems) &&
                cartItems.some(
                  (item) => String(item.productId) === String(product.id)
                ))
            }
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* Accessible Floating Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[13px] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="font-medium text-white">{toastMessage.title}</p>
            {toastMessage.desc && (
              <p className="text-[12px] text-white/70 line-clamp-1">{toastMessage.desc}</p>
            )}
          </div>
          {toastMessage.actionHref && (
            <Link
              to={toastMessage.actionHref}
              className="ml-2 px-2.5 py-1 rounded bg-white text-[#141414] font-medium text-[12px] hover:bg-white/90 transition-colors shrink-0"
            >
              {toastMessage.actionText}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default NewArrivalsSection;
