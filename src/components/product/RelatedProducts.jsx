import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductsContext } from '../../context/ProductsContext';
import { ProductCard } from '../home/ProductCard';

export function RelatedProducts({ currentProductId, category, currentProduct, onAddToCart }) {
  const navigate = useNavigate();
  const { products } = useProductsContext();

  const related = useMemo(() => {
    const targetBrand = currentProduct?.mobile_brand || null;

    const candidates = products.filter((p) => p.id !== currentProductId);

    // Score candidates based on compatibility and category match
    const scored = candidates.map((p) => {
      let score = 0;

      // 1. Primary boost for same category
      if (p.category === category) score += 10;

      // 2. Secondary boost for sharing compatible brand
      if (targetBrand && p.mobile_brand === targetBrand) score += 5;

      // 3. Minor boost for in-stock (using stock_status from view)
      if (p.stock_status !== 'OUT_OF_STOCK') score += 1;

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((s) => s.product);
  }, [products, currentProductId, category, currentProduct]);

  if (related.length === 0) return null;

  return (
    <section className="pt-16 sm:pt-24 border-t border-neutral-200">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial">
              Pairings &amp; Related Objects
            </span>
            <h2 className="text-h2 font-medium text-neutral-900 tracking-tight">
              Complete the Ecosystem
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-6 sm:gap-x-6 sm:gap-y-10">
          {related.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={onAddToCart}
              onQuickView={(p) => navigate(`/product/${p.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedProducts;
