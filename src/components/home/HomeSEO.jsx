import { useEffect } from 'react';
import { homeConfig } from '../../config/home';
import { store } from '../../config/store';

export function HomeSEO() {
  useEffect(() => {
    const seo = homeConfig.seo || {};

    // 1. Page Title
    const originalTitle = document.title;
    if (seo.title) {
      document.title = seo.title;
    }

    // Helper to set or update meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return null;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      const prevContent = el.getAttribute('content');
      el.setAttribute('content', content);
      return { el, prevContent };
    };

    const cleanupMeta = [];

    // 2. Meta Description
    if (seo.metaDescription) {
      const res = setMetaTag('name', 'description', seo.metaDescription);
      if (res) cleanupMeta.push(res);
    }

    // 3. Open Graph Tags
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = seo.ogImage ? `${origin}${seo.ogImage}` : '';

    cleanupMeta.push(setMetaTag('property', 'og:title', seo.title || originalTitle));
    cleanupMeta.push(setMetaTag('property', 'og:description', seo.metaDescription || ''));
    cleanupMeta.push(setMetaTag('property', 'og:type', seo.ogType || 'website'));
    cleanupMeta.push(setMetaTag('property', 'og:url', currentUrl));
    if (ogImage) {
      cleanupMeta.push(setMetaTag('property', 'og:image', ogImage));
    }

    // 4. LocalBusiness JSON-LD on Home
    let jsonLdScript = null;
    if (store.addressShort && store.phoneTel) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.id = 'wrapstore-localbusiness-ldjson';

      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: store.name || 'WrapStore',
        description: seo.metaDescription || 'Phone cases and mobile accessories in Dharmapuri',
        telephone: store.phoneTel,
        url: origin || currentUrl,
        image: ogImage || undefined,
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

      // Add openingHours ONLY when store.hours is filled in
      if (store.hours && store.hours.trim() !== '') {
        jsonLdData.openingHours = store.hours;
      }

      jsonLdScript.textContent = JSON.stringify(jsonLdData);
      document.head.appendChild(jsonLdScript);
    }

    // Cleanup when leaving home page
    return () => {
      document.title = originalTitle;
      cleanupMeta.forEach((item) => {
        if (item?.el && item.prevContent !== null && item.prevContent !== undefined) {
          item.el.setAttribute('content', item.prevContent);
        } else if (item?.el) {
          item.el.remove();
        }
      });
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    };
  }, []);

  return null;
}

export default HomeSEO;
