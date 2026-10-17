import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Check, Package } from 'lucide-react';
import { formatINR } from '../lib/currency';
import { storeConfig } from '../config/store';

export function OrderConfirmationPage() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) {
    return (
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <h1 className="text-[28px] font-semibold text-[#141414]">No Active Order Found</h1>
        <p className="text-[14px] text-[#6B6B6B]">
          If you recently placed an order, you can look it up using your order number and phone.
        </p>
        <div className="pt-2">
          <Link
            to="/track-order"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-[#B0521F] text-white text-[14px] font-semibold rounded-[6px]"
          >
            Track Order
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      {/* Success Banner */}
      <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center mx-auto text-[#B0521F]">
          <Check className="w-6 h-6" />
        </div>
        <h1 className="text-[28px] font-semibold text-[#141414]">
          Thank you for your order
        </h1>
        <p className="text-[16px] text-[#141414]">
          Order number: <strong className="font-semibold text-[#B0521F]">{order.orderId}</strong>
        </p>
        <p className="text-[14px] text-[#6B6B6B]">
          We have received your payment via Razorpay. Your order is being processed at our Dharmapuri store.
        </p>
      </div>

      {/* Items with Selected Models */}
      <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-4">
        <h2 className="text-[20px] font-semibold text-[#141414] pb-3 border-b border-[#E5E5E3]">
          Items Ordered
        </h2>

        <div className="divide-y divide-[#E5E5E3]">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.image && (
                  <div className="w-12 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#141414] truncate">{item.name}</p>
                  <p className="text-[12px] text-[#6B6B6B]">
                    Model: <strong className="text-[#141414]">{item.selected_model || item.mobile_model || 'Universal'}</strong>
                    {item.color && ` • ${item.color}`} • Qty: {item.quantity}
                  </p>
                </div>
              </div>

              <span className="text-[14px] font-semibold text-[#141414] shrink-0">
                {formatINR(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#E5E5E3] flex justify-between text-[16px] font-semibold text-[#141414]">
          <span>Total Paid</span>
          <span className="text-[#B0521F]">{formatINR(order.total)}</span>
        </div>
      </div>

      {/* Delivery & Next Steps */}
      <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-4">
        <h2 className="text-[20px] font-semibold text-[#141414]">
          Next Steps
        </h2>
        <ul className="space-y-2 text-[14px] text-[#6B6B6B] list-disc list-inside leading-relaxed">
          <li>Your items are being checked and packed at our Dharmapuri storefront.</li>
          <li>Tracking updates will be sent once courier pickup is confirmed.</li>
          <li>You can track fulfillment status anytime on our Track Order page using Order #{order.orderId}.</li>
        </ul>

        <div className="pt-4 border-t border-[#E5E5E3] flex flex-col sm:flex-row gap-3">
          <Link
            to="/track-order"
            state={{ orderId: order.orderId, phone: order.contact?.phone }}
            className="flex-1 min-h-[44px] px-5 py-2.5 bg-[#141414] hover:bg-[#383836] text-white text-[14px] font-semibold rounded-[6px] flex items-center justify-center transition-colors"
          >
            Track This Order
          </Link>
          <Link
            to="/"
            className="flex-1 min-h-[44px] px-5 py-2.5 bg-[#FAFAF9] hover:bg-white border border-[#E5E5E3] text-[#141414] text-[14px] font-semibold rounded-[6px] flex items-center justify-center transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
