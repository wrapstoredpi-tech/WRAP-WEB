import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { policies } from '../../config/policies';

export function ProductAccordions({ product, className = '' }) {
  // Support independent toggle for each accordion row
  const [openSections, setOpenSections] = useState({
    details: false,
    compatibility: false,
    returnsAndShipping: false,
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
                <span>Raised 1.2mm camera bezel protects camera lenses against table scratches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0" />
                <span>Reinforced impact corners with shock dispersion cushioning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0" />
                <span>Textured anti-slip sides for comfortable, secure one-handed grip</span>
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
          <div className="px-5 pb-5 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed">
            {compatibleModels.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[12px] text-[#737373]">
                  Precision engineered and verified for the following devices:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {compatibleModels.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-[#F8F7F4] border border-[#E5E5E3] rounded-[6px] px-2.5 py-1.5 text-[12px] text-[#141414] font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-[#B0521F] shrink-0" />
                      <span className="truncate">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>Universal compatibility across standard smartphones, cables, or accessories.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Returns and shipping */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('returnsAndShipping')}
          aria-expanded={openSections.returnsAndShipping}
          className="w-full px-5 py-4 sm:py-4.5 flex items-center justify-between text-left text-[15px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Returns and shipping</span>
          <ChevronDown
            className={`w-4 h-4 text-[#737373] transition-transform duration-200 ${
              openSections.returnsAndShipping ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.returnsAndShipping && (
          <div className="px-5 pb-5 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed space-y-2">
            <p>Orders delivered within {policies.delivery.tn.label}: {policies.delivery.tn.text}.</p>
            <p>Orders delivered to {policies.delivery.other.label.toLowerCase()}: {policies.delivery.other.text.toLowerCase()}.</p>
            <p>Damaged or wrong items are replaced.</p>
            <div className="pt-2 flex flex-wrap gap-4 text-[13px]">
              <Link to="/shipping-policy" className="text-[#B0521F] hover:underline font-medium">
                Shipping policy
              </Link>
              <Link to="/returns-and-refunds" className="text-[#B0521F] hover:underline font-medium">
                Cancellation, returns and refund policy
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductAccordions;
