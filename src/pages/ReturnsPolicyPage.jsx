import React, { useEffect } from 'react';
import { policies } from '../config/policies';
import { store } from '../config/store';

export function ReturnsPolicyPage() {
  useEffect(() => {
    document.title = 'Cancellation, returns and refund policy - WrapStore';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = 'Cancellation, returns and refund policy for WrapStore. Damaged or wrong items are replaced.';
  }, []);

  const isStrict = policies.mode === 'strict';
  const whatsappText = store.phoneDisplay;
  const whatsappHref = store.whatsappUrl || (store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : '');
  const phoneHref = store.phoneTel ? `tel:${store.phoneTel}` : (store.phoneDisplay ? `tel:${store.phoneDisplay.replace(/\s+/g, '')}` : '');

  return (
    <main className="flex-1 max-w-[760px] w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="space-y-8">
        {/* Page Title */}
        <div className="pb-6 border-b border-[#E5E5E3]">
          <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
            Cancellation, returns and refund policy
          </h1>
        </div>

        {/* 1. Refunds */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[#141414]">
            Refunds
          </h2>
          <div className="text-[14px] text-[#6B6B6B] leading-relaxed space-y-2">
            <p>
              We do not offer refunds. Damaged or wrong items are replaced, as described below.
            </p>
            {!isStrict && (
              <p>
                If we cannot replace a damaged or wrong item, we refund the amount you paid. If we cannot fulfil an order, or a payment is charged twice, we refund the full amount to your original payment method.
              </p>
            )}
          </div>
        </section>

        {/* 2. Damaged items */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[#141414]">
            Damaged items
          </h2>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            If an item arrives damaged, record an unboxing video as you open the parcel and take clear photos of the damage. {policies.returns.videoGuide} Send your order number, the video and the photos on WhatsApp to{' '}
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#B0521F] hover:underline font-medium"
              >
                {whatsappText}
              </a>
            ) : (
              <span>{whatsappText}</span>
            )}{' '}
            within {policies.returns.reportWithin}. We cannot accept a damage claim without the unboxing video and photos. If the damage is confirmed, we send a replacement.
          </p>
        </section>

        {/* 3. Wrong item delivered */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-[#141414]">
            Wrong item delivered
          </h2>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            If you receive an item that is not what you ordered, contact us with your order number and photos. We accept the return and send the correct item as a replacement.
          </p>
        </section>

        {/* 4. Cancellation (only if not empty) */}
        {Boolean(policies.returns.cancellation && policies.returns.cancellation.trim()) && (
          <section className="space-y-3">
            <h2 className="text-[20px] font-semibold text-[#141414]">
              Cancellation
            </h2>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
              {policies.returns.cancellation}
            </p>
          </section>
        )}

        {/* 5. Contact us */}
        <section className="space-y-3 pt-4 border-t border-[#E5E5E3]">
          <h2 className="text-[20px] font-semibold text-[#141414]">
            Contact us
          </h2>
          <div className="text-[14px] text-[#6B6B6B] leading-relaxed space-y-1.5">
            {whatsappText && (
              <p>
                <strong className="text-[#141414] font-medium">WhatsApp: </strong>
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B0521F] hover:underline font-medium"
                  >
                    {whatsappText}
                  </a>
                ) : (
                  whatsappText
                )}
              </p>
            )}
            {store.phoneDisplay && (
              <p>
                <strong className="text-[#141414] font-medium">Phone: </strong>
                {phoneHref ? (
                  <a href={phoneHref} className="text-[#141414] hover:underline">
                    {store.phoneDisplay}
                  </a>
                ) : (
                  store.phoneDisplay
                )}
              </p>
            )}
            {Boolean(store.hours && store.hours.trim()) && (
              <p>
                <strong className="text-[#141414] font-medium">Store hours: </strong>
                <span>{store.hours}</span>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ReturnsPolicyPage;

