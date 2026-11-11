import React from 'react';
import {
  EXTENSIVE_COLOR_MAP,
  PRIMARY_COLOR_KEYWORDS,
  isRealColor,
  hashToColor,
  getValidColors,
  resolveColorStyle,
} from '../../lib/colors';

// Re-export utility functions so consumers can import directly from UI or lib
export {
  EXTENSIVE_COLOR_MAP,
  PRIMARY_COLOR_KEYWORDS,
  isRealColor,
  hashToColor,
  getValidColors,
  resolveColorStyle,
};

/**
 * ColorSwatch Component (Informational Display Only)
 * 
 * Non-interactive static dots/chips with tooltip showing the colour name on hover/tap.
 * Strictly informational — does not select colors or modify cart/pricing.
 * If no valid colors are present, renders null so the colors area completely disappears and looks normal.
 */
export function ColorSwatch({
  colors = [],
  size = 'md',
  className = '',
  ...props
}) {
  // Support either string array or object array [{ name, inStock }]
  const items = colors
    .map((c) => {
      if (typeof c === 'string') return { name: c, inStock: true };
      return {
        name: c?.name || c?.color || '',
        inStock: c?.inStock !== false && !c?.outOfStock,
      };
    })
    .filter((item) => item.name);

  if (items.length === 0) return null;

  const sizeDimensions = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`inline-flex items-center flex-wrap gap-1.5 select-none ${className}`}
      aria-label={`Colours: ${items.map((i) => i.name).join(', ')}`}
      {...props}
    >
      {items.map((item, idx) => {
        const { name: colorName, inStock } = item;
        const colorStyle = resolveColorStyle(colorName);
        const lowerName = colorName.toLowerCase();
        const isLight =
          lowerName === 'white' ||
          lowerName === 'clear' ||
          lowerName === 'clear/transparent' ||
          lowerName === 'silver' ||
          lowerName === 'frost' ||
          lowerName === 'ivory' ||
          lowerName === 'cream';

        return (
          <span
            key={`${colorName}-${idx}`}
            title={`${colorName}${!inStock ? ' (Sold out)' : ''}`}
            aria-label={`${colorName}${!inStock ? ' (Sold out)' : ''}`}
            className="group relative inline-flex items-center justify-center cursor-default"
          >
            <span
              className={`
                relative block rounded-full transition-transform duration-150 overflow-hidden
                ${sizeDimensions[size] || sizeDimensions.md}
                ${isLight && lowerName !== 'clear' && lowerName !== 'clear/transparent' ? 'border border-[#E5E5E3]' : ''}
                ${!inStock ? 'opacity-60' : 'hover:scale-110'}
              `}
              style={colorStyle}
            >
              {!inStock && (
                <svg
                  className="absolute inset-0 w-full h-full text-[#141414]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <line x1="3" y1="21" x2="21" y2="3" />
                </svg>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default ColorSwatch;
