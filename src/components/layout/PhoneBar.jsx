/**
 * src/components/layout/PhoneBar.jsx
 * ──────────────────────────────────
 * Slim persistent bar under header: "Cases for iPhone 15 Pro · Change"
 * Tapping it re-opens the Phone Selection Sheet.
 */
import React from 'react';
import { Smartphone, ChevronRight } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';

export function PhoneBar() {
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  return (
    <div className="w-full bg-neutral-900 text-base-offwhite border-b border-neutral-800 text-xs py-2 px-4">
      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Smartphone className="w-3.5 h-3.5 text-accent shrink-0" />
          {savedPhone ? (
            <span className="truncate text-neutral-200">
              Cases tailored for <strong className="text-white font-semibold">{savedPhone.model}</strong>
            </span>
          ) : (
            <span className="truncate text-neutral-300">
              Select your phone for guaranteed compatible fits
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={openPhoneSheet}
          className="shrink-0 flex items-center gap-1 font-semibold text-accent hover:text-white transition-colors focus-visible:outline-accent py-0.5 px-1 min-h-[32px]"
          aria-label={savedPhone ? `Change phone model from ${savedPhone.model}` : 'Select your phone model'}
        >
          <span>{savedPhone ? 'Change' : 'Select Phone'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default PhoneBar;
