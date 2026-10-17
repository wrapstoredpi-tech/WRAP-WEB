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
  const validColors = getValidColors(colors);
  if (!validColors || validColors.length === 0) return null;

  const sizeDimensions = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`inline-flex items-center flex-wrap gap-1.5 select-none ${className}`}
      aria-label={`Colours: ${validColors.join(', ')}`}
      {...props}
    >
      {validColors.map((colorName, idx) => {
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
            title={colorName}
            aria-label={colorName}
            className="group relative inline-flex items-center justify-center cursor-default"
          >
            <span
              className={`
                block rounded-full transition-transform duration-150
                ${sizeDimensions[size] || sizeDimensions.md}
                ${isLight && lowerName !== 'clear' && lowerName !== 'clear/transparent' ? 'border border-[#E7E5E4]' : ''}
                hover:scale-110
              `}
              style={colorStyle}
            />
          </span>
        );
      })}
    </div>
  );
}

export default ColorSwatch;
