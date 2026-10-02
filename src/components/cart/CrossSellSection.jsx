import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useProductsContext } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';

export function CrossSellSection({ onAdded, className = '', title = 'Complete the ecosystem' }) {
  const { products = [] } = useProductsContext();
  const { cartItems = [], addItem } = useCart();
  const { savedPhone } = usePhoneContext();

  // 1. Determine target phone brand & model from savedPhone or infer from cart items
  const targetPhoneContext = useMemo(() => {
    if (savedPhone && savedPhone.model) {
      return {
        brand: savedPhone.brand || '',
        model: savedPhone.model || '',
      };
    }

    // Infer from cart items
    for (const item of cartItems) {
      const p = products.find((prod) => prod.id === item.productId);
      if (p && p.mobile_brand && p.mobile_brand !== 'Universal') {
        return {
          brand: p.mobile_brand,
          model: p.mobile_model || '',
        };
      }
    }

    return null;
  }, [savedPhone, cartItems, products]);

  // 2. Filter cross-sell accessories (non-case products)
  const crossSellProducts = useMemo(() => {
    const cartProductIds = new Set(cartItems.map((i) => i.productId));

    // Exclude cases and items already in cart
    const nonCaseProducts = products.filter((p) => {
      if (cartProductIds.has(p.id)) return false;
      if (p.stock_status === 'OUT_OF_STOCK' || p.available_stock === 0) return false;
      const cat = (p.category || '').toLowerCase();
      return !cat.includes('case');
    });

    if (nonCaseProducts.length === 0) {
      // Fallback to any in-stock non-cart product if no dedicated accessories exist
      return products
        .filter((p) => !cartProductIds.has(p.id) && p.stock_status !== 'OUT_OF_STOCK')
        .slice(0, 4);
    }

    let matching = [];

    if (targetPhoneContext) {
      const targetM = (targetPhoneContext.model || '').toLowerCase().trim();
      const targetB = (targetPhoneContext.brand || '').toLowerCase().trim();

      matching = nonCaseProducts.filter((p) => {
        const brandMatch = p.mobile_brand && targetB && p.mobile_brand.toLowerCase() === targetB;
        const modelMatch =
          targetM &&
          Array.isArray(p.compatible_models) &&
          p.compatible_models.some((m) => m.toLowerCase().includes(targetM));
        const isUniversal =
          p.mobile_brand === 'Universal' ||
          !p.compatible_models ||
          p.compatible_models.length === 0 ||
          p.compatible_models.includes('Universal');

        return modelMatch || brandMatch || isUniversal;
      });
    }

    // If matches are few, pad with featured or popular accessories
    if (matching.length < 4) {
      const remaining = nonCaseProducts.filter((p) => !matching.some((m) => m.id === p.id));
      const sortedRemaining = [...remaining].sort((a, b) => {
        if (a.online_featured && !b.online_featured) return -1;
        if (!a.online_featured && b.online_featured) return 1;
        return 0;
      });
      matching = [...matching, ...sortedRemaining];
    }

    return matching.slice(0, 4);
  }, [products, cartItems, targetPhoneContext]);

  if (crossSellProducts.length === 0) return null;

  const handleAddCrossSell = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = addItem(product, 1);
    if (success && onAdded) {
      onAdded(product);
    }
  };

  return (
    <section className={`space-y-4 pt-8 border-t border-[#E7E5E4] ${className}`}>
      <div className="space-y-0.5">
        <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#141414] tracking-tight">
          {title}
        </h3>
        <p className="text-[13px] text-[#666664] font-normal">
          {targetPhoneContext?.model
            ? `Curated accessories for your ${targetPhoneContext.model}`
            : 'Thoughtful additions for your everyday carry setup'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {crossSellProducts.map((product) => {
          return (
            <div
              key={product.id}
              className="group bg-white rounded-lg border border-[#E7E5E4] hover:border-[#141414] p-3 flex flex-col justify-between transition-colors shadow-xs"
            >
              <Link
                to={`/product/${product.id}`}
                className="block aspect-[4/5] bg-[#F5F5F4] rounded-md overflow-hidden mb-2.5 relative"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </Link>

              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-normal text-[#666664] block">
                    {product.category}
                  </span>
                  <Link
                    to={`/product/${product.id}`}
                    className="text-[13px] font-semibold text-[#141414] hover:text-[#9E381A] transition-colors line-clamp-1 block"
                  >
                    {product.name}
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[13px] font-semibold text-[#141414]">
                    {formatINR(product.selling_price)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleAddCrossSell(product, e)}
                    className="h-7 px-2.5 bg-[#FAFAF9] hover:bg-[#141414] text-[#141414] hover:text-white border border-[#E7E5E4] hover:border-[#141414] rounded-md text-[12px] font-semibold inline-flex items-center gap-1 transition-colors"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CrossSellSection;
