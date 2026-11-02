import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { policies } from '../config/policies';
import { store } from '../config/store';

export function ShippingPolicyPage() {
  useEffect(() => {
    document.title = 'Shipping policy - WrapStore';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = `Orders delivered within ${policies.delivery.tn.label}: ${policies.delivery.tn.text}. Orders delivered to other states: ${policies.delivery.other.text.toLowerCase()}.`;
  }, []);

  const whatsappText = store.phoneDisplay;
  const whatsappHref = store.whatsappUrl || (store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : '');

  return (
    <main className="flex-1 max-w-[760px] w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="space-y-8">
        {/* Page Title */}
        <div className="pb-6 border-b border-[#E5E5E3]">
          <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
            Shipping policy
          </h1>
        </div>

        {/* Delivery Time Section */}
        <section className="space-y-4">
          <h2 className="text-[20px] font-semibold text-[#141414]">
            Delivery time
          </h2>

          <div className="space-y-2 text-[15px] text-[#141414] leading-relaxed">
            <p>Orders delivered within {policies.delivery.tn.label}: {policies.delivery.tn.text}.</p>
            <p>Orders delivered to {policies.delivery.other.label.toLowerCase()}: {policies.delivery.other.text.toLowerCase()}.</p>
          </div>

          <div className="space-y-3 text-[14px] text-[#6B6B6B] leading-relaxed pt-2">
            <p>Delivery time is counted from {policies.delivery.countedFrom}.</p>
            <p>
              You can follow your order on the{' '}
              <Link to="/track-order" className="text-[#B0521F] hover:underline font-medium">
                tracking page
              </Link>
              . We update it as your order moves.
            </p>
            <p>
              If your order has not arrived within these times, contact us on{' '}
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B0521F] hover:underline font-medium"
                >
                  WhatsApp ({whatsappText})
                </a>
              ) : (
                <span>WhatsApp ({whatsappText})</span>
              )}{' '}
              with your order number.
            </p>
          </div>
        </section>

        
      </div>
    </main>
  );
}

export default ShippingPolicyPage;

