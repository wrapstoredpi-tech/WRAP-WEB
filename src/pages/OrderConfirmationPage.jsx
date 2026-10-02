import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Check, Package, ArrowRight, Home } from 'lucide-react';
import { formatINR } from '../lib/currency';
import { Button } from '../components/ui/Button';

export function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) {
    return (
      <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <h1 className="text-display font-semibold text-neutral-900 tracking-tight">No active order found</h1>
        <p className="text-body text-neutral-500">You can track an existing order using your Order ID and phone number.</p>
        <div className="pt-2">
          <Link to="/track-order">
            <Button variant="primary" size="md">
              Track Order
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base min-h-screen py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Success Header */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto border border-neutral-200">
            <Check className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-caption uppercase font-semibold text-neutral-500 tracking-wider">
              Order Confirmed
            </span>
            <h1 className="text-display font-semibold text-neutral-900 tracking-tight mt-1">
              Thank you for your order
            </h1>
            <p className="text-body text-neutral-500 mt-1">
              Order identifier: <strong className="text-neutral-900 font-semibold">{order.orderId || order.orderNumber}</strong>
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6 shadow-card">
          <h2 className="text-caption uppercase font-semibold text-neutral-900 pb-3 border-b border-neutral-200 tracking-wider">
            Order Summary
          </h2>

          {/* Line items */}
          <div className="space-y-4 divide-y divide-neutral-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 pt-3 first:pt-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 aspect-[4/5] object-cover rounded-lg bg-neutral-100 shrink-0 border border-neutral-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-neutral-900 truncate">{item.name}</p>
                  <p className="text-caption text-neutral-500">
                    Qty: {item.quantity} {item.color && `· ${item.color}`}
                  </p>
                </div>
                <span className="text-body font-semibold text-neutral-900">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery & Payment details */}
          <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-caption">
            <div className="space-y-1">
              <span className="font-semibold uppercase text-neutral-400 tracking-wider">Delivery Address</span>
              <p className="text-neutral-900 font-semibold">{order.contact?.name}</p>
              <p className="text-neutral-600">{order.delivery?.address}, {order.delivery?.city} - {order.delivery?.pincode}</p>
              <p className="text-neutral-600">Phone: {order.contact?.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold uppercase text-neutral-400 tracking-wider">Payment &amp; Total</span>
              <p className="text-neutral-900 font-medium">Method: {order.payment || 'Cash on Delivery'}</p>
              <p className="text-neutral-900 font-semibold text-body pt-1">
                Total: {formatINR(order.total || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="bg-neutral-900 text-white rounded-lg p-6 space-y-4 shadow-card">
          <h3 className="text-subheading font-semibold text-white">Next Steps</h3>
          <ul className="text-caption text-neutral-300 space-y-2 list-disc list-inside leading-relaxed">
            <li>We have received your order details and reserved your products.</li>
            <li>Our dispatch team will inspect and package your accessories within 24 hours.</li>
            <li>You can track shipping status live anytime using your Order ID.</li>
          </ul>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="accent"
              size="md"
              onClick={() => navigate('/track-order', { state: { orderId: order.orderId, phone: order.contact?.phone } })}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Track Order
            </Button>

            <Link to="/">
              <Button variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
                Back to Store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
