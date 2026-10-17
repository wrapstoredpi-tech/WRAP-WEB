import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { homeConfig } from '../../config/home';
import { formatINR } from '../../lib/currency';

/**
 * Calculates current day number in Indian Standard Time (IST, UTC+5:30)
 * Deterministic across any client timezone.
 */
export function getDayNumberIST() {
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = istFormatter.format(new Date()).split('-');
  const dateObj = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
  return Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24));
}

export function DealOfTheDayCard({ products = [], fallbackFeatured = [], isLoading = false, className = '' }) {
  const dealData = useMemo(() => {
    if (isLoading || !products || products.length === 0) return null;

    // Filter eligible products for Deal of the Day
    const eligible = products
      .map((p) => {
        const sellingPrice = Number(p.selling_price) || 0;
        const rawMrp = Number(p.mrp);
        let mrp = 0;
        let percentOff = 0;

        if (rawMrp > sellingPrice) {
          mrp = rawMrp;
          percentOff = Math.round(((mrp - sellingPrice) / mrp) * 100);
        } else if (p.discount_percentage && Number(p.discount_percentage) > 0) {
          percentOff = Math.round(Number(p.discount_percentage));
          mrp = Math.round(sellingPrice / (1 - percentOff / 100));
        } else {
          mrp = sellingPrice;
          percentOff = 0;
        }

        const availableStock = Number(p.available_stock ?? p.current_stock ?? 0);

        return {
          product: p,
          sellingPrice,
          mrp,
          percentOff,
          availableStock,
          saveAmount: mrp > sellingPrice ? mrp - sellingPrice : 0,
        };
      })
      .filter(({ product, percentOff, availableStock }) => {
        const isOnlineVisible = product.online_visible !== false;
        const isActive = product.is_active !== false;
        const notRejected = product.approval_status !== 'REJECTED';
        const inStock = availableStock > 0;
        const hasDiscount = percentOff >= (homeConfig.dealOfTheDay?.minPercentOff || 5);
        return isOnlineVisible && isActive && notRejected && inStock && hasDiscount;
      });

    // Check if config has pinned dealProductId
    const pinnedId = homeConfig.dealOfTheDay?.dealProductId;
    if (pinnedId) {
      const pinned = eligible.find((item) => String(item.product.id) === String(pinnedId));
      if (pinned) {
        return { item: pinned, isDeal: true };
      }
    }

    // Deterministic IST rotation if eligible products exist
    if (eligible.length > 0) {
      // Sort deterministically by id
      eligible.sort((a, b) => String(a.product.id).localeCompare(String(b.product.id)));
      const dayIndex = getDayNumberIST() % eligible.length;
      return { item: eligible[dayIndex], isDeal: true };
    }

    // Fallback: Show first featured product labelled "Featured" (never "deal")
    const fallbackProduct = fallbackFeatured[0] || products.find((p) => p.online_visible !== false && p.is_active !== false);
    if (fallbackProduct) {
      const sellingPrice = Number(fallbackProduct.selling_price) || 0;
      const rawMrp = Number(fallbackProduct.mrp);
      let mrp = sellingPrice;
      let percentOff = 0;
      if (rawMrp > sellingPrice) {
        mrp = rawMrp;
        percentOff = Math.round(((mrp - sellingPrice) / mrp) * 100);
      }
      return {
        item: {
          product: fallbackProduct,
          sellingPrice,
          mrp,
          percentOff,
          availableStock: Number(fallbackProduct.available_stock ?? fallbackProduct.current_stock ?? 0),
          saveAmount: mrp > sellingPrice ? mrp - sellingPrice : 0,
        },
        isDeal: false,
      };
    }

    return null;
  }, [products, fallbackFeatured, isLoading]);

  // Fixed size skeleton to prevent any layout shift while loading
  if (isLoading || !dealData) {
    return (
      <div
        className={`w-[300px] bg-white border border-[#E5E5E3] rounded-[6px] p-3 shadow-md ${className}`}
        aria-busy="true"
        aria-label="Loading deal of the day"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-3.5 w-24 bg-[#E5E5E3] rounded animate-pulse" />
          <div className="h-3 w-16 bg-[#E5E5E3] rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-[#E5E5E3] rounded-[4px] shrink-0 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-full bg-[#E5E5E3] rounded animate-pulse" />
            <div className="h-3.5 w-3/4 bg-[#E5E5E3] rounded animate-pulse" />
            <div className="h-4 w-20 bg-[#E5E5E3] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const { item, isDeal } = dealData;
  const { product, sellingPrice, mrp, percentOff, availableStock, saveAmount } = item;
  const imageSrc = product.primary_image || product.image_url || '/placeholder.png';

  return (
    <article
      className={`w-[300px] bg-white border border-[#E5E5E3] rounded-[6px] p-3 shadow-md text-[#141414] select-none ${className}`}
      aria-label={isDeal ? 'Deal of the day' : 'Featured product'}
    >
      {/* Top Header: Badge Label + Stock Warning */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold tracking-normal uppercase text-[#B0521F]">
          {isDeal ? (homeConfig.dealOfTheDay?.title || 'Deal of the day') : (homeConfig.dealOfTheDay?.featuredFallbackTitle || 'Featured')}
        </span>

        {/* Show Only N left ONLY when available_stock <= 5 */}
        {availableStock > 0 && availableStock <= 5 && (
          <span className="text-[11px] font-medium text-[#B0521F] bg-[#FAF0E6] px-1.5 py-0.5 rounded-[3px] tabular-nums">
            Only {availableStock} left
          </span>
        )}
      </div>

      {/* Main Content: Thumbnail + Details */}
      <div className="flex gap-3 items-center">
        {/* Thumbnail */}
        <Link
          to={`/product/${product.id}`}
          className="w-16 h-16 rounded-[4px] bg-[#F5F5F3] overflow-hidden shrink-0 border border-[#E5E5E3] block focus:outline-none focus:ring-1 focus:ring-[#141414]"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={imageSrc}
            alt={product.name}
            width={64}
            height={64}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Text & Price Info */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/product/${product.id}`}
            className="block text-[13px] font-semibold text-[#141414] hover:text-[#B0521F] line-clamp-2 leading-tight transition-colors"
          >
            {product.name}
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline gap-1.5 mt-1 font-sans">
            <span className="text-[14px] font-semibold text-[#141414] tabular-nums">
              {formatINR(sellingPrice)}
            </span>
            {mrp > sellingPrice && (
              <span className="text-[12px] text-[#8C8C8C] line-through tabular-nums">
                {formatINR(mrp)}
              </span>
            )}
          </div>

          {/* Real Savings */}
          {saveAmount > 0 && percentOff >= 5 && (
            <p className="text-[11px] text-[#2E7D32] font-medium tabular-nums leading-none mt-0.5">
              Save ₹{saveAmount.toLocaleString('en-IN')} ({percentOff}% off)
            </p>
          )}
        </div>

        {/* View Action Button */}
        <Link
          to={`/product/${product.id}`}
          className="shrink-0 px-2.5 py-1.5 bg-[#141414] hover:bg-[#383836] text-white text-[12px] font-semibold rounded-[4px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#141414]"
        >
          {homeConfig.dealOfTheDay?.viewButtonText || 'View'}
        </Link>
      </div>
    </article>
  );
}

export default DealOfTheDayCard;
