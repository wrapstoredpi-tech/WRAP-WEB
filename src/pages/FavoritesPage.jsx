import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useProductsContext } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../lib/currency';
import { ColorSwatch, getValidColors } from '../components/ui/ColorSwatch';

export function FavoritesPage() {
  const { favoriteIds, removeFromFavorites } = useFavorites();
  const { products, isLoading: isProductsLoading } = useProductsContext();
  const { addItem } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Track which product IDs were just added to cart
  const [addedItemIds, setAddedItemIds] = useState(new Set());
  // Track selected model per product card in favorites
  const [selectedModels, setSelectedModels] = useState({});

  // Filter products that are in favoriteIds
  const favoriteProducts = React.useMemo(() => {
    if (!products || favoriteIds.size === 0) return [];
    return products.filter((p) => favoriteIds.has(String(p.id)) || favoriteIds.has(String(p.product_id)));
  }, [products, favoriteIds]);

  const handleModelChange = (productId, model) => {
    setSelectedModels((prev) => ({ ...prev, [productId]: model }));
  };

  const handleAddToCart = (product) => {
    const isOutOfStock =
      product.stock_status === 'OUT_OF_STOCK' ||
      (product.available_stock !== undefined && product.available_stock <= 0);
    if (isOutOfStock) return;

    const compatibleModels = product.compatible_models || [];
    const isCase =
      (product.category || '').toLowerCase().includes('case') ||
      (Array.isArray(product.categories) && product.categories.some((c) => c.toLowerCase().includes('case')));
    const needsModelSelection = isCase || compatibleModels.length > 0;

    const chosenModel = selectedModels[product.id] || (compatibleModels.length === 1 ? compatibleModels[0] : null);

    // If case requires model and none chosen yet, navigate to detail page to select exact model
    if (needsModelSelection && !chosenModel && compatibleModels.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    const validColors = getValidColors(product);
    const color = validColors.length > 0 ? validColors[0] : null;

    addItem(product, 1, chosenModel || 'Universal', color);

    setAddedItemIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2400);
  };

  const handleAddAllInStock = () => {
    let addedCount = 0;
    favoriteProducts.forEach((product) => {
      const isOutOfStock =
        product.stock_status === 'OUT_OF_STOCK' ||
        (product.available_stock !== undefined && product.available_stock <= 0);
      if (!isOutOfStock) {
        const compatibleModels = product.compatible_models || [];
        const chosenModel = selectedModels[product.id] || (compatibleModels.length === 1 ? compatibleModels[0] : 'Universal');
        const validColors = getValidColors(product);
        const color = validColors.length > 0 ? validColors[0] : null;

        addItem(product, 1, chosenModel, color);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      navigate('/cart');
    }
  };

  if (isAuthLoading || isProductsLoading) {
    return (
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Guest view: prompt login to view and sync favourites
  if (!user) {
    return (
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
        <div className="max-w-md mx-auto space-y-4 bg-white border border-[#E5E5E3] rounded-2xl p-8 sm:p-10 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FAF9F6] border border-[#E5E5E3] flex items-center justify-center mx-auto text-[#DC2626]">
            <Heart className="w-7 h-7 fill-red-50 text-[#DC2626]" />
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-semibold text-[#141414] tracking-tight">
            Sign in to view favourites
          </h1>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            Create an account or sign in to save your favourite products, view them on any device, and quickly buy them anytime.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login?returnTo=/favorites"
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-[14px] font-semibold rounded-full transition-colors shadow-xs"
            >
              Sign In or Register
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-[46px] px-6 py-2.5 border border-[#E5E5E3] hover:border-[#141414] text-[#141414] text-[14px] font-semibold rounded-full transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-8 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E3]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center">
              <Heart className="w-4 h-4 fill-[#DC2626]" />
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold text-[#141414] tracking-[-0.01em]">
              My Favourites
            </h1>
          </div>
          <p className="text-[14px] text-[#6B6B6B]">
            {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item saved' : 'items saved'} in your account
          </p>
        </div>

        {favoriteProducts.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddAllInStock}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold rounded-full transition-colors shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add In-Stock to Bag</span>
            </button>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-[14px] text-[#B0521F] font-semibold hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        )}
      </div>

      {/* Empty State */}
      {favoriteProducts.length === 0 ? (
        <div className="max-w-md mx-auto text-center space-y-4 py-16 px-4 bg-white border border-[#E5E5E3] rounded-2xl p-8">
          <div className="w-14 h-14 rounded-full bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center mx-auto text-[#6B6B6B]">
            <Heart className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-[22px] font-semibold text-[#141414]">Your favourites list is empty</h2>
            <p className="text-[14px] text-[#6B6B6B]">
              Tap the heart icon on any product to save it here and buy it anytime.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/?category=Mobile%20Cases"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-[14px] font-semibold rounded-full transition-colors shadow-xs"
            >
              Explore Phone Cases
            </Link>
          </div>
        </div>
      ) : (
        /* Favourites Product Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favoriteProducts.map((product) => {
            const isOutOfStock =
              product.stock_status === 'OUT_OF_STOCK' ||
              (product.available_stock !== undefined && product.available_stock <= 0);
            const hasDiscount = product.mrp > product.selling_price;
            const compatibleModels = product.compatible_models || [];
            const isCase =
              (product.category || '').toLowerCase().includes('case') ||
              (Array.isArray(product.categories) && product.categories.some((c) => c.toLowerCase().includes('case')));
            const needsModel = isCase || compatibleModels.length > 0;
            const validColors = getValidColors(product);
            const isAdded = addedItemIds.has(product.id);

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-[#E5E5E3] hover:border-[#141414] transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs relative"
              >
                {/* Top Image area */}
                <div className="relative aspect-[4/5] w-full bg-[#FAFAF9] overflow-hidden">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                        isOutOfStock ? 'opacity-50 grayscale' : ''
                      }`}
                      loading="lazy"
                    />
                  </Link>

                  {/* Remove from Favourites Button */}
                  <button
                    type="button"
                    onClick={() => removeFromFavorites(product.id)}
                    aria-label="Remove from favourites"
                    title="Remove from favourites"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#DC2626] flex items-center justify-center border border-[#E5E5E3] shadow-xs transition-transform active:scale-90 cursor-pointer z-10"
                  >
                    <Trash2 className="w-4 h-4 text-[#6B6B6B] hover:text-[#DC2626] transition-colors" />
                  </button>

                  {/* Combo or New Badge */}
                  {product.is_combo ? (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="inline-flex items-center text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#B0521F] text-white">
                        Combo
                      </span>
                    </div>
                  ) : product.isNewArrival ? (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="inline-flex items-center text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[4px] bg-[#141414] text-white">
                        New
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Card Content & Buy Action */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold tracking-wide uppercase text-[#6B6B6B]">
                      {product.category || 'Mobile Accessories'}
                    </p>
                    <Link
                      to={`/product/${product.id}`}
                      className="block text-[15px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-[16px] font-semibold text-[#141414]">
                        {formatINR(product.selling_price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[13px] text-[#6B6B6B] line-through">
                          {formatINR(product.mrp)}
                        </span>
                      )}
                    </div>

                    {/* Colors Preview */}
                    {validColors.length > 0 && (
                      <div className="pt-0.5">
                        <ColorSwatch colors={validColors.slice(0, 4)} size="xs" />
                      </div>
                    )}

                    {/* Model Selector if applicable */}
                    {needsModel && compatibleModels.length > 1 && (
                      <div className="pt-1">
                        <div className="relative">
                          <select
                            value={selectedModels[product.id] || ''}
                            onChange={(e) => handleModelChange(product.id, e.target.value)}
                            className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-[12px] text-[#141414] appearance-none cursor-pointer pr-7 focus:outline-none focus:border-[#141414]"
                          >
                            <option value="">Select Phone Model</option>
                            {compatibleModels.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buy / Add to Bag Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                      className={`w-full min-h-[42px] px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        isOutOfStock
                          ? 'bg-[#E5E5E3] text-[#737373] cursor-not-allowed'
                          : isAdded
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-[#141414] hover:bg-[#262626] text-white active:scale-[0.98]'
                      }`}
                    >
                      {isOutOfStock ? (
                        <span>Out of Stock</span>
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Buy Now • Add to Bag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default FavoritesPage;
