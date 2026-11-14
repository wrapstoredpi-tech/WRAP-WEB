import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import { ImageGallery } from '../components/product/ImageGallery';
import { ProductInfoPanel } from '../components/product/ProductInfoPanel';
import { StickyMobileCartBar } from '../components/product/StickyMobileCartBar';
import { modelToSlug } from '../lib/models';
import { setPageMeta } from '../lib/seo';

export function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const buyButtonRef = useRef(null);
  const modelSelectRef = useRef(null);

  const { products, isLoading, error, refetch } = useProductsContext();
  const { savedPhone } = usePhoneContext();

  const product = products.find((p) => p.id === id || p.product_id === id);

  const isCombo = Boolean(product?.is_combo || product?.product_type === 'combo');
  const compatibleModels = product?.compatible_models || [];
  const isCase =
    !isCombo &&
    ((product?.category || '').toLowerCase().includes('case') ||
      (Array.isArray(product?.categories) && product.categories.some((c) => c.toLowerCase().includes('case'))));
  const needsModelSelection = isCase || compatibleModels.length > 0;

  // Selected phone model state:
  // Priority: 1. URL search param ?model=..., 2. savedPhone if compatible, 3. Empty prompt
  // (Must NOT modify savedPhone)
  const paramModel = searchParams.get('model');

  const resolveCompatibleModel = (input, list = []) => {
    if (!input || !list.length) return input || '';
    const target = modelToSlug(input);
    const found = list.find(
      (m) => modelToSlug(m) === target || (m || '').toLowerCase().trim() === input.toLowerCase().trim()
    );
    return found || null;
  };

  const initialModel = useMemo(() => {
    if (paramModel) {
      const match = resolveCompatibleModel(paramModel, compatibleModels);
      if (match) return match;
    }
    if (savedPhone?.model) {
      const match = resolveCompatibleModel(savedPhone.model, compatibleModels);
      if (match) return match;
    }
    return '';
  }, [paramModel, savedPhone?.model, compatibleModels]);

  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [modelError, setModelError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Page title and meta (Rule 8: product "<Name> for <models> | WrapStore" plus OG image)
  useEffect(() => {
    if (product) {
      const isCombo = Boolean(product.is_combo || product.product_type === 'combo');
      const compList = Array.isArray(product.compatible_models) ? product.compatible_models : [];
      let title;
      let description;

      if (isCombo && product.empty_intersection) {
        console.warn(
          `[ProductDetailPage] Combo "${product.name}" (id: ${product.id}) has an empty model intersection across its components - this combo is not available for any single phone model.`
        );
        title = `${product.name} | WrapStore`;
        description = 'This combo is not available for any single phone model.';
      } else {
        const modelsStr = compList.length > 0 ? compList.slice(0, 3).join(', ') : 'All Devices';
        title = `${product.name} for ${modelsStr} | WrapStore`;
        description =
          product.description && product.description.length >= 20
            ? product.description
            : `${product.name} available at WrapStore Dharmapuri.`;
      }
      const image =
        product.image_url || (Array.isArray(product.images) && product.images[0]) || '';
      setPageMeta({ title, description, image });
    }
  }, [product]);

  // Scroll to top on id change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (product) {
      setSelectedModel(initialModel);
      setModelError(false);
    }
  }, [id, product, initialModel]);

  // Listen for custom toast events (e.g. from share)
  useEffect(() => {
    const handleToast = (e) => {
      setToastMessage(e.detail || 'Link copied');
      setTimeout(() => setToastMessage(''), 2500);
    };
    window.addEventListener('wrapstore:toast', handleToast);
    return () => window.removeEventListener('wrapstore:toast', handleToast);
  }, []);

  const isModelSelected = Boolean(
    selectedModel &&
      (!compatibleModels.length || compatibleModels.includes(selectedModel))
  );

  // Derive brand for breadcrumbs
  const derivedBrand = useMemo(() => {
    if (savedPhone?.brand) return savedPhone.brand;
    if (selectedModel) {
      if (/iphone/i.test(selectedModel)) return 'Apple';
      if (/galaxy|samsung/i.test(selectedModel)) return 'Samsung';
    }
    if (product?.mobile_brand) return product.mobile_brand;
    return 'Apple';
  }, [savedPhone, selectedModel, product]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'WrapStore Case',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Link copied');
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-20 flex items-center justify-center">
        <p className="text-[14px] text-[#6B6B6B]">Loading product details...</p>
      </main>
    );
  }

  if (error && (!products || products.length === 0)) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-20 flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#141414] tracking-[-0.025em]">
          Couldn't load products, retrying
        </h1>
        <p className="text-[14px] text-[#6B6B6B] max-w-md leading-relaxed">
          We are having trouble connecting to the product catalogue. Reconnecting automatically...
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center min-h-[46px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white font-semibold text-[14px] rounded-[6px] transition-colors shadow-xs"
        >
          Retry now
        </button>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.025em]">Product not found</h1>
        <p className="text-[14px] text-[#6B6B6B]">The product you requested could not be located in our catalog.</p>
        <div className="pt-2">
          <Link
            to="/cases"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-[#B0521F] text-white text-[14px] font-semibold rounded-[6px] hover:bg-[#964317] transition-colors"
          >
            Browse Cases
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-4 md:py-6 space-y-4 sm:space-y-6 pb-28 lg:pb-16 relative">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#141414] text-white text-[13px] font-medium px-4 py-2 rounded-[6px] shadow-lg animate-fadeIn select-none">
          {toastMessage}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          DESKTOP BREADCRUMBS:
          For combos: Home / Combos / <name>
          For cases: Home / Cases / <Brand> / <Model> / <Product Name>
          For accessories: Home / <Category> / <Subcategory> / <Product Name>
          ─────────────────────────────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="hidden lg:flex text-[13px] text-[#6B6B6B] items-center gap-2 flex-wrap px-4 sm:px-0">
        <Link to="/" className="hover:text-[#141414] transition-colors">
          Home
        </Link>
        <span className="text-[#E5E5E3] select-none">/</span>

        {isCombo ? (
          <>
            <Link to="/combos" className="hover:text-[#141414] transition-colors">
              Combos
            </Link>
          </>
        ) : isCase ? (
          <>
            <Link to="/cases" className="hover:text-[#141414] transition-colors">
              Cases
            </Link>
            <span className="text-[#E5E5E3] select-none">/</span>
            <Link
              to={`/cases?brand=${encodeURIComponent(derivedBrand)}`}
              className="hover:text-[#141414] transition-colors"
            >
              {derivedBrand}
            </Link>
            {selectedModel && (
              <>
                <span className="text-[#E5E5E3] select-none">/</span>
                <Link
                  to={`/cases/${derivedBrand.toLowerCase()}/${modelToSlug(selectedModel)}`}
                  className="hover:text-[#141414] transition-colors"
                >
                  {selectedModel}
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <Link
              to={`/?category=${encodeURIComponent(product.category || 'Accessories')}`}
              className="hover:text-[#141414] transition-colors"
            >
              {product.category || 'Accessories'}
            </Link>
            {product.subcategory && (
              <>
                <span className="text-[#E5E5E3] select-none">/</span>
                <Link
                  to={`/?category=${encodeURIComponent(product.category || 'Accessories')}&subcategory=${encodeURIComponent(product.subcategory)}`}
                  className="hover:text-[#141414] transition-colors"
                >
                  {product.subcategory}
                </Link>
              </>
            )}
          </>
        )}

        <span className="text-[#E5E5E3] select-none">/</span>
        <span className="text-[#141414] font-medium truncate max-w-[240px]">
          {product.name}
        </span>
      </nav>

      {/* ───────────────────────────────────────────────────────────────────────────
          TWO COLUMNS (Desktop):
          Left (about 55%): Large #F4F3F0 image panel sticky while right column scrolls.
          Right (about 45%): Product details, swatches, Add to Bag, Complete your setup, accordions.
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-14 items-start">
        
        {/* Left Column (~55%): Full width on mobile (no side margins), Sticky on Desktop */}
        <div className="w-full lg:w-[55%] shrink-0 lg:sticky lg:top-[96px] self-start">
          <ImageGallery
            images={product.images}
            product={product}
            onShare={handleShare}
          />
        </div>

        {/* Right Column (~45%): Scrolls naturally, padded on mobile */}
        <div className="w-full lg:w-[45%] px-4 sm:px-0">
          <ProductInfoPanel
            product={product}
            onAddToCart={onAddToCart}
            buyButtonRef={buyButtonRef}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            modelError={modelError}
            setModelError={setModelError}
            modelSelectRef={modelSelectRef}
            isModelSelected={isModelSelected}
            needsModelSelection={needsModelSelection}
          />
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          STICKY MOBILE 52px ADD TO BAG BAR (< 1024px)
          ─────────────────────────────────────────────────────────────────────────── */}
      <StickyMobileCartBar
        product={product}
        selectedModel={selectedModel}
        isModelSelected={isModelSelected}
        needsModelSelection={needsModelSelection}
        onAddToCart={onAddToCart}
        modelSelectRef={modelSelectRef}
        setModelError={setModelError}
      />

    </main>
  );
}

export default ProductDetailPage;
