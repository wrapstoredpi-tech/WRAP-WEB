import React from 'react';

/**
 * Extensive palette mapping common mobile case, leather, tech, and fashion color names
 * to accurate CSS hex/gradient colors.
 */
const EXTENSIVE_COLOR_MAP = {
  // Blacks, Grays & Metallics
  black: '#121212',
  'matte black': '#1F1F1F',
  'phantom black': '#141414',
  'space black': '#1B1B1D',
  'space gray': '#4B4D52',
  'space grey': '#4B4D52',
  graphite: '#383838',
  charcoal: '#2B2B2B',
  obsidian: '#1E2022',
  midnight: '#181E29',
  'dark grey': '#374151',
  'dark gray': '#374151',
  gray: '#6B7280',
  grey: '#6B7280',
  silver: '#E5E7EB',
  'phantom silver': '#D1D5DB',
  platinum: '#E5E4E2',
  aluminum: '#D8D9DA',
  titanium: '#9E9992',
  'natural titanium': '#9E9992',
  'desert titanium': '#BCA89B',
  'black titanium': '#2C2B2A',
  'white titanium': '#EDEAE5',
  'blue titanium': '#3A4856',
  gunmetal: '#484A4C',
  pebble: '#A3A3A3',
  stone: '#9E9D9B',
  ash: '#B2BEB5',
  slate: '#64748B',
  smoke: '#737373',

  // Whites & Neutrals
  white: '#FFFFFF',
  'pure white': '#FFFFFF',
  'chalk white': '#F8F9FA',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  bone: '#E3DAC9',
  beige: '#F5F5DC',
  tan: '#D2B48C',
  sand: '#D8C3A5',
  taupe: '#8B8589',
  khaki: '#C3B091',
  starlight: '#F0EBE3',
  porcelain: '#F7F5F0',
  frost: '#EDF2F7',
  frosted: '#EDF2F7',
  clear: 'transparent',
  transparent: 'transparent',
  'clear/transparent': 'transparent',

  // Browns & Leathers
  brown: '#8B4513',
  'saddle brown': '#8A5232',
  'saddle tan': '#9E6746',
  saddle: '#9E6746',
  leather: '#966F33',
  cognac: '#9A461C',
  caramel: '#C68B59',
  amber: '#D97706',
  terracotta: '#D47355',
  rust: '#B45309',
  walnut: '#4B3621',
  'deep walnut': '#3D2B1F',
  bourbon: '#7B3F00',
  espresso: '#362B28',
  coffee: '#4A2C11',
  chocolate: '#3D2314',
  mocha: '#604130',
  cinnamon: '#7B3F00',
  chestnut: '#744230',

  // Blues
  blue: '#2563EB',
  navy: '#1E293B',
  'midnight blue': '#1E1B4B',
  'navy blue': '#0F172A',
  'ocean blue': '#0284C7',
  'pacific blue': '#2E5266',
  'sierra blue': '#9FB8D0',
  'sky blue': '#38BDF8',
  'royal blue': '#1D4ED8',
  'cobalt blue': '#1E40AF',
  'storm blue': '#334155',
  bay: '#5D8AA8',
  cyan: '#06B6D4',
  teal: '#0D9488',
  turquoise: '#14B8A6',
  aqua: '#00FFFF',
  cerulean: '#007BA7',
  indigo: '#4338CA',

  // Greens
  green: '#16A34A',
  'forest green': '#14532D',
  'pine green': '#164E63',
  'midnight green': '#1C3A27',
  'alpine green': '#2E5A44',
  'emerald green': '#059669',
  emerald: '#059669',
  olive: '#556B2F',
  'olive green': '#556B2F',
  sage: '#84A98C',
  mint: '#6EE7B7',
  'mint green': '#6EE7B7',
  aloe: '#9BC49E',
  wintergreen: '#568203',
  hazel: '#6B705C',
  camo: '#4D583E',
  moss: '#4A5D23',
  lime: '#84CC16',
  'lime green': '#84CC16',
  pistachio: '#93C572',

  // Reds, Pinks, Purples & Oranges
  red: '#DC2626',
  'product red': '#EF4444',
  crimson: '#991B1B',
  burgundy: '#800020',
  maroon: '#800000',
  wine: '#722F37',
  ruby: '#9B111E',
  cherry: '#BE123C',
  rose: '#E11D48',
  'rose gold': '#B76E79',
  pink: '#EC4899',
  'blush pink': '#F472B6',
  blush: '#FBCFE8',
  peony: '#F49AC2',
  coral: '#FB7185',
  salmon: '#FA8072',
  peach: '#FDBA74',
  orange: '#EA580C',
  'sunset orange': '#F97316',
  sunset: '#F97316',
  tangerine: '#FB923C',
  yellow: '#EAB308',
  gold: '#D4AF37',
  'champagne gold': '#E8D3A2',
  champagne: '#E8D3A2',
  mustard: '#CA8A04',
  purple: '#7E22CE',
  'deep purple': '#4C1D95',
  'bora purple': '#9333EA',
  lavender: '#C084FC',
  lilac: '#D8B4FE',
  violet: '#6D28D9',
  plum: '#581C87',
  magenta: '#C026D3',
  berry: '#831843',
};

