/**
 * src/lib/useProducts.js
 * ─────────────────────
 * Central data hook for WrapStore website.
 *
 * REAL SCHEMA (confirmed 2026-09-28):
 * ─────────────────────────────────────
 *  View: products_with_availability
 *    id, product_id, name, product_type  ← never used for categories/labels/filtering
 *    category_id, subcategory_id         ← sole source for category grouping
 *    mobile_brand   — e.g. "Apple", "Samsung"
 *    mobile_model   — COMMA-SEPARATED STRING of compatible models
 *    color_variants — JSONB array | plain string | null
 *    selling_price, discount_percentage, gst_percentage
 *    available_stock — int (current_stock - reserved_stock)
 *    stock_status    — 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
 *    approval_status — 'APPROVED' | 'PENDING' | 'REJECTED'
 *    is_active, online_visible, online_featured
 *    created_at, updated_at
 *
 *  Table: product_images
 *    product_id, public_url, sort_order, is_primary, storage_path
 *
 *  Tables: categories, subcategories
 *    id, name, sort_order, is_active, (subcategories also have category_id)
 *
 * VISIBILITY RULES:
 *  - online_visible = true
 *  - is_active = true
 *  - approval_status != 'REJECTED'   (PENDING + APPROVED both show)
 *  Do NOT change this rule set without an explicit instruction.
 *
 * CATEGORY RULES:
 *  - Read categories + subcategories tables directly (never derive from product_type)
 *  - Filter both with is_active = true; order by sort_order ASC, then name ASC
 *  - A product whose category_id is null, or whose category is inactive
 *    (and therefore absent from catMap), is grouped under "Other" — never hidden
 *  - Same rule for subcategory_id / subcategoryObj
 *
 * PRODUCT IDENTITY:
 *  - Each DB row is one product on the site — no merging by name or product_type
 *  - "Flowers" and "Black Flowers" are separate products with their own price,
 *    stock and images
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseConfigured } from './supabase';

// ─── Fallback placeholder image ───────────────────────────────────────────────
const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=75';

/**
 * Parse the comma-separated mobile_model string into a proper array.
 * Returns [] if falsy.
 */
export function parseModels(modelStr) {
  if (!modelStr) return [];
  return modelStr
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

/**
 * Check if a product is compatible with a user's saved phone model.
 * 
 * Rules:
 * 1. If no phone model is saved, all products are compatible.
 * 2. Products in non-case categories (e.g. Accessories, Gadgets, Cables) are universal
 *    and must NEVER be hidden by a phone-model filter.
 * 3. Products with no mobile_model set, or marked "Universal", are universal.
 * 4. Only Mobile Cases (or products with specific compatible models defined)
 *    are narrowed by the phone model filter.
 */
export function isProductCompatibleWithPhone(product, savedPhone) {
  if (!savedPhone || !savedPhone.model) return true;
  if (!product) return true;

  // Non-case categories are universal accessories
  const cat = (product.category || '').toLowerCase().trim();
  if (cat && cat !== 'mobile cases' && cat !== 'cases') {
    return true;
  }

  // Universal products or products without specific models
  const models = product.compatible_models || [];
  if (
    models.length === 0 ||
    models.includes('Universal') ||
    product.mobile_brand === 'Universal' ||
    !product.mobile_model ||
    product.mobile_model === 'Universal'
  ) {
    return true;
  }

  // Model-specific check
  const target = savedPhone.model.toLowerCase().trim();
  return models.some((m) => m.toLowerCase().trim() === target);
}

/**
 * Parse color_variants — may be a JSONB array, a comma-string, or null.
 * Always returns a plain JS string[].
 */
export function parseColors(colorVariants) {
  if (!colorVariants) return [];

  const extractString = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      return (item.name || item.color || item.label || item.value || item.title || '').trim();
    }
    return String(item).trim();
  };

  let rawList = [];

  if (Array.isArray(colorVariants)) {
    rawList = colorVariants;
  } else if (typeof colorVariants === 'string') {
    const trimmed = colorVariants.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        rawList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rawList = trimmed.split(/[,;/|]+/).map((s) => s.trim());
      }
    } else {
      rawList = trimmed.split(/[,;/|]+/).map((s) => s.trim());
    }
  } else if (typeof colorVariants === 'object') {
    rawList = [colorVariants];
  }

  const seen = new Set();
  const result = [];

  rawList.forEach((item) => {
    const str = extractString(item);
    if (!str || str.toLowerCase() === '[object object]' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return;
    const lower = str.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(str);
    }
  });

  return result;
}

