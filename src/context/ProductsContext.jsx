/**
 * src/context/ProductsContext.jsx
 * ─────────────────────────────────
 * Provides the live product catalog (from Supabase) to any component in the tree.
 * This avoids multiple simultaneous fetches when several components need product data.
 *
 * Exposes: { products, categories, subcategories, isLoading, error, refetch }
 */
import React, { createContext, useContext } from 'react';
import { useProducts } from '../lib/useProducts';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const value = useProducts();
  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

/**
 * useProductsContext()
 * Returns { products, categories, subcategories, isLoading, error, refetch }
 * from the nearest provider.
 */
export function useProductsContext() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProductsContext must be used within a ProductsProvider');
  }
  return ctx;
}

export default ProductsContext;
