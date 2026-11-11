/**
 * src/lib/models.js
 * ─────────────────
 * Central helpers for phone model slugs, sorting, and live model resolution.
 *
 * Rules:
 * - Slug format: lowercase, '+' becomes '-plus', spaces & non-alphanumeric become '-'.
 * - Model resolution: matches slug against live models list (never reverses string).
 * - Model sorting: series number descending, then Pro Max / Ultra, Pro, Plus / +, Base.
 */

export const DEFAULT_APPLE_MODELS = [
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
];

export const DEFAULT_SAMSUNG_MODELS = [
  'Samsung Galaxy S25 Ultra',
  'Samsung Galaxy S25+',
  'Samsung Galaxy S25',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24+',
  'Samsung Galaxy S24',
  'Samsung Galaxy S23 Ultra',
  'Samsung Galaxy S23+',
  'Samsung Galaxy S23',
  'Samsung Galaxy S22 Ultra',
  'Samsung Galaxy S22+',
  'Samsung Galaxy S22',
  'Samsung Galaxy Z Fold 6',
  'Samsung Galaxy Z Flip 6',
  'Samsung Galaxy Z Fold 5',
  'Samsung Galaxy Z Flip 5',
];

export function modelToSlug(model) {
  if (!model) return '';
  return String(model)
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugToModel(slug, liveModels = []) {
  if (!slug) return null;
  const target = String(slug).toLowerCase().trim().replace(/^-+|-+$/g, '');
  const cleanTarget = target.replace(/^(apple|samsung)-/, '');

  const matches = (m) => {
    const s = modelToSlug(m);
    if (s === target || s === cleanTarget) return true;
    const cleanS = s.replace(/^(apple|samsung)-/, '');
    return cleanS === target || cleanS === cleanTarget;
  };

  const liveMatch = liveModels.find(matches);
  if (liveMatch) return liveMatch;

  const allDefaults = [...DEFAULT_APPLE_MODELS, ...DEFAULT_SAMSUNG_MODELS];
  return allDefaults.find(matches) || null;
}

export function getModelRank(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('pro max') || lower.includes('ultra')) return 1;
  if (lower.includes('pro') && !lower.includes('max')) return 2;
  if (lower.includes('plus') || lower.includes('+')) return 3;
  if (lower.includes('mini')) return 5;
  if (lower.includes('fold')) return 6;
  if (lower.includes('flip')) return 7;
  return 4; // base model
}

export function sortModels(models = []) {
  return [...models].sort((a, b) => {
    const numA = (String(a).match(/\d+/) || [0])[0];
    const numB = (String(b).match(/\d+/) || [0])[0];
    const nA = parseInt(numA, 10);
    const nB = parseInt(numB, 10);
    if (nA !== nB) return nB - nA; // Series descending (e.g. 16 > 15)
    const rankDiff = getModelRank(a) - getModelRank(b); // Pro Max -> Pro -> Plus -> Base
    if (rankDiff !== 0) return rankDiff;
    return String(a).localeCompare(String(b));
  });
}

/**
 * Returns distinct phone models that have at least one visible, in-stock case for the specified brand.
 * Sorted newest first by series number, then Pro Max / Ultra, Pro, Plus / +, Base.
 */
export function getLiveModelsWithCases(products = [], brand = 'Apple') {
  const brandLower = brand.toLowerCase();
  const set = new Set();

  for (const p of products) {
    if (!p) continue;
    const isOutOfStock = p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) <= 0;
    if (isOutOfStock) continue;
    if (p.is_active === false || p.online_visible === false) continue;

    const nonPhoneSubcats = ['watch strap', 'watch cases', 'ipad case', 'ipad temper', 'airpods cases'];
    const pSub = (p.subcategory || '').toLowerCase();
    if (nonPhoneSubcats.includes(pSub)) continue;

    const isCase =
      (p.category === 'Mobile Cases' ||
        (Array.isArray(p.categories) && p.categories.includes('Mobile Cases')) ||
        (p.category || '').toLowerCase() === 'mobile cases' ||
        pSub === 'iphone' ||
        pSub === 'samsung') &&
      !nonPhoneSubcats.includes(pSub);

    if (!isCase) continue;

    const pBrand = (p.mobile_brand || '').toLowerCase();
    const pBrands = Array.isArray(p.brands) ? p.brands.map((b) => (b || '').toLowerCase()) : [];
    const pName = (p.name || '').toLowerCase();

    const matchesBrand =
      pBrand.includes(brandLower) ||
      pBrands.some((b) => b.includes(brandLower)) ||
      (brandLower === 'apple' && (pName.includes('iphone') || pName.includes('apple'))) ||
      (brandLower === 'samsung' && (pName.includes('samsung') || pName.includes('galaxy')));

    if (!matchesBrand) continue;

    const models = Array.isArray(p.compatible_models) ? p.compatible_models : [];
    for (const m of models) {
      if (!m || m === 'Universal') continue;
      const mLower = m.toLowerCase();
      if (brandLower === 'apple' && (mLower.includes('iphone') || mLower.includes('apple'))) {
        set.add(m);
      } else if (brandLower === 'samsung' && (mLower.includes('samsung') || mLower.includes('galaxy') || mLower.includes('s2') || mLower.includes('z '))) {
        set.add(m);
      }
    }
  }

  return sortModels(Array.from(set));
}

