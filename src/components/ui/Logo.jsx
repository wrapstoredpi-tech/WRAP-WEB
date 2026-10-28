import React from 'react';

/**
 * WrapStore Official Identity Logo (Local PNG)
 */
export function Logo({
  variant = 'default',
  size = 'md',
  className = '',
  alt = 'WrapStore',
  ...props
}) {
  const isLight = variant === 'inverted';

  // Sizing maps for height classes
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-7 sm:h-8',
    lg: 'h-9 sm:h-10',
    xl: 'h-11 sm:h-12',
  };

  const currentHeight = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      aria-label="WRAPSTORE"
      {...props}
    >
      <img
        src="/logo.png"
        alt={alt}
        className={`${currentHeight} w-auto object-contain select-none transition-transform duration-150 ${
          isLight ? 'invert brightness-0 invert-100' : ''
        }`}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

export default Logo;

