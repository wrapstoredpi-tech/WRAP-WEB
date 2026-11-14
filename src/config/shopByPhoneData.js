/**
 * src/config/shopByPhoneData.js
 * ─────────────────────────────
 * Configuration and metadata for the "Shop by Phone" section.
 * Realistic studio-photographed smartphone backside product images in optimized WebP.
 */

export const IPHONE_MODELS = [
  {
    id: 'iphone-18-pro-max',
    model: 'iPhone 18 Pro Max',
    brand: 'Apple',
    image: '/phones/iphone-18-pro-max.webp',
    series: '18',
    alt: 'Realistic backside of iPhone 18 Pro Max in Cosmic Dark Titanium with pro triple camera system and LiDAR',
    url: '/cases/apple/iphone-18-pro-max',
  },
  {
    id: 'iphone-18-pro',
    model: 'iPhone 18 Pro',
    brand: 'Apple',
    image: '/phones/iphone-18-pro.webp',
    series: '18',
    alt: 'Realistic backside of iPhone 18 Pro in Cosmic Dark Titanium',
    url: '/cases/apple/iphone-18-pro',
  },
  {
    id: 'iphone-17-pro-max',
    model: 'iPhone 17 Pro Max',
    brand: 'Apple',
    image: '/phones/iphone-17-pro-max.webp',
    series: '17',
    alt: 'Realistic backside of iPhone 17 Pro Max in Desert Gold Titanium with triple camera plateau',
    url: '/cases/apple/iphone-17-pro-max',
  },
  {
    id: 'iphone-17-pro',
    model: 'iPhone 17 Pro',
    brand: 'Apple',
    image: '/phones/iphone-17-pro.webp',
    series: '17',
    alt: 'Realistic backside of iPhone 17 Pro in Desert Gold Titanium',
    url: '/cases/apple/iphone-17-pro',
  },
  {
    id: 'iphone-17',
    model: 'iPhone 17',
    brand: 'Apple',
    image: '/phones/iphone-17.webp',
    series: '17',
    alt: 'Realistic backside of iPhone 17 in Teal with vertical dual camera module',
    url: '/cases/apple/iphone-17',
  },
  {
    id: 'iphone-16-pro-max',
    model: 'iPhone 16 Pro Max',
    brand: 'Apple',
    image: '/phones/iphone-16-pro-max.webp',
    series: '16',
    alt: 'Realistic backside of iPhone 16 Pro Max in Natural Titanium with triple lens camera and LiDAR',
    url: '/cases/apple/iphone-16-pro-max',
  },
  {
    id: 'iphone-16-pro',
    model: 'iPhone 16 Pro',
    brand: 'Apple',
    image: '/phones/iphone-16-pro.webp',
    series: '16',
    alt: 'Realistic backside of iPhone 16 Pro in Natural Titanium',
    url: '/cases/apple/iphone-16-pro',
  },
  {
    id: 'iphone-16-plus',
    model: 'iPhone 16 Plus',
    brand: 'Apple',
    image: '/phones/iphone-16-plus.webp',
    series: '16',
    alt: 'Realistic backside of iPhone 16 Plus in Ultramarine Blue with vertical dual camera pill',
    url: '/cases/apple/iphone-16-plus',
  },
  {
    id: 'iphone-16',
    model: 'iPhone 16',
    brand: 'Apple',
    image: '/phones/iphone-16.webp',
    series: '16',
    alt: 'Realistic backside of iPhone 16 in Teal with vertical dual camera pill',
    url: '/cases/apple/iphone-16',
  },
];

