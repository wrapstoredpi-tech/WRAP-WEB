import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { formatINR } from '../../lib/currency';
import { useCart } from '../../context/CartContext';
import { normaliseCombo } from '../../lib/useProducts';

/**
 * Category Filter Pills matching the approved design specification
 */
export const CATEGORY_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'mobile-cases', label: 'Mobile Cases' },
  { id: 'screen-protectors', label: 'Screen Protectors' },
  { id: 'ipad-cases', label: 'iPad Cases' },
  { id: 'cables', label: 'Cables' },
  { id: 'lens-protector', label: 'Lens Protector' },
  { id: 'power-banks', label: 'Power Banks' },
  { id: 'chargers-adapters', label: 'Chargers & Adapters' },
  { id: 'other-accessories', label: 'Other Accessories' },
];

/**
 * Normalizes and determines category matching for real products from Supabase
 */
function matchesCategoryFilter(product, activeFilter) {
  if (activeFilter === 'all') return true;

  const catName = (product.category || '').toLowerCase().trim();
  const subName = (product.subcategory || '').toLowerCase().trim();
  const prodName = (product.name || '').toLowerCase().trim();
  const allCats = (product.categories || []).map((c) => c.toLowerCase().trim());
  const allSubs = (product.subcategories || []).map((s) => s.toLowerCase().trim());

  switch (activeFilter) {
    case 'mobile-cases':
      return (
        catName.includes('case') ||
        allCats.some((c) => c.includes('case')) ||
        product.category_id === '2703ece0-9f83-4e71-88e7-28120de7f055' ||
        subName.includes('iphone') ||
        subName.includes('samsung') ||
        allSubs.some((s) => s.includes('iphone') || s.includes('samsung'))
      );

    case 'screen-protectors':
      return (
        subName.includes('temper') ||
        subName.includes('protector') ||
        allSubs.some((s) => s.includes('temper') || s.includes('protector')) ||
        prodName.includes('tempered') ||
        prodName.includes('screen protector') ||
        prodName.includes('lens protector') ||
        prodName.includes('glass') ||
        (product.combo_items || []).some((it) =>
          (it.product_name || '').toLowerCase().includes('temper')
        )
      );

    case 'chargers-adapters':
      return (
        subName.includes('adapter') ||
        subName.includes('charger') ||
        prodName.includes('charger') ||
        prodName.includes('adapter') ||
        prodName.includes('gan')
      );

    case 'cables':
      return subName.includes('cable') || prodName.includes('cable');

    case 'lens-protector':
      return (
        subName.includes('lens') ||
        prodName.includes('lens') ||
        prodName.includes('camera lens') ||
        prodName.includes('lens protector')
      );

    case 'power-banks':
      return subName.includes('power bank') || prodName.includes('power bank');

    case 'ipad-cases':
      return (
        subName.includes('ipad case') ||
        (prodName.includes('ipad') &&
          (prodName.includes('case') || prodName.includes('cover') || prodName.includes('folio')))
      );

    case 'other-accessories': {
      // Accessories that are not in the dedicated pills above
      const isSpecificPill =
        matchesCategoryFilter(product, 'mobile-cases') ||
        matchesCategoryFilter(product, 'screen-protectors') ||
        matchesCategoryFilter(product, 'chargers-adapters') ||
        matchesCategoryFilter(product, 'cables') ||
        matchesCategoryFilter(product, 'lens-protector') ||
        matchesCategoryFilter(product, 'power-banks') ||
        matchesCategoryFilter(product, 'ipad-cases');
      return !isSpecificPill;
    }

    default:
      return true;
  }
}

/**
 * Skeleton Loader Card matching the exact card dimensions to avoid layout shifts
 */
