import React, { useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductsContext } from '../context/ProductsContext';
import { Breadcrumbs } from '../components/product/Breadcrumbs';
import { ImageGallery } from '../components/product/ImageGallery';
import { ProductInfoPanel } from '../components/product/ProductInfoPanel';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { StickyMobileCartBar } from '../components/product/StickyMobileCartBar';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const buyButtonRef = useRef(null);

  const { products, isLoading } = useProductsContext();
  const product = products.find((p) => p.id === id || p.product_id === id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (isLoading) {
    return (
      <main className="flex-grow max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-12 py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#666664]">
          <Loader2 className="w-6 h-6 animate-spin text-[#141414]" />
          <span className="text-[13px] font-normal">Loading object...</span>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-grow max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-12 py-24 text-center">
        <div className="max-w-md mx-auto space-y-5 bg-white p-8 rounded-lg border border-[#E7E5E4]">
          <div className="space-y-1.5">
            <h1 className="text-[20px] font-semibold text-[#141414]">Object Not Found</h1>
            <p className="text-[13px] text-[#666664] font-normal">
              The requested object is no longer available in the catalog.
            </p>
          </div>
          <Link to="/" className="inline-block pt-2">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Catalog
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-12 py-4 sm:py-8 w-full space-y-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        category={product.category}
        productName={product.name}
        onCategoryClick={() => {}}
      />

      {/* Main Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} product={product} />
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-5">
          <ProductInfoPanel
            product={product}
            onAddToCart={onAddToCart}
            buyButtonRef={buyButtonRef}
          />
        </div>
      </div>

      {/* Related Objects */}
      <RelatedProducts
        currentProductId={product.id}
        category={product.category}
        currentProduct={product}
        onAddToCart={onAddToCart}
      />

      {/* Mobile Sticky Bar */}
      <StickyMobileCartBar
        product={product}
        buyButtonRef={buyButtonRef}
        onAddToCart={onAddToCart}
      />
    </main>
  );
}

export default ProductDetailPage;
