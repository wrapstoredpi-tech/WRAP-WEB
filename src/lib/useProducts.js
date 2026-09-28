/**
 * src/lib/useProducts.js
 * ─────────────────────
 * Central data hook for WrapStore website.
 *
 * REAL SCHEMA (discovered 2026-09-28):
 * ─────────────────────────────────────
 *  View: products_with_availability
 *    id, product_id, name, product_type
 *    category_id, subcategory_id
 *    mobile_brand   — e.g. "Apple", "Samsung"
 *    mobile_model   — COMMA-SEPARATED STRING of compatible models
 *                     e.g. "iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15 Pro Max"
 *    color_variants — JSONB array | plain string | null
 *    selling_price, discount_percentage, gst_percentage
 *    available_stock — int (current_stock - reserved_stock)
 *    stock_status    — 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
 *    is_active, online_visible, online_featured
 *    created_at, updated_at
 *
 *  Table: product_images
 *    product_id, public_url, sort_order, is_primary, storage_path
 *    (NOT image_url or display_order)
 *
 *  Tables: categories, subcategories
 *    id, name, (subcategories also have category_id)
 *    Anon can read these tables — use them directly.
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
 * Parse color_variants — it may be a JSONB array, a comma-string, or null.
 * Always returns a plain JS string[].
 */