export function FeaturedProductSkeleton() {
  return (
    <div
      className="bg-white rounded-[22px] sm:rounded-[24px] p-3 sm:p-3.5 border border-[#ECEAE5]/80 flex flex-col justify-between"
      aria-hidden="true"
    >
      <div className="w-full aspect-[4/3] sm:aspect-square bg-[#EFEFEB]/80 rounded-[16px] sm:rounded-[18px] animate-pulse relative" />
      <div className="pt-3.5 sm:pt-4 px-1 pb-1 space-y-2.5">
        <div className="h-4 bg-[#EFEFEB] rounded-full w-4/5 animate-pulse" />
        <div className="h-4 bg-[#EFEFEB] rounded-full w-3/5 animate-pulse" />
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 bg-[#EFEFEB] rounded-full w-16 animate-pulse" />
            <div className="h-4 bg-[#EFEFEB] rounded-full w-12 animate-pulse" />
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EFEFEB] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Product Card for the Featured Products and New Arrivals Grid
 */
export function FeaturedProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  isAdded: propIsAdded,
  onAddToCart,
}) {
  const navigate = useNavigate();
  const { cartItems, addItem } = useCart();
  const [imageError, setImageError] = useState(false);
  const [localAdded, setLocalAdded] = useState(false);

  // Check if item is in cart
  const isInCart = useMemo(() => {
    return (
      Array.isArray(cartItems) &&
      cartItems.some(
        (item) =>
          String(item.productId) === String(product?.id) ||
          String(item.id) === String(product?.id)
      )
    );
  }, [cartItems, product?.id]);

  const isProductAdded = Boolean(propIsAdded || isInCart || localAdded);

  useEffect(() => {
    if (isInCart) {
      setLocalAdded(true);
    } else {
      setLocalAdded(false);
    }
  }, [isInCart]);

  // Extract all distinct images for this product
  const images = useMemo(() => {
    const rawList = [];
    if (Array.isArray(product?.images) && product.images.length > 0) {
      rawList.push(...product.images);
    }
    if (product?.image_url) {
      rawList.push(product.image_url);
    }
    if (Array.isArray(product?.combo_items)) {
      product.combo_items.forEach((it) => {
        if (it.image) rawList.push(it.image);
      });
    }

    const seen = new Set();
    const result = [];
    rawList.filter(Boolean).forEach((url) => {
      if (!seen.has(url)) {
        seen.add(url);
        result.push(url);
      }
    });

    return result.length > 0 ? result : [product?.image_url || ''];
  }, [product?.images, product?.image_url, product?.combo_items]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-scroll images smoothly when there are 2 or more images
  useEffect(() => {
    if (images.length <= 1) return;

    const delay =
      Math.abs(
        String(product?.id || '')
          .split('')
          .reduce((acc, c) => acc + c.charCodeAt(0), 0)
      ) % 800;

    let intervalId;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2600);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [images.length, product?.id]);

  if (!product) return null;

  const sellingPrice = Number(product.selling_price) || 0;
  const rawMrp = Number(product.mrp) || 0;
  const hasDiscount = Boolean(
    product.has_discount !== undefined
      ? product.has_discount
      : rawMrp > sellingPrice
  );
  const discountPercentage =
    product.discount_percentage ||
    (hasDiscount && rawMrp > 0
      ? Math.round(((rawMrp - sellingPrice) / rawMrp) * 100)
      : 0);

  const isOutOfStock = Boolean(
    product.is_out_of_stock !== undefined
      ? product.is_out_of_stock
      : product.stock_status === 'OUT_OF_STOCK' ||
          (product.available_stock !== undefined && product.available_stock <= 0)
  );

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleWishlist) onToggleWishlist(product.id);
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOutOfStock) return;
    setLocalAdded(true);
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product, 1, 'Universal');
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-[22px] sm:rounded-[24px] p-3 sm:p-3.5 border border-[#ECEAE5]/80 hover:border-[#D0CFC9] hover:shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col justify-between cursor-pointer select-none relative"
      aria-label={`${product.name}, Price ${formatINR(sellingPrice)}`}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-square bg-white rounded-[16px] sm:rounded-[18px] overflow-hidden flex items-center justify-center p-1">
        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#141414] flex items-center justify-center border border-[#ECEAE5] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#141414]"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isWishlisted
                ? 'fill-red-500 text-red-500 scale-110'
                : 'text-[#4A4A4A] group-hover:text-[#141414]'
            }`}
            strokeWidth={isWishlisted ? 2.2 : 1.8}
          />
        </button>

        {product.is_combo && (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-30 pointer-events-none">
            <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#B0521F] text-white select-none">
              Combo
            </span>
          </div>
        )}

        {/* Product Image or Carousel */}
        {images.length > 1 ? (
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
            <div
              className="flex w-full h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((imgSrc, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center relative">
                  <img
                    src={imgSrc}
                    alt={`${product.name} - view ${idx + 1}`}
                    decoding="async"
                    className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>

            {/* Pagination indicator dots */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm pointer-events-auto">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  aria-label={`Go to image ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentImageIndex === idx
                      ? 'w-3.5 bg-white shadow-sm'
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            onError={() => setImageError(true)}
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8C8C8C] p-2 text-center">
            <Package className="w-8 h-8 stroke-[1.4] mb-1 text-[#B0AEA8]" />
            <span className="text-[11px] font-medium text-[#7A7873]">WrapStore</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pt-3 sm:pt-4 px-0.5 sm:px-1 pb-0.5 sm:pb-1 flex flex-col flex-1 justify-between">
        <h3 className="font-sans font-medium sm:font-semibold text-[13px] sm:text-[15px] text-[#141414] leading-[1.3] sm:leading-[1.35] tracking-[-0.01em] line-clamp-2 min-h-[34px] sm:min-h-[42px] group-hover:text-[#B0521F] transition-colors">
          {product.name}
        </h3>

        {/* Pricing and Add to Cart Row */}
        <div className="pt-2 sm:pt-3 flex items-end sm:items-center justify-between gap-1.5 sm:gap-2">
          {/* Prices */}
          <div className="flex items-baseline sm:items-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-0.5 min-w-0">
            <span className="font-sans font-bold text-[15px] sm:text-[18px] text-[#141414] tabular-nums tracking-tight">
              {formatINR(sellingPrice)}
            </span>

            {hasDiscount && rawMrp > 0 && (
              <span className="font-sans font-normal text-[11px] sm:text-[13px] text-[#8C8C8C] line-through tabular-nums">
                {formatINR(rawMrp)}
              </span>
            )}

            {hasDiscount && discountPercentage > 0 && (
              <span className="inline-flex items-center text-[9px] sm:text-[11px] font-semibold text-[#1D8837] bg-[#EAF7EE] px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Add to Cart Circular Button */}
          <button
            type="button"
            onClick={handleCartClick}
            disabled={isOutOfStock}
            aria-label={
              isOutOfStock
                ? 'Out of stock'
                : isProductAdded
                ? 'Added to cart'
                : `Add ${product.name} to cart`
            }
            title={isProductAdded ? 'Added to cart' : 'Add to cart'}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 ${
              isOutOfStock
                ? 'bg-[#E5E5E3] text-[#8C8C8C] cursor-not-allowed'
                : isProductAdded
                ? 'bg-[#1D8837] hover:bg-[#18752F] text-white scale-105 shadow-[0_2px_8px_rgba(29,136,55,0.25)]'
                : 'bg-[#141414] hover:bg-[#2A2A2A] text-white active:scale-90'
            }`}
          >
            {isProductAdded ? (
              <Check className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2]" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Main FeaturedProductsSection Component
 */
export function FeaturedProductsSection() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Interactive feedback states
  const [addedIds, setAddedIds] = useState(new Set());
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('wrapstore_wishlist_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Category pill horizontal scrolling controls
  const pillContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { cartItems, addItem } = useCart();

  // Sync addedIds with cartItems
  useEffect(() => {
    if (Array.isArray(cartItems)) {
      setAddedIds(new Set(cartItems.map((item) => item.productId).filter(Boolean)));
    }
  }, [cartItems]);

  // Show brief feedback toast
  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Update category scroll button visibility
  const updateScrollButtons = useCallback(() => {
    const el = pillContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = pillContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, products]);

  const handleScroll = (direction) => {
    const el = pillContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // ── Database Fetching with Strict Eligibility Rules ────────────────────────
  // Conditions: online_featured = true, online_visible = true, is_active = true
  const fetchFeaturedProducts = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      setError('Database connection not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch eligible products and active combos in parallel
      const [
        { data: rawProducts, error: prodErr },
        { data: rawCombos, error: comboErr },
        { data: rawComboItems, error: comboItemsErr },
      ] = await Promise.all([
        supabase
          .from('products')
          .select(
            `id,
             product_id,
             name,
             category_id,
             subcategory_id,
             selling_price,
             mrp,
             discount_percentage,
             current_stock,
             reserved_stock,
             online_visible,
             online_featured,
             is_active,
             approval_status,
             seo_slug,
             created_at,
             updated_at`
          )
          .eq('online_featured', true)
          .eq('online_visible', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
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
      if (comboErr) {
        console.warn('[FeaturedProductsSection] combos fetch error:', comboErr.message);
      }
      if (comboItemsErr) {
        console.warn('[FeaturedProductsSection] combo_items fetch error:', comboItemsErr.message);
      }

      if ((!rawProducts || rawProducts.length === 0) && (!rawCombos || rawCombos.length === 0)) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch categories, subcategories, and product_images in parallel
      const productIds = rawProducts.map((p) => p.id);
      const [catRes, subRes, imgRes] = await Promise.all([
        supabase.from('categories').select('id, name').eq('is_active', true),
        supabase.from('subcategories').select('id, name, category_id').eq('is_active', true),
        supabase
          .from('product_images')
          .select('product_id, public_url, sort_order, is_primary, storage_path')
          .in('product_id', productIds)
          .order('sort_order', { ascending: true }),
      ]);

      const catMap = Object.fromEntries((catRes.data || []).map((c) => [c.id, c.name]));
      const subMap = Object.fromEntries((subRes.data || []).map((s) => [s.id, s.name]));

      const imgMap = {};
      (imgRes.data || []).forEach((img) => {
        if (!imgMap[img.product_id]) imgMap[img.product_id] = [];
        imgMap[img.product_id].push(img);
      });

      // 3. Normalize products with pricing and image resolution
      const normalized = rawProducts.map((p) => {
        const images = imgMap[p.id] || [];
        // Primary image selection: is_primary=true, else first sorted image
        const primaryImg =
          images.find((img) => img.is_primary)?.public_url || images[0]?.public_url || null;

        const sellingPrice = Number(p.selling_price) || 0;
        const rawMrp = Number(p.mrp) || 0;

        // Calculate discount only when both prices are valid and MRP exceeds selling price
        const hasDiscount = rawMrp > sellingPrice;
        const calculatedDiscount = hasDiscount
          ? Math.round(((rawMrp - sellingPrice) / rawMrp) * 100)
          : 0;
        const discountPercentage = calculatedDiscount > 0 ? calculatedDiscount : (p.discount_percentage || 0);

        const availableStock = Math.max(0, (p.current_stock || 0) - (p.reserved_stock || 0));
        const isOutOfStock = availableStock <= 0;

        return {
          id: p.id,
          product_id: p.product_id,
          name: p.name,
          category: catMap[p.category_id] || 'Other',
          category_id: p.category_id,
          subcategory: subMap[p.subcategory_id] || 'Other',
          subcategory_id: p.subcategory_id,
          selling_price: sellingPrice,
          mrp: hasDiscount ? rawMrp : null,
          discount_percentage: discountPercentage,
          has_discount: hasDiscount && discountPercentage > 0,
          image_url: primaryImg,
          images: images.map((i) => i.public_url).filter(Boolean),
          available_stock: availableStock,
          current_stock: availableStock,
          stock_status: isOutOfStock ? 'OUT_OF_STOCK' : 'IN_STOCK',
          is_out_of_stock: isOutOfStock,
          seo_slug: p.seo_slug,
          created_at: p.created_at,
        };
      });

      // Normalize combos and combine
      const comboItemsMap = {};
      (rawComboItems || []).forEach((ci) => {
        if (!comboItemsMap[ci.combo_id]) comboItemsMap[ci.combo_id] = [];
        comboItemsMap[ci.combo_id].push(ci);
      });

      const prodMap = Object.fromEntries(normalized.map((p) => [p.id, p]));
      const normalizedCombos = (rawCombos || []).map((c) => {
        const comboObj = normaliseCombo(c, prodMap, catMap, subMap, comboItemsMap);
        const sellingPrice = Number(comboObj.selling_price) || 0;
        const rawMrp = Number(comboObj.raw_mrp ?? comboObj.mrp) || 0;
        const hasDiscount = rawMrp > sellingPrice;
        const discountPercentage = comboObj.discount_percentage || 0;
        const availableStock = comboObj.available_stock || 10;

        return {
          ...comboObj,
          has_discount: hasDiscount && discountPercentage > 0,
          is_out_of_stock: availableStock <= 0,
        };
      });

      setProducts([...normalized, ...normalizedCombos]);
    } catch (err) {
      console.error('[FeaturedProductsSection] Error fetching products:', err);
      setError(err.message || 'Failed to load featured products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  // Handle Add to Cart using existing CartContext
  const handleAddToCart = (product) => {
    if (!product || product.is_out_of_stock) return;

    const success = addItem(product, 1, 'Universal');
    if (success) {
      setAddedIds((prev) => new Set(prev).add(product.id));
      showToast({
        title: 'Added to cart',
        desc: product.name,
        actionText: 'View Cart',
        actionHref: '/cart',
      });
    }
  };

  // Handle Wishlist Toggle
  const handleToggleWishlist = (productId) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyWishlisted = next.has(productId);
      if (isCurrentlyWishlisted) {
        next.delete(productId);
        showToast({ title: 'Removed from favorites' });
      } else {
        next.add(productId);
        showToast({ title: 'Saved to favorites' });
      }

      try {
        localStorage.setItem('wrapstore_wishlist_ids', JSON.stringify(Array.from(next)));
      } catch {
        // LocalStorage fallback handled silently
      }

      return next;
    });
  };

  // Client-side filtering across already fetched products (avoids repeated DB roundtrips)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => matchesCategoryFilter(p, activeFilter));
  }, [products, activeFilter]);

  // Display up to 8 products in the 4-column desktop grid (2 rows of 4)
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, 8);
  }, [filteredProducts]);

  return (
    <section
      aria-labelledby="featured-products-heading"
      className="w-full select-none"
    >
      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          {/* Eyebrow */}
          <p className="font-sans text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.15em] text-[#71717A] mb-1.5 sm:mb-2">
            FEATURED PRODUCTS
          </p>

          {/* Heading */}
          <h2
            id="featured-products-heading"
            className="font-sans font-bold text-[30px] sm:text-[40px] lg:text-[46px] text-[#141414] leading-[1.08] tracking-[-0.02em]"
          >
            Handpicked for<br className="hidden sm:inline" /> a Better Everyday
          </h2>
        </div>

        {/* View All Categories CTA (Desktop / Tablet) */}
        <Link
          to="/?view=all"
          className="hidden sm:inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white font-sans text-[14px] font-medium transition-colors duration-200 self-start md:self-auto shrink-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 cursor-pointer group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* ── Category Filter Bar with Horizontal Carousel Controls ──────────── */}
      <div className="relative mb-6 sm:mb-8 flex items-center gap-3">
        {/* Horizontally Scrollable Category Pills */}
        <div
          ref={pillContainerRef}
          role="tablist"
          aria-label="Filter featured products by category"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full"
        >
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(pill.id)}
                className={`px-4 sm:px-5 py-2 rounded-full font-sans text-[13px] sm:text-[14px] whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 ${
                  isActive
                    ? 'bg-[#141414] text-white font-medium shadow-sm'
                    : 'bg-[#EFEFEB] text-[#4A4A4A] hover:bg-[#E5E3DD] hover:text-[#141414] font-medium'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Carousel Arrow Controls (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-1">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              canScrollLeft
                ? 'bg-[#EFEFEB] hover:bg-[#E5E3DD] text-[#4A4A4A] active:scale-90 cursor-pointer'
                : 'bg-[#F5F5F3] text-[#B0AEA8] opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              canScrollRight
                ? 'bg-[#EFEFEB] hover:bg-[#E5E3DD] text-[#4A4A4A] active:scale-90 cursor-pointer'
                : 'bg-[#F5F5F3] text-[#B0AEA8] opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ── Product Grid or Status States ──────────────────────────────────── */}
      {isLoading ? (
        /* Loading Skeleton Grid */
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6"
          aria-label="Loading featured products"
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <FeaturedProductSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="w-full bg-white rounded-[20px] border border-[#ECEAE5] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAFAF9] flex items-center justify-center text-[#B0521F]">
            <RefreshCw className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-sans font-semibold text-[17px] text-[#141414]">
              Unable to load featured products
            </h3>
            <p className="font-sans text-[13px] text-[#6B6B6B]">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchFeaturedProducts}
            className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white text-[13px] font-medium transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : displayedProducts.length === 0 ? (
        /* Clean Empty State */
        <div className="w-full bg-white rounded-[22px] border border-[#ECEAE5]/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]">
            <ShoppingBag className="w-6 h-6 stroke-[1.6]" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-sans font-semibold text-[17px] sm:text-[18px] text-[#141414]">
              No featured products in this category right now
            </h3>
            <p className="font-sans text-[13px] sm:text-[14px] text-[#6B6B6B] leading-relaxed">
              We update our handpicked collection regularly. Browse all our available products or switch back to All.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="px-5 py-2 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white text-[13px] font-medium transition-colors cursor-pointer"
            >
              Show All Products
            </button>
            <Link
              to="/?view=all"
              className="px-5 py-2 rounded-full bg-[#EFEFEB] hover:bg-[#E5E3DD] text-[#141414] text-[13px] font-medium transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      ) : (
        /* 4-Column Product Grid (Desktop: 4 columns, 2 rows max 8 products) */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
          {displayedProducts.map((product) => (
            <FeaturedProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={handleToggleWishlist}
              isAdded={
                addedIds.has(product.id) ||
                (Array.isArray(cartItems) &&
                  cartItems.some(
                    (item) => String(item.productId) === String(product.id)
                  ))
              }
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Mobile-only CTA button placed after all cards */}
      <div className="mt-6 flex sm:hidden justify-center">
        <Link
          to="/?view=all"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white font-sans text-[14px] font-medium transition-colors duration-200 shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 active:scale-[0.98]"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* ── Accessible Floating Feedback Toast ───────────────────────────────── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[13px] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="font-medium text-white">{toastMessage.title}</p>
            {toastMessage.desc && (
              <p className="text-[12px] text-white/70 line-clamp-1">{toastMessage.desc}</p>
            )}
          </div>
          {toastMessage.actionHref && (
            <Link
              to={toastMessage.actionHref}
              className="ml-2 px-2.5 py-1 rounded bg-white text-[#141414] font-medium text-[12px] hover:bg-white/90 transition-colors shrink-0"
            >
              {toastMessage.actionText}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default FeaturedProductsSection;
