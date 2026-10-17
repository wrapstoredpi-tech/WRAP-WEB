import React, { useMemo } from 'react';
import { useProductsContext } from '../../context/ProductsContext';
import { ProductCard } from '../home/ProductCard';

export function RelatedProducts({ currentProductId, currentProduct }) {
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
    <section className="pt-12 sm:pt-16 border-t border-[#E5E5E3] space-y-6">
      <div className="space-y-1">
        <h2 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          Related products
        </h2>
        <p className="text-[14px] text-[#6B6B6B]">
          Other cases and accessories matched to your setup.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {related.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
          />
        ))}
      </div>
    </section>
  );
}

export default RelatedProducts;
