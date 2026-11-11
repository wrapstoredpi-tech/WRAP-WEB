import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { policies } from '../../config/policies';

export function ProductAccordions({ product, className = '' }) {
  // Support independent toggle for each accordion row; Product details open by default when present
  const [openSections, setOpenSections] = useState({
    details: true,
    compatibleModels: false,
    deliveryAndReturns: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const compModels = Array.isArray(product?.compatible_models) ? product.compatible_models : [];
  const desc = (product?.description || '').trim();
  const lowerDesc = desc.toLowerCase();
  const isPlaceholderDesc =
    !desc ||
    lowerDesc === (product?.name || '').trim().toLowerCase() ||
    desc.length < 20 ||
    ['demo', 'desc', 'description', 'description text here'].includes(lowerDesc);
  const showDetails = !isPlaceholderDesc;

  return (
    <div className={`bg-white rounded-[6px] border border-[#E5E5E3] divide-y divide-[#E5E5E3] overflow-hidden ${className}`}>
      
      {/* 1. Product details (hidden if empty, equals name, or is placeholder) */}
      {showDetails && (
        <div>
          <button
            type="button"
            onClick={() => toggleSection('details')}
            aria-expanded={openSections.details}
            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left text-[14px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
          >
            <span>Product details</span>
            <ChevronDown
              className={`w-4 h-4 text-[#6B6B6B] transition-transform duration-200 ${
                openSections.details ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openSections.details && (
            <div className="px-4 sm:px-5 pb-4 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed">
              <p className="whitespace-pre-line">{desc}</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Compatible models */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('compatibleModels')}
          aria-expanded={openSections.compatibleModels}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left text-[14px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Compatible models</span>
          <ChevronDown
            className={`w-4 h-4 text-[#6B6B6B] transition-transform duration-200 ${
              openSections.compatibleModels ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.compatibleModels && (
          <div className="px-4 sm:px-5 pb-4 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed">
            {compModels.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[12px] text-[#6B6B6B]">
                  Compatible with:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {compModels.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F4F3F0] border border-[#E5E5E3] rounded-[4px] text-[12px] font-medium text-[#141414]"
                    >
                      <Check className="w-3 h-3 text-[#141414]" />
                      <span>{m}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p>Standard universal fit.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Delivery and returns */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('deliveryAndReturns')}
          aria-expanded={openSections.deliveryAndReturns}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left text-[14px] font-semibold text-[#141414] hover:bg-[#FAFAF9] transition-colors cursor-pointer select-none"
        >
          <span>Delivery and returns</span>
          <ChevronDown
            className={`w-4 h-4 text-[#6B6B6B] transition-transform duration-200 ${
              openSections.deliveryAndReturns ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.deliveryAndReturns && (
          <div className="px-4 sm:px-5 pb-4 pt-1 text-[13px] text-[#6B6B6B] leading-relaxed space-y-2">
            <p>
              Orders in {policies.delivery.tn.label}: {policies.delivery.tn.text}.
            </p>
            <p>
              {policies.delivery.other.label}: {policies.delivery.other.text.toLowerCase()}.
            </p>
            <p>
              Counted from {policies.delivery.countedFrom}.
            </p>
            <p className="text-[#141414] font-medium pt-1">
              Items damaged in transit or with manufacturing defects are promptly replaced.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-[12px] sm:text-[13px]">
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
