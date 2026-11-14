import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { store } from '../../config/store';

export function HomeAboutBand() {
  const address = store.addressLines ? store.addressLines.join(', ') : store.addressShort;
  const hours = store.hours || '10:00 AM – 9:00 PM';
  const phone = store.phoneDisplay || '+91 81227 47947';
  const whatsappUrl = store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : 'https://wa.me/918122747947';

  return (
    <section aria-label="About WrapStore" className="w-full bg-[#141414] text-white py-16 md:py-24 select-none">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left: Store Photo (Desktop min-height 520px cover; Mobile 4:3) */}
          <div className="w-full aspect-[4/3] lg:aspect-auto lg:min-h-[520px] rounded-[18px] overflow-hidden relative shadow-2xl border border-white/10 group">
            <img
              src="/about/store.webp"
              alt="WrapStore retail store on Railway Station Road, Dharmapuri"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = '/about/store.jpg';
              }}
            />
            {/* Subtle inset highlight */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Right: Content Column */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3">
              <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.08em] text-[#A0A0A0] font-semibold block">
                About WrapStore
              </span>
              <h2 className="text-[30px] sm:text-[38px] lg:text-[40px] font-semibold text-white tracking-[-0.025em] leading-[1.15]">
                Your iPhone deserves more than just a case.
              </h2>
              <p className="text-[15px] text-[#A8A8A8] leading-relaxed max-w-xl">
                WrapStore is a specialized mobile accessories store based on Railway Station Road,
                Dharmapuri. We curate tactile, durable cases and certified charging gear designed to fit
                your exact smartphone.
              </p>
            </div>

            {/* 2-Column Info Row with Top Border */}
            <div className="pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Visit us */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold text-white uppercase tracking-wider block">
                  Visit us
                </span>
                <p className="text-[14px] text-[#A8A8A8] leading-snug">
                  Railway Station Rd, Dharmapuri, Tamil Nadu 636701
                </p>
                {hours && (
                  <p className="text-[13px] text-[#808080] flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#A0A0A0]" />
                    <span>{hours}</span>
                  </p>
                )}
              </div>

              {/* Talk to us */}
              <div className="space-y-1.5">
                <span className="text-[13px] font-semibold text-white uppercase tracking-wider block">
                  Talk to us
                </span>
                <p className="text-[14px] text-[#A8A8A8] pt-0.5">
                  <a
                    href={`tel:${store.phoneTel || phone}`}
                    className="hover:text-white transition-colors"
                  >
                    {phone}
                  </a>
                  <span className="text-[#808080]"> · </span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] hover:underline font-medium"
                  >
                    WhatsApp
                  </a>
                </p>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-full bg-white text-[#141414] hover:bg-[#EFECE6] font-semibold text-[14px] transition-colors shadow-xs"
              >
                Get directions
              </a>

              <Link
                to="/about"
                className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-full border border-white/30 text-white hover:border-white hover:bg-white/5 font-semibold text-[14px] transition-colors"
              >
                Our story
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default HomeAboutBand;
