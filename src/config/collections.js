/**
 * src/config/collections.js
 * ─────────────────────────
 * Trending collections on WrapStore Home.
 *
 * Rules:
 * - A collection displays only if at least one in-stock case matches
 *   (product name contains a match keyword, case-insensitive).
 * - "From" price and overlapping images are derived dynamically from matched products.
 * - Clicking a collection opens /collection/:slug which reuses the model-page
 *   listing (grid, filters, sort) filtered to the matched products and filtered
 *   to the saved phone when set.
 */

export const collections = [
  {
    slug: 'clear-magsafe',
    name: 'Clear and MagSafe',
    description: 'Crystal-clear protection with magnetic snap',
    tagline: 'Anti-yellow protection',
    match: ['antiyellow', 'clear', 'magsafe', 'transparent'],
    bg: '#E9EEF2',
    dark: false,
  },
  {
    slug: 'leather',
    name: 'Leather',
    description: 'Supple vegan leather with tactile grip',
    tagline: 'Genuine pebble grain',
    match: ['leather'],
    bg: '#EADFD3',
    dark: false,
  },
  {
    slug: 'carbon-matte',
    name: 'Carbon and matte',
    description: 'Ultra-slim aramid weave and anti-fingerprint matte',
    tagline: 'Slim, zero fingerprint',
    match: ['carbon', 'matte', 'air pro'],
    bg: '#2A2B30',
    dark: true,
  },
];

export function getCollectionBySlug(slug) {
  if (!slug) return null;
  const target = String(slug).toLowerCase().trim();
  return collections.find((c) => c.slug === target) || null;
}
