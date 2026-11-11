import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, ArrowRight } from 'lucide-react';
import { usePhoneContext } from '../../context/PhoneContext';
import { modelToSlug } from '../../lib/models';

export function ShopByPhoneStrip() {
  const { savedPhone } = usePhoneContext();

  const brand = (savedPhone?.brand || 'Apple').toLowerCase() === 'samsung' ? 'samsung' : 'apple';
  const slug = savedPhone?.model ? modelToSlug(savedPhone.model) : '';
  const hasPhone = Boolean(savedPhone?.model);

  const destination = hasPhone ? `/cases/${brand}/${slug}` : '/cases';
  const buttonLabel = hasPhone ? `${savedPhone.model} — Shop now` : 'Find your model';

  return (
    <section aria-label="Shop cases for your phone" className="w-full select-none">
      <div className="w-full bg-white border border-[#E5E5E3] rounded-[6px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Smartphone Icon + Prompt */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#F4F3F0] border border-[#E5E5E3] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-[#B0521F]" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] sm:text-[16px] text-[#141414] leading-snug">
              Shop cases for your phone
            </h3>
            <p className="text-[12px] sm:text-[13px] text-[#6B6B6B] mt-0.5">
              {hasPhone
                ? `Showing compatible cases and screen protectors for ${savedPhone.model}`
                : 'Select your phone once to filter all cases and accessories'}
            </p>
          </div>
        </div>

        {/* Right: Action Button */}
        <div className="w-full sm:w-auto shrink-0">
          <Link
            to={destination}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#141414] hover:bg-[#B0521F] text-white text-[13px] sm:text-[14px] font-semibold rounded-[6px] transition-colors text-center cursor-pointer"
          >
            <span>{buttonLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ShopByPhoneStrip;

