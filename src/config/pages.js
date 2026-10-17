/**
 * src/config/pages.js
 * ───────────────────
 * Static page content and copy for WrapStore.
 * Easily editable by store owners.
 */

export const pagesConfig = {
  contact: {
    title: 'Contact and Store',
    metaDescription: 'Visit the WrapStore physical store in Dharmapuri or contact us for inquiries.',
    intro: 'WrapStore is a specialized phone case and mobile accessories store located in Dharmapuri, Tamil Nadu. Visit us in-person or reach out online.',
    sections: [
      {
        heading: 'Physical Store Address',
        content: 'WrapStore, 142 Netaji Bypass Road, Near Town Bus Stand, Dharmapuri, Tamil Nadu 636701.',
      },
      {
        heading: 'Store Hours',
        content: 'Monday – Saturday: 10:00 AM – 9:00 PM\nSunday: 11:00 AM – 8:00 PM',
      },
      {
        heading: 'Customer Support',
        content: 'WhatsApp: +91 94422 18765\nEmail: contact@wrapstore.in\nPhone: +91 94422 18765',
      },
      {
        heading: 'In-Store Services',
        content: 'Exact model trial and fitting, tempered glass installation, physical case inspection, and direct customer assistance.',
      },
    ],
  },

  shipping: {
    title: 'Shipping and Returns',
    metaDescription: 'Shipping timelines, dispatch details, and replacement policy for WrapStore.',
    intro: 'All online orders are packed and dispatched directly from our physical store in Dharmapuri.',
    sections: [
      {
        heading: 'Dispatch and Delivery',
        content: 'Orders placed before 3:00 PM are processed same-day. Standard courier dispatch takes 24–48 hours. Typical delivery takes 2–4 business days within Tamil Nadu and South India, and 4–6 business days for the rest of India.',
      },
      {
        heading: 'Shipping Charges',
        content: 'Free standard shipping on all orders of ₹1,000 and above. Orders below ₹1,000 have a flat shipping rate of ₹99.',
      },
      {
        heading: 'Replacement Policy',
        content: 'We provide a 7-day replacement for products with manufacturing defects or if you received an incorrect item. Because cases are precision-engineered for specific phone models, please ensure you verify your model before finalizing your purchase.',
      },
      {
        heading: 'Return Process',
        content: 'To request an exchange or replacement, reach out via WhatsApp at +91 94422 18765 with your Order ID and photo of the item. Our support team will assist you within 24 hours.',
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    metaDescription: 'WrapStore privacy guidelines and personal data handling policy.',
    intro: 'At WrapStore, we value your privacy and keep data collection strictly limited to what is necessary for fulfilling your order.',
    sections: [
      {
        heading: 'Information We Collect',
        content: 'When you place an order as a guest, we collect your name, phone number, shipping address, and optional email solely to deliver your package and send order notifications.',
      },
      {
        heading: 'Payment Information',
        content: 'We do not collect or store debit/credit card numbers or UPI PINs. All payment transactions are encrypted and processed directly by Razorpay, an authorized payment gateway.',
      },
      {
        heading: 'Device Preferences',
        content: 'Your saved phone model preference is stored locally on your device (in browser local storage) so you do not need to re-select your phone on subsequent visits.',
      },
      {
        heading: 'Data Sharing',
        content: 'We only share delivery details with logistics and courier partners responsible for delivering your package. We never sell or rent your personal information to third parties.',
      },
    ],
  },

  terms: {
    title: 'Terms and Conditions',
    metaDescription: 'WrapStore terms of service, purchasing conditions, and store guidelines.',
    intro: 'By accessing and placing an order on WrapStore, you agree to the following terms.',
    sections: [
      {
        heading: 'Product Compatibility',
        content: 'One case design is manufactured to fit distinct phone models. You must select your exact phone model before completing checkout. Case cutouts, button alignment, and dimensions differ between phone generations.',
      },
      {
        heading: 'Online Payments',
        content: 'All orders must be prepaid online via Razorpay (UPI, Debit Card, Credit Card, Net Banking, or Wallet). Cash on Delivery is not supported.',
      },
      {
        heading: 'Order Fulfillment',
        content: 'In the event an item becomes unavailable after an order is placed, our support team will contact you promptly to arrange an immediate replacement or full refund.',
      },
      {
        heading: 'Jurisdiction',
        content: 'All transactions and agreements are governed by the laws of India, with jurisdiction in Dharmapuri, Tamil Nadu.',
      },
    ],
  },
};

export default pagesConfig;
