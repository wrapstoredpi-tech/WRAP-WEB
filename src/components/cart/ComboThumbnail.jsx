import React, { useState } from 'react';

function SafeImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`w-full h-full bg-[#F4F3F0] ${className}`} aria-hidden="true" />;
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
 * Requirement 3:
 * Images: use the combo image if set; otherwise a 2x2 collage of its component product photos on #F4F3F0.
 * No placeholder icons anywhere.
 */
export function ComboThumbnail({ combo, product, components = [], className = '' }) {
  const item = combo || product || null;

  // 1. Explicit dedicated combo image
  const explicitImage =
    item?.combo_image ||
    (item?.image_url && !item.image_url.includes('placeholder') ? item.image_url : null) ||
    (item?.image && !item.image.includes('placeholder') ? item.image : null);

  // 2. Component photos if any
  const rawComponents =
    (components && components.length > 0 ? components : null) ||
    (item?.combo_items && item.combo_items.length > 0 ? item.combo_items : null) ||
    (item?.items && item.items.length > 0 ? item.items : null) ||
    [];

  const componentPhotos = rawComponents
    .map((c) => c?.image || c?.image_url || c?.product?.image_url || (Array.isArray(c?.images) && c.images[0]))
    .filter(Boolean);

  // If explicit combo image is set, render it full bleed
  if (explicitImage) {
    return (
      <div className={`w-full h-full bg-[#F4F3F0] rounded-[6px] overflow-hidden relative ${className}`}>
        <SafeImage src={explicitImage} alt={item?.name || 'Combo'} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Otherwise, render a 2x2 collage of component photos on #F4F3F0
  return (
    <div className={`w-full h-full bg-[#F4F3F0] rounded-[6px] overflow-hidden relative ${className}`}>
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-[#E5E5E3]">
        {[0, 1, 2, 3].map((idx) => {
          const photo = componentPhotos[idx];
          return (
            <div key={idx} className="relative w-full h-full bg-[#F4F3F0] overflow-hidden">
              {photo ? (
                <SafeImage src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#F4F3F0]" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ComboThumbnail;
