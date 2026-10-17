/**
 * src/lib/productRowAdapter.js
 * ────────────────────────────
 * Extensible row-building adapter for Featured and New Arrivals product rows.
 *
 * Current scope: reads from products_with_availability.
 * Designed to merge future sources (e.g., accessory variants, product combos)
 * without modifying UI components.
 *
 * Rules:
 *  - Only products where online_visible=true, is_active=true, approval_status!='REJECTED',
 *    and available_stock > 0 are eligible.
 *  - Never show out-of-stock products in these rows.
 *  - Featured order: online_featured=true first, then bestsellers (via RPC), then newest.
 *  - New arrivals order: newest by created_at, excluding anything in Featured.
 *  - Quiet "New" tag only when created within the last 14 days.
 *  - If a row would have fewer than 4 products, return [] to hide the row entirely.
 *  - Website NEVER queries invoices, invoice_items or payments directly.
 */

import { supabase, supabaseConfigured } from './supabase';

/**
 * Filter product for row eligibility (must be active, visible, approved, and in-stock).
 */
export function isEligibleInStock(p) {
  if (!p) return false;
  const isApproved = p.approval_status !== 'REJECTED';
  const isOnline = p.online_visible === true;
  const isActive = p.is_active === true;
  const stock = Number(p.available_stock ?? p.current_stock ?? 0);
  const isInStock = stock > 0 && p.stock_status !== 'OUT_OF_STOCK';

  return isApproved && isOnline && isActive && isInStock;
}

/**
 * Extensible combiner for multiple catalogue sources.
 * Future sources (accessory variants, combos) are passed here.
 */
export function combineCatalogueSources(...sources) {
  const seenIds = new Set();
  const combined = [];

  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const item of source) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        combined.push(item);
      }
    }
  }

  return combined;
}

/**
 * Safely fetch best-seller units from the get_bestsellers RPC.
 * Never queries invoice or order tables directly.
 * Returns a Map of productId (uuid) -> units (number).
 */
export async function fetchBestSellersMap(limit = 16) {
  if (!supabaseConfigured || !supabase) {
    return new Map();
  }

  try {
    const { data, error } = await supabase.rpc('get_bestsellers', { p_limit: limit });

    if (error) {
      // If RPC is not yet created in DB or returns error, log quietly and return empty map
      console.warn('[productRowAdapter] get_bestsellers RPC unavailable:', error.message);
      return new Map();
    }

    const map = new Map();
    if (Array.isArray(data)) {
      data.forEach((row) => {
        if (row && row.product_id) {
          map.set(row.product_id, Number(row.units || 0));
        }
      });
    }
    return map;
  } catch (err) {
    console.warn('[productRowAdapter] fetchBestSellersMap error:', err);
    return new Map();
  }
}

/**
 * Build Featured products row.
 * Ordering: online_featured=true first, then best sellers, then newest. Fill to limit.
 * Hides row entirely if fewer than minThreshold (default 4).
 *
 * @param {Array} sources - Array or array of arrays of products
 * @param {Map|Object} bestSellerMap - Map or Object of productId -> units
 * @param {number} limit - Maximum products to return (default 8)
 * @param {number} minThreshold - Minimum products required to show the row (default 4)
 * @returns {Array} Array of featured products, or [] if < minThreshold
 */
export function buildFeaturedRow(
  sources = [],
  bestSellerMap = new Map(),
  limit = 8,
  minThreshold = 4
) {
  const allProducts = Array.isArray(sources[0])
    ? combineCatalogueSources(...sources)
    : combineCatalogueSources(sources);

  // Filter to eligible in-stock products only
  const eligible = allProducts.filter(isEligibleInStock);

  const getBestsellerUnits = (id) => {
    if (bestSellerMap instanceof Map) {
      return bestSellerMap.get(id) || 0;
    }
    return bestSellerMap?.[id] || 0;
  };

  // Split into buckets
  const featuredBucket = [];
  const bestSellerBucket = [];
  const newestBucket = [];

  const addedIds = new Set();

  // 1. online_featured = true
  eligible
    .filter((p) => p.online_featured === true)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .forEach((p) => {
      featuredBucket.push(p);
      addedIds.add(p.id);
    });

  // 2. Best sellers (with units > 0) not yet added
  eligible
    .filter((p) => !addedIds.has(p.id) && getBestsellerUnits(p.id) > 0)
    .sort((a, b) => {
      const diff = getBestsellerUnits(b.id) - getBestsellerUnits(a.id);
      if (diff !== 0) return diff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })
    .forEach((p) => {
      bestSellerBucket.push(p);
      addedIds.add(p.id);
    });

  // 3. Newest products by created_at not yet added
  eligible
    .filter((p) => !addedIds.has(p.id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .forEach((p) => {
      newestBucket.push(p);
      addedIds.add(p.id);
    });

  const merged = [...featuredBucket, ...bestSellerBucket, ...newestBucket].slice(0, limit);

  // If fewer than minThreshold products, never show a sparse row
  if (merged.length < minThreshold) {
    return [];
  }

  return merged;
}

/**
 * Build New Arrivals products row.
 * Ordering: newest by created_at, excluding anything already shown in Featured.
 * Attaches isNew tag flag (only within last 14 days).
 * Hides row entirely if fewer than minThreshold (default 4).
 *
 * @param {Array} sources - Array or array of arrays of products
 * @param {Set|Array} excludedIds - Set or Array of product IDs to exclude (already in Featured)
 * @param {number} limit - Maximum products to return (default 8)
 * @param {number} minThreshold - Minimum products required to show the row (default 4)
 * @param {number} newTagDays - Days threshold for "New" badge (default 14)
 * @returns {Array} Array of new arrival products with isNewArrival property, or [] if < minThreshold
 */
export function buildNewArrivalsRow(
  sources = [],
  excludedIds = new Set(),
  limit = 8,
  minThreshold = 4,
  newTagDays = 14
) {
  const allProducts = Array.isArray(sources[0])
    ? combineCatalogueSources(...sources)
    : combineCatalogueSources(sources);

  const excludeSet = excludedIds instanceof Set ? excludedIds : new Set(excludedIds || []);
  const now = Date.now();
  const maxNewTagAgeMs = newTagDays * 24 * 60 * 60 * 1000;

  // Eligible, in-stock, and not in excludedIds
  const eligible = allProducts
    .filter((p) => isEligibleInStock(p) && !excludeSet.has(p.id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const list = eligible.slice(0, limit).map((p) => {
    const ageMs = p.created_at ? now - new Date(p.created_at).getTime() : Infinity;
    const isNew = ageMs >= 0 && ageMs <= maxNewTagAgeMs;
    return {
      ...p,
      isNewArrival: isNew,
    };
  });

  // Never show a sparse row
  if (list.length < minThreshold) {
    return [];
  }

  return list;
}
