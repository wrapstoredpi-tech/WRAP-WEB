import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../lib/currency';

const PAIRINGS = [
  {
    id: 'A',
    name: 'Pairing A (Default)',
    displayFont: "'DM Serif Display', Georgia, serif",
    sansFont: "'Poppins', sans-serif",
    headlineWeight: 400,
    description: 'DM Serif Display 400 for large headlines + Poppins for nav, body, buttons, and prices.',
  },
  {
    id: 'B',
    name: 'Pairing B',
    displayFont: "'Cormorant Garamond', Georgia, serif",
    sansFont: "'Poppins', sans-serif",
    headlineWeight: 500,
    description: 'Cormorant Garamond 500 (display only) + Poppins for nav, body, buttons, and prices.',
  },
  {
    id: 'C',
    name: 'Pairing C',
    displayFont: "'Poppins', sans-serif",
    sansFont: "'Poppins', sans-serif",
    headlineWeight: 700,
    description: 'Poppins only (700 for headlines, 400–600 for body, nav, buttons, and prices).',
  },
];

export function TypeTestPage() {
  const [activePairingId, setActivePairingId] = useState('A');

  // Apply chosen pairing to root CSS variables for live site-wide preview
  const handleApplyPairing = (pairing) => {
    setActivePairingId(pairing.id);
    document.documentElement.style.setProperty('--font-display', pairing.displayFont);
    document.documentElement.style.setProperty('--font-sans', pairing.sansFont);
  };

  // Reset to default on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--font-display');
      document.documentElement.style.removeProperty('--font-sans');
    };
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="space-y-3 pb-6 border-b border-[#E5E5E3]">
        <span className="text-[12px] font-semibold text-[#B0521F]">
          Typography Preview
        </span>
        <h1 className="text-[34px] sm:text-[48px] text-[#141414] leading-tight">
          Typography Pairing Test
        </h1>
        <p className="text-[16px] text-[#6B6B6B] max-w-2xl">
          Evaluate font pairings with real WrapStore content. You can click any pairing below to apply it live across the entire website via <code className="px-1.5 py-0.5 bg-white border border-[#E5E5E3] rounded text-[13px]">--font-display</code> and <code className="px-1.5 py-0.5 bg-white border border-[#E5E5E3] rounded text-[13px]">--font-sans</code>.
        </p>
      </div>

      {/* Pairing switcher tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PAIRINGS.map((p) => {
          const isActive = activePairingId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPairing(p)}
              className={`text-left p-5 rounded-[6px] border transition-all cursor-pointer ${
                isActive
                  ? 'bg-white border-[#141414] shadow-sm'
                  : 'bg-[#FAFAF9] border-[#E5E5E3] hover:border-[#141414]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#141414]">{p.name}</span>
                {isActive && (
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 bg-[#141414] text-white rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#6B6B6B] mt-2 leading-relaxed">
                {p.description}
              </p>
              <div className="mt-3 pt-3 border-t border-[#E5E5E3] text-[11px] font-mono text-[#6B6B6B] space-y-1">
                <div className="truncate">Display: {p.displayFont.split(',')[0]}</div>
                <div className="truncate">Sans: {p.sansFont.split(',')[0]}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison cards with real WrapStore content */}
      <div className="space-y-8">
        <h2 className="text-[28px] sm:text-[32px] text-[#141414]">
          Comparative Preview
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PAIRINGS.map((pairing) => {
            return (
              <div
                key={pairing.id}
                className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-6 flex flex-col justify-between"
                style={{
                  fontFamily: pairing.sansFont,
                }}
              >
                <div className="space-y-6">
                  {/* Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
                    <span className="text-[14px] font-semibold text-[#141414]">
                      {pairing.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyPairing(pairing)}
                      className="text-[12px] font-semibold text-[#B0521F] hover:underline"
                    >
                      Apply sitewide
                    </button>
                  </div>

                  {/* 1. Headline */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] block mb-1">
                      Display Headline (40px / 30px)
                    </span>
                    <h3
                      className="text-[30px] leading-tight text-[#141414]"
                      style={{
                        fontFamily: pairing.displayFont,
                        fontWeight: pairing.headlineWeight,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Cases for iPhone and Samsung
                    </h3>
                  </div>

                  {/* 2. Nav row */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] block mb-1">
                      Navigation Row
                    </span>
                    <nav className="flex flex-wrap gap-3 text-[14px] font-medium text-[#141414] py-2 border-y border-[#E5E5E3]">
                      <span className="hover:text-[#B0521F] cursor-pointer">iPhone Cases</span>
                      <span className="hover:text-[#B0521F] cursor-pointer">Samsung Cases</span>
                      <span className="hover:text-[#B0521F] cursor-pointer">Accessories</span>
                      <span className="hover:text-[#B0521F] cursor-pointer">About</span>
                      <span className="hover:text-[#B0521F] cursor-pointer">Contact</span>
                    </nav>
                  </div>

                  {/* 3. Product card with real price and tabular-nums */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] block mb-1">
                      Product Card &amp; Price (Rupee U+20B9)
                    </span>
                    <div className="border border-[#E5E5E3] rounded-[6px] overflow-hidden bg-[#FAFAF9]">
                      <div className="aspect-[4/3] bg-[#E5E5E3] relative overflow-hidden">
                        <img
                          src="/subcategories/iphone.jpg"
                          alt="Mobile Cases - Silicon"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2 bg-white">
                        <h4 className="text-[16px] font-semibold text-[#141414]">
                          Mobile Cases - Silicon
                        </h4>
                        <div className="flex items-baseline gap-2 tabular-nums">
                          <span className="text-[16px] font-bold text-[#141414]">
                            {formatINR(499)}
                          </span>
                          <span className="text-[14px] text-[#6B6B6B] line-through">
                            {formatINR(799)}
                          </span>
                          <span className="text-[12px] text-[#B0521F] font-semibold">
                            38% off
                          </span>
                        </div>
                        <div className="text-[12px] text-[#6B6B6B]">
                          In stock • Dharmapuri store
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Button */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] block mb-1">
                      Button
                    </span>
                    <button
                      type="button"
                      className="w-full min-h-[44px] px-6 py-2.5 bg-[#B0521F] text-white text-[16px] font-semibold rounded-[6px]"
                    >
                      Shop cases
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E5E3] text-[12px] text-[#6B6B6B]">
                  Tabular numbers check: <span className="tabular-nums font-semibold text-[#141414]">₹1,249.00 / 0123456789</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-[#E5E5E3] flex justify-between items-center text-[14px] text-[#6B6B6B]">
        <span>Return to <Link to="/" className="text-[#B0521F] hover:underline font-semibold">Home page</Link></span>
        <span>WrapStore Typography Test</span>
      </div>
    </div>
  );
}

export default TypeTestPage;