/**
 * Normalise a raw products_with_availability row into the shape the UI expects.
 *
 * Rules enforced here:
 *  - Category/subcategory resolved via catMap/subMap (keyed by UUID).
 *    If the id is absent from the map (null id OR inactive category filtered out),
 *    the product goes under "Other" — it is never hidden.
 *  - product_type is preserved in the returned object for debugging only;
 *    it must NEVER be used for display labels, category grouping, or filtering.
 *  - Each call to normaliseProduct corresponds to exactly one DB product.
 *    No deduplication or merging is performed.
 *
 * @param {object} raw       - raw DB row from products_with_availability
 * @param {object} imagesMap - { [productId]: [{ public_url, sort_order, is_primary }] }
 * @param {object} catMap    - { [categoryId]: { id, name, sort_order } }
 * @param {object} subMap    - { [subcategoryId]: { id, name, category_id, sort_order } }
 */
export function normaliseProduct(raw, imagesMap = {}, catMap = {}, subMap = {}) {
  const compatible_models = parseModels(raw.mobile_model);
  const color_variants = parseColors(raw.color_variants);

  // ── Images ──────────────────────────────────────────────────────────────────
  // Real DB columns: public_url, sort_order, is_primary (NOT image_url / display_order)
  const dbImages = imagesMap[raw.id] || [];
  // Defensive re-sort (query already ordered by sort_order ASC)
  const sortedImages = [...dbImages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Primary thumbnail: is_primary=true → first image → null (no images)
  const primaryImg =
    sortedImages.find((img) => img.is_primary)?.public_url ||
    sortedImages[0]?.public_url ||
    null;

  // Gallery array: real public_url strings only; empty when no rows in product_images
  const images = sortedImages.length > 0
    ? sortedImages.map((img) => img.public_url).filter(Boolean)
    : [];

  // image_url for card thumbnail; placeholder only when DB has no image rows at all
  const image_url = primaryImg || PLACEHOLDER_IMG;

  // ── Categories ──────────────────────────────────────────────────────────────
  // Resolve via UUID lookup. If category_id is null OR the category is inactive
  // (was filtered out of catMap), resolve to 'Other'. Never use product_type.
  const categoryObj = raw.category_id ? catMap[raw.category_id] : null;
  const subcategoryObj = raw.subcategory_id ? subMap[raw.subcategory_id] : null;

  const category = categoryObj?.name || 'Other';
  const subcategory = subcategoryObj?.name || 'Other';

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const mrp =
    raw.discount_percentage > 0
      ? Math.round(raw.selling_price / (1 - raw.discount_percentage / 100))
      : raw.selling_price;

  return {
    // Identity (one row = one product, never merged)
    id: raw.id,
    product_id: raw.product_id,
    // Display
    name: raw.name,
    description: raw.description || '',
    category,                            // from catMap, never from product_type
    subcategory,                         // from subMap, never from product_type
    category_id: raw.category_id,        // raw UUID for ID-based filtering
    subcategory_id: raw.subcategory_id,
    product_type: raw.product_type,      // preserved for debugging; do NOT use for display/filtering
    // Compatibility
    mobile_brand: raw.mobile_brand || 'Universal',
    mobile_model: compatible_models[0] || 'Universal',
    compatible_models,
    brand_compatibility: raw.mobile_brand ? [raw.mobile_brand] : [],
    color_variants,
    // Pricing
    selling_price: raw.selling_price,
    mrp,
    discount_percentage: raw.discount_percentage || 0,
    gst_percentage: raw.gst_percentage || 18,
    // Stock — view's precomputed fields
    available_stock: raw.available_stock,
    current_stock: raw.available_stock,  // alias for legacy UI reads
    stock_status: raw.stock_status,      // 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
    // Images (real public_url values)
    image_url,                           // primary or placeholder
    images,                              // real URLs, empty array if no DB rows
    hasRealImages: images.length > 0,
    images_with_meta: sortedImages,      // full objects with sort_order, is_primary
    // Visibility / approval
    approval_status: raw.approval_status,
    is_active: raw.is_active,
    online_visible: raw.online_visible,
    online_featured: raw.online_featured,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    seo_slug: raw.seo_slug,
  };
}

// ─── Primary hook ─────────────────────────────────────────────────────────────

/**
 * useProducts()
 *
 * Visibility filter (do not change without explicit instruction):
 *   online_visible = true  AND  is_active = true  AND  approval_status != 'REJECTED'
 *   → PENDING products show; APPROVED products show; REJECTED products never show.
 *
 * Categories / subcategories:
 *   Fetched from their own tables with is_active = true, ordered by sort_order ASC.
 *   Never derived from product_type.
 *
 * Realtime: subscribed to products, product_images, categories, subcategories.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);      // [{ id, name, sort_order }]
  const [subcategories, setSubcategories] = useState([]); // [{ id, name, category_id, sort_order }]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      setError('Supabase not configured');
      return;
    }

    try {
      // ── 1. Products ──────────────────────────────────────────────────────────
      // Visibility: online_visible=true, is_active=true, approval_status != REJECTED
      // (PENDING + APPROVED both appear; do not add more conditions without instruction)
      const { data: rawProducts, error: prodErr } = await supabase
        .from('products_with_availability')
        .select('*')
        .eq('online_visible', true)
        .eq('is_active', true)
        .neq('approval_status', 'REJECTED')
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;

      // ── 2. Active categories — ordered by sort_order (then name as tiebreaker) ──
      // is_active confirmed present on 2026-09-28; never use product_type as fallback
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (catErr) {
        console.warn('[useProducts] categories fetch error:', catErr.message);
      }

      // ── 3. Active subcategories — same ordering rules ────────────────────────
      const { data: subData, error: subErr } = await supabase
        .from('subcategories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (subErr) {
        console.warn('[useProducts] subcategories fetch error:', subErr.message);
      }

      // Build O(1) lookup maps from UUID → object
      const catMap = {};
      (catData || []).forEach((c) => { catMap[c.id] = c; });

      const subMap = {};
      (subData || []).forEach((s) => { subMap[s.id] = s; });

      // ── 4. Images (real columns: public_url, sort_order, is_primary) ─────────
      let imagesMap = {};
      if (rawProducts && rawProducts.length > 0) {
        const productIds = rawProducts.map((p) => p.id);
        const { data: imgData, error: imgErr } = await supabase
          .from('product_images')
          .select('product_id, public_url, sort_order, is_primary, storage_path')
          .in('product_id', productIds)
          .order('sort_order', { ascending: true });

        if (imgErr) {
          console.warn('[useProducts] product_images fetch error:', imgErr.message);
        }

        if (imgData) {
          imagesMap = imgData.reduce((acc, img) => {
            if (!acc[img.product_id]) acc[img.product_id] = [];
            acc[img.product_id].push(img);
            return acc;
          }, {});
        }
      }

      // ── 5. Normalise — one call per DB row, no merging ───────────────────────
      const normalised = (rawProducts || []).map((p) =>
        normaliseProduct(p, imagesMap, catMap, subMap)
      );

      setProducts(normalised);
      setCategories(catData || []);
      setSubcategories(subData || []);
      setError(null);
    } catch (err) {
      console.error('[useProducts] fetch error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let channel = null;

    try {
      const channelTopic = `ws-wrapstore-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase.channel(channelTopic);

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('[Realtime] products change:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' },
          (payload) => {
            console.log('[Realtime] product_images change:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' },
          (payload) => {
            console.log('[Realtime] categories change:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' },
          (payload) => {
            console.log('[Realtime] subcategories change:', payload.eventType);
            fetchAll();
          })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] subscribed to products, product_images, categories, subcategories');
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.warn('[Realtime] subscription error:', err);
    }

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {
          // ignore cleanup errors
        }
        channelRef.current = null;
      }
    };
  }, [fetchAll]);

  return { products, categories, subcategories, isLoading, error, refetch: fetchAll };
}

// ─── Single product hook ───────────────────────────────────────────────────────

/**
 * useProduct(id)
 * Same visibility rules as useProducts:
 *   online_visible=true, is_active=true, approval_status != REJECTED
 * Categories resolved from active-only catMap/subMap.
 */
export function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    async function fetchSingle() {
      setIsLoading(true);
      try {
        const isUuid = /^[0-9a-f-]{36}$/i.test(id);
        const { data, error: err } = await supabase
          .from('products_with_availability')
          .select('*')
          .eq(isUuid ? 'id' : 'product_id', id)
          .eq('online_visible', true)
          .eq('is_active', true)
          .neq('approval_status', 'REJECTED')
          .single();

        if (err) throw err;

        // Fetch active categories & subcategories (is_active=true, sort_order ordered)
        const [catRes, subRes, imgRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }),
          supabase
            .from('subcategories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }),
          supabase
            .from('product_images')
            .select('product_id, public_url, sort_order, is_primary, storage_path')
            .eq('product_id', data.id)
            .order('sort_order', { ascending: true }),
        ]);

        const catMap = {};
        (catRes.data || []).forEach((c) => { catMap[c.id] = c; });
        const subMap = {};
        (subRes.data || []).forEach((s) => { subMap[s.id] = s; });

        const imagesMap = { [data.id]: imgRes.data || [] };
        setProduct(normaliseProduct(data, imagesMap, catMap, subMap));
        setError(null);
      } catch (err) {
        console.error('[useProduct] fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSingle();
  }, [id]);

  return { product, isLoading, error };
}

