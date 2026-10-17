import React from 'react';
import { Link } from 'react-router-dom';
import { about } from '../../config/about';

export function HomeAboutBlock() {
  const paragraphs = about.paragraphs || [];

  return (
    <section aria-labelledby="home-about-heading" className="select-none">
      {/* 2-Column Block: Text on left, store photo on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8">
        
        {/* Left Column: Heading + Paragraphs in order (1st as lead) */}
        <div className="md:col-span-7 space-y-4">
          <h2
            id="home-about-heading"
            className="font-display font-normal text-[30px] sm:text-[40px] text-[#141414] tracking-[-0.01em] leading-[1.1]"
          >
            About WrapStore
          </h2>

          {/* First paragraph as a larger lead paragraph */}
          {paragraphs.length > 0 && (
            <p className="font-sans text-[17px] sm:text-[18px] text-[#141414] font-normal leading-relaxed">
              {paragraphs[0]}
            </p>
          )}

          {/* Remaining paragraphs in order */}
          <div className="space-y-3 font-sans text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
            {paragraphs.slice(1).map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#B0521F] hover:underline cursor-pointer"
            >
              <span>Read more about WrapStore</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Store Photo */}
        <div className="md:col-span-5">
          <div className="aspect-[3/2] w-full rounded-[6px] overflow-hidden bg-[#F5F5F3] border border-[#E5E5E3]">
            <img
              src="/about/store.webp"
              alt="WrapStore retail showroom on Railway Station Rd, Dharmapuri"
              width={600}
              height={400}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeAboutBlock;
