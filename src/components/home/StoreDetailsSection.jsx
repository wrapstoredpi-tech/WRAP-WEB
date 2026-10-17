import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { store } from '../../config/store';

export function StoreDetailsSection() {
  const [isNearViewport, setIsNearViewport] = useState(false);
  const containerRef = useRef(null);

  // Lazy-load the iframe only when the block is near the viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={containerRef}
      className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 select-none"
      aria-labelledby="store-details-title"
    >
      {/* Two columns on desktop, stacked on mobile (map below the text) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Heading, Address, Phone, WhatsApp, Hours (if not empty), Get directions CTA */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-1.5">
            <h2
              id="store-details-title"
              className="font-display font-normal text-[30px] sm:text-[40px] text-[#141414] tracking-[-0.01em] leading-[1.1]"
            >
              Contact and store
            </h2>
          </div>

          {/* Full address (addressLines, each on its own line) */}
          <div className="space-y-0.5 text-[15px] text-[#525252] leading-relaxed">
            {store.addressLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          {/* Phone as a tel: link */}
          <div>
            <a
              href={`tel:${store.phoneTel}`}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors"
              aria-label={`Call WrapStore at ${store.phoneDisplay}`}
            >
              <Phone className="w-4 h-4 text-[#B0521F]" />
              <span>Call {store.phoneDisplay}</span>
            </a>
          </div>

          {/* WhatsApp button (only when whatsappNumber is not empty) */}
          {store.whatsappNumber && (
            <div>
              <a
                href={`https://wa.me/${store.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[14px] font-semibold rounded-[6px] transition-colors cursor-pointer"
                aria-label="Chat with WrapStore on WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          )}

          {/* Opening hours row (ONLY when store.hours is not empty; hide while empty) */}
          {store.hours && store.hours.trim() !== '' && (
            <div className="flex items-start gap-2 text-[14px] text-[#525252]">
              <Clock className="w-4 h-4 text-[#B0521F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#141414] font-semibold">Opening Hours</strong>
                <span>{store.hours}</span>
              </div>
            </div>
          )}

          {/* Primary button "Get directions" opening mapsUrl in a new tab */}
          <div className="pt-1">
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#141414] hover:bg-[#383836] text-white text-[14px] font-semibold rounded-[6px] transition-colors cursor-pointer"
            >
              Get directions
            </a>
          </div>
        </div>

        {/* Right Column: Map Frame with fallback panel and solid overlay CTA */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] md:aspect-[16/10] w-full rounded-[6px] border border-[#E5E5E3] overflow-hidden bg-[#F5F5F3]">
            
            {/* Static Fallback Panel (rendered behind iframe so block stays complete) */}
            <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center bg-[#F5F5F3] z-0">
              <MapPin className="w-8 h-8 text-[#B0521F] mb-2" />
              <p className="font-semibold text-[#141414] text-[16px]">{store.name}</p>
              <div className="text-[13px] text-[#6B6B6B] max-w-xs mt-1 mb-4 space-y-0.5">
                {store.addressLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <a
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 bg-[#141414] hover:bg-[#383836] text-white text-[13px] font-semibold rounded-[6px] transition-colors"
              >
                Get directions
              </a>
            </div>

            {/* Lazy-loaded iframe */}
            {isNearViewport && (
              <iframe
                src={store.mapEmbedSrc}
                title="Map showing WrapStore, Railway Station Rd, Dharmapuri"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                scrolling="no"
                className="relative z-10 w-full h-full border-0"
              />
            )}

            {/* Overlay solid CTA button bottom-left over the map */}
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 bg-white hover:bg-[#FAFAF9] text-[#141414] hover:text-[#B0521F] text-[13px] font-semibold rounded-[6px] shadow-md border border-[#E5E5E3] transition-colors select-none"
              aria-label="Open location in Google Maps (opens in new tab)"
            >
              <ExternalLink className="w-4 h-4 text-[#6B6B6B]" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StoreDetailsSection;
