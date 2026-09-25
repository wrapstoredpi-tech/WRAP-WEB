/**
 * src/lib/useProducts.js
 * ─────────────────────
 * Central data hook for WrapStore website.
 *
 * REAL SCHEMA (discovered 2026-09-25):
 * ─────────────────────────────────────
 *  View: products_with_availability
 *    id, product_id, name, product_type
 *    category_id, subcategory_id
 *    mobile_brand   — e.g. "Apple", "Samsung"
 *    mobile_model   — COMMA-SEPARATED STRING of compatible models
 *                     e.g. "iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15 Pro Max"
 *    color_variants — JSONB array | null  (null for most current products)
 *    selling_price, discount_percentage, gst_percentage
 *    available_stock — int (current_stock - reserved_stock)
 *    stock_status    — 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
 *    is_active, online_visible, online_featured
 *    created_at, updated_at
 *
 *  Table: product_images
 *    product_id, image_url, display_order, is_primary
 *    (currently empty in DB — fallback to placeholder handled in normalise())
 *
 *  Tables: categories, subcategories
 *    RLS blocks anon reads of these tables in the current policy set.
 *    We derive category/subcategory labels from the product fields themselves
 *    (mobile_brand, product_type) until RLS is opened for anon.
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
 * the UI components expect (mirrors the old mock shape).
 */
export function normaliseProduct(raw, imagesMap = {}) {
  const compatible_models = parseModels(raw.mobile_model);
  const color_variants = parseColors(raw.color_variants);

  // Images from product_images table (keyed by product id)
  const dbImages = imagesMap[raw.id] || [];
  const primaryImg =
    dbImages.find((img) => img.is_primary)?.image_url ||
    dbImages[0]?.image_url ||
    PLACEHOLDER_IMG;

  const images = dbImages.length > 0
    ? dbImages.map((img) => img.image_url)
    : [PLACEHOLDER_IMG];

  // Derive category label from product_type / mobile_brand
  const category = deriveCategoryLabel(raw.product_type, raw.mobile_brand);
  const subcategory = raw.mobile_brand || 'Universal';

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
    // Stock — use the view's precomputed fields, NOT raw current_stock comparisons
    available_stock: raw.available_stock,
    current_stock: raw.available_stock, // alias for legacy UI that reads current_stock
    stock_status: raw.stock_status, // 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
    // Images
    image_url: primaryImg,
    images,
    images_with_meta: dbImages,
    // Meta
    is_active: raw.is_active,
    online_visible: raw.online_visible,
    online_featured: raw.online_featured,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    seo_slug: raw.seo_slug,
  };
}

/**
 * Derive a human-readable category name from product_type and mobile_brand.
 * This is used until categories table is accessible via anon RLS.
 */
function deriveCategoryLabel(productType, mobileBrand) {
  if (!productType) return 'Accessories';
  const t = productType.toLowerCase();
  if (t.includes('case') || t.includes('cover')) return 'Mobile Cases';
  if (t.includes('cable') || t.includes('charger') || t.includes('wireless')) return 'Gadgets';
  if (t.includes('sleeve') || t.includes('stand') || t.includes('desk') || t.includes('mat')) return 'Accessories';
  return 'Mobile Cases'; // default for wrapstore catalog
}

// ─── Primary hook ─────────────────────────────────────────────────────────────

/**
 * useProducts()
 * Fetches all online-visible products from products_with_availability,
 * enriches them with product_images, and sets up a Realtime subscription
 * so stock/visibility changes from the POS appear live.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      setError('Supabase not configured');
      return;
    }

    try {
      // 1. Fetch products from the view (RLS: online_visible=true & is_active=true enforced server-side)
      const { data: rawProducts, error: prodErr } = await supabase
        .from('products_with_availability')
        .select('*')
        .eq('online_visible', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;

      // 2. Fetch images for all returned products
      let imagesMap = {};
      if (rawProducts && rawProducts.length > 0) {
        const productIds = rawProducts.map((p) => p.id);
        const { data: imgData } = await supabase
          .from('product_images')
          .select('product_id, image_url, display_order, is_primary')
          .in('product_id', productIds)
          .order('display_order', { ascending: true });

        if (imgData) {
          imagesMap = imgData.reduce((acc, img) => {
            if (!acc[img.product_id]) acc[img.product_id] = [];
            acc[img.product_id].push(img);
            return acc;
          }, {});
        }
      }

      const normalised = (rawProducts || []).map((p) => normaliseProduct(p, imagesMap));
      setProducts(normalised);
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
    fetchProducts();
  }, [fetchProducts]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let channel = null;

    try {
      const channelTopic = `ws-products-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase.channel(channelTopic);

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('[Realtime] products change:', payload.eventType);
            fetchProducts();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'product_images' },
          () => {
            fetchProducts();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] subscribed to products & product_images');
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
  }, [fetchProducts]);



  return { products, isLoading, error, refetch: fetchProducts };
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

    async function fetch() {
      setIsLoading(true);
      try {
        // Try matching by UUID id first, then product_id string
        const isUuid = /^[0-9a-f-]{36}$/i.test(id);
        const { data, error: err } = await supabase
          .from('products_with_availability')
          .select('*')
          .eq(isUuid ? 'id' : 'product_id', id)
          .eq('online_visible', true)
          .eq('is_active', true)
          .single();

        if (err) throw err;

        // Fetch images
        const { data: imgData } = await supabase
          .from('product_images')
          .select('product_id, image_url, display_order, is_primary')
          .eq('product_id', data.id)
          .order('display_order', { ascending: true });

        const imagesMap = { [data.id]: imgData || [] };
        setProduct(normaliseProduct(data, imagesMap));
        setError(null);
      } catch (err) {
        console.error('[useProduct] fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [id]);

  return { product, isLoading, error };
}

// ─── Categories / models derived from live product data ───────────────────────

/**
 * Derive filter options from the live product list.
 * (categories & subcategories tables are not readable by anon in current RLS)
 */
export function deriveFilterOptions(products) {
  // Unique categories
  const categorySet = new Set(products.map((p) => p.category).filter(Boolean));
  const categories = ['All Categories', ...Array.from(categorySet).sort()];

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
    categories,
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
