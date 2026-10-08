/**
 * Hero Carousel Configuration
 * 
 * Defines the slide content, imagery, and call-to-actions for the WrapStore home hero slider.
 * Supports 2 to 3 slides seamlessly (or single slide with controls automatically hidden).
 */

export const heroSlides = [
  {
    id: 'storefront-flagship',
    kicker: 'AUTHENTIC STORE • DHARMAPURI',
    title: 'Cases Engineered for Precision & Defense',
    description: 'Low-profile protective structures crafted from tactile materials. Precision cutouts and verified geometry for seamless daily carry.',
    image: '/hero/slide-1.jpg',
    alt: 'WrapStore physical storefront in Dharmapuri featuring customer service counter and curated accessories',
    primaryCta: {
      text: 'Explore Catalog',
      category: 'All',
    },
    secondaryCta: {
      text: 'Select Your Phone',
      action: 'select-phone',
    },
  },
  {
    id: 'case-wall-collection',
    kicker: 'MASSIVE SELECTION • IPHONE & SAMSUNG',
    title: '1000+ Verified Fits in Stock',
    description: 'Explore matte, rugged, clear, and MagSafe-compatible phone cases tailored for exact camera cutouts and edge protection.',
    image: '/hero/slide-2.jpg',
    alt: 'WrapStore wall display stocked with high-grade protective cases for iPhone and Samsung models',
    primaryCta: {
      text: 'Shop Mobile Cases',
      category: 'Mobile Cases',
    },
    secondaryCta: {
      text: 'Select Your Phone',
      action: 'select-phone',
    },
  },
  {
    id: 'everyday-carry-gear',
    kicker: 'EVERYDAY CARRY GEAR',
    title: 'Essential Accessories & Protectors',
    description: 'Tempered glass, lens protectors, durable fast-charging cables, and tactile daily carry accessories.',
    image: '/hero/slide-3.jpg',
    alt: 'WrapStore interior showroom with phone accessories, screen guards, and display counters',
    primaryCta: {
      text: 'Explore Accessories',
      category: 'Accessories',
    },
    secondaryCta: {
      text: 'Select Your Phone',
      action: 'select-phone',
    },
  },
];

export default heroSlides;
