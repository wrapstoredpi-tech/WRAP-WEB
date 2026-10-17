/**
 * src/config/featured.js
 * ──────────────────────
 * Featured Product spotlight section configuration.
 *
 * All customer-facing copy comes directly from here.
 * - productId: Set to a product UUID to pin a specific featured product
 * - image: Optional custom photo path e.g. '/home/featured.webp' (if not set or null, uses product's primary image)
 * - buttonText: 'View product'
 * - seeAllText: 'See all featured'
 */

export const featured = {
  heading: 'Featured',
  productId: null, // Pin a specific product ID if desired
  image: null, // e.g. '/home/featured.webp'
  buttonText: 'View product',
  seeAllText: 'See all featured',
};

export default featured;
