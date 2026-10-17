import React from 'react';
import { Link } from 'react-router-dom';
import { featured as featuredConfig } from '../../config/featured';
import { formatINR } from '../../lib/currency';
import { SpotlightPhoto } from './SpotlightPhoto';

export function deriveCompatibilityLine(product) {
  if (!product) return '';
  const models = product.compatible_models || [];
  if (models.length === 1) {
    return `Fits ${models[0]}`;
  }
  if (models.length > 1) {
    return `Fits ${models[0]} and ${models.length - 1} more models`;
  }
  if (product.category && product.category !== 'Other') {
    return product.category;
  }
  if (product.subcategory && product.subcategory !== 'Other') {
    return product.subcategory;
  }
  return 'Everyday accessories';
}

export function FeaturedProductSection({ product }) {
  if (!product) return null;

  const sellingPrice = Number(product.selling_price) || 0;
  const rawMrp = Number(product.mrp);
  const mrp = rawMrp > sellingPrice ? rawMrp : (product.discount_percentage > 0 ? Math.round(sellingPrice / (1 - product.discount_percentage / 100)) : sellingPrice);
  const isDiscounted = mrp > sellingPrice;

  const compatibilityLine = deriveCompatibilityLine(product);
  const photoSrc = featuredConfig.image || product.image_url || product.primary_image;

  return (
    <section
      aria-labelledby="featured-section-title"
      className="w-full select-none"
    >
      {/* On Mobile: H2 sits at the top */}
      <h2 className="lg:hidden font-display font-normal text-[30px] leading-[1.1] tracking-[-0.01em] text-[#141414] mb-6">
        {featuredConfig.heading || 'Featured'}
      </h2>

      {/* Mirrored 12-Column Grid: Photo 7 cols on Left, Text 5 cols on Right (Desktop)
          Mobile: Photo, then Text/Price/Button */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Photo: Desktop Left 7 cols (order-1), Mobile Top (order-1) */}
        <div className="order-1 lg:col-span-7">
          <Link to={`/product/${product.id}`} tabIndex={-1} aria-hidden="true" className="block cursor-pointer">
            <SpotlightPhoto
              src={photoSrc}
              alt={product.name}
              customImage={featuredConfig.image}
            />
          </Link>
        </div>

        {/* Text: Desktop Right 5 cols (order-2), Mobile Bottom (order-2) */}
        <div className="order-2 lg:col-span-5 flex flex-col justify-center space-y-5">
          {/* H2 on Desktop only */}
          <h2
            id="featured-section-title"
            className="hidden lg:block font-display font-normal text-[40px] leading-[1.1] tracking-[-0.01em] text-[#141414]"
          >
            {featuredConfig.heading || 'Featured'}
          </h2>

          {/* Product Name (Poppins 600) */}
          <div className="space-y-1.5">
            <Link to={`/product/${product.id}`} className="block hover:text-[#B0521F] transition-colors cursor-pointer">
              <h3 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[#141414] leading-[1.3] line-clamp-2">
                {product.name}
              </h3>
            </Link>

            {/* Compatibility line */}
            {compatibilityLine && (
              <p className="font-sans font-normal text-[14px] text-[#6B6B6B] leading-[1.5]">
                {compatibilityLine}
              </p>
            )}
          </div>

          {/* Price: 700 with MRP struck through only when discounted */}
          <div className="pt-1">
            <div className="flex items-baseline gap-3">
              <span className="font-sans font-bold text-[24px] sm:text-[28px] tabular-nums text-[#141414]">
                {formatINR(sellingPrice)}
              </span>
              {isDiscounted && (
                <span className="font-sans font-normal text-[16px] tabular-nums text-[#6B6B6B] line-through">
                  {formatINR(mrp)}
                </span>
              )}
            </div>
          </div>

          {/* Actions: Primary button "View product" & text link "See all featured" */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <Link
              to={`/product/${product.id}`}
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 bg-[#141414] hover:bg-[#383836] text-white font-sans font-semibold text-[15px] rounded-[6px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 text-center cursor-pointer"
            >
              {featuredConfig.buttonText || 'View product'}
            </Link>

            <Link
              to="/?featured=1"
              className="inline-flex items-center text-[14px] font-sans font-semibold text-[#141414] hover:text-[#B0521F] hover:underline cursor-pointer transition-colors"
            >
              {featuredConfig.seeAllText || 'See all featured'} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProductSection;