export const SAMSUNG_CATEGORIES = [
  {
    id: 'samsung-galaxy-s-series',
    model: 'Samsung Galaxy S Series',
    brand: 'Samsung',
    image: '/phones/samsung-s-series.webp',
    series: 'S',
    badge: 'Flagship',
    alt: 'Realistic backside of Samsung Galaxy S Series in Titanium Black with quad floating camera lenses and laser AF',
    url: '/cases/samsung/samsung-galaxy-s24-ultra',
  },
  {
    id: 'samsung-galaxy-a-series',
    model: 'Samsung Galaxy A Series',
    brand: 'Samsung',
    image: '/phones/samsung-a-series.webp',
    series: 'A',
    badge: 'Popular',
    alt: 'Realistic backside of Samsung Galaxy A Series in Awesome Iceblue with triple floating camera lenses',
    url: '/cases/samsung/samsung-galaxy-a55',
  },
  {
    id: 'samsung-galaxy-z-series',
    model: 'Samsung Galaxy Z Series',
    brand: 'Samsung',
    image: '/phones/samsung-z-series.webp',
    series: 'Z',
    badge: 'Foldable',
    alt: 'Realistic backside of Samsung Galaxy Z Series Fold in Silver Shadow with slim hinge spine and precision lenses',
    url: '/cases/samsung/samsung-galaxy-z-fold-6',
  },
  {
    id: 'samsung-galaxy-s25-ultra',
    model: 'Samsung Galaxy S25 Ultra',
    brand: 'Samsung',
    image: '/phones/samsung-galaxy-s25-ultra.webp',
    series: 'S',
    alt: 'Realistic backside of Samsung Galaxy S25 Ultra in Titanium Black',
    url: '/cases/samsung/samsung-galaxy-s25-ultra',
  },
  {
    id: 'samsung-galaxy-s24-ultra',
    model: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    image: '/phones/samsung-galaxy-s24-ultra.webp',
    series: 'S',
    alt: 'Realistic backside of Samsung Galaxy S24 Ultra in Titanium Black',
    url: '/cases/samsung/samsung-galaxy-s24-ultra',
  },
  {
    id: 'samsung-galaxy-a55',
    model: 'Samsung Galaxy A55',
    brand: 'Samsung',
    image: '/phones/samsung-galaxy-a55.webp',
    series: 'A',
    alt: 'Realistic backside of Samsung Galaxy A55 5G in Awesome Iceblue',
    url: '/cases/samsung/samsung-galaxy-a55',
  },
  {
    id: 'samsung-galaxy-z-fold-6',
    model: 'Samsung Galaxy Z Fold 6',
    brand: 'Samsung',
    image: '/phones/samsung-galaxy-z-fold-6.webp',
    series: 'Z',
    alt: 'Realistic backside of Samsung Galaxy Z Fold 6 in Silver Shadow',
    url: '/cases/samsung/samsung-galaxy-z-fold-6',
  },
];

/**
 * Returns the realistic WebP product image for any phone model.
 */
export function getPhoneImage(model = '', brand = 'Apple') {
  if (!model) {
    return brand.toLowerCase() === 'samsung'
      ? '/phones/samsung-s-series.webp'
      : '/phones/iphone-16-pro-max.webp';
  }

  // Exact lookup in predefined models
  const allPhones = [...IPHONE_MODELS, ...SAMSUNG_CATEGORIES];
  const directMatch = allPhones.find(
    (p) => p.model.toLowerCase() === model.toLowerCase() || p.id === model.toLowerCase()
  );
  if (directMatch) return directMatch.image;

  // Fuzzy model matching
  const m = model.toLowerCase();
  if (m.includes('galaxy') || m.includes('samsung') || brand.toLowerCase() === 'samsung') {
    if (m.includes('fold') || m.includes('flip') || m.includes('z series')) return '/phones/samsung-z-series.webp';
    if (m.includes('a55') || m.includes('a54') || m.includes('a35') || m.includes('a series')) return '/phones/samsung-a-series.webp';
    return '/phones/samsung-s-series.webp';
  }

  if (m.includes('18')) {
    return m.includes('pro') ? '/phones/iphone-18-pro-max.webp' : '/phones/iphone-17.webp';
  }
  if (m.includes('17')) {
    return m.includes('pro') ? '/phones/iphone-17-pro-max.webp' : '/phones/iphone-17.webp';
  }
  if (m.includes('plus')) return '/phones/iphone-16-plus.webp';
  if (m.includes('pro')) return '/phones/iphone-16-pro-max.webp';
  return '/phones/iphone-16.webp';
}
