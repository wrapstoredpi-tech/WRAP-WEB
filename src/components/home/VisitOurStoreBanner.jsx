import React from 'react';
import { store } from '../../config/store';
import { MapPin, MessageSquare, ExternalLink } from 'lucide-react';

export function VisitOurStoreBanner() {
  const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
  const storePhoto = isFile ? './about/store.webp' : '/about/store.webp';
  const hoursText = store.hours && store.hours.trim() !== '' ? ` • Open ${store.hours}` : '';
  const addressLine = `${store.addressShort || store.addressLines[0]}${hoursText}`;

  return (
    <section aria-label="Visit our store" className="w-full select-none">
      {/* Full-bleed banner container */}
      <div className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] overflow-hidden bg-[#141414]">
        {/* Background photo: physical Dharmapuri store */}
        <img
          src={storePhoto}
          alt="WrapStore physical storefront in Dharmapuri, Tamil Nadu"
          loading="lazy"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.src = '/about/store.jpg';
          }}
        />

        {/* Dark scrim ONLY behind text bottom-left */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:w-[65%] md:bg-gradient-to-r md:from-black/90 md:via-black/50 md:to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Text bottom-left aligned to container */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pb-8 sm:pb-12 pointer-events-auto">
            <div className="max-w-xl text-left space-y-1.5">
              <h2 className="text-white text-[30px] sm:text-[42px] font-semibold tracking-[-0.025em] leading-[1.1] drop-shadow-md">
                Visit our store
              </h2>

              <p className="text-white/90 text-[13px] sm:text-[15px] font-normal line-clamp-1 drop-shadow-sm">
                {store.addressShort || store.addressLines[0]}
              </p>

              {store.hours && (
                <p className="text-white/75 text-[12px] sm:text-[13px] font-normal drop-shadow-sm">
                  Open {store.hours}
                </p>
              )}

              <div className="pt-3 flex items-center gap-3 flex-wrap">
                <a
                  href={store.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 bg-white hover:bg-[#FAFAF9] text-[#141414] text-[13px] sm:text-[14px] font-semibold rounded-[6px] transition-colors shadow-md cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#B0521F]" />
                  <span>Get directions</span>
                </a>

                {store.whatsappNumber && (
                  <a
                    href={`https://wa.me/${store.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[13px] sm:text-[14px] font-semibold rounded-[6px] transition-colors shadow-md cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp us</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VisitOurStoreBanner;
