import React from 'react';

/**
 * Official WrapStore Logo Component
 * Renders the two-tone bordered box logo:
 * - Outer rectangular border
 * - Solid black left half with white "WRAP"
 * - White right half with black "STORE"
 *
 * @param {'default' | 'inverted' | 'monochrome'} variant
 * @param {'sm' | 'md' | 'lg' | 'xl'} size
 * @param {string} className
 */
export function Logo({
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'h-6',
    md: 'h-7 sm:h-8',
    lg: 'h-9 sm:h-10',
    xl: 'h-12',
  };

  const isLight = variant === 'inverted';

  return (
    <svg
      viewBox="0 0 260 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`
        inline-block shrink-0 w-auto select-none transition-transform duration-200
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
      aria-label="WRAPSTORE"
      {...props}
    >
      {/* Outer Border Frame */}
      <rect
        x="3"
        y="3"
        width="254"
        height="68"
        fill={isLight ? '#111111' : '#FFFFFF'}
        stroke={isLight ? '#FFFFFF' : '#000000'}
        strokeWidth="4.5"
      />

      {/* Left Solid Box */}
      <rect
        x="8.5"
        y="8.5"
        width="118"
        height="57"
        fill={isLight ? '#FFFFFF' : '#000000'}
      />

      {/* "WRAP" Text */}
      <text
        x="67.5"
        y="47.5"
        fill={isLight ? '#000000' : '#FFFFFF'}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="27"
        fontWeight="600"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        WRAP
      </text>

      {/* "STORE" Text */}
      <text
        x="187"
        y="47.5"
        fill={isLight ? '#FFFFFF' : '#000000'}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="27"
        fontWeight="800"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        STORE
      </text>
    </svg>
  );
}

export default Logo;
