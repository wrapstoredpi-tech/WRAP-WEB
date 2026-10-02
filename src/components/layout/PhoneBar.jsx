import React from 'react';
import { Smartphone, ChevronRight } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';

export function PhoneBar() {
  const { savedPhone, openPhoneSheet } = usePhoneContext();

  return (
    <div className="w-full bg-[#FAFAF9] text-[#141414] border-b border-[#E7E5E4] py-2 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Smartphone className="w-3.5 h-3.5 text-[#666664] shrink-0" />
          {savedPhone ? (
            <span className="truncate text-[#666664]">
              Compatibility active for <span className="text-[#141414] font-semibold">{savedPhone.model}</span>
            </span>
          ) : (
            <span className="truncate text-[#666664]">
              Select your phone for exact fit compatibility
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={openPhoneSheet}
          className="shrink-0 flex items-center gap-1 font-semibold text-[#141414] hover:text-[#9E381A] transition-colors focus-visible:outline-[#141414] py-0.5"
          aria-label={savedPhone ? `Change phone from ${savedPhone.model}` : 'Select phone model'}
        >
          <span>{savedPhone ? 'Change' : 'Select'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#666664]" />
        </button>
      </div>
    </div>
  );
}

export default PhoneBar;
