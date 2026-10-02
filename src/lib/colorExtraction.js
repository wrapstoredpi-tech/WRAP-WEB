import { useState, useEffect } from 'react';
import { getPalette } from 'colorthief';
import { parseColors } from './useProducts';

/**
 * Standard 15-named reference palette for mapping extracted RGB colors.
 * (Black, White, Grey, Silver, Gold, Red, Blue, Navy, Green, Yellow, Orange, Pink, Purple, Brown, Clear/Transparent)
 */
export const REFERENCE_PALETTE = [
  { name: 'Black', rgb: [18, 18, 18] },
  { name: 'White', rgb: [250, 250, 250] },
  { name: 'Grey', rgb: [107, 114, 128] },
  { name: 'Silver', rgb: [215, 218, 222] },
  { name: 'Gold', rgb: [212, 175, 55] },
  { name: 'Red', rgb: [220, 38, 38] },
  { name: 'Blue', rgb: [37, 99, 235] },
  { name: 'Navy', rgb: [24, 34, 53] },
  { name: 'Green', rgb: [22, 163, 74] },
  { name: 'Yellow', rgb: [234, 179, 8] },
  { name: 'Orange', rgb: [234, 88, 12] },
  { name: 'Pink', rgb: [236, 72, 153] },
  { name: 'Purple', rgb: [126, 34, 206] },
  { name: 'Brown', rgb: [139, 69, 19] },
  { name: 'Clear/Transparent', rgb: [245, 245, 245], isClear: true },
];

/**
 * Perceptually weighted Euclidean color distance formula.
 */
function colorDistance(rgb1, rgb2) {
  const rDiff = rgb1[0] - rgb2[0];
  const gDiff = rgb1[1] - rgb2[1];
  const bDiff = rgb1[2] - rgb2[2];
  const rMean = (rgb1[0] + rgb2[0]) / 2;
  const weightR = 2 + rMean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rMean) / 256;
  return Math.sqrt(weightR * rDiff * rDiff + weightG * gDiff * gDiff + weightB * bDiff * bDiff);
}

/**
 * Maps arbitrary [R, G, B] values to the closest named color from the reference palette.
 */
export function mapRgbToNamedColor(r, g, b) {
  let minDistance = Infinity;
  let closestName = 'Grey';

  for (const ref of REFERENCE_PALETTE) {
    if (ref.isClear) continue;
    const dist = colorDistance([r, g, b], ref.rgb);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = ref.name;
    }
  }

  return closestName;
}

/**
 * Resolves the primary product image URL from live product data.
 * Checks is_primary entry, sort_order entry, or image_url.
 */
export function getPrimaryImageUrl(product) {
  if (!product) return null;

  const imgList = product.images || product.product_images;
  if (Array.isArray(imgList) && imgList.length > 0) {
    const primaryEntry = imgList.find((img) => typeof img === 'object' && img?.is_primary);
    if (primaryEntry) {
      return primaryEntry.public_url || primaryEntry.url || primaryEntry.image_url || primaryEntry;
    }
    const sorted = [...imgList].sort((a, b) => {
      const orderA = typeof a === 'object' && a?.sort_order != null ? a.sort_order : 999;
      const orderB = typeof b === 'object' && b?.sort_order != null ? b.sort_order : 999;
      return orderA - orderB;
    });
    const first = sorted[0];
    if (first) {
      return typeof first === 'string' ? first : (first.public_url || first.url || first.image_url);
    }
  }

  return product.image_url || null;
}

// In-memory memory cache for fast lookups
const inMemoryCache = new Map();

/**
 * Extracts dominant colors from the product's primary image using ColorThief.
 * Caches results in localStorage key: wrapstore_color_cache:<product_id>.
 * Fails silently with a console warning on CORS or canvas errors.
 */
export async function extractColorsFromImage(productId, imageUrl) {
  if (!productId || !imageUrl) return [];

  // 1. Check in-memory cache
  if (inMemoryCache.has(productId)) {
    return inMemoryCache.get(productId);
  }

  // 2. Check localStorage cache
  const cacheKey = `wrapstore_color_cache:${productId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCache.set(productId, parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[WrapStore Color Cache] Error reading cache for', productId, e);
  }

  // 3. Asynchronously load image with crossOrigin="anonymous" and run color extraction
  try {
    const colors = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      img.onload = async () => {
        try {
          const rawPalette = await getPalette(img, { colorCount: 8, ignoreWhite: false });
          if (!rawPalette || rawPalette.length === 0) {
            resolve([]);
            return;
          }

          const mappedNames = [];
          for (const color of rawPalette) {
            const r = color.r !== undefined ? color.r : color[0];
            const g = color.g !== undefined ? color.g : color[1];
            const b = color.b !== undefined ? color.b : color[2];

            const namedColor = mapRgbToNamedColor(r, g, b);
            if (namedColor && !mappedNames.includes(namedColor)) {
              mappedNames.push(namedColor);
            }
            if (mappedNames.length >= 4) break;
          }

          resolve(mappedNames.slice(0, 4));
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        reject(err);
      };
    });

    if (colors && colors.length > 0) {
      inMemoryCache.set(productId, colors);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(colors));
      } catch (e) {
        console.warn('[WrapStore Color Cache] Error saving to localStorage', e);
      }
      return colors;
    }
  } catch (err) {
    // Fail silently, log console warning as requested
    console.warn(
      `[WrapStore Color Extraction] Auto-color extraction failed for product "${productId}". Showing no swatches.`,
      err?.message || err
    );
  }

  return [];
}

/**
 * React hook to get the effective colors for a product following the exact priority:
 * 1. product.color_variants if available (normalised array/comma-string).
 * 2. Auto-detected dominant colors from primary image using ColorThief (cached).
 * 3. Empty array if no color_variants and no images.
 */
export function useProductColors(product) {
  const [colors, setColors] = useState(() => {
    if (!product) return [];

    // Priority 1: DB color_variants
    const dbColors = parseColors(product.color_variants);
    if (dbColors.length > 0) return dbColors;

    // Check synchronous cache
    if (product.id) {
      if (inMemoryCache.has(product.id)) {
        return inMemoryCache.get(product.id);
      }
      try {
        const cached = localStorage.getItem(`wrapstore_color_cache:${product.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryCache.set(product.id, parsed);
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (!product) return;

    // Priority 1: DB color_variants
    const dbColors = parseColors(product.color_variants);
    if (dbColors.length > 0) {
      setColors(dbColors);
      return;
    }

    // Priority 2: Auto-detect fallback from primary image
    const primaryImg = getPrimaryImageUrl(product);
    if (!primaryImg || !product.id) {
      setColors([]);
      return;
    }

    let isMounted = true;
    extractColorsFromImage(product.id, primaryImg).then((extracted) => {
      if (isMounted) {
        setColors(extracted || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [product]);

  return colors;
}
