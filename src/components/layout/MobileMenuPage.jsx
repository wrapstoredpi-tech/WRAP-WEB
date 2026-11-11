import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Package, Smartphone } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { usePhoneContext } from '../../context/PhoneContext';
import { ComboThumbnail } from '../cart/ComboThumbnail';
import { getLiveModelsWithCases, isComboEligible } from '../../lib/models';

export function MobileMenuPage({
  isOpen,
  onClose,
  products = [],
  hasSamsungCases = false,
  liveAccessorySubs = [],
  hasCombos = false,
}) {
  const navigate = useNavigate();
  const { savedPhone } = usePhoneContext();
  const [isAccessoriesExpanded, setIsAccessoriesExpanded] = useState(false);

  if (!isOpen) return null;

  // Resolve representative real photos from live products
  const appleCaseProduct = products.find(
    (p) =>
      p &&
      p.image_url &&
      (p.stock_status !== 'OUT_OF_STOCK' && (p.available_stock ?? p.current_stock ?? 0) > 0) &&
      ((p.category || '').toLowerCase().includes('case') ||
        (Array.isArray(p.categories) && p.categories.some((c) => (c || '').toLowerCase().includes('case')))) &&
      ((p.mobile_brand || '').toLowerCase().includes('apple') || (p.name || '').toLowerCase().includes('iphone'))
  );

  const samsungCaseProduct = hasSamsungCases
    ? products.find(
        (p) =>
          p &&
          p.image_url &&
          (p.stock_status !== 'OUT_OF_STOCK' && (p.available_stock ?? p.current_stock ?? 0) > 0) &&
          ((p.category || '').toLowerCase().includes('case') ||
            (Array.isArray(p.categories) && p.categories.some((c) => (c || '').toLowerCase().includes('case')))) &&
          ((p.mobile_brand || '').toLowerCase().includes('samsung') || (p.name || '').toLowerCase().includes('galaxy'))
      )
    : null;

  const accessoryProduct = products.find(
    (p) =>
      p &&
      p.image_url &&
      (p.stock_status !== 'OUT_OF_STOCK' && (p.available_stock ?? p.current_stock ?? 0) > 0) &&
      ((p.category || '').toLowerCase().includes('accessor') ||
        (Array.isArray(p.categories) && p.categories.some((c) => (c || '').toLowerCase().includes('accessor'))))
  );

  const comboProduct = products.find(
    (p) =>
      p &&
      (p.is_combo || p.product_type === 'combo') &&
      (p.stock_status !== 'OUT_OF_STOCK' && (p.available_stock ?? p.current_stock ?? 0) > 0)
  );

  const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
  const defaultCase = isFile ? './subcategories/iphone.jpg' : '/subcategories/iphone.jpg';
  const defaultAcc = isFile ? './subcategories/tempered-glass.jpg' : '/subcategories/tempered-glass.jpg';
  const defaultCombo = isFile ? './hero/slide-2.webp' : '/hero/slide-2.webp';

  const appleLiveModels = getLiveModelsWithCases(products, 'Apple');
  const appleDesignsCount = appleLiveModels.reduce((acc, m) => acc + (m.designsCount || 0), 0);

  const samsungLiveModels = hasSamsungCases ? getLiveModelsWithCases(products, 'Samsung') : [];
  const samsungDesignsCount = samsungLiveModels.reduce((acc, m) => acc + (m.designsCount || 0), 0);

  const eligibleCombosCount = products.filter(isComboEligible).length;

  const accessoriesSubtitle = liveAccessorySubs.length > 0
    ? liveAccessorySubs.slice(0, 3).map((s) => s.name).join(', ')
    : 'Phone accessories';

  const applePhoto = appleCaseProduct?.image_url || defaultCase;
  const samsungPhoto = samsungCaseProduct?.image_url || defaultCase;
  const accessoryPhoto = accessoryProduct?.image_url || defaultAcc;

  const handleTileClick = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 bg-[#FAFAF9] text-[#141414] flex flex-col h-[100dvh] max-h-[100dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-fade-in"
    >
      {/* 56px Top Bar */}
      <header className="h-[56px] shrink-0 border-b border-[#E5E5E3] px-4 flex items-center justify-between bg-white">
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#6B6B6B] rounded-[6px] transition-colors cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>

        <Link to="/" onClick={onClose} className="inline-flex items-center" aria-label="WrapStore Home">
          <Logo size="sm" />
        </Link>

        <div className="w-11" /> {/* Spacer to keep logo visually centred */}
      </header>

      {/* Main Menu Content */}
      <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Saved Phone Status Bar if present */}
        {savedPhone?.model && (
          <div className="p-3 bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 text-[#141414] font-medium truncate">
              <Smartphone className="w-4 h-4 text-[#B0521F] shrink-0" />
              <span className="truncate">Your phone: <strong className="font-semibold">{savedPhone.model}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => handleTileClick('/cases')}
              className="text-[#B0521F] hover:underline font-semibold text-[12px] shrink-0 ml-2 cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {/* Top-Level Group Tiles on #F4F3F0 with 6px radius */}
        <div className="space-y-3">
          {/* Tile 1: iPhone Cases */}
          <Link
            to="/cases?brand=Apple"
            onClick={onClose}
            className="w-full bg-[#F4F3F0] hover:bg-[#EFECE6] border border-[#E5E5E3] rounded-[6px] h-[92px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left group"
          >
            <div className="space-y-0.5">
              <span className="block font-semibold text-[17px] text-[#141414] font-sans">
                iPhone cases
              </span>
              <span className="block text-[13px] text-[#6B6B6B]">
                {appleDesignsCount > 0 ? `${appleDesignsCount} designs` : 'Apple iPhone cases'}
              </span>
            </div>
            <div className="w-16 h-16 rounded-[4px] bg-white border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={applePhoto}
                alt="iPhone cases"
                onError={(e) => { e.currentTarget.src = '/subcategories/iphone.jpg'; }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>
          </Link>

          {/* Tile 2: Samsung Cases (rendered ONLY with products) */}
          {hasSamsungCases && (
            <Link
              to="/cases?brand=Samsung"
              onClick={onClose}
              className="w-full bg-[#F4F3F0] hover:bg-[#EFECE6] border border-[#E5E5E3] rounded-[6px] h-[92px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left group"
            >
              <div className="space-y-0.5">
                <span className="block font-semibold text-[17px] text-[#141414] font-sans">
                  Samsung cases
                </span>
                <span className="block text-[13px] text-[#6B6B6B]">
                  {samsungDesignsCount > 0 ? `${samsungDesignsCount} designs` : 'Galaxy cases'}
                </span>
              </div>
              <div className="w-16 h-16 rounded-[4px] bg-white border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={samsungPhoto}
                  alt="Samsung cases"
                  onError={(e) => { e.currentTarget.src = '/subcategories/iphone.jpg'; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
            </Link>
          )}

          {/* Tile 3: Accessories -> Expands to live subcategories */}
          <div className="bg-[#F4F3F0] border border-[#E5E5E3] rounded-[6px] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsAccessoriesExpanded(!isAccessoriesExpanded)}
              aria-expanded={isAccessoriesExpanded}
              className="w-full h-[92px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left group hover:bg-[#EFECE6]"
            >
              <div className="space-y-0.5">
                <span className="block font-semibold text-[17px] text-[#141414] font-sans">
                  Accessories
                </span>
                <span className="block text-[13px] text-[#6B6B6B] truncate max-w-[200px]">
                  {accessoriesSubtitle}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-[4px] bg-white border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={accessoryPhoto}
                    alt="Accessories"
                    onError={(e) => { e.currentTarget.src = '/subcategories/tempered-glass.jpg'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[#6B6B6B] transition-transform duration-200 ${
                    isAccessoriesExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Subcategories Expansion List */}
            {isAccessoriesExpanded && (
              <div className="border-t border-[#E5E5E3] bg-white p-3 space-y-1">
                <Link
                  to="/?category=Accessories"
                  onClick={onClose}
                  className="block w-full text-left px-3 py-2 text-[14px] font-semibold text-[#B0521F] hover:bg-[#FAFAF9] rounded-[4px] transition-colors cursor-pointer"
                >
                  View all accessories →
                </Link>
                {liveAccessorySubs.map((sub) => (
                  <Link
                    key={sub.name}
                    to={`/?category=Accessories&subcategory=${encodeURIComponent(sub.name)}`}
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[14px] text-[#141414] hover:bg-[#FAFAF9] rounded-[4px] transition-colors cursor-pointer text-left"
                  >
                    <span className="font-medium">{sub.name}</span>
                    <span className="text-[12px] text-[#6B6B6B]">
                      {sub.productCount}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tile 4: Combos (rendered ONLY if eligible combos exist) */}
          {hasCombos && (
            <Link
              to="/combos"
              onClick={onClose}
              className="w-full bg-[#F4F3F0] hover:bg-[#EFECE6] border border-[#E5E5E3] rounded-[6px] h-[92px] p-4 flex items-center justify-between transition-colors cursor-pointer text-left group"
            >
              <div className="space-y-0.5">
                <span className="block font-semibold text-[17px] text-[#141414] font-sans">
                  Combos
                </span>
                <span className="block text-[13px] text-[#6B6B6B]">
                  {eligibleCombosCount > 0 ? `${eligibleCombosCount} protection bundles` : 'Protection combos'}
                </span>
              </div>
              <div className="w-16 h-16 rounded-[4px] bg-white border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center p-1">
                {comboProduct ? (
                  <ComboThumbnail combo={comboProduct} className="w-full h-full" />
                ) : (
                  <img
                    src={defaultCombo}
                    alt="Combos"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </Link>
          )}
        </div>

        {/* Plain Links Below */}
        <div className="pt-6 border-t border-[#E5E5E3] space-y-3">
          <Link
            to="/contact"
            onClick={onClose}
            className="block text-[15px] font-medium text-[#141414] hover:text-[#B0521F] py-1 transition-colors"
          >
            Visit store
          </Link>
          <Link
            to="/track-order"
            onClick={onClose}
            className="block text-[15px] font-medium text-[#141414] hover:text-[#B0521F] py-1 transition-colors"
          >
            Track order
          </Link>
          <Link
            to="/contact"
            onClick={onClose}
            className="block text-[15px] font-medium text-[#141414] hover:text-[#B0521F] py-1 transition-colors"
          >
            Contact
          </Link>
          <Link
            to="/about"
            onClick={onClose}
            className="block text-[15px] font-medium text-[#141414] hover:text-[#B0521F] py-1 transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MobileMenuPage;
