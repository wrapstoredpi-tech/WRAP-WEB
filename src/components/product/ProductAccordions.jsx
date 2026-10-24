import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { storeConfig } from '../../config/store';

export function ProductAccordions({ product, className = '' }) {
  // Support independent toggle for each accordion row
  const [openSections, setOpenSections] = useState({
    details: false,
    compatibility: false,
    shipping: false,
    returns: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const compatibleModels = product?.compatible_models || [];

  return (
    <div className={`bg-white rounded-2xl border border-[#E5E5E3] divide-y divide-[#E5E5E3] overflow-hidden ${className}`}>
      {/* 1. Product Details */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('details')}
          aria-expanded={openSections.details}
          className="w-full px-5 py-4 sm:py-4.5 flex items-center justify-between text-left text-[15px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Product Details</span>
          <ChevronDown
            className={`w-4 h-4 text-[#737373] transition-transform duration-200 ${
              openSections.details ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.details && (
          <div className="px-5 pb-5 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed space-y-3">
            <p>
              {product?.description ||
                'Precision-crafted protective case engineered with high-grade impact-absorbing materials, tactile responsive button covers, and a scratch-resistant textured finish.'}
            </p>
            <ul className="space-y-1.5 pl-1 text-[13px]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0" />
                <span>Precision cutouts for speaker grilles, microphone, and charging port</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0" />
                <span>Raised 1.2mm camera ring and front lip for scratch and flat-drop protection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0" />
                <span>Tactile, clicky button covers preserving natural device feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0" />
                <span>Slim, pocket-friendly profile with enhanced textured grip sides</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* 2. Compatibility */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('compatibility')}
          aria-expanded={openSections.compatibility}
          className="w-full px-5 py-4 sm:py-4.5 flex items-center justify-between text-left text-[15px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Compatibility</span>
          <ChevronDown
            className={`w-4 h-4 text-[#737373] transition-transform duration-200 ${
              openSections.compatibility ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.compatibility && (
          <div className="px-5 pb-5 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed space-y-3">
            {compatibleModels.length > 0 ? (
              <>
                <p>Designed for exact fit and button alignment for the following models:</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {compatibleModels.map((model) => (
                    <span
                      key={model}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F4F0] rounded-lg border border-[#E5E5E3] text-[12px] font-medium text-[#141414]"
                    >
                      <Check className="w-3 h-3 text-[#16A34A]" />
                      <span>{model}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p>Universal compatibility across standard smartphones, cables, or accessories.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Shipping & Delivery */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('shipping')}
          aria-expanded={openSections.shipping}
          className="w-full px-5 py-4 sm:py-4.5 flex items-center justify-between text-left text-[15px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Shipping & Delivery</span>
          <ChevronDown
            className={`w-4 h-4 text-[#737373] transition-transform duration-200 ${
              openSections.shipping ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.shipping && (
          <div className="px-5 pb-5 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed space-y-2.5">
            <p>
              <strong className="text-[#141414] font-medium">Free Delivery:</strong> All prepaid orders qualify for free standard delivery across India.
            </p>
            <p>
              <strong className="text-[#141414] font-medium">Dispatch Time:</strong> Orders are packed and dispatched from our Dharmapuri store within 24 hours.
            </p>
            <p>
              <strong className="text-[#141414] font-medium">Estimated Delivery:</strong> 2–4 business days across Tamil Nadu & South India; 3–6 business days for rest of India.
            </p>
            <p>
              <strong className="text-[#141414] font-medium">Tracking:</strong> Live shipment tracking details sent directly via SMS and WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* 4. Returns & Warranty */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('returns')}
          aria-expanded={openSections.returns}
          className="w-full px-5 py-4 sm:py-4.5 flex items-center justify-between text-left text-[15px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Returns & Warranty</span>
          <ChevronDown
            className={`w-4 h-4 text-[#737373] transition-transform duration-200 ${
              openSections.returns ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.returns && (
          <div className="px-5 pb-5 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed space-y-2.5">
            <p>
              <strong className="text-[#141414] font-medium">7-Day Easy Replacement:</strong> In case of wrong model delivered, damaged transit packaging, or manufacturing defects, we offer an immediate replacement.
            </p>
            <p>
              <strong className="text-[#141414] font-medium">Warranty:</strong> 6-month limited warranty on build quality and material integrity under normal usage.
            </p>
            <p>
              <strong className="text-[#141414] font-medium">Hassle-free Help:</strong> Message our Dharmapuri customer team on WhatsApp ({storeConfig.phoneDisplay}) with photos for quick resolution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductAccordions;