// Alias for backwards-compatibility with existing pages
export const getLiveModelsForBrand = getLiveModelsWithCases;

/**
 * Returns true if brand has at least one visible, in-stock case product.
 */
export function hasLiveCasesForBrand(products = [], brand = 'Samsung') {
  const models = getLiveModelsWithCases(products, brand);
  return models.length > 0;
}

/**
 * Generates a normalized design key for colour siblings:
 * Products with the same name (trimmed, case-insensitive) in the same subcategory.
 */
export function getDesignKey(product) {
  if (!product) return '';
  const sub = String(product.subcategory || product.category || '').toLowerCase().trim();
  const name = String(product.name || '').toLowerCase().trim();
  return `${sub}:::${name}`;
}

/**
 * Groups a product list into unique designs (one card per design).
 * Selects the in-stock sibling with newest created_at as the primary product,
 * and attaches aggregated color_variants from all siblings.
 */
export function groupProductsByDesign(products = []) {
  const groups = new Map();

  for (const p of products) {
    if (!p) continue;
    const isOutOfStock = p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) <= 0;
    if (isOutOfStock) continue;
    if (p.is_active === false || p.online_visible === false) continue;

    const key = getDesignKey(p);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(p);
  }

  const result = [];
  for (const [, siblings] of groups) {
    // Sort by created_at descending
    siblings.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const primary = { ...siblings[0] };

    // Aggregate unique colors across all siblings
    const colorSet = new Set();
    siblings.forEach((s) => {
      const vars = Array.isArray(s.color_variants) ? s.color_variants : [];
      vars.forEach((c) => {
        const cName = typeof c === 'string' ? c : c?.name || c?.color || String(c);
        if (cName) colorSet.add(cName);
      });
    });

    primary.allSiblings = siblings;
    primary.aggregatedColors = Array.from(colorSet);
    result.push(primary);
  }

  return result;
}

/**
 * Returns design info for a specific model:
 * - designsCount: distinct design groups compatible with this model
 * - heroProduct: newest representative product with a valid image
 * - slug: model URL slug
 */
export function getModelCaseDesigns(products = [], model = '', brand = 'Apple') {
  if (!model) return { designsCount: 0, heroProduct: null, slug: '' };
  const brandLower = brand.toLowerCase();
  const mLower = model.toLowerCase().trim();

  const matchingProducts = products.filter((p) => {
    if (!p) return false;
    const isOutOfStock = p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) <= 0;
    if (isOutOfStock) return false;
    if (p.is_active === false || p.online_visible === false) return false;

    const nonPhoneSubcats = ['watch strap', 'watch cases', 'ipad case', 'ipad temper', 'airpods cases'];
    const pSub = (p.subcategory || '').toLowerCase();
    if (nonPhoneSubcats.includes(pSub)) return false;

    const isCase =
      (p.category === 'Mobile Cases' ||
        (Array.isArray(p.categories) && p.categories.includes('Mobile Cases')) ||
        (p.category || '').toLowerCase() === 'mobile cases' ||
        pSub === 'iphone' ||
        pSub === 'samsung') &&
      !nonPhoneSubcats.includes(pSub);

    if (!isCase) return false;

    const pBrand = (p.mobile_brand || '').toLowerCase();
    const pBrands = Array.isArray(p.brands) ? p.brands.map((b) => (b || '').toLowerCase()) : [];
    const matchesBrand =
      pBrand.includes(brandLower) ||
      pBrands.some((b) => b.includes(brandLower)) ||
      (brandLower === 'apple' && (p.name || '').toLowerCase().includes('iphone')) ||
      (brandLower === 'samsung' && (p.name || '').toLowerCase().includes('galaxy'));
    if (!matchesBrand) return false;

    const models = Array.isArray(p.compatible_models) ? p.compatible_models : [];
    return models.some((cm) => (cm || '').toLowerCase().trim() === mLower);
  });

  const uniqueDesigns = groupProductsByDesign(matchingProducts);
  const heroProduct = uniqueDesigns.length > 0 ? uniqueDesigns[0] : null;

  return {
    model,
    designsCount: uniqueDesigns.length,
    heroProduct,
    slug: modelToSlug(model),
  };
}

