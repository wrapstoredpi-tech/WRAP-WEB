import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import { ImageGallery } from '../components/product/ImageGallery';
import { ProductInfoPanel } from '../components/product/ProductInfoPanel';
import { StickyMobileCartBar } from '../components/product/StickyMobileCartBar';
import { modelToSlug, sortModels } from '../lib/models';
import { parseModels } from '../lib/useProducts';
import { getValidColors, isRealColor } from '../lib/colors';
import { setPageMeta } from '../lib/seo';

// Helper to extract a normalised single primary color name from a product
function extractProductColor(p) {
  if (!p) return null;
  const valids = getValidColors(p.color_variants || p.color);
  if (valids && valids.length > 0) return valids[0];
  if (typeof p.color_variants === 'string' && p.color_variants.trim() && isRealColor(p.color_variants)) {
    return p.color_variants.trim();
  }
  if (typeof p.color === 'string' && p.color.trim() && isRealColor(p.color)) {
    return p.color.trim();
  }
  return null;
}

// Helper to extract compatible models list from a product
function extractProductModels(p) {
  if (Array.isArray(p?.compatible_models) && p.compatible_models.length > 0) {
    return p.compatible_models;
  }
  if (p?.mobile_model && p.mobile_model !== 'Universal') {
    return parseModels(p.mobile_model);
  }
  return [];
}

