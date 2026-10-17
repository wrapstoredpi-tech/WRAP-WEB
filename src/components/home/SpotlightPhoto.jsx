import React, { useState } from 'react';

export function SpotlightPhoto({
  src,
  alt = 'Product photo',
  customImage = null,
}) {
  const [naturalWidth, setNaturalWidth] = useState(null);
  const imageSrc = customImage || src;

  const handleLoad = (e) => {
    if (e.target && e.target.naturalWidth) {
      setNaturalWidth(e.target.naturalWidth);
    }
  };

  const isUnder700 = naturalWidth !== null && naturalWidth < 700;

  return (
    <div
      className={`relative w-full aspect-[4/3] sm:aspect-square rounded-[6px] overflow-hidden ${
        isUnder700 ? 'bg-[#EAE8E3] p-6 flex items-center justify-center' : 'bg-[#E5E5E3]'
      }`}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={800}
        height={800}
        loading="lazy"
        onLoad={handleLoad}
        className={`w-full h-full rounded-[6px] transition-opacity duration-300 ${
          isUnder700 ? 'object-contain max-h-full max-w-full' : 'object-cover'
        }`}
      />
    </div>
  );
}

export default SpotlightPhoto;
