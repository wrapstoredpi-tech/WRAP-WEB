import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, ChevronRight, Check } from 'lucide-react';
import {
  DEFAULT_APPLE_MODELS,
  DEFAULT_SAMSUNG_MODELS,
  sortModels,
  getLiveModelsWithCases,
} from '../../lib/models';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';

export function CollectionModelModal({
  isOpen,
  onClose,
  collection,
  onSelectModel,
  selectedModel = null,
}) {
  const { products = [] } = useProductsContext();
  const { savedPhone } = usePhoneContext();
  const [activeBrand, setActiveBrand] = useState('Apple');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Sync active brand when opened
  useEffect(() => {
    if (isOpen) {
      if (savedPhone?.brand === 'Samsung') {
        setActiveBrand('Samsung');
      } else {
        setActiveBrand('Apple');
      }
      setSearchQuery('');
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, savedPhone]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Models for active brand
  const modelsList = useMemo(() => {
    const defaultModels = activeBrand === 'Samsung' ? DEFAULT_SAMSUNG_MODELS : DEFAULT_APPLE_MODELS;
    const liveModels = getLiveModelsWithCases(products, activeBrand);

    // Merge live models and defaults, unique and sorted
    const set = new Set([...liveModels, ...defaultModels]);
    const sorted = sortModels(Array.from(set));

    if (!searchQuery.trim()) return sorted;

    const q = searchQuery.toLowerCase().trim();
    return sorted.filter((m) => m.toLowerCase().includes(q));
  }, [activeBrand, products, searchQuery]);

  if (!isOpen || !collection) return null;

  const currentModel = selectedModel || savedPhone?.model || null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-model-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-[24px] sm:rounded-[20px] shadow-2xl border border-[#E7E5E0] overflow-hidden max-h-[88vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7E5E0] flex items-start justify-between gap-3">
          <div>
            <h2 id="collection-model-title" className="text-[18px] sm:text-[20px] font-semibold text-[#141414] leading-tight">
              Select your phone model
            </h2>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">
              Choose your device to see available <strong className="text-[#141414] font-medium">{collection.name}</strong> cases
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#F4F2EE] hover:bg-[#EAE8E2] text-[#141414] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Selector & Search */}
        <div className="p-4 border-b border-[#E7E5E0] space-y-3 bg-[#FAF8F5]">
          {/* Brand Pills */}
          <div className="inline-flex p-1 bg-[#EAE8E2] rounded-full gap-1 border border-[#DDD9D2]">
            <button
              type="button"
              onClick={() => {
                setActiveBrand('Apple');
                setSearchQuery('');
              }}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-all cursor-pointer ${
                activeBrand === 'Apple'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'text-[#5A5A5A] hover:text-[#141414]'
              }`}
            >
              iPhone
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveBrand('Samsung');
                setSearchQuery('');
              }}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-all cursor-pointer ${
                activeBrand === 'Samsung'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'text-[#5A5A5A] hover:text-[#141414]'
              }`}
            >
              Samsung
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C8C8C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeBrand === 'Apple' ? 'iPhone' : 'Samsung'} model (e.g. 16 Pro, S24)...`}
              className="w-full bg-white border border-[#E7E5E0] focus:border-[#141414] rounded-[10px] pl-9 pr-8 py-2 text-[13px] sm:text-[14px] text-[#141414] placeholder:text-[#999] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8C8C] hover:text-[#141414] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Model List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-[#F0EDE8]">
          {modelsList.length === 0 ? (
            <div className="py-10 text-center text-[#6B6B6B] text-[13px]">
              No models found matching "{searchQuery}".
            </div>
          ) : (
            modelsList.map((model) => {
              const isCurrent =
                currentModel &&
                currentModel.toLowerCase().trim() === model.toLowerCase().trim();

              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => onSelectModel(activeBrand, model)}
                  className={`w-full py-3 px-3.5 rounded-[10px] text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    isCurrent
                      ? 'bg-[#141414] text-white'
                      : 'hover:bg-[#F4F2EE] text-[#141414]'
                  }`}
                >
                  <span className={`text-[14px] font-medium ${isCurrent ? 'text-white' : 'text-[#141414]'}`}>
                    {model}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#A8A8A8] group-hover:text-[#141414] transition-colors" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectionModelModal;
