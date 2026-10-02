import React from 'react';

/**
 * WrapStore Official Identity Logo
 * 
 * Exact vector rendition of the WrapStore logo:
 * - Outer rectangular border
 * - Solid inverted "WRAP" block on the left
 * - Crisp "STORE" typography on the right
 */
export function Logo({
  variant = 'default',
  size = 'md',
  className = '',
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

  const primaryColor = isLight ? '#FFFFFF' : '#141414';
  const contrastTextColor = isLight ? '#141414' : '#FFFFFF';

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      aria-label="WRAPSTORE"
      {...props}
    >
      <svg
        viewBox="0 0 250 68"
        className={`${currentHeight} w-auto transition-transform duration-150`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Rectangular Border */}
        <rect
          x="2"
          y="2"
          width="246"
          height="64"
          stroke={primaryColor}
          strokeWidth="3.5"
          fill="none"
        />

        {/* Left Solid Block for "WRAP" */}
        <rect
          x="9"
          y="9"
          width="114"
          height="50"
          fill={primaryColor}
        />

        {/* "WRAP" Inverted Text */}
        <text
          x="66"
          y="43"
          fill={contrastTextColor}
          fontFamily="Poppins, sans-serif"
          fontSize="24"
          fontWeight="600"
          letterSpacing="0.1em"
          textAnchor="middle"
        >
          WRAP
        </text>

        {/* "STORE" Text on the right */}
        <text
          x="184"
          y="43"
          fill={primaryColor}
          fontFamily="Poppins, sans-serif"
          fontSize="24"
          fontWeight="600"
          letterSpacing="0.12em"
          textAnchor="middle"
        >
          STORE
        </text>
      </svg>
    </div>
  );
}

export default Logo;
