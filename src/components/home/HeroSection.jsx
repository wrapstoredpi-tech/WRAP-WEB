import React from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';

export function HeroSection({ onShopClick }) {
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  return (
    <section className="relative w-full bg-[#141414] text-white overflow-hidden border-b border-[#262624]">
      {/* Background: Quiet, ultra-premium directional dark gradient with subtle ambient lighting */}
      <div 
        className="absolute inset-0 z-0 bg-gradient-to-br from-[#1E1E1C] via-[#141414] to-[#0D0D0D]"
        aria-hidden="true"
      >
        {/* Soft directional ambient light pool from top-right */}
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-white/[0.03] blur-3xl pointer-events-none"
        />
        {/* Subtle subtle linear grid/glow */}
        <div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.05),transparent)] pointer-events-none"
        />
      </div>

      {/* Hero Content: Constrained reading column inside full-bleed canvas */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 flex flex-col justify-center">
        <div className="max-w-[600px] space-y-4 sm:space-y-5">
          
          {/* Small-caps, letter-spaced, muted kicker */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[12px] uppercase font-semibold text-[#A8A29E] tracking-[0.12em]">
              EVERYDAY CARRY
            </span>
            {savedPhone && (
              <>
                <span className="text-white/20 text-[12px]">•</span>
                <span className="text-[12px] text-[#D6D3D1] bg-white/10 px-2.5 py-0.5 rounded-lg font-normal border border-white/10">
                  Fitted for {savedPhone.model}
                </span>
              </>
            )}
          </div>

          {/* Poppins Semibold Display Headline (36-44px desktop / 28-32px mobile) */}
          <h1 className="text-[28px] sm:text-[36px] md:text-[42px] font-semibold text-white tracking-[-0.03em] leading-[1.15]">
            Cases Engineered for Precision &amp; Defense
          </h1>

          {/* Regular weight, body size, muted subtext */}
          <p className="text-[14px] sm:text-[15px] font-normal text-[#A8A29E] leading-relaxed max-w-[540px]">
            Low-profile protective structures crafted from tactile materials. Precision cutouts and verified geometry for seamless daily carry.
          </p>

          {/* Action Buttons: 10px radius, 46px height, 1.5x padding rhythm */}
          <div className="pt-2 sm:pt-3 flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3">
            <button
              type="button"
              onClick={() => onShopClick && onShopClick('All')}
              className="group h-[46px] px-6 py-3 rounded-lg bg-[#9E381A] hover:bg-[#882F15] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors duration-200 focus-visible:outline-white"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            {!savedPhone ? (
              <button
                type="button"
                onClick={openPhoneSheet}
                className="h-[46px] px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-normal text-[14px] border border-white/10 transition-colors duration-200 flex items-center justify-center gap-2 focus-visible:outline-white"
              >
                <Smartphone className="w-4 h-4 text-[#A8A29E]" />
                <span>Select Your Phone</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openPhoneSheet}
                className="h-[46px] px-5 py-3 rounded-lg bg-transparent hover:bg-white/5 text-[#A8A29E] hover:text-white font-normal text-[13px] transition-colors duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-white"
              >
                <span>Change ({savedPhone.model})</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
