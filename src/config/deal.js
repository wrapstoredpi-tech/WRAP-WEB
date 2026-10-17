/**
 * src/config/deal.js
 * ──────────────────
 * Deal of the Day configuration.
 *
 * All customer-facing copy comes directly from here.
 * - productId: Set to a product UUID to pin a specific deal (must be eligible: online_visible, is_active, approval_status != 'REJECTED', available_stock > 0, percent_off >= 5)
 * - image: Optional custom photo path e.g. '/home/deal.webp' (if not set or null, uses product's primary image)
 * - shortLine: One short line from config (default empty, hidden when empty)
 */

export const deal = {
  heading: 'Deal of the day',
  shortLine: '', // default empty, hidden when empty
  productId: null, // Pin a specific product ID if desired
  image: null, // e.g. '/home/deal.webp'
  buttonText: 'Shop the deal',
};

export default deal;
