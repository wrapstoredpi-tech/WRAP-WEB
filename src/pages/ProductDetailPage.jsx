import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductsContext } from '../context/ProductsContext';
import { Breadcrumbs } from '../components/product/Breadcrumbs';
import { ImageGallery } from '../components/product/ImageGallery';
import { ProductInfoPanel } from '../components/product/ProductInfoPanel';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { StickyMobileCartBar } from '../components/product/StickyMobileCartBar';
import { Button } from '../components/ui/Button';
import { ArrowLeft, PackageX, Loader2 } from 'lucide-react';

export function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const buyButtonRef = useRef(null);

  // Find product from the shared live product catalog
  const { products, isLoading } = useProductsContext();
  const product = products.find((p) => p.id === id || p.product_id === id);

  // Selected color variant state
  const [selectedColor, setSelectedColor] = useState('');

  // Update selected color when product changes
  useEffect(() => {
    if (product?.color_variants && product.color_variants.length > 0) {
      setSelectedColor(product.color_variants[0]);
    } else {
      setSelectedColor('');
    }
  }, [product]);

  // Scroll to top whenever ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // Loading state while catalog is being fetched
  if (isLoading) {
    return (
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-neutral-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-body-sm">Loading product…</span>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="max-w-md mx-auto space-y-6 bg-neutral-100 p-8 border border-neutral-200">
          <div className="w-12 h-12 bg-neutral-200 text-neutral-600 rounded-full flex items-center justify-center mx-auto">
            <PackageX className="w-6 h-6 stroke-1" />
          </div>
          <div className="space-y-2">
            <h1 className="text-h2 font-medium text-neutral-900">Product Not Found</h1>
            <p className="text-body-sm text-neutral-500">
              The object you are looking for may have been archived or removed from the catalog.
            </p>
          </div>
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Catalog
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 w-full">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        category={product.category}
        productName={product.name}
        onCategoryClick={() => {}}
      />

      {/* Main Product Presentation (Gallery + Info Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-4 sm:pt-6">
        {/* Left: Interactive Image Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} product={product} />
        </div>

        {/* Right: Product Info Panel */}
        <div className="lg:col-span-5">
          <ProductInfoPanel
            product={product}
            onAddToCart={onAddToCart}
            buyButtonRef={buyButtonRef}
            selectedColorState={{ color: selectedColor, setColor: setSelectedColor }}
          />
        </div>
      </div>

      {/* Related Products Row */}
      <RelatedProducts
        currentProductId={product.id}
        category={product.category}
        currentProduct={product}
        onAddToCart={onAddToCart}
      />

      {/* Sticky Mobile Add to Cart Bar */}
      <StickyMobileCartBar
        product={product}
        buyButtonRef={buyButtonRef}
        selectedColor={selectedColor}
        onAddToCart={onAddToCart}
      />
    </main>
  );
}

export default ProductDetailPage;
