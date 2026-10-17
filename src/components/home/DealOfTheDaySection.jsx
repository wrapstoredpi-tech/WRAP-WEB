import React from 'react';
import { Link } from 'react-router-dom';
import { deal as dealConfig } from '../../config/deal';
import { formatINR } from '../../lib/currency';
import { SpotlightPhoto } from './SpotlightPhoto';

export function DealOfTheDaySection({ dealData }) {
  if (!dealData || !dealData.product) return null;

  const { product, sellingPrice, mrp, percentOff, savings } = dealData;
  const availableStock = Number(product.available_stock ?? product.current_stock ?? 0);
  const shortLine = dealConfig.shortLine || '';
  const photoSrc = dealConfig.image || product.image_url || product.primary_image;

  return (
    <section
      aria-labelledby="deal-of-the-day-title"
      className="w-full bg-[#F4F3F0] border-y border-[#E5E5E3] py-12 lg:py-16 select-none"
    >
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6">
        {/* On Mobile: H2 sits at the top */}
        <h2 className="lg:hidden font-display font-normal text-[30px] leading-[1.1] tracking-[-0.01em] text-[#141414] mb-6">
          {dealConfig.heading || 'Deal of the day'}
        </h2>

        {/* 12-Column Grid: Text 5 cols on Left, Photo 7 cols on Right (Desktop)
            Mobile: Photo, then Text/Price/Button */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Photo: Desktop Right 7 cols (order-2), Mobile Top (order-1) */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <Link to={`/product/${product.id}`} tabIndex={-1} aria-hidden="true" className="block cursor-pointer">
              <SpotlightPhoto
                src={photoSrc}
                alt={product.name}
                customImage={dealConfig.image}
              />
            </Link>
          </div>

          {/* Text: Desktop Left 5 cols (order-1), Mobile Bottom (order-2) */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-center space-y-5">
            {/* H2 on Desktop only */}
            <h2
              id="deal-of-the-day-title"
              className="hidden lg:block font-display font-normal text-[40px] leading-[1.1] tracking-[-0.01em] text-[#141414]"
            >
              {dealConfig.heading || 'Deal of the day'}
            </h2>

            {/* Product Name (Poppins 600, 2 lines max) */}
            <div className="space-y-1.5">
              <Link to={`/product/${product.id}`} className="block hover:text-[#B0521F] transition-colors cursor-pointer">
                <h3 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[#141414] leading-[1.3] line-clamp-2">
                  {product.name}
                </h3>
              </Link>

              {/* Optional short line from config */}
              {shortLine ? (
                <p className="font-sans font-normal text-[14px] text-[#6B6B6B] leading-[1.5]">
                  {shortLine}
                </p>
              ) : null}
            </div>

            {/* Price Block: selling price 700 28px, struck MRP, savings */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-baseline gap-3">
                <span className="font-sans font-bold text-[28px] tabular-nums text-[#141414]">
                  {formatINR(sellingPrice)}
                </span>
                {mrp > sellingPrice && (
                  <span className="font-sans font-normal text-[16px] tabular-nums text-[#6B6B6B] line-through">
                    {formatINR(mrp)}
                  </span>
                )}
              </div>
              <div className="font-sans font-medium text-[14px] text-[#141414]">
                You save {formatINR(savings)} ({percentOff}% off)
              </div>
            </div>

            {/* Only N left (only when available_stock <= 5) */}
            {availableStock <= 5 && availableStock > 0 && (
              <p className="font-sans font-medium text-[13px] text-[#B0521F]">
                Only {availableStock} left
              </p>
            )}

            {/* Button: Shop the deal linking to product page */}
            <div className="pt-2">
              <Link
                to={`/product/${product.id}`}
                className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 bg-[#141414] hover:bg-[#383836] text-white font-sans font-semibold text-[15px] rounded-[6px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 text-center cursor-pointer"
              >
                {dealConfig.buttonText || 'Shop the deal'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DealOfTheDaySection;
