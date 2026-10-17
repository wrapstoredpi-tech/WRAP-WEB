/**
 * src/lib/checkout.js
 * ───────────────────
 * Checkout and order tracking service.
 * Payment is online only via Razorpay (UPI, card, net banking, wallet).
 * No Cash on Delivery.
 */

const LOCAL_STORAGE_ORDERS_KEY = 'wrapstore_orders_v2';

export const ORDER_STATUS_STEPS = [
  'Awaiting payment',
  'Payment received',
  'Packed',
  'Shipped',
  'Delivered',
];

export async function submitOrder(orderInput) {
  // Simulate network latency (1.2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const orderId = 'WS-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toISOString();

  // Normalize items to ensure mobile_model is captured for online_order_items
  const items = (orderInput.items || []).map((item) => ({
    productId: item.productId || item.product?.id,
    name: item.name || item.product?.name,
    mobile_model: item.selected_model || item.mobile_model || item.product?.mobile_model || 'Universal',
    selected_model: item.selected_model || item.mobile_model || item.product?.mobile_model || 'Universal',
    color: item.selected_color || item.color || null,
    price: item.price || item.product?.selling_price || 0,
    quantity: item.quantity || 1,
    image: item.image || item.product?.image_url,
  }));

  const newOrder = {
    orderId,
    createdAt: now,
    status: 'Payment received', // Online payment via Razorpay succeeds
    items,
    subtotal: orderInput.subtotal || 0,
    shippingFee: orderInput.shippingFee || 0,
    total: orderInput.total || 0,
    contact: orderInput.contact || {},
    delivery: orderInput.delivery || {},
    payment: 'Online Payment (Razorpay: UPI, Card, Net Banking)',
  };

  try {
    const existingOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(existingOrders));
  } catch (e) {
    console.warn('Could not save order to localStorage:', e);
  }

  // Notify active admin tabs in real time
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('wrapstore:order_created', { detail: newOrder }));
    } catch {}
  }

  return {
    success: true,
    orderId,
    order: newOrder,
  };
}

export async function trackOrder(orderId, phone) {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cleanOrderId = (orderId || '').trim().toUpperCase();
  const cleanPhone = (phone || '').trim().replace(/\D/g, '');

  let localOrder = null;
  try {
    const existingOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]');
    localOrder = existingOrders.find((o) => {
      const idMatch = (o.orderId || '').toUpperCase() === cleanOrderId;
      if (!idMatch) return false;
      if (!cleanPhone) return true;
      const orderPhone = (o.contact?.phone || '').replace(/\D/g, '');
      return orderPhone.includes(cleanPhone);
    });
  } catch (e) {
    console.warn('Error reading local orders:', e);
  }

  if (localOrder) {
    return {
      success: true,
      order: localOrder,
      status: localOrder.status || 'Payment received',
      allSteps: ORDER_STATUS_STEPS,
    };
  }

  return {
    success: false,
    message: 'No order found with this order ID and phone number.',
  };
}
