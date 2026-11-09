import React, { useState } from 'react';
import { Package } from 'lucide-react';

function NeutralSilhouette({ className = '' }) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-[#F5F4F0] text-[#A3A3A3] ${className}`}
      aria-hidden="true"
    >
      <Package className="w-4 h-4 stroke-[1.4]" />
    </div>
  );
}

function SafeImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <NeutralSilhouette className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/**
 * ComboThumbnail
 * Renders tiled component photos:
 *  - 1 item: single photo
 *  - 2 items: 2 side by side
 *  - 3 items: 1 large on left, 2 stacked on right
 *  - 4+ items: 2x2 grid with +N on the 4th tile if > 4
 *  - Fallback to neutral silhouette on failure
 */
export function ComboThumbnail({ product, components = [], className = '' }) {
  // If the combo has its own explicit custom image that is distinct from components
  const hasDedicatedImage = Boolean(
    product?.combo_image ||
    (product?.image_url && (!components || components.length === 0 || !components.some(c => c.image === product.image_url)))
  );

  // If there's an explicit custom combo image and no tiling desired
  if (hasDedicatedImage && components.length === 0) {
    return (
      <div className={`w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0 relative ${className}`}>
        <SafeImage src={product.image_url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  const validComponents = Array.isArray(components) ? components : [];

  // If no components available, fallback to product image or silhouette
  if (validComponents.length === 0) {
    return (
      <div className={`w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0 relative ${className}`}>
        <SafeImage src={product?.image_url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 1 item
  if (validComponents.length === 1) {
    return (
      <div className={`w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0 relative ${className}`}>
        <SafeImage src={validComponents[0].image} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 2 items: side by side
  if (validComponents.length === 2) {
    return (
      <div className={`w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0 relative ${className}`}>
        <div className="grid grid-cols-2 w-full h-full gap-0.5 bg-[#E5E5E3]">
          <div className="relative w-full h-full bg-[#FAFAF9] overflow-hidden">
            <SafeImage src={validComponents[0].image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative w-full h-full bg-[#FAFAF9] overflow-hidden">
            <SafeImage src={validComponents[1].image} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  // 3 items: 1 large on left + 2 stacked on right
  if (validComponents.length === 3) {
    return (
      <div className={`w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0 relative ${className}`}>
        <div className="grid grid-cols-2 w-full h-full gap-0.5 bg-[#E5E5E3]">
          <div className="relative w-full h-full bg-[#FAFAF9] overflow-hidden">
            <SafeImage src={validComponents[0].image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-rows-2 w-full h-full gap-0.5">
            <div className="relative w-full h-full bg-[#FAFAF9] overflow-hidden">
              <SafeImage src={validComponents[1].image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative w-full h-full bg-[#FAFAF9] overflow-hidden">
              <SafeImage src={validComponents[2].image} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4 or more items: 2x2 grid with +N badge on 4th tile if > 4
  return (
    <div className={`w-20 sm:w-24 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0 relative ${className}`}>
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-[#E5E5E3]">
        {validComponents.slice(0, 4).map((c, idx) => (
          <div key={idx} className="relative w-full h-full bg-[#FAFAF9] overflow-hidden">
            <SafeImage src={c.image} alt="" className="w-full h-full object-cover" />
            {idx === 3 && validComponents.length > 4 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center text-white text-[11px] font-bold tabular-nums">
                +{validComponents.length - 3}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComboThumbnail;

