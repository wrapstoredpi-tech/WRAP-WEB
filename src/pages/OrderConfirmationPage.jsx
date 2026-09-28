import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, CreditCard, ArrowRight, Home, Smartphone } from 'lucide-react';

export function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) {
    return (
      <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-display font-semibold text-neutral-900">No active order found</h1>
        <p className="text-body-sm text-neutral-500">You can track an existing order using your Order ID and Phone number.</p>
        <div className="pt-2">
          <Link to="/track-order" className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold text-body-sm">
            Track Order
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base-offwhite py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Success Header */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-800 tracking-wide">Order Received</span>
            <h1 className="text-display font-semibold text-neutral-900 tracking-tight mt-1">
              Thank you for your order!
            </h1>
            <p className="text-body-sm text-neutral-500 mt-1">
              Your order ID is <strong className="text-neutral-900 font-mono">{order.orderId || order.orderNumber}</strong>
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <h2 className="text-body font-semibold text-neutral-900 pb-3 border-b border-neutral-200">
            Order Summary
          </h2>

          {/* Line items */}
          <div className="space-y-4 divide-y divide-neutral-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 pt-3 first:pt-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 object-cover rounded-lg bg-neutral-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-neutral-900 truncate">{item.name}</p>
                  <p className="text-xs text-neutral-500">
                    Qty: {item.quantity} {item.color && `· ${item.color}`}
                  </p>
                </div>
                <span className="text-body-sm font-semibold text-neutral-900">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery & Payment details */}
          <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold uppercase text-neutral-400">Delivery Address</span>
              <p className="text-neutral-900 font-medium">{order.contact?.name}</p>
              <p className="text-neutral-600">{order.delivery?.address}, {order.delivery?.city} - {order.delivery?.pincode}</p>
              <p className="text-neutral-600">Phone: {order.contact?.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold uppercase text-neutral-400">Payment &amp; Total</span>
              <p className="text-neutral-900 font-medium">Method: {order.payment || 'Cash on Delivery'}</p>
              <p className="text-neutral-900 font-semibold text-body-sm pt-1">Total Paid: ₹{(order.total || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="bg-neutral-900 text-white rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-body font-semibold text-white">Next Steps</h3>
          <ul className="text-xs text-neutral-300 space-y-2 list-disc list-inside leading-relaxed">
            <li>We have received your order details and reserved your items.</li>
            <li>Our dispatch team will inspect and package your accessories within 24 hours.</li>
            <li>You can track live shipping status anytime on our tracking page.</li>
          </ul>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/track-order', { state: { orderId: order.orderId, phone: order.contact?.phone } })}
              className="min-h-[44px] px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-body-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Track Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/"
              className="min-h-[44px] px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold text-body-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
