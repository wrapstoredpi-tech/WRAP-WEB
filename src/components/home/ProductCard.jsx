import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { formatINR } from '../../lib/currency';
import { ColorSwatch, getValidColors } from '../ui/ColorSwatch';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { usePurchaseSheet } from '../../context/PurchaseSheetContext';
import { ComboThumbnail } from '../cart/ComboThumbnail';
import { getComboImage } from '../../lib/models';

export function ProductCard({ product, outlinedButton = false }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { items = [], addItem } = useCart();
  const { savedPhone } = usePhoneContext();
  const { openSheet } = usePurchaseSheet();

  if (!product) return null;

  const isOutOfStock =
    product.stock_status === 'OUT_OF_STOCK' ||
    (product.available_stock ?? product.current_stock ?? 0) <= 0;

  // Rule: Do not show out of stock items
  if (isOutOfStock) return null;

  const mrp = product.mrp || product.original_value || product.raw_mrp || 0;
  const sellingPrice = product.selling_price || 0;
  const hasDiscount = mrp > sellingPrice;
  const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const isFav = product.id ? isFavorite(product.id) : false;

  // Sibling color dots with stock awareness (Rule 15)
  const siblingDots = useMemo(() => {
    if (!product.allSiblings || product.allSiblings.length === 0) {
      const raw = product.aggregatedColors || getValidColors(product);
      return (raw || []).map((c) => ({
        name: typeof c === 'string' ? c : c?.name || c?.color,
        inStock: true,
      }));
    }
    const dots = [];
    const seenNames = new Set();
    product.allSiblings.forEach((s) => {
      const isStocked =
        (s.available_stock ?? s.current_stock ?? 0) > 0 && s.stock_status !== 'OUT_OF_STOCK';
      const sColors = getValidColors(s);
      sColors.forEach((c) => {
        const cName = typeof c === 'string' ? c : c?.name || c?.color;
        if (cName && !seenNames.has(cName.toLowerCase())) {
          seenNames.add(cName.toLowerCase());
          dots.push({ name: cName, inStock: isStocked });
        }
      });
    });
    return dots;
  }, [product]);

  // Check if item is already in the bag
  const isInBag = items.some(
    (item) => item.productId === product.id || item.product_id === product.id
  );

  // Model compatibility check for quick-add (Rule 6)
  // Products with compatible_models are model-specific (cases, tempered glass, lens protectors).
  // Only products with NO model list add directly.
  const models = Array.isArray(product.compatible_models) ? product.compatible_models : [];
  const hasModelList = models.length > 0;
  const fitsSavedPhone = Boolean(savedPhone?.model && models.includes(savedPhone.model));
  const isDirectAdd = !hasModelList;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.id) {
      toggleFavorite(product.id, { returnUrl: `/product/${product.id}` });
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (product.is_combo) {
      if (fitsSavedPhone) {
        addItem(product, 1, savedPhone.model);
        openSheet({ product, quantity: 1, selectedModel: savedPhone.model });
      } else {
        navigate(`/product/${product.id}`);
      }
      return;
    }

    if (isDirectAdd) {
      addItem(product, 1, 'Universal');
      openSheet({ product, quantity: 1, selectedModel: 'Universal' });
    } else if (fitsSavedPhone) {
      addItem(product, 1, savedPhone.model);
      openSheet({ product, quantity: 1, selectedModel: savedPhone.model });
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const thumbnailSrc = product.is_combo
    ? getComboImage(product)
    : product.image_url ||
      (Array.isArray(product.images) && product.images[0]) ||
      '/subcategories/iphone.jpg';

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col bg-white border border-[#E5E5E3] hover:border-[#141414] rounded-[6px] overflow-hidden transition-all cursor-pointer shadow-2xs h-full"
      role="article"
      aria-label={`${product.name}, Price ₹${sellingPrice}`}
    >
      {/* Real photo at fixed 4:5 aspect ratio on #F4F3F0 */}
      <div className="relative aspect-[4/5] w-full bg-[#F4F3F0] overflow-hidden">
        {product.is_combo ? (
          <div className="w-full h-full p-2 flex items-center justify-center">
            <ComboThumbnail combo={product} className="w-full h-full" />
          </div>
        ) : (
          <img
            src={thumbnailSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '/subcategories/iphone.jpg';
            }}
          />
        )}

        {/* Quiet Guest Favorite Heart Button top-right (Rule 19: white circle, #141414 icon, filled accent when saved) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
          title={isFav ? 'Remove from favourites' : 'Add to favourites'}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus:outline-none"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'fill-[#B0521F] text-[#B0521F]' : 'text-[#141414]'
            }`}
          />
        </button>
      </div>

      {/* Card Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div className="space-y-1.5">
          {/* Color Dots below image (Rule 15: show all siblings, sold out crossed out) */}
          {!product.is_combo && siblingDots.length > 0 && (
            <div className="pb-0.5">
              <ColorSwatch colors={siblingDots} size="xs" />
            </div>
          )}

          {/* Product name in Poppins 500, sentence case, up to 2 lines */}
          <h3 className="font-sans font-medium text-[14px] sm:text-[15px] text-[#141414] group-hover:text-[#B0521F] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Price and Quick-Add CTA */}
        <div className="mt-3 pt-2.5 border-t border-[#E5E5E3] space-y-2.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-sans font-semibold text-[15px] sm:text-[16px] text-[#141414] tabular-nums">
              {formatINR(sellingPrice)}
            </span>
            {hasDiscount && (
              <span className="font-sans text-[12px] sm:text-[13px] text-[#6B6B6B] line-through tabular-nums">
                {formatINR(mrp)}
              </span>
            )}
            {/* Rule 18: Discount shown once per card as 'N% off' next to the price */}
            {hasDiscount && (
              <span className="text-[12px] font-semibold text-[#B0521F]">
                {discountPercent}% off
              </span>
            )}
          </div>

          {/* Quick-Add Button (Rule 6) */}
          {isInBag ? (
            <div className="w-full py-2 px-3 bg-[#F4F3F0] text-[#6B6B6B] text-[12px] font-medium rounded-[6px] text-center flex items-center justify-center gap-1.5 border border-[#E5E5E3]">
              <Check className="w-3.5 h-3.5 text-[#141414]" />
              <span>In bag</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`w-full py-2 px-3 text-[12px] sm:text-[13px] font-semibold rounded-[6px] transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                outlinedButton
                  ? 'border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white bg-transparent'
                  : 'bg-[#141414] hover:bg-[#B0521F] text-white'
              }`}
            >
              {isDirectAdd ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to bag</span>
                </>
              ) : fitsSavedPhone ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add for {savedPhone.model}</span>
                </>
              ) : product.is_combo ? (
                <span>View combo</span>
              ) : (
                <span>Choose model</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
