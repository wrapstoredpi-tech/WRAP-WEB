import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductsContext } from '../context/ProductsContext';
import { ImageGallery } from '../components/product/ImageGallery';
import { ProductInfoPanel } from '../components/product/ProductInfoPanel';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { StickyMobileCartBar } from '../components/product/StickyMobileCartBar';
import { ChevronRight } from 'lucide-react';

export function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams();
  const buyButtonRef = useRef(null);

  const { products, isLoading } = useProductsContext();
  const product = products.find((p) => p.id === id || p.product_id === id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (isLoading) {
    return (
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 flex items-center justify-center">
        <p className="text-[14px] text-[#6B6B6B]">Loading product details...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 text-center space-y-4">
        <h1 className="text-[28px] font-semibold text-[#141414]">Product Not Found</h1>
        <p className="text-[14px] text-[#6B6B6B]">The product you requested could not be located in our catalog.</p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-[#141414] text-white text-[14px] font-semibold rounded-[6px]"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[12px] text-[#6B6B6B] flex items-center gap-1.5">
        <Link to="/" className="hover:text-[#141414] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
        <Link
          to={`/?category=${encodeURIComponent(product.category || 'All')}`}
          className="hover:text-[#141414] transition-colors"
        >
          {product.category}
        </Link>
        {product.subcategory && (
          <>
            <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
            <Link
              to={`/?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subcategory)}`}
              className="hover:text-[#141414] transition-colors"
            >
              {product.subcategory}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
        <span className="text-[#141414] font-semibold truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main 2-Column Presentation: Gallery (55%) & Buy Box (45%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery: ~58% (7 of 12 cols) */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} product={product} />
        </div>

        {/* Buy Box: ~42% (5 of 12 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8">
          <ProductInfoPanel
            product={product}
            onAddToCart={onAddToCart}
            buyButtonRef={buyButtonRef}
          />
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        currentProductId={product.id}
        currentProduct={product}
      />

      {/* Mobile Sticky Add to Bag Bar */}
      <StickyMobileCartBar
        product={product}
        buyButtonRef={buyButtonRef}
        onAddToCart={onAddToCart}
      />
    </main>
  );
}

export default ProductDetailPage;
