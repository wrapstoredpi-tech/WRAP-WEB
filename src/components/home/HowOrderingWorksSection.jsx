import React from 'react';
import { homeConfig } from '../../config/home';

export function HowOrderingWorksSection() {
  const config = homeConfig.howOrderingWorks || {};
  const steps = config.steps || [];

  return (
    <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 space-y-6" aria-labelledby="how-ordering-works-title">
      <div className="space-y-1">
        <h2 id="how-ordering-works-title" className="text-[24px] sm:text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          {config.heading || 'How ordering works'}
        </h2>
        <p className="text-[14px] text-[#6B6B6B]">
          {config.subtext || 'Simple, transparent mobile shopping in three steps.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        {steps.map((item, index) => (
          <div
            key={item.number || index}
            className="p-5 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] space-y-3"
          >
            <div className="text-[20px] font-semibold text-[#B0521F]">
              {String(item.number || index + 1).padStart(2, '0')}
            </div>
            <div className="space-y-1">
              <h3 className="text-[16px] font-semibold text-[#141414]">
                {item.title}
              </h3>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowOrderingWorksSection;
