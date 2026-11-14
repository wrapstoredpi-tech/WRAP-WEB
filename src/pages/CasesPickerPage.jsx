import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown, ChevronUp, ChevronRight, ArrowRight } from 'lucide-react';
import { useProductsContext } from '../context/ProductsContext';
import { usePhoneContext } from '../context/PhoneContext';
import {
  getLiveModelsWithCases,
  hasLiveCasesForBrand,
  getModelCaseDesigns,
  modelToSlug,
  DEFAULT_APPLE_MODELS,
  DEFAULT_SAMSUNG_MODELS,
  sortModels,
} from '../lib/models';
import { setPageMeta } from '../lib/seo';

export function CasesPickerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products = [] } = useProductsContext();
  const { savedPhone, selectPhone } = usePhoneContext();

  const brandParam = searchParams.get('brand');
  const isChangeRequested = searchParams.get('change') === 'true';

  useEffect(() => {
    setPageMeta({
      title: 'Find your phone | WrapStore',
      description: 'Find cases and protection designed for your phone.',
    });
  }, []);

  // Check which brands have live cases
  const hasAppleCases = useMemo(() => hasLiveCasesForBrand(products, 'Apple') || true, [products]);
  const hasSamsungCases = useMemo(() => hasLiveCasesForBrand(products, 'Samsung'), [products]);

  // Brand list: Apple always, Samsung only when it has cases
  const liveBrands = useMemo(() => {
    const list = [];
    if (hasAppleCases) list.push({ name: 'Apple', label: 'Apple' });
    if (hasSamsungCases) list.push({ name: 'Samsung', label: 'Samsung' });
    return list;
  }, [hasAppleCases, hasSamsungCases]);

  // Step 1 "Brand" / Step 2 "Model" state
  const [selectedBrand, setSelectedBrand] = useState(() => {
    if (brandParam) {
      const lower = brandParam.toLowerCase();
      if (lower === 'samsung' && hasSamsungCases) return 'Samsung';
      return 'Apple';
    }
    // If a saved phone exists and change is not requested, preselect step 2
    if (savedPhone?.brand && !isChangeRequested) {
      return savedPhone.brand;
    }
    // On desktop, default to the first available brand (Apple)
    return 'Apple';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherModels, setShowOtherModels] = useState(false);
  const [isExpandedAvailable, setIsExpandedAvailable] = useState(false);

  // Sync with brand URL parameter
  useEffect(() => {
    if (brandParam) {
      const lower = brandParam.toLowerCase();
      setSelectedBrand(lower === 'samsung' && hasSamsungCases ? 'Samsung' : 'Apple');
    }
  }, [brandParam, hasSamsungCases]);

  // Active brand: fallback to 'Apple' if none selected
  const activeBrand = selectedBrand || (liveBrands[0]?.name ?? 'Apple');

  // Models with cases available (newest first, each with N designs)
  const availableModelsWithDesigns = useMemo(() => {
    const models = getLiveModelsWithCases(products, activeBrand);
    return models.map((m) => {
      const { designsCount, slug } = getModelCaseDesigns(products, m, activeBrand);
      return {
        model: m,
        designsCount,
        slug,
        hasCases: true,
      };
    });
  }, [products, activeBrand]);

  // Other models (from brand default models that currently have 0 cases)
  const otherModels = useMemo(() => {
    const defaults = activeBrand === 'Samsung' ? DEFAULT_SAMSUNG_MODELS : DEFAULT_APPLE_MODELS;
    const availableSet = new Set(availableModelsWithDesigns.map((item) => item.model.toLowerCase()));
    const remaining = defaults.filter((m) => !availableSet.has(m.toLowerCase()));
    return sortModels(remaining).map((m) => ({
      model: m,
      designsCount: 0,
      slug: modelToSlug(m),
      hasCases: false,
    }));
  }, [activeBrand, availableModelsWithDesigns]);

  // Filtered lists based on search query
  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableModelsWithDesigns;
    const q = searchQuery.toLowerCase().trim();
    return availableModelsWithDesigns.filter((item) => item.model.toLowerCase().includes(q));
  }, [availableModelsWithDesigns, searchQuery]);

  const filteredOther = useMemo(() => {
    if (!searchQuery.trim()) return otherModels;
    const q = searchQuery.toLowerCase().trim();
    return otherModels.filter((item) => item.model.toLowerCase().includes(q));
  }, [otherModels, searchQuery]);

  // Desktop view limit (all visible when <= 18)
  const displayedAvailableDesktop = useMemo(() => {
    if (searchQuery.trim() || isExpandedAvailable || filteredAvailable.length <= 18) {
      return filteredAvailable;
    }
    return filteredAvailable.slice(0, 18);
  }, [filteredAvailable, searchQuery, isExpandedAvailable]);

  // Handle brand selection
  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    setSearchParams({ brand });
    setSearchQuery('');
    setShowOtherModels(false);
    setIsExpandedAvailable(false);
  };

  // Change brand (go to Step 1 on mobile)
  const handleChangeBrand = () => {
    setSelectedBrand(null);
    setSearchParams({ change: 'true' });
    setSearchQuery('');
  };

  // Select a model -> save wrapstore_phone and navigate to /cases/<brand>/<model-slug>
  const handleSelectModel = (modelName) => {
    const brand = activeBrand;
    selectPhone(brand, modelName);
    navigate(`/cases/${brand.toLowerCase()}/${modelToSlug(modelName)}`);
  };

  // Has saved phone for current view
  const hasSavedPhone = Boolean(savedPhone?.model);

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FAFAF9] text-[#141414] py-6 sm:py-10">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] text-[#6B6B6B] mb-6 sm:mb-8" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#141414] transition-colors">WrapStore</Link>
          <span>/</span>
          {selectedBrand ? (
            <>
              <button
                type="button"
                onClick={handleChangeBrand}
                className="hover:text-[#141414] transition-colors cursor-pointer"
              >
                Cases
              </button>
              <span>/</span>
              <span className="text-[#141414] font-medium">{selectedBrand}</span>
            </>
          ) : (
            <span className="text-[#141414] font-medium">Cases</span>
          )}
        </nav>

        {/* ─── MOBILE STACKED FLOW (< 1024px) ─── */}
        <div className="lg:hidden">
          {/* Step 1: Brand Selection (Plain list) */}
          {!selectedBrand && (
            <div className="max-w-xl mx-auto py-2">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-semibold text-[#141414] tracking-[-0.025em]">
                  Select your brand
                </h1>
                <p className="text-[14px] text-[#6B6B6B] mt-1.5">
                  Choose your phone manufacturer to view cases.
                </p>
              </div>

              <div className="space-y-3">
                {liveBrands.map((brand) => (
                  <button
                    key={brand.name}
                    type="button"
                    onClick={() => handleSelectBrand(brand.name)}
                    className="w-full min-h-[52px] px-5 py-3.5 bg-white border border-[#E5E5E3] hover:border-[#141414] rounded-[6px] flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div>
                      <span className="text-[16px] font-semibold text-[#141414] block">
                        {brand.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#6B6B6B] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Model Selection (Mobile) */}
          {selectedBrand && (
            <div className="max-w-xl mx-auto py-2 space-y-5">
              {/* Brand Accent Line: The chosen brand stays visible above as a line in accent */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
                <div className="text-[14px] flex items-center gap-1.5 text-[#B0521F]">
                  <span className="text-[#6B6B6B]">Brand:</span>
                  <span className="font-semibold text-[#B0521F]">{selectedBrand}</span>
                  <span className="text-[#6B6B6B]">·</span>
                  <button
                    type="button"
                    onClick={handleChangeBrand}
                    className="underline underline-offset-2 hover:text-[#141414] font-medium cursor-pointer"
                  >
                    tap to change
                  </button>
                </div>
                <span className="text-[13px] text-[#6B6B6B]">
                  {availableModelsWithDesigns.length} models with cases
                </span>
              </div>

              {/* Saved Phone Banner: Preselects step 2 and shows "Continue with <model>" */}
              {hasSavedPhone && savedPhone.brand === selectedBrand && (
                <div className="bg-[#B0521F]/5 border border-[#B0521F]/30 rounded-[6px] p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#B0521F] uppercase tracking-wider block">
                      Saved phone
                    </span>
                    <p className="text-[15px] font-semibold text-[#141414]">
                      {savedPhone.model}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectModel(savedPhone.model)}
                    className="min-h-[40px] px-4 bg-[#B0521F] hover:bg-[#964317] text-white text-[13px] font-medium rounded-[6px] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Continue with {savedPhone.model}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <h1 className="text-2xl font-semibold text-[#141414] tracking-[-0.025em]">
                  Select your {selectedBrand === 'Apple' ? 'iPhone' : 'Samsung Galaxy'} model
                </h1>
                <p className="text-[13px] text-[#6B6B6B] mt-1">
                  Cases shown are for your phone.
                </p>
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your model (e.g. 16 Pro, S24)"
                  className="w-full h-[46px] pl-10 pr-10 text-[14px] text-[#141414] bg-white border border-[#E5E5E3] rounded-[6px] focus:outline-none focus:border-[#141414] placeholder-[#6B6B6B] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Group 1: Cases available */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#141414]">
                    Cases available
                  </h2>
                  <span className="text-[12px] text-[#6B6B6B]">
                    {filteredAvailable.length} {filteredAvailable.length === 1 ? 'model' : 'models'}
                  </span>
                </div>

                {filteredAvailable.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredAvailable.map((item) => {
                      const isCurrent = savedPhone?.model === item.model;
                      return (
                        <button
                          key={item.model}
                          type="button"
                          onClick={() => handleSelectModel(item.model)}
                          className={`w-full min-h-[50px] px-4 py-3 border rounded-[6px] flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group ${
                            isCurrent
                              ? 'border-[#B0521F] bg-[#B0521F]/5 ring-1 ring-[#B0521F]'
                              : 'border-[#E5E5E3] bg-white hover:border-[#141414] hover:bg-[#F4F3F0]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[14px] font-semibold text-[#141414] block truncate">
                              {item.model}
                            </span>
                            <span className="text-[12px] text-[#6B6B6B] block">
                              {item.designsCount} {item.designsCount === 1 ? 'design' : 'designs'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#6B6B6B] py-2">
                    No models matching "{searchQuery}" in cases available.
                  </p>
                )}
              </div>

              {/* Group 2: Other models (collapsed under "View all models") */}
              {filteredOther.length > 0 && (
                <div className="pt-4 border-t border-[#E5E5E3] space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowOtherModels((prev) => !prev)}
                    className="w-full flex items-center justify-between py-2 text-[14px] font-medium text-[#141414] hover:text-[#B0521F] transition-colors cursor-pointer"
                  >
                    <span>
                      {showOtherModels ? 'Hide other models' : 'View all models'}
                    </span>
                    {showOtherModels ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showOtherModels && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {filteredOther.map((item) => (
                        <button
                          key={item.model}
                          type="button"
                          onClick={() => handleSelectModel(item.model)}
                          className="w-full min-h-[48px] px-4 py-2.5 border border-[#E5E5E3] bg-[#F4F3F0] hover:bg-white hover:border-[#141414] rounded-[6px] flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[13px] font-medium text-[#141414] block truncate">
                              {item.model}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B] block">
                              Request case
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── DESKTOP TWO-COLUMN FLOW (>= 1024px) ─── */}
        <div className="hidden lg:grid lg:grid-cols-[280px_1fr] gap-10 items-start py-4">
          
          {/* Left Column (about 280px): Brand List */}
          <div className="sticky top-[96px] space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#141414]">Step 1 · Brand</h2>
              <p className="text-[13px] text-[#6B6B6B] mt-0.5">Select manufacturer</p>
            </div>

            <div className="space-y-2.5">
              {liveBrands.map((brand) => {
                const isSelected = activeBrand === brand.name;
                return (
                  <button
                    key={brand.name}
                    type="button"
                    onClick={() => handleSelectBrand(brand.name)}
                    className={`w-full min-h-[50px] px-4 py-3 rounded-[6px] border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#B0521F] bg-[#B0521F]/5 ring-1 ring-[#B0521F]'
                        : 'border-[#E5E5E3] bg-white hover:border-[#141414] hover:bg-[#F4F3F0]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[15px] text-[#141414] block">
                        {brand.label}
                      </span>
                      <span className="text-[12px] text-[#6B6B6B] block">
                        {brand.name === 'Apple' ? 'iPhone series' : 'Galaxy series'}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#B0521F]' : 'text-[#6B6B6B]'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Model Selection (Grid of 3 columns) */}
          <div className="space-y-6">
            {/* Accent Line: The chosen brand stays visible above as a line in accent ("Brand: Apple", tap to change) */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div className="text-[14px] flex items-center gap-1.5 text-[#B0521F]">
                <span className="text-[#6B6B6B]">Brand:</span>
                <span className="font-semibold text-[#B0521F]">{activeBrand}</span>
                <span className="text-[#6B6B6B]">·</span>
                <button
                  type="button"
                  onClick={handleChangeBrand}
                  className="underline underline-offset-2 hover:text-[#141414] font-medium cursor-pointer"
                >
                  Change
                </button>
              </div>
              <span className="text-[13px] text-[#6B6B6B]">
                {availableModelsWithDesigns.length} models with cases
              </span>
            </div>

            {/* Saved Phone Banner on Desktop */}
            {hasSavedPhone && savedPhone.brand === activeBrand && (
              <div className="bg-[#B0521F]/5 border border-[#B0521F]/30 rounded-[6px] p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-[#B0521F] uppercase tracking-wider block">
                    Current saved device
                  </span>
                  <p className="text-[16px] font-semibold text-[#141414] mt-0.5">
                    {savedPhone.model}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectModel(savedPhone.model)}
                  className="min-h-[42px] px-5 bg-[#B0521F] hover:bg-[#964317] text-white text-[14px] font-medium rounded-[6px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Continue with {savedPhone.model}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <h1 className="text-3xl font-semibold text-[#141414] tracking-[-0.025em]">
                Select your {activeBrand === 'Apple' ? 'iPhone' : 'Samsung Galaxy'} model
              </h1>
              <p className="text-[14px] text-[#6B6B6B] mt-1">
                Every screen after this will show cases designed specifically for your phone.
              </p>
            </div>

            {/* Search Field */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your model (e.g. 16 Pro, S24)"
                className="w-full h-[46px] pl-10 pr-10 text-[14px] text-[#141414] bg-white border border-[#E5E5E3] rounded-[6px] focus:outline-none focus:border-[#141414] placeholder-[#6B6B6B] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] rounded-full"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Group 1: Cases available */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#141414]">
                  Cases available
                </h2>
                <span className="text-[13px] text-[#6B6B6B]">
                  {filteredAvailable.length} {filteredAvailable.length === 1 ? 'model' : 'models'}
                </span>
              </div>

              {displayedAvailableDesktop.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {displayedAvailableDesktop.map((item) => {
                    const isCurrent = savedPhone?.model === item.model;
                    return (
                      <button
                        key={item.model}
                        type="button"
                        onClick={() => handleSelectModel(item.model)}
                        className={`min-h-[56px] px-4 py-3 rounded-[6px] border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs group ${
                          isCurrent
                            ? 'border-[#B0521F] bg-[#B0521F]/5 ring-1 ring-[#B0521F]'
                            : 'border-[#E5E5E3] bg-white hover:border-[#141414] hover:bg-[#F4F3F0]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[14px] font-semibold text-[#141414] block truncate">
                            {item.model}
                          </span>
                          <span className="text-[12px] text-[#6B6B6B] block">
                            {item.designsCount} {item.designsCount === 1 ? 'design' : 'designs'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-[#E5E5E3] rounded-[6px] bg-white p-6 text-center">
                  <p className="text-[14px] text-[#6B6B6B]">
                    No models found matching "{searchQuery}".
                  </p>
                </div>
              )}

              {/* Expansion toggle if > 18 models */}
              {!searchQuery.trim() && filteredAvailable.length > 18 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsExpandedAvailable((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E5E3] bg-white hover:bg-[#F4F3F0] text-[13px] font-medium text-[#141414] rounded-[6px] transition-colors cursor-pointer"
                  >
                    <span>{isExpandedAvailable ? 'Show fewer' : `View all ${filteredAvailable.length} models`}</span>
                    {isExpandedAvailable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Group 2: Other models (collapsed under "View all models") */}
            {filteredOther.length > 0 && (
              <div className="pt-6 border-t border-[#E5E5E3] space-y-4">
                <button
                  type="button"
                  onClick={() => setShowOtherModels((prev) => !prev)}
                  className="w-full flex items-center justify-between py-2 text-[14px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors cursor-pointer"
                >
                  <span>
                    {showOtherModels ? 'Hide other models' : 'View all models'}
                  </span>
                  {showOtherModels ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOtherModels && (
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {filteredOther.map((item) => (
                      <button
                        key={item.model}
                        type="button"
                        onClick={() => handleSelectModel(item.model)}
                        className="min-h-[50px] px-4 py-2.5 border border-[#E5E5E3] bg-[#F4F3F0] hover:bg-white hover:border-[#141414] rounded-[6px] flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[13px] font-medium text-[#141414] block truncate">
                            {item.model}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B] block">
                            Request case
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default CasesPickerPage;
