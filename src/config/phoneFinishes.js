/**
 * src/config/phoneFinishes.js
 * ───────────────────────────
 * Signature finishes (body color, edge bezel, and camera plateau/bump shade)
 * for phone SVG illustrations in the "Shop by phone" section.
 */

export const PHONE_FINISHES = {
  // ─── iPhone 17 Series ───────────────────────────────────────────────────────
  'iPhone 17 Pro Max': { color: '#C8BBA0', edge: '#AD9F84', shade: '#BFAFA2' }, // Desert/Titanium
  'iPhone 17 Pro':     { color: '#C8BBA0', edge: '#AD9F84', shade: '#BFAFA2' },
  'iPhone 17 Air':     { color: '#97C3C0', edge: '#7DA6A3', shade: '#88B2AF' }, // Mint / Sky
  'iPhone 17':         { color: '#97C3C0', edge: '#7DA6A3', shade: '#88B2AF' },

  // ─── iPhone 16 Series ───────────────────────────────────────────────────────
  'iPhone 16 Pro Max': { color: '#C4B59D', edge: '#A6967E', shade: '#B7A890' }, // Desert Titanium
  'iPhone 16 Pro':     { color: '#BDB9B3', edge: '#A29E97', shade: '#B0ACA5' }, // Natural Titanium
  'iPhone 16 Plus':    { color: '#445D86', edge: '#354A6E', shade: '#3D547A' }, // Ultramarine
  'iPhone 16':         { color: '#88C2B3', edge: '#71A99B', shade: '#7BB3A5' }, // Teal

  // ─── iPhone 15 Series ───────────────────────────────────────────────────────
  'iPhone 15 Pro Max': { color: '#BDBAB4', edge: '#A09C95', shade: '#AEA9A2' }, // Natural Titanium
  'iPhone 15 Pro':     { color: '#3A4454', edge: '#2B3442', shade: '#333D4C' }, // Blue Titanium
  'iPhone 15 Plus':    { color: '#DEC8CF', edge: '#C6AEB6', shade: '#D1BAC2' }, // Pink
  'iPhone 15':         { color: '#D8DFD5', edge: '#BDC5BA', shade: '#CBD3C8' }, // Green

  // ─── iPhone 14 Series ───────────────────────────────────────────────────────
  'iPhone 14 Pro Max': { color: '#524B5C', edge: '#3E3847', shade: '#474151' }, // Deep Purple
  'iPhone 14 Pro':     { color: '#E3DFD9', edge: '#C8C4BD', shade: '#D4D0C9' }, // Silver
  'iPhone 14 Plus':    { color: '#9BB4C7', edge: '#8199AB', shade: '#8DA6B9' }, // Blue
  'iPhone 14':         { color: '#E4DFD0', edge: '#C9C4B5', shade: '#D6D1C2' }, // Starlight

  // ─── iPhone 13 Series ───────────────────────────────────────────────────────
  'iPhone 13 Pro Max': { color: '#9AB3C7', edge: '#8099AC', shade: '#8CA5B8' }, // Sierra Blue
  'iPhone 13 Pro':     { color: '#667567', edge: '#515E52', shade: '#5B695C' }, // Alpine Green
  'iPhone 13 mini':    { color: '#DEC4C8', edge: '#C5ABB0', shade: '#D2B7BC' }, // Pink
  'iPhone 13':         { color: '#27313B', edge: '#1B242D', shade: '#212A34' }, // Midnight

  // ─── Samsung Galaxy S25 Series ──────────────────────────────────────────────
  'Samsung Galaxy S25 Ultra': { color: '#686765', edge: '#51504E', shade: '#5C5B59' }, // Titanium Gray
  'Samsung Galaxy S25+':      { color: '#B2C2CC', edge: '#97A7B2', shade: '#A3B4BE' }, // Icy Blue
  'Samsung Galaxy S25':       { color: '#D6D5D2', edge: '#B9B8B5', shade: '#C7C6C3' }, // Silver Shadow

  // ─── Samsung Galaxy S24 Series ──────────────────────────────────────────────
  'Samsung Galaxy S24 Ultra': { color: '#363533', edge: '#262523', shade: '#2E2D2B' }, // Titanium Black
  'Samsung Galaxy S24+':      { color: '#55546C', edge: '#434257', shade: '#4C4B62' }, // Cobalt Violet
  'Samsung Galaxy S24':       { color: '#E5DDCB', edge: '#C7BFAC', shade: '#D6CEBC' }, // Amber Yellow

  // ─── Samsung Galaxy S23 Series ──────────────────────────────────────────────
  'Samsung Galaxy S23 Ultra': { color: '#2C2E2F', edge: '#1D1E1F', shade: '#242526' }, // Phantom Black
  'Samsung Galaxy S23+':      { color: '#4D594F', edge: '#3B463D', shade: '#445046' }, // Botanic Green
  'Samsung Galaxy S23':       { color: '#DCD6C8', edge: '#BFB9AB', shade: '#CCC6B8' }, // Cream
};

const DEFAULT_FINISH = {
  color: '#D8D7D3',
  edge: '#C4C3BE',
  shade: '#CCCBC6',
};

/**
 * Returns phone finish color, edge, and bump shade for a given model string.
 */
export function getPhoneFinish(model = '') {
  if (!model) return DEFAULT_FINISH;
  const direct = PHONE_FINISHES[model];
  if (direct) return direct;

  const mLower = model.toLowerCase();
  for (const [key, val] of Object.entries(PHONE_FINISHES)) {
    if (mLower.includes(key.toLowerCase()) || key.toLowerCase().includes(mLower)) {
      return val;
    }
  }

  // Fallbacks by brand / model cues
  if (mLower.includes('ultra')) {
    return { color: '#4C4C4E', edge: '#363638', shade: '#404042' };
  }
  if (mLower.includes('pro')) {
    return { color: '#BDB9B3', edge: '#A09C95', shade: '#ACA8A1' };
  }
  if (mLower.includes('galaxy') || mLower.includes('samsung')) {
    return { color: '#C8CFD6', edge: '#A9B2B9', shade: '#B8C1C8' };
  }

  return DEFAULT_FINISH;
}
