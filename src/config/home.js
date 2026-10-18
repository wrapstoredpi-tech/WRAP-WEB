/**
 * src/config/home.js
 * ──────────────────
 * All customer-facing copy and section configuration for the WrapStore Home page.
 * Edit any text, headings, or link destinations directly here.
 *
 * Rules:
 * - No emojis.
 * - No invented claims (no years in business, customer counts, warranties, delivery times, offers or countdowns).
 */

import { deal } from './deal';
import { featured } from './featured';

export const homeConfig = {
  // 1. First Screen Hero (12-column grid: 5 cols left copy, 7 cols right slider)
  firstScreen: {
    headline: 'Phone cases and accessories from Dharmapuri.',
    subtext: 'Cases for iPhone and Samsung, plus everyday accessories. Choose your phone, pick a design, pay securely online.',
    aboutLines: [
      'Cases for iPhone and Samsung, plus everyday accessories.',
      'Choose your phone, pick a design, pay securely online.',
    ],
    primaryButtonText: 'Shop cases',
    primaryButtonLink: '/?category=Mobile%20Cases',
    findPhoneText: 'Find your phone',
    facts: [
      { id: 'location', label: 'Store in Dharmapuri' },
      { id: 'payment', label: 'Secure online payment' },
      { id: 'support', label: 'WhatsApp support' },
    ],
  },

  // Hero Full-Width Banner Slider
  heroSlider: {
    autoplayIntervalMs: 6000,
    aspectRatio: '21/9',
    slides: [
      {
        id: 'unlimited-prints-video',
        type: 'video',
        video: '/video_demo1.mp4',
        image: '/hero/slide-2.webp',
        alt: 'Unlimited Prints - Find your perfect case',
        tag: 'Unlimited Prints',
        tagSubtitle: 'Find your perfect case',
        link: '/?category=Mobile%20Cases',
      },
      {
        id: 'case-wall-collection',
        type: 'image',
        image: '/hero/slide-2.webp',
        alt: 'WrapStore premium mobile case collection for iPhone & Samsung',
        tag: 'Signature Cases',
        tagSubtitle: 'Explore Apple & Samsung designs',
        link: '/?category=Mobile%20Cases',
        width: 1800,
        height: 1200,
      },
      {
        id: 'storefront-flagship',
        type: 'image',
        image: '/hero/slide-1.webp',
        alt: 'WrapStore physical storefront showroom in Dharmapuri',
        tag: 'Showroom in Dharmapuri',
        tagSubtitle: 'Railway Station Rd flagship store',
        link: '/about',
        width: 1800,
        height: 1200,
      },
      {
        id: 'everyday-carry-gear',
        type: 'image',
        image: '/hero/slide-3.webp',
        alt: 'WrapStore accessories showroom display counters',
        tag: 'Everyday Gear',
        tagSubtitle: 'Tempered glass, chargers & straps',
        link: '/?category=Accessories',
        width: 1800,
        height: 1200,
      },
    ],
  },

  // Deal of the Day configuration (imported from src/config/deal.js)
  deal,
  dealOfTheDay: deal,

  // Shop by Category row (Directly under the first screen)
  categoriesSection: {
    heading: 'Shop by category',
    maxTiles: 8,
  },

  // Featured spotlight configuration (imported from src/config/featured.js)
  featured,

  // New Arrivals Row (Below Featured)
  newArrivals: {
    heading: 'New arrivals',
    viewAllText: 'View all',
    viewAllLink: '/?view=all',
    limit: 8,
    minProductsToShow: 4,
    newTagThresholdDays: 14,
  },

  // About Us Block (Below New Arrivals)
  aboutSnippet: {
    heading: 'About WrapStore',
    text: 'WrapStore is a specialized mobile accessories store based in Dharmapuri, Tamil Nadu. We curate cases for Apple and Samsung smartphones, alongside durable screen protectors, fast chargers, and daily carry phone gear.',
    storePhoto: '/about/store.webp',
    learnMoreText: 'Learn more about us',
    learnMoreLink: '/about',
    steps: [
      {
        number: '1',
        title: 'Choose your phone',
        description: 'Select your exact model so every case and protector shown fits perfectly.',
      },
      {
        number: '2',
        title: 'Pick a design',
        description: 'Browse in-stock styles, tactile textures, and protective finishes.',
      },
      {
        number: '3',
        title: 'Pay securely online',
        description: 'Pay via UPI, card, or net banking. Online payment only.',
      },
    ],
  },

  // Contact and Store Section (Above footer)
  storeDetails: {
    heading: 'Contact and store',
    subtext: 'Visit our physical shop in Dharmapuri or reach out on WhatsApp.',
    chatButtonText: 'Chat on WhatsApp',
    mapButtonText: 'View on Google Maps',
    viewContactPageText: 'View contact details',
  },

  // Floating WhatsApp button
  floatingWhatsApp: {
    prefilledMessage:
      'Hi WrapStore, I have an inquiry about phone cases and accessories.',
  },

  // Account / Login Benefits (Used on /login page)
  accountBenefits: [
    {
      id: 'track-orders',
      title: 'Track your orders',
      description: 'Check the real-time shipping status and order history for all your purchases.',
    },
    {
      id: 'saved-addresses',
      title: 'Saved addresses',
      description: 'Store multiple delivery addresses for faster checkout on your mobile device.',
    },
    {
      id: 'faster-checkout',
      title: 'Faster checkout',
      description: 'Pre-fill your contact details and review previous orders instantly.',
    },
  ],

  // SEO & Open Graph
  seo: {
    title: 'WrapStore — Phone Cases & Accessories | Dharmapuri',
    metaDescription:
      'Phone cases and accessories, from a store in Dharmapuri. Choose your phone, pick a design, pay securely online.',
    ogType: 'website',
    ogImage: '/hero/slide-1.webp',
  },
};

export default homeConfig;
