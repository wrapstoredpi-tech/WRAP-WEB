import React from 'react';
import { MapPin, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { storeConfig } from '../../config/store';

export function StoreStrip() {
  return (
    <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Location & Hours details */}
        <div className="space-y-4 max-w-2xl">
          <div>
            <h2 className="text-[20px] font-semibold text-[#141414]">
              WrapStore Dharmapuri
            </h2>
            <p className="text-[14px] text-[#6B6B6B] mt-0.5">
              Visit our physical store to test fit cases on your device or pick up accessories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#6B6B6B] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#141414]">Address</strong>
                <span className="text-[#6B6B6B] leading-relaxed">
                  {storeConfig.address}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#6B6B6B] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#141414]">Store Hours</strong>
                <span className="text-[#6B6B6B] leading-relaxed">
                  {storeConfig.storeHours}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions (WhatsApp & Map) */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <a
            href={storeConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#141414] hover:bg-[#383836] text-white text-[14px] font-semibold rounded-[6px] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>

          <a
            href={storeConfig.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#FAFAF9] hover:bg-white border border-[#E5E5E3] text-[#141414] text-[14px] font-semibold rounded-[6px] transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#6B6B6B]" />
            <span>View on Google Maps</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default StoreStrip;
