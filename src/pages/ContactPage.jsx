import React, { useEffect } from 'react';
import { store } from '../config/store';
import { pagesConfig } from '../config/pages';
import { StoreDetailsSection } from '../components/home/StoreDetailsSection';

export function ContactPage() {
  const contactConfig = pagesConfig.contact || {
    title: 'Contact and store',
    metaDescription: 'Visit the WrapStore physical store on Railway Station Rd, Dharmapuri or contact us for phone cases and accessories inquiries.',
  };

  useEffect(() => {
    // 1. Page Title
    const originalTitle = document.title;
    document.title = `${contactConfig.title} — ${store.name}`;

    // 2. Meta Description
    let metaEl = document.querySelector('meta[name="description"]');
    const prevMetaContent = metaEl?.getAttribute('content');
    if (!metaEl) {
      metaEl = document.createElement('meta');
      metaEl.setAttribute('name', 'description');
      document.head.appendChild(metaEl);
    }
    metaEl.setAttribute('content', contactConfig.metaDescription);

    // 3. LocalBusiness JSON-LD
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'wrapstore-contact-localbusiness-ldjson';

    const jsonLdData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: store.name,
      telephone: store.phoneTel,
      url: origin || currentUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Railway Station Rd',
        addressLocality: 'Dharmapuri',
        addressRegion: 'Tamil Nadu',
        postalCode: '636701',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: store.lat,
        longitude: store.lng,
      },
      paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Wallets',
      currenciesAccepted: 'INR',
    };

    if (store.hours && store.hours.trim() !== '') {
      jsonLdData.openingHours = store.hours;
    }

    script.textContent = JSON.stringify(jsonLdData);
    document.head.appendChild(script);

    return () => {
      document.title = originalTitle;
      if (metaEl) {
        if (prevMetaContent !== null && prevMetaContent !== undefined) {
          metaEl.setAttribute('content', prevMetaContent);
        } else {
          metaEl.remove();
        }
      }
      script.remove();
    };
  }, [contactConfig]);

  return (
    <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Title & Introduction */}
      <div className="space-y-3 pb-6 border-b border-[#E5E5E3]">
        <h1 className="font-display font-normal text-[32px] sm:text-[40px] text-[#141414] tracking-[-0.01em]">
          Contact and store
        </h1>
        <p className="font-sans text-[16px] text-[#525252] leading-relaxed max-w-2xl">
          WrapStore is a physical mobile accessories store located on Railway Station Road in Dharmapuri, Tamil Nadu. Reach out to us directly by phone or WhatsApp for case inquiries, stock confirmation, and store directions.
        </p>
      </div>

      {/* Map Block ("Contact and store") */}
      <StoreDetailsSection />
    </main>
  );
}

export default ContactPage;