// ─── Filter options derived from live data + real categories ──────────────────

/**
 * deriveFilterOptions()
 *
 * Builds filter UI options from normalised products + real category/subcategory rows.
 *
 * Category list rules:
 *  - Source: the real categories table (already filtered to is_active=true by useProducts)
 *  - Only include categories that have at least one visible product (usedCategoryIds)
 *  - Products with null category_id, OR whose category was inactive (resolved to 'Other'),
 *    get an "Other" entry appended to the list
 *  - Order preserved from sort_order (categories array already ordered by fetchAll)
 *  - NEVER derive category names from product_type
 *
 * @param {object[]} products      - normalised product array (one entry per DB row)
 * @param {object[]} categories    - active [{ id, name, sort_order }] from DB
 * @param {object[]} subcategories - active [{ id, name, category_id, sort_order }] from DB
 */
export function deriveFilterOptions(products, categories = [], subcategories = []) {
  // Build set of category IDs that actually appear in the visible product list
  const usedCategoryIds = new Set(products.map((p) => p.category_id).filter(Boolean));

  // Keep only categories that have at least one product; preserve sort_order from DB
  const liveCategories = categories.filter((c) => usedCategoryIds.has(c.id));

  // Build the display list: 'All Categories' sentinel + active categories with products
  const categoryList = ['All Categories', ...liveCategories.map((c) => c.name)];

  // Append 'Other' if any product resolved to it (null category_id or inactive category)
  const hasOther = products.some((p) => p.category === 'Other');
  if (hasOther && !categoryList.includes('Other')) {
    categoryList.push('Other');
  }

  // Subcategories grouped by category_id (already ordered by sort_order from DB)
  const subcategoryMap = {}; // { [categoryId]: [{ id, name, sort_order }] }
  subcategories.forEach((sub) => {
    if (!subcategoryMap[sub.category_id]) subcategoryMap[sub.category_id] = [];
    subcategoryMap[sub.category_id].push(sub);
  });

  // Unique color variants across all visible products, cleanly deduplicated case-insensitively
  const colorMap = new Map();
  products.forEach((p) => {
    (p.color_variants || []).forEach((c) => {
      const name = typeof c === 'string' ? c.trim() : (c?.name || c?.color || String(c)).trim();
      if (!name || name.toLowerCase() === '[object object]' || name.toLowerCase() === 'null') return;
      const lower = name.toLowerCase();
      if (!colorMap.has(lower)) {
        colorMap.set(lower, name);
      }
    });
  });
  const allColors = Array.from(colorMap.values()).sort((a, b) => a.localeCompare(b));

  // Brand → models map (for phone-model filter)
  const brandModelsMap = {};
  const brandSet = new Set(products.map((p) => p.mobile_brand).filter(
    (b) => b && b !== 'Universal'
  ));
  for (const brand of brandSet) {
    brandModelsMap[brand] = Array.from(
      new Set(
        products
          .filter((p) => p.mobile_brand === brand)
          .flatMap((p) => p.compatible_models || [])
      )
    ).filter(Boolean);
  }

  return {
    categories: categoryList,             // string[] for sidebar display
    categoryObjects: liveCategories,      // [{ id, name }] for UUID-based filtering
    subcategoryMap,                       // { [categoryId]: [{ id, name }] }
    brands: ['All Brands', ...Array.from(brandSet).sort()],
    allColors,
    brandModelsMap,
  };
}

// ─── Price range constants (static) ──────────────────────────────────────────
export const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
  { label: 'Over ₹2,000', min: 2000, max: Infinity },
];

export const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Discount: High to Low', value: 'discount' },
  { label: 'Stock: In Stock First', value: 'in_stock' },
];
