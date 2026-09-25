import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, Package, MapPin, CreditCard,
  Banknote, ArrowRight, Home, ChevronRight,
  Calendar, Hash, Mail, Phone
} from 'lucide-react';

const formatPrice = (n) => `$${Number(n).toFixed(2)}`;

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-metadata text-neutral-400 uppercase tracking-widest font-semibold">{label}</p>
        <p className="text-body-sm text-neutral-900 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  // If someone navigates here directly without order state, redirect home
  useEffect(() => {
    if (!order) {
      navigate('/', { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  const isCOD = order.paymentMethod === 'cod';

  return (
    <main className="flex-1 bg-base-offwhite">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">

        {/* ── Success Hero ── */}
        <div className="text-center mb-10">
          {/* Animated checkmark ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            </div>
            {/* Subtle pulse ring */}
            <span className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping opacity-30" />
          </div>

          <p className="text-metadata text-neutral-400 tracking-widest uppercase font-bold mb-2">Order Confirmed</p>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight mb-3">
            Thank you, {order.customerName.split(' ')[0]}.
          </h1>
          <p className="text-body text-neutral-500 max-w-md mx-auto">
            Your order has been placed and is being prepared. We&rsquo;ll keep you updated every step of the way.
          </p>
        </div>

        {/* ── Order Number Banner ── */}
        <div className="bg-neutral-900 text-white px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-metadata text-neutral-400 tracking-widest uppercase font-semibold mb-1">Order Number</p>
            <p className="text-h3 font-bold tracking-widest font-mono">{order.orderNumber}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-metadata text-neutral-400 tracking-widest uppercase font-semibold mb-1">Placed On</p>
            <p className="text-body-sm text-neutral-200">{formatDate(order.placedAt)}</p>
          </div>
        </div>

        {/* ── Details grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Delivery Info */}
          <div className="bg-white border border-neutral-200 p-5 flex flex-col gap-4">
            <h2 className="text-body-sm font-bold text-neutral-900 uppercase tracking-widest pb-3 border-b border-neutral-100">
              Delivery Details
            </h2>
            <InfoRow icon={Package} label="Recipient" value={order.customerName} />
            <InfoRow icon={Phone} label="Phone" value={order.phone} />
            {order.email && <InfoRow icon={Mail} label="Email" value={order.email} />}
            <InfoRow icon={MapPin} label="Ship to" value={order.address} />
          </div>

          {/* Payment Info */}
          <div className="bg-white border border-neutral-200 p-5 flex flex-col gap-4">
            <h2 className="text-body-sm font-bold text-neutral-900 uppercase tracking-widest pb-3 border-b border-neutral-100">
              Payment
            </h2>
            <div className="flex items-start gap-3">
              {isCOD
                ? <Banknote className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                : <CreditCard className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              }
              <div>
                <p className="text-metadata text-neutral-400 uppercase tracking-widest font-semibold">Method</p>
                <p className="text-body-sm text-neutral-900 font-medium mt-0.5">
                  {isCOD ? 'Cash on Delivery' : 'Pay Online'}
                </p>
                <p className="text-body-sm text-neutral-400 mt-1">
                  {isCOD
                    ? 'Please keep exact change ready at delivery.'
                    : 'Payment is pending — you will be redirected to complete payment.'
                  }
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="mt-2 pt-4 border-t border-neutral-100 flex flex-col gap-2">
              <div className="flex justify-between text-body-sm text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-neutral-600">
                <span>Shipping</span>
                {order.shippingFee === 0
                  ? <span className="font-semibold text-emerald-600">Free</span>
                  : <span className="font-medium">{formatPrice(order.shippingFee)}</span>
                }
              </div>
              <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span className="text-h3">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Items ── */}
        <div className="bg-white border border-neutral-200 p-5 mb-6">
          <h2 className="text-body-sm font-bold text-neutral-900 uppercase tracking-widest pb-3 border-b border-neutral-100 mb-1">
            Items Ordered
          </h2>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-14 h-14 shrink-0 bg-neutral-100 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-neutral-900 truncate">{item.name}</p>
                  <p className="text-metadata text-neutral-400 uppercase tracking-wider mt-0.5">{item.model}</p>
                  <p className="text-body-sm text-neutral-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-body-sm font-bold text-neutral-900 shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/track-order"
            state={{ orderNumber: order.orderNumber, phone: order.phone }}
            id="track-order-link"
            className="flex-1 h-12 bg-neutral-900 text-white font-bold text-body flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            Track your order
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            id="continue-shopping-link"
            className="flex-1 h-12 bg-white border border-neutral-200 text-neutral-900 font-semibold text-body flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
          >
            <Home className="w-4 h-4 text-neutral-400" />
            Continue Shopping
          </Link>
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-body-sm text-neutral-400 mt-8">
          Questions? Email us at{' '}
          <a href="mailto:support@wrapstore.co" className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900 transition-colors">
            support@wrapstore.co
          </a>
        </p>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