/**
 * Deterministically generates a vibrant, aesthetically pleasing HSL color from any string.
 */
function hashToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  const s = 45 + (Math.abs(hash) % 30);
  const l = 35 + (Math.abs(hash >> 3) % 30);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Intelligently resolves any color string (name, hex, multi-word, or unknown)
 * into a CSS background object for the swatch circle.
 */
export function resolveColorStyle(colorName = '') {
  if (!colorName) {
    return { backgroundColor: '#9CA3AF' };
  }

  const raw = String(colorName).trim();
  const lower = raw.toLowerCase();

  // 1. Direct Hex or CSS Color Function
  if (
    raw.startsWith('#') ||
    raw.startsWith('rgb') ||
    raw.startsWith('hsl') ||
    raw.startsWith('linear-gradient')
  ) {
    return raw.startsWith('linear-gradient')
      ? { background: raw }
      : { backgroundColor: raw };
  }

  // 2. Clear / Transparent special gradient with border
  if (lower === 'clear' || lower === 'transparent' || lower === 'clear/transparent') {
    return {
      background: 'linear-gradient(135deg, #FFFFFF 30%, #D1D5DB 50%, #FFFFFF 70%)',
      border: '1px dashed #9CA3AF',
    };
  }

  // 3. Exact dictionary match
  if (EXTENSIVE_COLOR_MAP[lower]) {
    return { backgroundColor: EXTENSIVE_COLOR_MAP[lower] };
  }

  // 4. Word-by-word fuzzy match
  for (const [key, val] of Object.entries(EXTENSIVE_COLOR_MAP)) {
    if (lower.includes(key)) {
      return { backgroundColor: val };
    }
  }

  // 5. Individual words check
  const words = lower.split(/[\s-_/]+/);
  for (const word of words) {
    if (EXTENSIVE_COLOR_MAP[word]) {
      return { backgroundColor: EXTENSIVE_COLOR_MAP[word] };
    }
  }

  // 6. Native fallback
  return { backgroundColor: hashToColor(raw) };
}

/**
 * ColorSwatch Component (Informational Display Only)
 * 
 * Non-interactive static dots/chips with tooltip showing the colour name on hover/tap.
 * Strictly informational — does not select colors or modify cart/pricing.
 */
export function ColorSwatch({
  colors = [],
  size = 'md',
  className = '',
  ...props
}) {
  if (!colors || colors.length === 0) return null;

  const sizeDimensions = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`inline-flex items-center flex-wrap gap-1.5 select-none ${className}`}
      aria-label={`Colours: ${colors.join(', ')}`}
      {...props}
    >
      {colors.map((colorItem, idx) => {
        const colorName = typeof colorItem === 'object' && colorItem !== null
          ? colorItem.name || colorItem.color || colorItem.label || String(colorItem)
          : String(colorItem);

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
