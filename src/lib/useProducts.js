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
import { getValidColors, isRealColor } from './colors';

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
  const allCats = Array.isArray(product.categories)
    ? product.categories.map((c) => c.toLowerCase().trim())
    : [];
  const isCase =
    cat === 'mobile cases' ||
    cat === 'cases' ||
    allCats.includes('mobile cases') ||
    allCats.includes('cases');

  if (!isCase && cat && cat !== 'other') {
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
  const color_variants = getValidColors(raw.color_variants);

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
  const rawMrp =
    raw.mrp !== undefined && raw.mrp !== null && raw.mrp !== ''
      ? Number(raw.mrp)
      : null;
  const mrp =
    rawMrp && rawMrp > 0
      ? rawMrp
      : raw.discount_percentage > 0
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
    collection: raw.collection || null,
    magsafe: raw.magsafe || null,
    mah: raw.mah || null,
    strap_mm: raw.strap_mm || null,
    // Compatibility
    mobile_brand: raw.mobile_brand || 'Universal',
    mobile_model: compatible_models[0] || 'Universal',
    compatible_models,
    brand_compatibility: raw.mobile_brand ? [raw.mobile_brand] : [],
    color_variants,
    // Pricing
    selling_price: raw.selling_price,
    mrp,
    raw_mrp: rawMrp,
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

/**
 * Normalise a raw combo row from `combos` table into the unified product shape.
 *
 * Rules:
 *  - Resolves constituent items from rawCombo.items or comboItemsMap.
 *  - Resolves each item's category and subcategory from productsMap, catMap, subMap.
 *  - Exposes `categories` (array of all constituent item category names, e.g. ['Mobile Cases', 'Accessories']).
 *  - Exposes `category_ids` (array of all constituent item category UUIDs).
 *  - Exposes `subcategories` (array of all constituent item subcategory names, e.g. ['Iphone', 'Tempered Glass']).
 *  - Exposes `subcategory_ids` (array of all constituent item subcategory UUIDs).
 *  - Exposes `compatible_models` (all models uploaded for the combo items).
 *  - Sets is_combo = true and combo_items with full item details.
 */
export function normaliseCombo(
  rawCombo,
  productsMap = {},
  catMap = {},
  subMap = {},
  comboItemsMap = {}
) {
  const rawItems =
    Array.isArray(rawCombo.items) && rawCombo.items.length > 0
      ? rawCombo.items
      : comboItemsMap[rawCombo.id] || [];

  const items = rawItems.map((item) => {
    const prod = productsMap[item.product_id] || {};
    const catId = item.category_id || prod.category_id;
    const subId = item.subcategory_id || prod.subcategory_id;
    const catObj = catId ? catMap[catId] : null;
    const subObj = subId ? subMap[subId] : null;

    let brand = prod.mobile_brand || item.mobile_brand || '';
    if (!brand || brand === 'Universal') {
      const itemModels = (item.mobile_model || '').toLowerCase();
      if (itemModels.includes('iphone') || itemModels.includes('apple')) {
        brand = 'Apple';
      } else if (itemModels.includes('samsung') || itemModels.includes('galaxy')) {
        brand = 'Samsung';
      } else {
        brand = 'Universal';
      }
    }

    return {
      ...item,
      product_id: item.product_id || prod.id,
      product_name: item.product_name || prod.name,
      product_code: item.product_code || prod.product_id,
      category_id: catId || null,
      subcategory_id: subId || null,
      category: catObj?.name || prod.category || 'Accessories',
      subcategory: subObj?.name || prod.subcategory || 'Accessories',
      mobile_brand: brand,
      unit_price: item.unit_price ?? prod.selling_price ?? 0,
      image: item.image || prod.image_url || null,
    };
  });

  const categoryIdSet = new Set();
  const categoryNameSet = new Set();
  const subcategoryIdSet = new Set();
  const subcategoryNameSet = new Set();
  const brandSet = new Set();
  const modelSet = new Set();

  items.forEach((it) => {
    if (it.category_id) categoryIdSet.add(it.category_id);
    if (it.category && it.category !== 'Other') categoryNameSet.add(it.category);
    if (it.subcategory_id) subcategoryIdSet.add(it.subcategory_id);
    if (it.subcategory && it.subcategory !== 'Other') subcategoryNameSet.add(it.subcategory);
    if (it.mobile_brand && it.mobile_brand !== 'Universal') brandSet.add(it.mobile_brand);

    const models = parseModels(it.mobile_model);
    models.forEach((m) => {
      modelSet.add(m);
      if (m.toLowerCase().includes('iphone') || m.toLowerCase().includes('apple')) {
        brandSet.add('Apple');
      } else if (m.toLowerCase().includes('samsung') || m.toLowerCase().includes('galaxy')) {
        brandSet.add('Samsung');
      }
    });
  });

  const categories = Array.from(categoryNameSet);
  const category_ids = Array.from(categoryIdSet);
  const subcategories = Array.from(subcategoryNameSet);
  const subcategory_ids = Array.from(subcategoryIdSet);
  const compatible_models = Array.from(modelSet);
  const brands = Array.from(brandSet);

  const primaryBrand = brands.includes('Apple') ? 'Apple' : brands[0] || 'Universal';

  const primaryCategory =
    categories.find((c) => c.toLowerCase().includes('case')) ||
    categories[0] ||
    'Mobile Cases';
  const primaryCategoryId =
    category_ids.find((id) => catMap[id]?.name?.toLowerCase().includes('case')) ||
    category_ids[0] ||
    null;

  const primarySubcategory =
    subcategories.find((s) => s.toLowerCase().includes('iphone') || s.toLowerCase().includes('samsung')) ||
    subcategories[0] ||
    'Iphone';
  const primarySubcategoryId =
    subcategory_ids.find((id) => {
      const name = subMap[id]?.name?.toLowerCase() || '';
      return name.includes('iphone') || name.includes('samsung');
    }) ||
    subcategory_ids[0] ||
    null;

  const images = [];
  items.forEach((it) => {
    if (it.image && !images.includes(it.image)) images.push(it.image);
    if (Array.isArray(it.images)) {
      it.images.forEach((img) => {
        if (img && !images.includes(img)) images.push(img);
      });
    }
  });

  const primaryImg = images[0] || null;
  const image_url = primaryImg || PLACEHOLDER_IMG;
  const sortedImages = images.map((url, idx) => ({
    public_url: url,
    sort_order: idx,
    is_primary: idx === 0,
  }));

  const selling_price = Number(rawCombo.selling_price) || 0;
  const mrp = Number(rawCombo.original_value) || Math.round(selling_price * 1.2);
  const discount_percentage =
    mrp > selling_price ? Math.round(((mrp - selling_price) / mrp) * 100) : 0;

  const stockList = items.map((it) => Number(it.allotted_qty ?? 10));
  const available_stock = stockList.length > 0 ? Math.min(...stockList) : 10;

  return {
    id: rawCombo.id,
    product_id: rawCombo.combo_code || rawCombo.code || rawCombo.id,
    name: rawCombo.name,
    description: rawCombo.description || '',
    category: primaryCategory,
    categories,
    category_id: primaryCategoryId,
    category_ids,
    subcategory: primarySubcategory,
    subcategories,
    subcategory_id: primarySubcategoryId,
    subcategory_ids,
    product_type: 'combo',
    is_combo: true,
    combo_items: items,
    collection: 'Combo Offers',
    magsafe: false,
    mah: null,
    strap_mm: null,
    mobile_brand: primaryBrand,
    brands: brands.length > 0 ? brands : [primaryBrand],
    mobile_model: compatible_models[0] || 'Universal',
    compatible_models,
    brand_compatibility: brands.length > 0 ? brands : [primaryBrand],
    color_variants: [],
    selling_price,
    mrp,
    raw_mrp: rawCombo.original_value || null,
    discount_percentage,
    gst_percentage: 18,
    available_stock,
    current_stock: available_stock,
    stock_status: available_stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    image_url,
    images: images.length > 0 ? images : [image_url],
    hasRealImages: images.length > 0,
    images_with_meta: sortedImages,
    approval_status: 'APPROVED',
    is_active: rawCombo.is_active !== false,
    online_visible: true,
    online_featured: true,
    created_at: rawCombo.created_at,
    updated_at: rawCombo.updated_at,
    seo_slug: (rawCombo.name || 'combo').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
      // ── 1. Products & Combos ────────────────────────────────────────────────
      // Visibility: online_visible=true, is_active=true, approval_status != REJECTED
      // (PENDING + APPROVED both appear; do not add more conditions without instruction)
      const [
        { data: rawProducts, error: prodErr },
        { data: baseProducts, error: baseErr },
        { data: rawCombos, error: comboErr },
        { data: rawComboItems, error: comboItemsErr },
      ] = await Promise.all([
        supabase
          .from('products_with_availability')
          .select('*')
          .eq('online_visible', true)
          .eq('is_active', true)
          .neq('approval_status', 'REJECTED')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select(
            'id, name, product_id, category_id, subcategory_id, mobile_brand, mobile_model, mrp, collection, magsafe, mah, strap_mm, selling_price'
          ),
        supabase
          .from('combos')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('combo_items')
          .select('*'),
      ]);

      if (prodErr) throw prodErr;
      if (baseErr) {
        console.warn('[useProducts] products table fetch error:', baseErr.message);
      }
      if (comboErr) {
        console.warn('[useProducts] combos fetch error:', comboErr.message);
      }
      if (comboItemsErr) {
        console.warn('[useProducts] combo_items fetch error:', comboItemsErr.message);
      }

      const metaMap = {};
      (baseProducts || []).forEach((bp) => {
        metaMap[bp.id] = bp;
      });

      // Map combo_items by combo_id
      const comboItemsMap = {};
      (rawComboItems || []).forEach((ci) => {
        if (!comboItemsMap[ci.combo_id]) comboItemsMap[ci.combo_id] = [];
        comboItemsMap[ci.combo_id].push(ci);
      });

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

      // ── 5. Normalise products — one call per DB row, no merging ─────────────────
      const normalised = (rawProducts || []).map((p) => {
        const meta = metaMap[p.id] || {};
        return normaliseProduct(
          {
            ...p,
            mrp: meta.mrp !== undefined && meta.mrp !== null ? meta.mrp : p.mrp,
            collection: meta.collection || p.collection || null,
            magsafe: meta.magsafe !== undefined ? meta.magsafe : p.magsafe,
            mah: meta.mah !== undefined ? meta.mah : p.mah,
            strap_mm: meta.strap_mm !== undefined ? meta.strap_mm : p.strap_mm,
          },
          imagesMap,
          catMap,
          subMap
        );
      });

      // Map base products and normalised products for combo constituent item resolution
      const allProductsMap = {};
      (baseProducts || []).forEach((bp) => {
        allProductsMap[bp.id] = bp;
      });
      normalised.forEach((np) => {
        allProductsMap[np.id] = np;
        if (np.product_id) allProductsMap[np.product_id] = np;
      });

      // ── 6. Normalise combos ──────────────────────────────────────────────────
      const normalisedCombos = (rawCombos || []).map((c) =>
        normaliseCombo(c, allProductsMap, catMap, subMap, comboItemsMap)
      );

      setProducts([...normalised, ...normalisedCombos]);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'combos' },
          (payload) => {
            console.log('[Realtime] combos change:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'combo_items' },
          (payload) => {
            console.log('[Realtime] combo_items change:', payload.eventType);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' },
          (payload) => {
            console.log('[Realtime] POS invoice recorded / product sold:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' },
          (payload) => {
            console.log('[Realtime] POS invoice item updated:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_orders' },
          (payload) => {
            console.log('[Realtime] online order change:', payload.eventType);
            fetchAll();
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_order_items' },
          (payload) => {
            console.log('[Realtime] online order item change:', payload.eventType);
            fetchAll();
          })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] active sync for products, stock, POS invoices, and orders');
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
        const [
          { data, error: err },
          { data: baseData, error: baseErr },
        ] = await Promise.all([
          supabase
            .from('products_with_availability')
            .select('*')
            .eq(isUuid ? 'id' : 'product_id', id)
            .eq('online_visible', true)
            .eq('is_active', true)
            .neq('approval_status', 'REJECTED')
            .single(),
          supabase
            .from('products')
            .select('id, mrp, collection, magsafe, mah, strap_mm')
            .eq(isUuid ? 'id' : 'product_id', id)
            .maybeSingle(),
        ]);

        if (err && !data) {
          // Check combos table if not in products_with_availability
          const { data: comboData, error: comboErr } = await supabase
            .from('combos')
            .select('*')
            .or(`id.eq.${id},combo_code.eq.${id},code.eq.${id}`)
            .eq('is_active', true)
            .maybeSingle();

          if (comboErr || !comboData) throw err;

          const [catRes, subRes, cItemsRes, allProdsRes] = await Promise.all([
            supabase
              .from('categories')
              .select('id, name, sort_order')
              .eq('is_active', true)
              .order('sort_order', { ascending: true }),
            supabase
              .from('subcategories')
              .select('*')
              .eq('is_active', true)
              .order('sort_order', { ascending: true }),
            supabase.from('combo_items').select('*').eq('combo_id', comboData.id),
            supabase.from('products').select('*'),
          ]);

          const catMap = {};
          (catRes.data || []).forEach((c) => { catMap[c.id] = c; });
          const subMap = {};
          (subRes.data || []).forEach((s) => { subMap[s.id] = s; });
          const pMap = {};
          (allProdsRes.data || []).forEach((p) => { pMap[p.id] = p; });

          const normalisedCombo = normaliseCombo(
            comboData,
            pMap,
            catMap,
            subMap,
            { [comboData.id]: cItemsRes.data || [] }
          );
          setProduct(normalisedCombo);
          setError(null);
          return;
        }

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
        const mergedData = {
          ...data,
          mrp: baseData?.mrp !== undefined && baseData?.mrp !== null ? baseData.mrp : data.mrp,
          collection: baseData?.collection || data.collection || null,
          magsafe: baseData?.magsafe !== undefined ? baseData.magsafe : data.magsafe,
          mah: baseData?.mah !== undefined ? baseData.mah : data.mah,
          strap_mm: baseData?.strap_mm !== undefined ? baseData.strap_mm : data.strap_mm,
        };
        setProduct(normaliseProduct(mergedData, imagesMap, catMap, subMap));
        setError(null);
      } catch (err) {
        console.error('[useProduct] fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSingle();

    // ── Realtime listener for POS updates to this product ────────
    let channel = null;
    try {
      const channelTopic = `ws-prod-${id}-${Math.random().toString(36).substring(2, 8)}`;
      channel = supabase.channel(channelTopic);

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          if (!payload.new || payload.new.id === id || payload.new.product_id === id) {
            console.log('[Realtime:useProduct] product updated from POS:', payload.eventType);
            fetchSingle();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, (payload) => {
          if (!payload.new || payload.new.product_id === id) {
            console.log('[Realtime:useProduct] product image updated:', payload.eventType);
            fetchSingle();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('[Realtime:useProduct] subscription error:', err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
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
  const usedCategoryIds = new Set();
  products.forEach((p) => {
    if (p.category_id) usedCategoryIds.add(p.category_id);
    if (Array.isArray(p.category_ids)) {
      p.category_ids.forEach((id) => usedCategoryIds.add(id));
    }
  });

  // Keep only categories that have at least one product; preserve sort_order from DB
  const liveCategories = categories.filter((c) => usedCategoryIds.has(c.id));

  // Build the display list: 'All Categories' sentinel + active categories with products
  const categoryList = ['All Categories', ...liveCategories.map((c) => c.name)];

  // Append 'Other' if any product resolved to it (null category_id or inactive category)
  const hasOther = products.some(
    (p) => p.category === 'Other' || (Array.isArray(p.categories) && p.categories.includes('Other'))
  );
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
      if (!name || !isRealColor(name)) return;
      const lower = name.toLowerCase();
      if (!colorMap.has(lower)) {
        colorMap.set(lower, name);
      }
    });
  });
  const allColors = Array.from(colorMap.values()).sort((a, b) => a.localeCompare(b));

  // Brand → models map (for phone-model filter)
  const brandModelsMap = {};
  const brandSet = new Set();
  products.forEach((p) => {
    if (p.mobile_brand && p.mobile_brand !== 'Universal') brandSet.add(p.mobile_brand);
    if (Array.isArray(p.brands)) {
      p.brands.forEach((b) => {
        if (b && b !== 'Universal') brandSet.add(b);
      });
    }
  });

  for (const brand of brandSet) {
    brandModelsMap[brand] = Array.from(
      new Set(
        products
          .filter(
            (p) =>
              p.mobile_brand === brand ||
              (Array.isArray(p.brands) && p.brands.includes(brand))
          )
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
