export const store = {
  name: 'WrapStore',
  addressLines: ['Railway Station Rd', 'Dharmapuri, Tamil Nadu 636701', 'India'],
  addressShort: 'Railway Station Rd, Dharmapuri',
  phoneDisplay: '+91 81227 47947',
  phoneTel: '+918122747947',
  whatsappNumber: '918122747947',   // TODO confirm this number is on WhatsApp
  mapsUrl: 'https://maps.app.goo.gl/87uBpgWPiUFLCtxc6',
  mapEmbedSrc: 'https://www.google.com/maps?q=12.1253261,78.1566856&z=17&output=embed',
  lat: 12.1253261,
  lng: 78.1566856,
  hours: '',                        // TODO owner to fill in; hide the hours row while empty
};

// Aliases for backward compatibility across existing store components
store.shortAddress = store.addressShort;
store.address = store.addressLines.join(', ');
store.phone = store.phoneDisplay;
store.whatsappUrl = store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : '';
store.mapUrl = store.mapsUrl;
store.storeHours = store.hours;
store.onlinePaymentNote = 'Secure online payment by Razorpay (UPI, Cards, Net Banking, Wallets).';
store.productTrustLine = 'Packed and dispatched from our Dharmapuri store. Secure online payment.';
store.checkoutPaymentNotice = 'Pay securely online by UPI, card, net banking or wallet';
store.shippingPolicySummary = 'Dispatched from Dharmapuri. Standard courier shipping across India.';
store.returnPolicySummary = 'Replacement available for manufacturing defects or model mismatch.';

export const storeConfig = store;
export default store;
