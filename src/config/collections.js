/**
 * src/config/collections.js
 * ─────────────────────────
 * Trending collections on WrapStore.
 *
 * Supports dynamic collections extracted from public.products (collection text column)
 * as well as legacy/fallback definitions.
 */

export function collectionNameToSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const collections = [
  {
    slug: 'anti-yellow',
    name: 'Anti - Yellow',
    description: 'Crystal-clear protection with magnetic snap',
    tagline: 'Anti-yellow protection',
    match: ['antiyellow', 'clear', 'magsafe', 'anti - yellow'],
    bg: '#F2F4F7',
    dark: false,
  },
  {
    slug: 'coloured-antiyellow',
    name: 'Coloured antiyellow',
    description: 'Vibrant tinted anti-yellow shockproof cases',
    tagline: 'Colour with clear protection',
    match: ['coloured antiyellow', 'coloured'],
    bg: '#FAF0E6',
    dark: false,
  },
  {
    slug: 'leather',
    name: 'Leather',
    description: 'Supple vegan leather with tactile grip',
    tagline: 'Genuine pebble grain',
    match: ['leather'],
    bg: '#EAE8E3',
    dark: false,
  },
  {
    slug: 'normal',
    name: 'Normal',
    description: 'Everyday standard protection',
    tagline: 'Simple, essential protection',
    match: ['normal'],
    bg: '#E8F1F2',
    dark: false,
  },
];

export function getCollectionBySlug(slug, products = []) {
  if (!slug) return null;
  const target = String(slug).toLowerCase().trim();

  // 1. Look dynamically in live products
  if (Array.isArray(products) && products.length > 0) {
    for (const p of products) {
      const col = (p.collection || '').trim();
      if (col && collectionNameToSlug(col) === target) {
        return {
          name: col,
          slug: target,
          description: `Cases from the ${col} collection.`,
        };
      }
    }
  }

  // 2. Check static collections list
  const staticCol = collections.find((c) => c.slug === target);
  if (staticCol) return staticCol;

  // 3. Fallback: humanize the slug
  const readable = target
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    name: readable,
    slug: target,
    description: `Cases from the ${readable} collection.`,
  };
}