export function parseColors(colorVariants) {
  if (!colorVariants) return [];
  if (Array.isArray(colorVariants)) return colorVariants.map(String).filter(Boolean);
  if (typeof colorVariants === 'string') {
    try {
      const parsed = JSON.parse(colorVariants);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fall through to comma-split
    }
    return colorVariants.split(',').map((c) => c.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Normalise a raw products_with_availability row into the shape
 * the UI components expect.
 *
 * @param {object} raw      - raw DB row
 * @param {object} imagesMap - { [productId]: [{ public_url, sort_order, is_primary, storage_path }] }
 * @param {object} catMap    - { [categoryId]: { id, name } }
 * @param {object} subMap    - { [subcategoryId]: { id, name, category_id } }
 */
export function normaliseProduct(raw, imagesMap = {}, catMap = {}, subMap = {}) {
  const compatible_models = parseModels(raw.mobile_model);
  const color_variants = parseColors(raw.color_variants);

  // ── Images ──────────────────────────────────────────────────────────────────
  // DB columns: public_url, sort_order, is_primary (NOT image_url / display_order)
  const dbImages = imagesMap[raw.id] || [];
  // Sort by sort_order ascending (already ordered from query, but defensive)
  const sortedImages = [...dbImages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Primary image for card thumbnail: is_primary=true, else first, else placeholder
  const primaryImg =
    sortedImages.find((img) => img.is_primary)?.public_url ||
    sortedImages[0]?.public_url ||
    null; // null = truly no images

  // Full image URL array for gallery (only real images; placeholder added lazily in UI)
  const images = sortedImages.length > 0
    ? sortedImages.map((img) => img.public_url).filter(Boolean)
    : [];

  // image_url: for card thumbnail — only fall back to placeholder if truly no images
  const image_url = primaryImg || PLACEHOLDER_IMG;

  // ── Categories ──────────────────────────────────────────────────────────────
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
    // Identity
    id: raw.id,
    product_id: raw.product_id,
    // Display
    name: raw.name,
    description: raw.description || '',
    category,
    subcategory,
    category_id: raw.category_id,
    subcategory_id: raw.subcategory_id,
    product_type: raw.product_type,
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
    // Stock — use the view's precomputed fields
    available_stock: raw.available_stock,
    current_stock: raw.available_stock, // alias for legacy UI
    stock_status: raw.stock_status,     // 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
    // Images — public_url is the real column name
    image_url,                          // primary image URL (or placeholder)
    images,                             // array of real image URLs (empty if none)
    hasRealImages: images.length > 0,   // true only when DB has actual image rows
    images_with_meta: sortedImages,     // full image objects incl. sort_order, is_primary
    // Meta
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
 * Fetches all online-visible active products from products_with_availability,
 * enriches them with product_images (using real columns: public_url, sort_order,
 * is_primary, storage_path), reads real categories & subcategories tables,
 * and sets up Realtime subscriptions on products, product_images, categories
 * and subcategories so any POS change appears live without a manual refresh.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);     // [{ id, name }]
  const [subcategories, setSubcategories] = useState([]); // [{ id, name, category_id }]
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
      // 1. Fetch products (RLS: online_visible=true & is_active=true)
      const { data: rawProducts, error: prodErr } = await supabase
        .from('products_with_availability')
        .select('*')
        .eq('online_visible', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;

      // 2. Fetch active categories only (is_active column confirmed present)
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (catErr) {
        // Non-fatal: log and continue with empty categories
        console.warn('[useProducts] categories fetch error:', catErr.message);
      }

      // 3. Fetch active subcategories only (is_active column confirmed present)
      const { data: subData, error: subErr } = await supabase
        .from('subcategories')
        .select('id, name, category_id, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (subErr) {
        console.warn('[useProducts] subcategories fetch error:', subErr.message);
      }

      // Build lookup maps
      const catMap = {};
      (catData || []).forEach((c) => { catMap[c.id] = c; });

      const subMap = {};
      (subData || []).forEach((s) => { subMap[s.id] = s; });

      // 4. Fetch images for all products
      // REAL columns: public_url, sort_order, is_primary, storage_path
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

      // 5. Normalise
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
  // Listen to products, product_images, categories AND subcategories so any
  // POS change (new product, image upload, category rename) appears live.
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let channel = null;

    try {
      const channelTopic = `ws-wrapstore-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase.channel(channelTopic);

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('[Realtime] products change:', payload.eventType);
            fetchAll();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'product_images' },
          (payload) => {
            console.log('[Realtime] product_images change:', payload.eventType);
            fetchAll();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          (payload) => {
            console.log('[Realtime] categories change:', payload.eventType);
            fetchAll();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subcategories' },
          (payload) => {
            console.log('[Realtime] subcategories change:', payload.eventType);
            fetchAll();
          }
        )
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
          .single();

        if (err) throw err;

        // Fetch active categories & subcategories only
        const [catRes, subRes, imgRes] = await Promise.all([
          supabase.from('categories').select('id, name, sort_order').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }),
          supabase.from('subcategories').select('id, name, category_id, sort_order').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }),
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
 * Build filter options from live products AND real categories/subcategories.
 *
 * @param {object[]} products      - normalised products
 * @param {object[]} categories    - [{ id, name }]
 * @param {object[]} subcategories - [{ id, name, category_id }]
 */
export function deriveFilterOptions(products, categories = [], subcategories = []) {
  // Categories: use real categories table, but only include ones that have products.
  // Always add "All Categories" sentinel at front.
  const usedCategoryIds = new Set(products.map((p) => p.category_id).filter(Boolean));
  const liveCategories = categories.filter((c) => usedCategoryIds.has(c.id));

  // If we have real categories, use them; otherwise fall back to derived names.
  let categoryList;
  if (liveCategories.length > 0) {
    categoryList = ['All Categories', ...liveCategories.map((c) => c.name)];
    // Products with no category_id → "Other"
    const hasOther = products.some((p) => !p.category_id);
    if (hasOther && !categoryList.includes('Other')) {
      categoryList.push('Other');
    }
  } else {
    // Fallback: derive from normalised product.category field
    const catSet = new Set(products.map((p) => p.category).filter(Boolean));
    categoryList = ['All Categories', ...Array.from(catSet).sort()];
  }

  // Subcategories grouped under each category (for nested nav)
  const subcategoryMap = {}; // { [categoryId]: [{ id, name }] }
  subcategories.forEach((sub) => {
    if (!subcategoryMap[sub.category_id]) subcategoryMap[sub.category_id] = [];
    subcategoryMap[sub.category_id].push(sub);
  });

  // Unique colors
  const allColors = Array.from(
    new Set(products.flatMap((p) => p.color_variants || []))
  ).filter(Boolean);

  // Brand → models map
  const brandModelsMap = {};
  const brandSet = new Set(products.map((p) => p.mobile_brand).filter(Boolean));
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
    categories: categoryList,
    categoryObjects: liveCategories,           // [{ id, name }] for ID-based filtering
    subcategoryMap,                            // { [categoryId]: [{ id, name }] }
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
