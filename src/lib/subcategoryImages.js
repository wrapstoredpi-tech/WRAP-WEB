/**
 * src/lib/subcategoryImages.js
 * ────────────────────────────
 * Permanent static & database-driven subcategory tile image resolver.
 *
 * Resolves images in priority order:
 *  1. sub.tile_image_url (from Supabase subcategories table)
 *  2. Bundled permanent generated product photography in /subcategories/<slug>.jpg
 *  3. Neutral fallback (null)
 */

const SUBCATEGORY_SLUG_MAP = {
  'iphone': '/subcategories/iphone.jpg',
  'samsung': '/subcategories/samsung.jpg',
  'vivo': '/subcategories/vivo.jpg',
  'power-bank': '/subcategories/power-bank.jpg',
  'watch-strap': '/subcategories/watch-strap.jpg',
  'ipad-case': '/subcategories/ipad-case.jpg',
  'ipad-temper': '/subcategories/ipad-temper.jpg',
  'cables': '/subcategories/cables.jpg',
  'airpods-cases': '/subcategories/airpods-cases.jpg',
  'wallet': '/subcategories/wallet.jpg',
  'skin': '/subcategories/skin.jpg',
  'badge-stickers': '/subcategories/badge-stickers.jpg',
  'watch-cases': '/subcategories/watch-cases.jpg',
  'phone-stand': '/subcategories/phone-stand.jpg',
  'cleaning-kit': '/subcategories/cleaning-kit.jpg',
  'adapters': '/subcategories/adapters.jpg',
  'lens-protector': '/subcategories/lens-protector.jpg',
  'tempered-glass': '/subcategories/tempered-glass.jpg',
};

/**
 * Normalises subcategory name to slug format (e.g. "Power Bank" -> "power-bank", "Badge / Stickers" -> "badge-stickers").
 */
export function normalizeSubcategorySlug(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Returns the permanent image URL for a given subcategory.
 *
 * @param {object} sub - subcategory row { id, name, slug, tile_image_url }
 * @returns {string|null} Image URL or null for neutral placeholder
 */
export function getSubcategoryImageUrl(sub) {
  if (!sub) return null;

  // 1. Direct database column if populated
  if (sub.tile_image_url && typeof sub.tile_image_url === 'string' && sub.tile_image_url.trim()) {
    return sub.tile_image_url.trim();
  }

  // 2. Slug-based lookup
  const slug = sub.slug || normalizeSubcategorySlug(sub.name);
  if (SUBCATEGORY_SLUG_MAP[slug]) {
    return SUBCATEGORY_SLUG_MAP[slug];
  }

  // 3. Fallback to slug path if exists
  if (slug) {
    return `/subcategories/${slug}.jpg`;
  }

  return null;
}
