import React from 'react';
import { Smartphone } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';

export function PhoneBar() {
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  return (
    <div className="w-full bg-[#FAFAF9] text-[#141414] border-b border-[#E5E5E3] h-[36px] flex items-center px-4 sm:px-6 z-30">
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Smartphone className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
          {savedPhone && savedPhone.model ? (
            <span className="truncate text-[#6B6B6B]">
              Cases for <strong className="text-[#141414] font-semibold">{savedPhone.model}</strong>
            </span>
          ) : (
            <span className="text-[#6B6B6B]">Select your phone</span>
          )}
        </div>

        <button
          type="button"
          onClick={openPhoneSheet}
          className="text-[12px] font-semibold text-[#141414] hover:text-[#B0521F] underline underline-offset-2 transition-colors cursor-pointer py-1"
          aria-label={savedPhone ? `Change phone model from ${savedPhone.model}` : 'Select your phone model'}
        >
          {savedPhone && savedPhone.model ? 'Change' : 'Select'}
        </button>
      </div>
    </div>
  );
}

export default PhoneBar;
