/**
 * src/lib/checkout.js
 * ──────────────────
 * Checkout and order tracking service.
 * Simulates order submission with a delay for backend compatibility.
 */

const LOCAL_STORAGE_ORDERS_KEY = 'wrapstore_orders';

export async function submitOrder(orderInput) {
  // Simulate network latency (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const orderId = 'WS-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toISOString();

  const newOrder = {
    orderId,
    createdAt: now,
    status: 'Confirmed',
    items: orderInput.items || [],
    subtotal: orderInput.subtotal || 0,
    shippingFee: orderInput.shippingFee || 0,
    total: orderInput.total || 0,
    contact: orderInput.contact || {},
    delivery: orderInput.delivery || {},
    payment: orderInput.payment || 'Cash on Delivery',
  };

  try {
    const existingOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(existingOrders));
  } catch (e) {
    console.warn('Could not save order to localStorage:', e);
  }

  return {
    success: true,
    orderId,
    order: newOrder,
  };
}

export async function trackOrder(orderId, phone) {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const cleanOrderId = (orderId || '').trim().toUpperCase();
  const cleanPhone = (phone || '').trim();

  let localOrder = null;
  try {
    const existingOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]');
    localOrder = existingOrders.find(
      (o) =>
        o.orderId.toUpperCase() === cleanOrderId &&
        (!cleanPhone || (o.contact?.phone && o.contact.phone.includes(cleanPhone)))
    );
  } catch (e) {
    console.warn('Error reading local orders:', e);
  }

  if (localOrder) {
    return {
      success: true,
      order: localOrder,
      stepper: [
        { label: 'Pending', status: 'completed', timestamp: 'Order received' },
        { label: 'Confirmed', status: 'completed', timestamp: 'Payment verified' },
        { label: 'Processing', status: 'current', timestamp: 'In progress' },
        { label: 'Shipped', status: 'upcoming', timestamp: 'Pending dispatch' },
        { label: 'Delivered', status: 'upcoming', timestamp: 'Pending delivery' },
      ],
    };
  }

  // Fallback demo response if user typed any order ID
  if (cleanOrderId.startsWith('WS-') || cleanOrderId.length >= 5) {
    return {
      success: true,
      order: {
        orderId: cleanOrderId,
        createdAt: new Date().toISOString(),
        status: 'Processing',
        contact: { name: 'Customer', phone: cleanPhone || '9876543210' },
        delivery: { address: 'Sample Address', city: 'Mumbai', pincode: '400001' },
        payment: 'Cash on Delivery',
        items: [],
        total: 1299,
      },
      stepper: [
        { label: 'Pending', status: 'completed', timestamp: 'Order received' },
        { label: 'Confirmed', status: 'completed', timestamp: 'Payment verified' },
        { label: 'Processing', status: 'current', timestamp: 'Preparing package' },
        { label: 'Shipped', status: 'upcoming', timestamp: 'Expected soon' },
        { label: 'Delivered', status: 'upcoming', timestamp: 'Expected soon' },
      ],
    };
  }

  return {
    success: false,
    message: 'No order found with this order ID and phone number.',
  };
}
