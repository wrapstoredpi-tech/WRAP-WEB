import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductsContext } from '../context/ProductsContext';
import { ImageGallery } from '../components/product/ImageGallery';
import { ProductInfoPanel } from '../components/product/ProductInfoPanel';
import { ProductAccordions } from '../components/product/ProductAccordions';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { StickyMobileCartBar } from '../components/product/StickyMobileCartBar';

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
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 flex items-center justify-center">
        <p className="text-[14px] text-[#737373]">Loading product details...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 text-center space-y-4">
        <h1 className="font-sans text-[28px] font-semibold text-[#141414]">Product Not Found</h1>
        <p className="text-[14px] text-[#737373]">The product you requested could not be located in our catalog.</p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-[#141414] text-white text-[14px] font-semibold rounded-full hover:bg-[#262626] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 space-y-6 sm:space-y-10">
      {/* Breadcrumb matching mockup navigation */}
      <nav aria-label="Breadcrumb" className="text-[12px] sm:text-[13px] text-[#737373] flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-[#141414] transition-colors">
          Home
        </Link>
        <span className="text-[#A8A29E] select-none">›</span>
        <Link
          to={`/?category=${encodeURIComponent(product.category || 'All')}`}
          className="hover:text-[#141414] transition-colors"
        >
          {product.category || 'Mobile Cases'}
        </Link>
        {product.subcategory && (
          <>
            <span className="text-[#A8A29E] select-none">›</span>
            <Link
              to={`/?category=${encodeURIComponent(product.category || 'All')}&subcategory=${encodeURIComponent(product.subcategory)}`}
              className="hover:text-[#141414] transition-colors"
            >
              {product.subcategory}
            </Link>
          </>
        )}
        <span className="text-[#A8A29E] select-none">›</span>
        <span className="text-[#141414] font-medium truncate max-w-[200px] sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main 2-Column Presentation: Gallery & Accordions on Left (6 cols), Buy Box on Right (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
        {/* Left Column: Gallery on Desktop (6 cols - minimised 15% from 7 cols), with 4-row Accordions below gallery */}
        <div className="lg:col-span-6 space-y-6 lg:space-y-8">
          <ImageGallery images={product.images} product={product} />

          {/* Desktop Accordions: Below gallery, matching gallery width */}
          <div className="hidden lg:block">
            <ProductAccordions product={product} />
          </div>
        </div>

        {/* Right Column: Product Information & Purchase Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6 lg:space-y-8">
          <ProductInfoPanel
            product={product}
            onAddToCart={onAddToCart}
            buyButtonRef={buyButtonRef}
          />

          {/* Mobile Accordions: Placed below main product info on screens < lg */}
          <div className="block lg:hidden pt-2">
            <ProductAccordions product={product} />
          </div>
        </div>
      </div>

      {/* Related Products Section */}
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
