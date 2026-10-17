/**
 * Hero Carousel Configuration
 * 
 * Defines the fixed overlay content and slide imagery for the WrapStore home hero.
 */

export const heroContent = {
  title: 'Cases Engineered for Precision & Defense',
  description: 'Low-profile protective structures crafted from tactile materials for seamless daily carry.',
  primaryCta: {
    text: 'Explore Catalog',
    category: 'All',
  },
};

export const heroSlides = [
  {
    id: 'storefront-flagship',
    image: '/hero/slide-1.jpg',
    alt: 'WrapStore physical storefront in Dharmapuri featuring customer service counter and curated accessories',
  },
  {
    id: 'case-wall-collection',
    image: '/hero/slide-2.jpg',
    alt: 'WrapStore wall display stocked with high-grade protective cases for iPhone and Samsung models',
  },
  {
    id: 'everyday-carry-gear',
    image: '/hero/slide-3.jpg',
    alt: 'WrapStore interior showroom with phone accessories, screen guards, and display counters',
  },
];

export default {
  heroContent,
  heroSlides,
};
