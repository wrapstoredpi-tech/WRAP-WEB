import React, { useMemo } from 'react';
import { useProductsContext } from '../../context/ProductsContext';
import { ProductCard } from '../home/ProductCard';

export function RelatedProducts({ currentProductId, category, currentProduct, onAddToCart }) {
  const { products } = useProductsContext();

  const related = useMemo(() => {
    if (!currentProduct) return [];

    const currentSubcategory = currentProduct.subcategory;
    const currentCategory = currentProduct.category;

    const candidates = products.filter((p) => p.id !== currentProductId && p.product_id !== currentProductId);

    candidates.sort((a, b) => {
      const aSub = a.subcategory === currentSubcategory ? 2 : a.category === currentCategory ? 1 : 0;
      const bSub = b.subcategory === currentSubcategory ? 2 : b.category === currentCategory ? 1 : 0;
      return bSub - aSub;
    });

    return candidates.slice(0, 4);
  }, [products, currentProductId, currentProduct]);

  if (related.length === 0) return null;

  return (
    <section className="pt-12 sm:pt-16 border-t border-[#E7E5E4]">
      <div className="space-y-6">
        <div>
          <span className="text-[12px] uppercase font-semibold text-[#A8A29E] tracking-tight block mb-1">
            Related
          </span>
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#141414] tracking-tight">
            Complementary Objects
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {related.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedProducts;
