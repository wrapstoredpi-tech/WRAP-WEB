import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { about } from '../config/about';

export function AboutPage() {
  const paragraphs = about.paragraphs || [];

  useEffect(() => {
    document.title = 'About Us — WrapStore | Mobile Cases & Accessories in Dharmapuri';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', about.intro);
    }
  }, []);

  return (
    <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10 sm:space-y-12">
      
      {/* 1. Header / Intro */}
      <div className="space-y-4 pb-8 border-b border-[#E5E5E3]">
        <h1 className="font-display font-normal text-[34px] sm:text-[42px] lg:text-[48px] text-[#141414] leading-[1.08] tracking-[-0.01em]">
          About WrapStore
        </h1>
        <p className="font-sans text-[16px] sm:text-[18px] text-[#525252] leading-relaxed max-w-2xl">
          {about.intro}
        </p>
      </div>

      {/* 2. Story Section with Store Photo & Paragraphs in Order */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Paragraphs in order: first as larger lead paragraph */}
        <div className="md:col-span-7 space-y-5">
          {paragraphs.length > 0 && (
            <p className="font-sans text-[18px] sm:text-[20px] text-[#141414] font-normal leading-relaxed">
              {paragraphs[0]}
            </p>
          )}

          <div className="space-y-4 font-sans text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
            {paragraphs.slice(1).map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>

        {/* Store Photo */}
        <div className="md:col-span-5 space-y-2">
          <div className="aspect-[3/2] w-full rounded-[6px] overflow-hidden bg-[#F5F5F3] border border-[#E5E5E3]">
            <img
              src="/about/store.webp"
              alt="WrapStore physical showroom on Railway Station Rd, Dharmapuri"
              width={600}
              height={400}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[12px] text-[#8C8C8C] leading-snug">
            WrapStore showroom, Railway Station Rd, Dharmapuri.
          </p>
        </div>
      </div>

      {/* 3. Bottom CTA to Cases */}
      <div className="pt-8 border-t border-[#E5E5E3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-[#141414]">
            Explore our collection
          </p>
          <p className="text-[13px] text-[#6B6B6B]">
            Find precision cases and accessories for your phone model.
          </p>
        </div>
        <Link
          to="/?category=Mobile%20Cases"
          className="min-h-[44px] px-6 py-2.5 bg-[#141414] hover:bg-[#383836] text-white font-semibold text-[14px] rounded-[6px] transition-colors inline-flex items-center justify-center"
        >
          Shop cases
        </Link>
      </div>
    </main>
  );
}

export default AboutPage;
