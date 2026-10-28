import React, { useMemo, useState } from 'react';
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
  const [addedIds, setAddedIds] = useState(new Set());

  // Determine target phone brand & model from savedPhone or cart items
  const targetPhoneContext = useMemo(() => {
    if (savedPhone && savedPhone.model) {
      return {
        brand: savedPhone.brand || '',
        model: savedPhone.model || '',
      };
    }

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

  // Filter cross-sell accessories (non-case products, matched to phone + universal accessories included)
  const crossSellProducts = useMemo(() => {
    const cartProductIds = new Set(cartItems.map((i) => i.productId));

    const nonCaseProducts = products.filter((p) => {
      if (cartProductIds.has(p.id)) return false;
      if (p.stock_status === 'OUT_OF_STOCK' || (p.available_stock ?? p.current_stock ?? 0) === 0) return false;
      const cat = (p.category || '').toLowerCase();
      return !cat.includes('case');
    });

    if (nonCaseProducts.length === 0) {
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

    if (matching.length < 4) {
      const remaining = nonCaseProducts.filter((p) => !matching.some((m) => m.id === p.id));
      matching = [...matching, ...remaining];
    }

    return matching.slice(0, 4);
  }, [products, cartItems, targetPhoneContext]);

  if (crossSellProducts.length === 0) return null;

  const handleAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = addItem(product, 1, 'Universal');
    if (success) {
      setAddedIds((prev) => new Set(prev).add(product.id));
      if (onAdded) onAdded(product);
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }, 2000);
    }
  };

  return (
    <section className={`pt-8 border-t border-[#E5E5E3] space-y-4 ${className}`}>
      <div className="space-y-0.5">
        <h2 className="text-[20px] font-semibold text-[#141414]">
          {title}
        </h2>
        <p className="text-[12px] text-[#6B6B6B]">
          {targetPhoneContext
            ? `Recommended add-ons for your ${targetPhoneContext.model}`
            : 'Essential chargers, screen guards and cables'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {crossSellProducts.map((p) => {
          const isJustAdded = addedIds.has(p.id);
          return (
            <div
              key={p.id}
              className="bg-white border border-[#E5E5E3] rounded-[6px] p-3 flex flex-col justify-between hover:border-[#141414] transition-colors"
            >
              <Link to={`/product/${p.id}`} className="space-y-2.5 block">
                <div className="aspect-[4/5] bg-white rounded-[6px] overflow-hidden">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#141414] line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[14px] text-[#141414] font-semibold pt-0.5">
                    {formatINR(p.selling_price)}
                  </p>
                </div>
              </Link>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => handleAdd(p, e)}
                  disabled={isJustAdded}
                  className={`w-full min-h-[44px] px-3 py-1.5 text-[12px] font-semibold rounded-[6px] border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isJustAdded
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white hover:bg-[#FAFAF9] text-[#141414] border-[#E5E5E3]'
                  }`}
                >
                  {isJustAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CrossSellSection;
