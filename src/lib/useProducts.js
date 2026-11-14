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
import { fetchHeroSlides } from './heroSlides';

// ─── Public Realtime Tables (Isolated channels per table) ─────────────────────
const PUBLIC_REALTIME_TABLES = [
  'products',
  'product_images',
  'combos',
  'combo_items',
  'categories',
  'subcategories',
  'hero_slides',
];

const loggedChannelStatuses = new Set();

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

  // Combos: check intersected compatible_models
  if (product.is_combo || product.product_type === 'combo') {
    if (product.empty_intersection === true) return false;
    const models = product.compatible_models || [];
    if (models.length > 0) {
      const target = savedPhone.model.toLowerCase().trim();
      return models.some((m) => m.toLowerCase().trim() === target);
    }
    return !product.has_restricted_components;
  }

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
      const itemModels = (item.mobile_model || prod.mobile_model || '').toLowerCase();
      if (itemModels.includes('iphone') || itemModels.includes('apple')) {
        brand = 'Apple';
      } else if (itemModels.includes('samsung') || itemModels.includes('galaxy')) {
        brand = 'Samsung';
      } else {
        brand = 'Universal';
      }
    }

    // Extract item models cleanly
    let rawModels = [];
    if (Array.isArray(item.compatible_models) && item.compatible_models.length > 0) {
      rawModels = item.compatible_models;
    } else if (typeof item.mobile_model === 'string' && item.mobile_model.trim()) {
      rawModels = parseModels(item.mobile_model);
    } else if (Array.isArray(prod.compatible_models) && prod.compatible_models.length > 0) {
      rawModels = prod.compatible_models;
    } else if (typeof prod.mobile_model === 'string' && prod.mobile_model.trim()) {
      rawModels = parseModels(prod.mobile_model);
    }

    const itemCompatibleModels = rawModels
      .map((m) => (typeof m === 'string' ? m.trim() : ''))
      .filter((m) => m && m.toLowerCase() !== 'universal' && m.toLowerCase() !== 'all');

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
      mobile_model: item.mobile_model || prod.mobile_model || (itemCompatibleModels[0] || null),
      compatible_models: itemCompatibleModels,
      unit_price: item.unit_price ?? prod.selling_price ?? 0,
      image: item.image || prod.image_url || null,
      qty_per_combo: item.qty_per_combo ?? item.unit_quantity ?? item.quantity ?? 1,
    };
  });

  const categoryIdSet = new Set();
  const categoryNameSet = new Set();
  const subcategoryIdSet = new Set();
  const subcategoryNameSet = new Set();

  items.forEach((it) => {
    if (it.category_id) categoryIdSet.add(it.category_id);
    if (it.category && it.category !== 'Other') categoryNameSet.add(it.category);
    if (it.subcategory_id) subcategoryIdSet.add(it.subcategory_id);
    if (it.subcategory && it.subcategory !== 'Other') subcategoryNameSet.add(it.subcategory);
  });

  categoryNameSet.add('Combos');
  const categories = Array.from(categoryNameSet);
  const category_ids = Array.from(categoryIdSet);
  const subcategories = Array.from(subcategoryNameSet);
  const subcategory_ids = Array.from(subcategoryIdSet);

  // ── Compute compatible_models as the INTERSECTION of components' model lists ──
  // Rule: A component with no model list (i.e. universal) does not restrict the combo.
  const restrictedLists = [];

  items.forEach((it) => {
    if (Array.isArray(it.compatible_models) && it.compatible_models.length > 0) {
      restrictedLists.push(it.compatible_models);
    }
  });

  let compatible_models = [];
  let emptyIntersection = false;
  const hasRestrictedComponents = restrictedLists.length > 0;

  if (restrictedLists.length === 0) {
    // All components are universal
    compatible_models = [];
    emptyIntersection = false;
  } else if (restrictedLists.length === 1) {
    // Only one component has model restrictions; universal components do not restrict it
    compatible_models = [...restrictedLists[0]];
    emptyIntersection = false;
  } else {
    // Two or more components have model lists: compute intersection case-insensitively
    let current = [...restrictedLists[0]];
    for (let i = 1; i < restrictedLists.length; i++) {
      const nextSet = new Set(restrictedLists[i].map((m) => m.toLowerCase().trim()));
      current = current.filter((m) => nextSet.has(m.toLowerCase().trim()));
    }
    compatible_models = current;
    if (compatible_models.length === 0) {
      emptyIntersection = true;
    }
  }

  if (emptyIntersection) {
    console.warn(
      `[useProducts] Combo "${rawCombo.name}" (id: ${rawCombo.id}) has an empty model intersection across its components:`,
      restrictedLists
    );
  }

  const brandSet = new Set();
  compatible_models.forEach((m) => {
    const lower = m.toLowerCase();
    if (lower.includes('iphone') || lower.includes('apple')) {
      brandSet.add('Apple');
    } else if (lower.includes('samsung') || lower.includes('galaxy')) {
      brandSet.add('Samsung');
    }
  });

  if (brandSet.size === 0) {
    items.forEach((it) => {
      if (it.mobile_brand && it.mobile_brand !== 'Universal') {
        brandSet.add(it.mobile_brand);
      }
    });
  }

  const brands = Array.from(brandSet);
  const primaryBrand = brands.includes('Apple') ? 'Apple' : brands[0] || 'Universal';

  const primaryCategory = 'Combos';
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

  // ── Dedicated Combo Image Resolution ───────────────────────────────────────
  // Prioritise custom uploaded combo image(s) from admin over generic constituent item images
  const dedicatedComboImages = [];

  // 1. Check direct columns on rawCombo
  if (rawCombo.image_url) {
    dedicatedComboImages.push(rawCombo.image_url);
  }
  if (rawCombo.image && !dedicatedComboImages.includes(rawCombo.image)) {
    dedicatedComboImages.push(rawCombo.image);
  }

  // 2. Check direct images array on rawCombo
  if (Array.isArray(rawCombo.images)) {
    rawCombo.images.forEach((img) => {
      const url = typeof img === 'string' ? img : (img?.public_url || img?.url);
      if (url && !dedicatedComboImages.includes(url)) dedicatedComboImages.push(url);
    });
  }

  // 3. Check embedded combo_image / combo_images in items metadata
  const embeddedComboImg =
    rawCombo.combo_image ||
    rawItems.find((it) => it?.combo_image)?.combo_image ||
    (Array.isArray(rawCombo.items) && rawCombo.items[0]?.combo_image);
  if (embeddedComboImg && !dedicatedComboImages.includes(embeddedComboImg)) {
    dedicatedComboImages.push(embeddedComboImg);
  }

  const embeddedComboImgs =
    rawCombo.combo_images ||
    rawItems.find((it) => Array.isArray(it?.combo_images))?.combo_images ||
    (Array.isArray(rawCombo.items) && rawCombo.items[0]?.combo_images);
  if (Array.isArray(embeddedComboImgs)) {
    embeddedComboImgs.forEach((img) => {
      const url = typeof img === 'string' ? img : (img?.public_url || img?.url);
      if (url && !dedicatedComboImages.includes(url)) dedicatedComboImages.push(url);
    });
  }

  // 4. Collect constituent item images as gallery thumbnails
  const constituentImages = [];
  items.forEach((it) => {
    if (it.image && !constituentImages.includes(it.image) && !dedicatedComboImages.includes(it.image)) {
      constituentImages.push(it.image);
    }
    if (Array.isArray(it.images)) {
      it.images.forEach((img) => {
        if (img && !constituentImages.includes(img) && !dedicatedComboImages.includes(img)) {
          constituentImages.push(img);
        }
      });
    }
  });

  // Dedicated combo images always take top priority
  const images = [...dedicatedComboImages, ...constituentImages];
  const primaryImg = dedicatedComboImages[0] || constituentImages[0] || null;
  const image_url = primaryImg || PLACEHOLDER_IMG;
  const sortedImages = (images.length > 0 ? images : [image_url]).map((url, idx) => ({
    public_url: url,
    sort_order: idx,
    is_primary: idx === 0,
  }));

  const selling_price = Number(rawCombo.selling_price) || 0;
  const mrp = Number(rawCombo.original_value) || Math.round(selling_price * 1.2);
  const discount_percentage =
    mrp > selling_price ? Math.round(((mrp - selling_price) / mrp) * 100) : 0;

  const stockList = items.map((it) => {
    const prod = productsMap[it.product_id];
    if (prod && (prod.available_stock !== undefined || prod.current_stock !== undefined)) {
      return Math.max(0, Number(prod.available_stock ?? prod.current_stock ?? 0));
    }
    return Math.max(0, Number(it.allotted_qty ?? 0));
  });
  const available_stock = stockList.length > 0 ? Math.min(...stockList) : 0;

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
    empty_intersection: emptyIntersection,
    has_restricted_components: hasRestrictedComponents,
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
  const [products, setProducts] = useState(() => {
    if (import.meta.env.DEV) {
      try {
        const mockRaw =
          typeof window !== 'undefined' &&
          (window.__WRAPSTORE_MOCK_CATALOG__ || localStorage.getItem('wrapstore_mock_catalog'));
        if (mockRaw) {
          const parsed = typeof mockRaw === 'string' ? JSON.parse(mockRaw) : mockRaw;
          if (Array.isArray(parsed?.products)) return parsed.products;
        }
      } catch {}
    }
    return [];
  });
  const [categories, setCategories] = useState(() => {
    if (import.meta.env.DEV) {
      try {
        const mockRaw =
          typeof window !== 'undefined' &&
          (window.__WRAPSTORE_MOCK_CATALOG__ || localStorage.getItem('wrapstore_mock_catalog'));
        if (mockRaw) {
          const parsed = typeof mockRaw === 'string' ? JSON.parse(mockRaw) : mockRaw;
          if (Array.isArray(parsed?.categories)) return parsed.categories;
        }
      } catch {}
    }
    return [];
  });
  const [subcategories, setSubcategories] = useState(() => {
    if (import.meta.env.DEV) {
      try {
        const mockRaw =
          typeof window !== 'undefined' &&
          (window.__WRAPSTORE_MOCK_CATALOG__ || localStorage.getItem('wrapstore_mock_catalog'));
        if (mockRaw) {
          const parsed = typeof mockRaw === 'string' ? JSON.parse(mockRaw) : mockRaw;
          if (Array.isArray(parsed?.subcategories)) return parsed.subcategories;
        }
      } catch {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (import.meta.env.DEV) {
      try {
        const mockRaw =
          typeof window !== 'undefined' &&
          (window.__WRAPSTORE_MOCK_CATALOG__ || localStorage.getItem('wrapstore_mock_catalog'));
        if (mockRaw) return false;
      } catch {}
    }
    return true;
  });
  const [error, setError] = useState(null);

  const channelsRef = useRef({});
  const retryCountsRef = useRef({});
  const retryTimersRef = useRef({});
  const catalogDebounceRef = useRef(null);
  const heroDebounceRef = useRef(null);
  const autoRetryTimerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      setError("Couldn't load products, retrying");
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
      if (autoRetryTimerRef.current) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }
      setError(null);
    } catch (err) {
      console.error('[useProducts] fetch error:', err);
      if (import.meta.env.DEV) {
        try {
          const mockRaw =
            typeof window !== 'undefined' &&
            (window.__WRAPSTORE_MOCK_CATALOG__ || localStorage.getItem('wrapstore_mock_catalog'));
          if (mockRaw) {
            const parsed = typeof mockRaw === 'string' ? JSON.parse(mockRaw) : mockRaw;
            if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
              setProducts(parsed.products);
              setCategories(parsed.categories || []);
              setSubcategories(parsed.subcategories || []);
              setError(null);
              return;
            }
          }
        } catch (mockErr) {
          console.warn('Mock catalog fallback error:', mockErr);
        }
      }
      setError("Couldn't load products, retrying");
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = setTimeout(() => {
        fetchAll();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper to subscribe to a single table with isolated error handling & backoff
  const subscribeTable = useCallback((table) => {
    if (!supabaseConfigured || !supabase) return;

    // Clean up existing channel for this table if any
    if (channelsRef.current[table]) {
      try {
        supabase.removeChannel(channelsRef.current[table]);
      } catch {}
      delete channelsRef.current[table];
    }

    const channelTopic = `ws-rt-${table}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelTopic);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          console.log(`[Realtime] ${table} change:`, payload.eventType);
          if (table === 'hero_slides') {
            if (heroDebounceRef.current) clearTimeout(heroDebounceRef.current);
            heroDebounceRef.current = setTimeout(() => {
              fetchHeroSlides();
            }, 800);
          } else {
            if (catalogDebounceRef.current) clearTimeout(catalogDebounceRef.current);
            catalogDebounceRef.current = setTimeout(() => {
              fetchAll();
            }, 800);
          }
        }
      )
      .subscribe((status) => {
        // Log each channel's status (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT) once
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const key = `${table}:${status}`;
          if (!loggedChannelStatuses.has(key)) {
            loggedChannelStatuses.add(key);
            console.log(`[Realtime:${table}] ${status}`);
          }
        }

        if (status === 'SUBSCRIBED') {
          retryCountsRef.current[table] = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // If a channel errors, retry it with backoff (5s, 15s, 60s), without reloading the page
          const BACKOFF_DELAYS = [5000, 15000, 60000];
          const attempt = retryCountsRef.current[table] || 0;
          const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)];
          retryCountsRef.current[table] = attempt + 1;

          if (retryTimersRef.current[table]) {
            clearTimeout(retryTimersRef.current[table]);
          }
          retryTimersRef.current[table] = setTimeout(() => {
            subscribeTable(table);
          }, delay);
        }
      });

    channelsRef.current[table] = channel;
  }, [fetchAll]);

  // Initial fetch and auto-retry cleanup
  useEffect(() => {
    fetchAll();
    return () => {
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    };
  }, [fetchAll]);

  // Realtime: one channel PER TABLE for 7 public tables
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    PUBLIC_REALTIME_TABLES.forEach((table) => {
      subscribeTable(table);
    });

    return () => {
      if (catalogDebounceRef.current) clearTimeout(catalogDebounceRef.current);
      if (heroDebounceRef.current) clearTimeout(heroDebounceRef.current);

      Object.keys(retryTimersRef.current).forEach((table) => {
        if (retryTimersRef.current[table]) {
          clearTimeout(retryTimersRef.current[table]);
        }
      });
      retryTimersRef.current = {};

      Object.keys(channelsRef.current).forEach((table) => {
        const ch = channelsRef.current[table];
        if (ch) {
          try {
            supabase.removeChannel(ch);
          } catch {}
        }
      });
      channelsRef.current = {};
    };
  }, [subscribeTable]);

  // Stock safety net: refetch on visibilitychange and poll every 60s while visible
  useEffect(() => {
    let pollInterval = null;

    const startPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchAll();
        }
      }, 60000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        fetchAll();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (typeof document !== 'undefined') {
      if (document.visibilityState === 'visible') {
        startPolling();
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  // Append 'Combos' if any product is a combo
  const hasCombos = products.some((p) => p.is_combo || p.product_type === 'combo');
  if (hasCombos && !categoryList.includes('Combos')) {
    categoryList.push('Combos');
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
