import { store } from './store.js';

export const policies = {
  mode: 'recommended',            // 'recommended' or 'strict'
  delivery: {
    tn: { label: 'Tamil Nadu', text: '2 to 4 days' },
    other: { label: 'Other states', text: 'Up to 1 week' },
    countedFrom: 'the day your order is confirmed',     // TODO owner: confirmation or dispatch?
    homeState: 'Tamil Nadu',
  },
  returns: {
    reportWithin: '48 hours of delivery',               // TODO owner: confirm the time limit
    videoGuide: 'Record the video without cuts, starting with the sealed parcel and its shipping label.',
    cancellation: '',                                    // TODO owner: hide the section while empty
  },
};

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const SHIPPING_CHARGES = {
  TN: 55,         // Tamil Nadu
  PONDY: 55,      // Puducherry
  KL: 85,         // Kerala
  KA: 85,         // Karnataka
  AP: 85,         // Andhra Pradesh
  TL: 85,         // Telangana
  REST: 100,      // North and all other states/UTs
};

export const COURIER_PARTNERS = {
  ST_COURIER: 'ST Courier',
  INDIA_POST: 'India Post',
};

/**
 * Returns the courier partner assigned to a state.
 * TN and Puducherry only through ST Courier; all others through India Post.
 */
export function getCourierPartner(state) {
  if (!state) return COURIER_PARTNERS.ST_COURIER;
  const s = String(state).trim().toLowerCase();
  if (s === 'tamil nadu' || s === 'puducherry') {
    return COURIER_PARTNERS.ST_COURIER;
  }
  return COURIER_PARTNERS.INDIA_POST;
}

/**
 * Calculates dynamic shipping charges based on state.
 * TN: 55, Puducherry: 55, KL: 85, KA: 85, AP: 85, TL: 85, North/Others: 100
 */
export function getShippingFee(state) {
  if (!state) return SHIPPING_CHARGES.TN;
  const s = String(state).trim().toLowerCase();
  if (s === 'tamil nadu' || s === 'puducherry') {
    return 55;
  }
  if (
    s === 'kerala' ||
    s === 'karnataka' ||
    s === 'andhra pradesh' ||
    s === 'telangana'
  ) {
    return 85;
  }
  return 100;
}

export function getDeliveryEstimate(state) {
  if (!state) return null;
  const normalized = String(state).trim().toLowerCase();
  const isTN = normalized === policies.delivery.homeState.toLowerCase();
  return isTN ? policies.delivery.tn.text : policies.delivery.other.text;
}

export function getDeliveryLine(state) {
  if (!state) return null;
  const normalized = String(state).trim().toLowerCase();
  const isTN = normalized === policies.delivery.homeState.toLowerCase();
  return isTN
    ? `Orders delivered within ${policies.delivery.tn.label}: ${policies.delivery.tn.text}.`
    : `Orders delivered to other states: ${policies.delivery.other.text.toLowerCase()}.`;
}

export function getCheckoutNoticeText(mode = policies.mode) {
  if (mode === 'strict') {
    return 'By placing this order you agree that all sales are final, with replacements only for damaged or wrong items.';
  }
  return 'By placing this order you agree to our returns policy: damaged or wrong items are replaced, and refunded if a replacement is not available.';
}

export default policies;
