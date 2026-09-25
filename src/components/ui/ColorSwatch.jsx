import React from 'react';

/**
 * Color map for translating variant names to CSS hexadecimal / styling values.
 */
const COLOR_MAP = {
  black: '#1A1A1A',
  charcoal: '#262626',
  obsidian: '#1F2022',
  midnight: '#181E29',
  'space gray': '#4B4D52',
  'space black': '#1D1D1F',
  silver: '#E2E4E6',
  white: '#FFFFFF',
  clear: 'transparent',
  frost: '#F0F0F2',
  'saddle brown': '#8A5232',
  'saddle tan': '#9E6746',
  saddle: '#9E6746',
  amber: '#C7622D',
  rust: '#BA5026',
  terracotta: '#D47355',
  tan: '#C49E7C',
  caramel: '#A66A38',
  cognac: '#8B4513',
  walnut: '#4B3621',
  'deep walnut': '#3D2B1F',
  olive: '#556B2F',
  'forest green': '#2D4A3E',
  'pine green': '#1F3F35',
  sage: '#8A9A86',
  'ocean blue': '#254E70',
  navy: '#1B2A4A',
  blue: '#3B82F6',
  'sierra blue': '#9FB8D0',
  'pacific blue': '#2E5266',
  'natural titanium': '#9E9992',
  'desert titanium': '#B8A495',
  'rose gold': '#B76E79',
  gold: '#D4AF37',
  sand: '#D8C3A5',
  stone: '#8E8D8A',
  slate: '#64748B',
};

/**
 * Helper to resolve a color string to a CSS background representation.
 */
function resolveColorStyle(colorName = '') {
  const normalized = colorName.toLowerCase().trim();
  
  if (normalized === 'clear') {
    return {
      background: 'linear-gradient(135deg, #FFFFFF 40%, #E5E7EB 50%, #FFFFFF 60%)',
      border: '1px dashed #9CA3AF',
    };
  }

  const hex = COLOR_MAP[normalized] || '#9CA3AF';
  return {
    backgroundColor: hex,
  };
}

/**
 * ColorSwatch component
 * Renders color_variants as small circular swatches — purely a visual/selectable display,
 * NOT tied to separate stock or price.
 *
 * @param {string[]} colors - Array of color variant names (e.g. ['Black', 'Clear', 'Blue'])
 * @param {string} selectedColor - Currently active/selected color name
 * @param {function} onSelect - Optional click handler (colorName) => void
 * @param {'sm' | 'md' | 'lg'} size - Size of the swatches
 * @param {boolean} interactive - Whether swatches are clickable buttons or static previews
 * @param {boolean} showLabel - Display the active color name next to/above swatches
 * @param {string} className - Additional container CSS classes
 */
export function ColorSwatch({
  colors = [],
  selectedColor,
  onSelect,
  size = 'md',
  interactive = true,
  showLabel = false,
  className = '',
  ...props
}) {
  if (!colors || colors.length === 0) return null;

  const sizeDimensions = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const ringOffsets = {
    sm: 'p-0.5',
    md: 'p-0.5',
    lg: 'p-1',
  };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`} {...props}>
      {showLabel && selectedColor && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-sans">
          <span className="text-neutral-400">Color:</span>
          <span className="font-medium text-neutral-900">{selectedColor}</span>
        </div>
      )}

      <div
        className="flex items-center flex-wrap gap-1.5"
        role={interactive ? 'radiogroup' : 'group'}
        aria-label="Color options"
      >
        {colors.map((colorName) => {
          const isSelected = selectedColor && selectedColor.toLowerCase() === colorName.toLowerCase();
          const colorStyle = resolveColorStyle(colorName);
          const isWhiteOrClear =
            colorName.toLowerCase() === 'white' ||
            colorName.toLowerCase() === 'clear' ||
            colorName.toLowerCase() === 'silver';

          const swatchContent = (
            <span
              className={`
                block rounded-full transition-transform duration-150
                ${sizeDimensions[size] || sizeDimensions.md}
                ${isWhiteOrClear && colorName.toLowerCase() !== 'clear' ? 'border border-neutral-300' : ''}
                ${isSelected ? 'scale-90 shadow-xs' : 'hover:scale-105'}
              `}
              style={colorStyle}
            />
          );

          if (!interactive) {
            return (
              <span
                key={colorName}
                title={colorName}
                className={`
                  relative inline-flex items-center justify-center rounded-full
                  ${ringOffsets[size] || ringOffsets.md}
                  ${isSelected ? 'ring-1.5 ring-neutral-900 ring-offset-1 ring-offset-base-offwhite' : ''}
                `}
              >
                {swatchContent}
              </span>
            );
          }

          return (
            <button
              key={colorName}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select color ${colorName}`}
              title={colorName}
              onClick={() => onSelect && onSelect(colorName)}
              className={`
                relative inline-flex items-center justify-center rounded-full transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                ${ringOffsets[size] || ringOffsets.md}
                ${
                  isSelected
                    ? 'ring-1.5 ring-neutral-900 ring-offset-1 ring-offset-base-offwhite'
                    : 'hover:ring-1 hover:ring-neutral-300'
                }
              `}
            >
              {swatchContent}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ColorSwatch;