export function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const buyButtonRef = useRef(null);
  const modelSelectRef = useRef(null);

  const { products, isLoading, error, refetch } = useProductsContext();
  const { savedPhone, selectPhone } = usePhoneContext();

  const product = products.find((p) => p.id === id || p.product_id === id);

  // Active product state for instantaneous in-memory image and detail switching
  const [activeProduct, setActiveProduct] = useState(product);

  useEffect(() => {
    setActiveProduct(product);
  }, [product]);

  const currentProduct = activeProduct || product;

  // Sibling / collection products representing model and color variations of this product design
  const relatedProducts = useMemo(() => {
    if (!currentProduct || !products?.length) return [];

    const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const currentNameClean = cleanStr(currentProduct.name);
    const currentSubClean = cleanStr(currentProduct.subcategory || currentProduct.category);
    const currentCollectionClean = cleanStr(currentProduct.collection);

    // 1. Exact match by normalized name in same subcategory
    if (currentNameClean) {
      const nameMatches = products.filter((p) => {
        const pNameClean = cleanStr(p.name);
        const pSubClean = cleanStr(p.subcategory || p.category);
        return pNameClean === currentNameClean && (!currentSubClean || !pSubClean || pSubClean === currentSubClean);
      });
      if (nameMatches.length > 0) return nameMatches;
    }

    // 2. Collection match (e.g. for design families that share collection name)
    if (currentCollectionClean && currentCollectionClean !== 'null' && currentCollectionClean !== 'undefined') {
      const colMatches = products.filter((p) => {
        const pColClean = cleanStr(p.collection);
        return pColClean === currentCollectionClean;
      });
      if (colMatches.length > 0) return colMatches;
    }

    return [currentProduct];
  }, [products, currentProduct]);

  // Aggregate all models across related products
  const availableModels = useMemo(() => {
    const seen = new Set();
    const modelsList = [];

    // Current product models first
    if (currentProduct) {
      extractProductModels(currentProduct).forEach((m) => {
        const trimmed = (m || '').trim();
        if (!trimmed || trimmed.toLowerCase() === 'universal') return;
        if (!seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          modelsList.push(trimmed);
        }
      });
    }

    // Related products models
    relatedProducts.forEach((p) => {
      extractProductModels(p).forEach((m) => {
        const trimmed = (m || '').trim();
        if (!trimmed || trimmed.toLowerCase() === 'universal') return;
        if (!seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          modelsList.push(trimmed);
        }
      });
    });

    return sortModels(modelsList);
  }, [relatedProducts, currentProduct]);

  const isCombo = Boolean(currentProduct?.is_combo || currentProduct?.product_type === 'combo');
  const isCase =
    !isCombo &&
    ((currentProduct?.category || '').toLowerCase().includes('case') ||
      (Array.isArray(currentProduct?.categories) && currentProduct.categories.some((c) => c.toLowerCase().includes('case'))));

  // Filter out 'Universal' or empty models so accessories/gadgets aren't treated as model-specific
  const validCompatibleModels = useMemo(() => {
    const raw = (Array.isArray(currentProduct?.compatible_models) && currentProduct.compatible_models.length > 0)
      ? currentProduct.compatible_models
      : parseModels(currentProduct?.mobile_model);
    return raw.filter((m) => {
      const trimmed = (m || '').trim();
      return trimmed && trimmed.toLowerCase() !== 'universal';
    });
  }, [currentProduct]);

  const allSelectableModels = useMemo(() => {
    return availableModels.length > 0 ? availableModels : validCompatibleModels;
  }, [availableModels, validCompatibleModels]);

  // Accessories without specific phone models should NOT prompt for phone model selection
  const needsModelSelection = !isCombo && allSelectableModels.length > 0;

  // Selected phone model state:
  // Priority: 1. URL search param ?model=..., 2. savedPhone if compatible, 3. Empty prompt
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
    if (!needsModelSelection) return '';
    const listToCheck = allSelectableModels;
    if (paramModel) {
      const match = resolveCompatibleModel(paramModel, listToCheck);
      if (match) return match;
    }
    if (savedPhone?.model) {
      const match = resolveCompatibleModel(savedPhone.model, listToCheck);
      if (match) return match;
    }
    return '';
  }, [needsModelSelection, paramModel, savedPhone?.model, allSelectableModels]);

  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [modelError, setModelError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const isModelSwitchRef = useRef(false);
  const prevIdRef = useRef(null);

  // All distinct valid colors across all related products (regardless of model)
  const allProductColors = useMemo(() => {
    if (!relatedProducts.length && !currentProduct) return [];
    const seen = new Set();
    const list = [];

    const curColor = extractProductColor(currentProduct);
    if (curColor && isRealColor(curColor)) {
      seen.add(curColor.toLowerCase());
      list.push(curColor);
    }

    relatedProducts.forEach((p) => {
      const c = extractProductColor(p);
      if (c && isRealColor(c) && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase());
        list.push(c);
      }
    });

    return list;
  }, [relatedProducts, currentProduct]);

  // Only colors available for the currently selected model (or all if no model selected)
  const availableColors = useMemo(() => {
    if (!relatedProducts.length && !currentProduct) return [];
    const seen = new Set();
    const list = [];

    const isModelChosen = Boolean(selectedModel && selectedModel.toLowerCase() !== 'universal');
    const relevantProducts = isModelChosen
      ? relatedProducts.filter((p) => {
          const models = extractProductModels(p).map((m) => m.trim().toLowerCase());
          return models.length === 0 || models.includes(selectedModel.trim().toLowerCase());
        })
      : relatedProducts;

    const curColor = extractProductColor(currentProduct);
    const isCurColorRelevant = relevantProducts.some((p) => {
      const c = extractProductColor(p);
      return c && curColor && c.trim().toLowerCase() === curColor.trim().toLowerCase();
    });

    if (curColor && isRealColor(curColor) && isCurColorRelevant) {
      seen.add(curColor.toLowerCase());
      list.push(curColor);
    }

    relevantProducts.forEach((p) => {
      const c = extractProductColor(p);
      if (c && isRealColor(c) && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase());
        list.push(c);
      }
    });

    if (list.length === 0 && curColor && isRealColor(curColor)) {
      list.push(curColor);
    }

    return list;
  }, [relatedProducts, currentProduct, selectedModel]);

  // Current active color (from URL param or current active product)
  const currentColor = useMemo(() => {
    const fromParam = searchParams.get('color');
    if (fromParam && availableColors.some((c) => c.toLowerCase() === fromParam.toLowerCase())) {
      const matched = availableColors.find((c) => c.toLowerCase() === fromParam.toLowerCase());
      if (matched) return matched;
    }
    const curColor = extractProductColor(currentProduct);
    if (curColor && availableColors.some((c) => c.toLowerCase() === curColor.toLowerCase())) {
      return curColor;
    }
    return availableColors.length > 0 ? availableColors[0] : (curColor || '');
  }, [currentProduct, availableColors, searchParams]);

  // Helper to find best matching product for (targetColor, targetModel)
  const findMatchingProduct = (targetColor, targetModel) => {
    if (!relatedProducts.length) return null;

    const normColor = (targetColor || '').trim().toLowerCase();
    const normModel = (targetModel || '').trim().toLowerCase();

    // 1. Both color and model provided -> exact match
    if (normColor && normModel) {
      const exactMatch = relatedProducts.find((p) => {
        const pColor = (extractProductColor(p) || '').trim().toLowerCase();
        const pModels = extractProductModels(p).map((m) => m.trim().toLowerCase());
        return pColor === normColor && pModels.includes(normModel);
      });
      if (exactMatch) return exactMatch;
    }

    // 2. Target model provided: prefer match with targetColor if possible, then in-stock
    if (normModel) {
      const modelMatches = relatedProducts.filter((p) => {
        const pModels = extractProductModels(p).map((m) => m.trim().toLowerCase());
        return pModels.includes(normModel);
      });
      if (modelMatches.length > 0) {
        if (normColor) {
          const sameColor = modelMatches.find((p) => (extractProductColor(p) || '').trim().toLowerCase() === normColor);
          if (sameColor) return sameColor;
        }
        const inStock = modelMatches.find((p) => (p.available_stock ?? p.current_stock ?? 0) > 0);
        return inStock || modelMatches[0];
      }
    }

    // 3. Target color provided: prefer in-stock
    if (normColor) {
      const colorMatches = relatedProducts.filter((p) => {
        const pColor = (extractProductColor(p) || '').trim().toLowerCase();
        return pColor === normColor;
      });
      if (colorMatches.length > 0) {
        const inStock = colorMatches.find((p) => (p.available_stock ?? p.current_stock ?? 0) > 0);
        return inStock || colorMatches[0];
      }
    }

    return null;
  };

  // Map each model to a product (prioritizing current active color)
  const modelToProductMap = useMemo(() => {
    const map = new Map();
    availableModels.forEach((m) => {
      const match = findMatchingProduct(currentColor, m) || findMatchingProduct(null, m);
      if (match) map.set(m, match);
    });
    return map;
  }, [availableModels, currentColor, relatedProducts]);

  // Availability map for colors relative to currently selected model
  const colorAvailabilityMap = useMemo(() => {
    const map = {};
    if (!selectedModel) {
      availableColors.forEach((c) => {
        map[c.toLowerCase()] = { available: true, inStock: true };
      });
      return map;
    }

    const normModel = selectedModel.toLowerCase();
    availableColors.forEach((c) => {
      const normColor = c.toLowerCase();
      const match = relatedProducts.find((p) => {
        const pColor = (extractProductColor(p) || '').trim().toLowerCase();
        const pModels = extractProductModels(p).map((m) => m.trim().toLowerCase());
        return pColor === normColor && (pModels.length === 0 || pModels.includes(normModel));
      });

      if (!match) {
        map[normColor] = { available: false, inStock: false };
      } else {
        const inStock = (match.available_stock ?? match.current_stock ?? 0) > 0;
        map[normColor] = { available: true, inStock };
      }
    });

    return map;
  }, [availableColors, selectedModel, relatedProducts]);

  // Handle phone model change in the dropdown
  const handleModelChange = (newModel) => {
    if (!newModel) {
      setSelectedModel('');
      return;
    }

    isModelSwitchRef.current = true;
    setSelectedModel(newModel);
    setModelError(false);

    if (newModel && selectPhone) {
      selectPhone(currentProduct?.mobile_brand || 'Apple', newModel);
    }

    // Try preserving current color for the new model
    let targetProduct = findMatchingProduct(currentColor, newModel);
    if (!targetProduct) {
      targetProduct = findMatchingProduct(null, newModel);
    }

    if (targetProduct) {
      setActiveProduct(targetProduct);
      const targetColor = extractProductColor(targetProduct) || currentColor;

      const params = new URLSearchParams(searchParams);
      params.set('model', newModel);
      if (targetColor) {
        params.set('color', targetColor);
      }

      if (targetProduct.id !== id) {
        navigate(`/product/${targetProduct.id}?${params.toString()}`, { replace: true });
      }
    }
  };

  // Handle color change when clicking a color variant swatch
  const handleColorChange = (newColor) => {
    if (!newColor || newColor.toLowerCase() === (currentColor || '').toLowerCase()) return;

    isModelSwitchRef.current = true;

    // 1. Try finding matching product for newColor and current selectedModel
    let targetProduct = findMatchingProduct(newColor, selectedModel);

    // 2. If not found for current selectedModel, find any product with newColor
    if (!targetProduct) {
      targetProduct = findMatchingProduct(newColor, null);
    }

    if (targetProduct) {
      setActiveProduct(targetProduct);

      // If target product has specific model compatibility, adapt selectedModel
      const targetModels = extractProductModels(targetProduct);
      let updatedModel = selectedModel;
      if (selectedModel && targetModels.length > 0 && !targetModels.map((m) => m.toLowerCase()).includes(selectedModel.toLowerCase())) {
        updatedModel = targetModels[0] || '';
        setSelectedModel(updatedModel);
      }

      const params = new URLSearchParams(searchParams);
      if (updatedModel) {
        params.set('model', updatedModel);
      }
      params.set('color', newColor);

      if (targetProduct.id !== id) {
        navigate(`/product/${targetProduct.id}?${params.toString()}`, { replace: true });
      }
    }
  };

  // Sync active product if paramModel or paramColor changes externally
  useEffect(() => {
    const pModel = searchParams.get('model');
    const pColor = searchParams.get('color');

    if (pModel || pColor) {
      const match = findMatchingProduct(pColor || currentColor, pModel || selectedModel);
      if (match && match.id !== currentProduct?.id) {
        setActiveProduct(match);
      }
    }
  }, [searchParams, currentProduct?.id]);

  // Page title and meta
  useEffect(() => {
    if (currentProduct) {
      const isCombo = Boolean(currentProduct.is_combo || currentProduct.product_type === 'combo');
      const compList = allSelectableModels;
      let title;
      let description;

      if (isCombo && currentProduct.empty_intersection) {
        console.warn(
          `[ProductDetailPage] Combo "${currentProduct.name}" (id: ${currentProduct.id}) has an empty model intersection across its components - this combo is not available for any single phone model.`
        );
        title = `${currentProduct.name} | WrapStore`;
        description = 'This combo is not available for any single phone model.';
      } else {
        const modelsStr = compList.length > 0 ? compList.slice(0, 3).join(', ') : '';
        title = `${currentProduct.name}${modelsStr ? ` for ${modelsStr}` : ''} | WrapStore`;
        description =
          currentProduct.description && currentProduct.description.length >= 20
            ? currentProduct.description
            : `${currentProduct.name} available at WrapStore Dharmapuri.`;
      }
      const image =
        currentProduct.image_url || (Array.isArray(currentProduct.images) && currentProduct.images[0]) || '';
      setPageMeta({ title, description, image });
    }
  }, [currentProduct, allSelectableModels]);

  // Scroll to top only on new product navigations, not on in-page model variant changes
  useEffect(() => {
    if (isModelSwitchRef.current) {
      isModelSwitchRef.current = false;
      prevIdRef.current = id;
      return;
    }
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [id]);

  // Sync selectedModel on initial load or when initialModel changes externally
  useEffect(() => {
    if (!isModelSwitchRef.current && initialModel) {
      setSelectedModel(initialModel);
      setModelError(false);
    }
  }, [initialModel]);

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
    !needsModelSelection ||
    (selectedModel &&
      (!allSelectableModels.length
        ? true
        : allSelectableModels.includes(selectedModel)))
  );

  // Derive brand for breadcrumbs
  const derivedBrand = useMemo(() => {
    if (savedPhone?.brand) return savedPhone.brand;
    if (selectedModel) {
      if (/iphone/i.test(selectedModel)) return 'Apple';
      if (/galaxy|samsung/i.test(selectedModel)) return 'Samsung';
    }
    if (currentProduct?.mobile_brand) return currentProduct.mobile_brand;
    return 'Apple';
  }, [savedPhone, selectedModel, currentProduct]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentProduct?.name || 'WrapStore Case',
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
          className="inline-flex items-center justify-center min-h-[46px] px-6 bg-[#141414] hover:bg-black text-white font-semibold text-[14px] rounded-[6px] transition-colors shadow-xs"
        >
          Retry now
        </button>
      </main>
    );
  }

  if (!currentProduct) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.025em]">Product not found</h1>
        <p className="text-[14px] text-[#6B6B6B]">The product you requested could not be located in our catalog.</p>
        <div className="pt-2">
          <Link
            to="/cases"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-[#141414] text-white text-[14px] font-semibold rounded-[6px] hover:bg-black transition-colors"
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
              to={`/?category=${encodeURIComponent(currentProduct.category || 'Accessories')}`}
              className="hover:text-[#141414] transition-colors"
            >
              {currentProduct.category || 'Accessories'}
            </Link>
            {currentProduct.subcategory && (
              <>
                <span className="text-[#E5E5E3] select-none">/</span>
                <Link
                  to={`/?category=${encodeURIComponent(currentProduct.category || 'Accessories')}&subcategory=${encodeURIComponent(currentProduct.subcategory)}`}
                  className="hover:text-[#141414] transition-colors"
                >
                  {currentProduct.subcategory}
                </Link>
              </>
            )}
          </>
        )}

        <span className="text-[#E5E5E3] select-none">/</span>
        <span className="text-[#141414] font-medium truncate max-w-[240px]">
          {currentProduct.name}
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
            images={currentProduct.images}
            product={currentProduct}
            onShare={handleShare}
          />
        </div>

        {/* Right Column (~45%): Scrolls naturally, padded on mobile */}
        <div className="w-full lg:w-[45%] px-4 sm:px-0">
          <ProductInfoPanel
            product={currentProduct}
            onAddToCart={onAddToCart}
            buyButtonRef={buyButtonRef}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            modelError={modelError}
            setModelError={setModelError}
            modelSelectRef={modelSelectRef}
            isModelSelected={isModelSelected}
            needsModelSelection={needsModelSelection}
            availableModels={allSelectableModels}
            modelToProductMap={modelToProductMap}
            onModelChange={handleModelChange}
            availableColors={availableColors}
            allProductColors={allProductColors}
            currentColor={currentColor}
            onColorChange={handleColorChange}
            colorAvailabilityMap={colorAvailabilityMap}
          />
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          STICKY MOBILE 52px ADD TO BAG BAR (< 1024px)
          ─────────────────────────────────────────────────────────────────────────── */}
      <StickyMobileCartBar
        product={currentProduct}
        selectedModel={selectedModel}
        isModelSelected={isModelSelected}
        needsModelSelection={needsModelSelection}
        onAddToCart={onAddToCart}
        modelSelectRef={modelSelectRef}
        setModelError={setModelError}
        selectedColor={currentColor}
      />

    </main>
  );
}

export default ProductDetailPage;
