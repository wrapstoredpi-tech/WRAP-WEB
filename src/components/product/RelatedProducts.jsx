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

    // Sort: same subcategory first, then same category
    candidates.sort((a, b) => {
      const aSub = a.subcategory === currentSubcategory ? 2 : a.category === currentCategory ? 1 : 0;
      const bSub = b.subcategory === currentSubcategory ? 2 : b.category === currentCategory ? 1 : 0;
      return bSub - aSub;
    });

    return candidates.slice(0, 4);
  }, [products, currentProductId, currentProduct]);

  if (related.length === 0) return null;

  return (
    <section className="pt-12 sm:pt-16 border-t border-neutral-200">
      <div className="space-y-6">
        <div>
          <span className="text-xs uppercase font-semibold text-neutral-500 tracking-wide">
            Curated Recommendations
          </span>
          <h2 className="text-display font-semibold text-neutral-900 tracking-tight">
            You May Also Like
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
