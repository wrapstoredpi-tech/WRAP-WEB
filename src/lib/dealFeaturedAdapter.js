/**
 * src/lib/dealFeaturedAdapter.js
 * ──────────────────────────────
 * Pure selection and data preparation logic for Deal of the Day and Featured spotlight sections.
 */

import { deal as dealConfig } from '../config/deal';
import { featured as featuredConfig } from '../config/featured';

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

/**
 * Calculate pricing and percent_off for a product.
 * Formula from specification:
 *   percent_off = round((mrp - selling_price) / mrp * 100) when mrp > selling_price,
 *   else discount_percentage
 */
export function getProductPricing(p) {
  const sellingPrice = Number(p.selling_price) || 0;
  const rawMrp = Number(p.mrp);
  let mrp = sellingPrice;
  let percentOff = 0;

  if (rawMrp > sellingPrice) {
    mrp = rawMrp;
    percentOff = Math.round(((mrp - sellingPrice) / mrp) * 100);
  } else if (p.discount_percentage && Number(p.discount_percentage) > 0) {
    percentOff = Math.round(Number(p.discount_percentage));
    mrp = Math.round(sellingPrice / (1 - percentOff / 100));
  }

  const savings = mrp > sellingPrice ? mrp - sellingPrice : 0;

  return {
    sellingPrice,
    mrp,
    percentOff,
    savings,
  };
}

/**
 * Checks visibility & stock rules:
 * - online_visible !== false
 * - is_active !== false
 * - approval_status !== 'REJECTED'
 * - available_stock > 0
 */
export function isBaseEligible(p) {
  if (!p) return false;
  const isOnlineVisible = p.online_visible !== false;
  const isActive = p.is_active !== false;
  const notRejected = p.approval_status !== 'REJECTED';
  const availableStock = Number(p.available_stock ?? p.current_stock ?? 0);
  return isOnlineVisible && isActive && notRejected && availableStock > 0;
}

/**
 * Select the Deal of the Day product:
 * - products_with_availability where online_visible, is_active, approval_status != 'REJECTED',
 *   available_stock > 0 and percent_off >= 5
 * - Use config.deal.productId when set and eligible
 * - Otherwise sort by id, index = IST day number % count
 * - If nothing is eligible, return null (section hides)
 */
export function selectDealOfTheDay(products) {
  if (!products || products.length === 0) return null;

  const eligible = [];
  for (const p of products) {
    if (!isBaseEligible(p)) continue;
    const pricing = getProductPricing(p);
    if (pricing.percentOff >= 5) {
      eligible.push({ product: p, ...pricing });
    }
  }

  if (eligible.length === 0) {
    return null;
  }

  // 1. Config pinned deal
  if (dealConfig?.productId) {
    const pinned = eligible.find((item) => item.product.id === dealConfig.productId);
    if (pinned) return pinned;
  }

  // 2. Deterministic daily rotation by IST day number
  eligible.sort((a, b) => String(a.product.id).localeCompare(String(b.product.id)));
  const dayIndex = getDayNumberIST() % eligible.length;
  return eligible[dayIndex];
}

/**
 * Select the Featured Spotlight product:
 * - Base visibility and stock rules
 * - Exclude product used in Deal section
 * - Choose config.featured.productId when set and eligible
 * - Else most recently updated product with online_featured = true
 * - Else top get_bestsellers result
 * - Else newest in-stock product
 * - If nothing eligible, return null (section hides)
 */
export function selectFeaturedProduct(products, dealProductId = null, bestSellerMap = new Map()) {
  if (!products || products.length === 0) return null;

  // Filter out non-eligible and deal product
  const eligible = products.filter((p) => {
    if (dealProductId && p.id === dealProductId) return false;
    return isBaseEligible(p);
  });

  if (eligible.length === 0) {
    return null;
  }

  // 1. Config pinned featured product
  if (featuredConfig?.productId) {
    const pinned = eligible.find((p) => p.id === featuredConfig.productId);
    if (pinned) return pinned;
  }

  // 2. Most recently updated product with online_featured = true
  const featuredOnly = eligible.filter((p) => p.online_featured === true);
  if (featuredOnly.length > 0) {
    featuredOnly.sort((a, b) => {
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      return timeB - timeA;
    });
    return featuredOnly[0];
  }

  // 3. Top get_bestsellers result
  if (bestSellerMap && bestSellerMap.size > 0) {
    const bestSellers = eligible.filter((p) => bestSellerMap.has(p.id));
    if (bestSellers.length > 0) {
      bestSellers.sort((a, b) => {
        const itemA = bestSellerMap.get(a.id);
        const itemB = bestSellerMap.get(b.id);
        return (itemA?.rank ?? 999) - (itemB?.rank ?? 999);
      });
      return bestSellers[0];
    }
  }

  // 4. Newest in-stock product
  eligible.sort((a, b) => {
    const timeB = new Date(b.created_at || 0).getTime();
    const timeA = new Date(a.created_at || 0).getTime();
    return timeB - timeA;
  });

  return eligible[0] || null;
}