/**
 * Returns live accessory subcategories that have at least one visible in-stock product.
 */
export function getLiveAccessorySubcategories(products = [], subcategories = []) {
  const accProducts = products.filter((p) => {
    if (!p) return false;
    const isOutOfStock = p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) <= 0;
    if (isOutOfStock) return false;
    if (p.is_active === false || p.online_visible === false) return false;

    const cat = (p.category || '').toLowerCase();
    const cats = Array.isArray(p.categories) ? p.categories.map((c) => (c || '').toLowerCase()) : [];
    return cat.includes('accessor') || cats.some((c) => c.includes('accessor'));
  });

  const subMap = new Map();
  for (const p of accProducts) {
    const subName = p.subcategory || 'General';
    if (!subMap.has(subName)) {
      subMap.set(subName, []);
    }
    subMap.get(subName).push(p);
  }

  const result = [];
  for (const [name, prods] of subMap) {
    if (prods.length === 0) continue;
    // Find matching subcategory metadata if available
    const meta = (subcategories || []).find((s) => (s?.name || '').toLowerCase() === name.toLowerCase());
    const hero = prods[0];
    result.push({
      id: meta?.id || name,
      name,
      productCount: prods.length,
      heroProduct: hero,
      image: hero.image_url || '/subcategories/tempered-glass.jpg',
    });
  }

  return result;
}

/**
 * Single source of truth for Combo eligibility across:
 * - Nav mega menu
 * - Mobile menu
 * - Home "Shop by category" combos tab
 * - Home "Better together" product scroll row
 * - Model page combos chip
 *
 * A combo is eligible ONLY if:
 * 1. online_visible !== false
 * 2. is_active !== false
 * 3. stock_status !== 'OUT_OF_STOCK'
 * 4. (available_stock ?? current_stock ?? 0) > 0
 * 5. combosOrderable !== false && orderable !== false
 */
export function isComboEligible(combo) {
  if (!combo) return false;
  if (!combo.is_combo && combo.product_type !== 'combo') return false;
  if (combo.is_active === false || combo.online_visible === false) return false;
  if (combo.stock_status === 'OUT_OF_STOCK') return false;

  const stock = combo.available_stock ?? combo.current_stock ?? 0;
  if (stock <= 0) return false;
  if (combo.combosOrderable === false || combo.orderable === false) return false;

  return true;
}

export function getEligibleCombos(products = []) {
  return products.filter((p) => isComboEligible(p));
}

/**
 * Resolves a combo's own representative image (preferring combo_image),
 * never a placeholder.
 */
export function getComboImage(combo) {
  if (!combo) return '/subcategories/iphone.jpg';
  if (combo.combo_image) return combo.combo_image;
  if (combo.image_url && !combo.image_url.includes('placeholder')) return combo.image_url;
  if (combo.image && !combo.image.includes('placeholder')) return combo.image;
  if (Array.isArray(combo.combo_items)) {
    const itImg =
      combo.combo_items.find((it) => it?.combo_image)?.combo_image ||
      combo.combo_items.find((it) => it?.image)?.image;
    if (itImg) return itImg;
  }
  if (Array.isArray(combo.items)) {
    const itImg =
      combo.items.find((it) => it?.combo_image)?.combo_image ||
      combo.items.find((it) => it?.image)?.image;
    if (itImg) return itImg;
  }
  if (Array.isArray(combo.images) && combo.images.length > 0) return combo.images[0];
  return '/subcategories/iphone.jpg';
}

/**
 * Returns up to max visible in-stock combos using unified eligibility.
 */
export function getLiveCombos(products = [], max = 3) {
  return getEligibleCombos(products).slice(0, max);
}

