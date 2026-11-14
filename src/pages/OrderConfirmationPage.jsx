import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Copy, Check, MessageCircle, ArrowRight, Package } from 'lucide-react';
import { formatINR } from '../lib/currency';
import { groupOrderItems, CompactComboComponentList } from '../components/cart/OrderItemsList';
import { store } from '../config/store';
import { policies, getDeliveryLine } from '../config/policies';
import { supabase } from '../lib/supabase';
import { setPageMeta } from '../lib/seo';

// Lazy-load the scene for performance & bundle splitting
const OrderConfirmedScene = lazy(() => import('../components/order/OrderConfirmedScene'));

const STEPS = [
  { key: 'placed', label: 'Order placed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export function OrderConfirmationPage() {
  const { state } = useLocation();

  // Restore order from location.state or sessionStorage cache on refresh
  const order = state?.order || (() => {
    try {
      const cached = sessionStorage.getItem('wrapstore_last_order');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  })();

  const orderNumber = order?.orderId || order?.order_number || '';
  const orderId = order?.id || '';
  const customerPhone = order?.contact?.phone || order?.customer_phone || '';
  const orderState = order?.shipping_state || order?.delivery?.state || null;
  const groupedItems = useMemo(() => (Array.isArray(order?.items) ? groupOrderItems(order.items) : []), [order?.items]);

  // Copy button state
  const [copied, setCopied] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Server-verified payment and status state
  const [serverPaymentStatus, setServerPaymentStatus] = useState(order?.payment_status || 'PAID');
  const [liveOrderStatus, setLiveOrderStatus] = useState(order?.order_status || order?.status || 'CONFIRMED');
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [justPacked, setJustPacked] = useState(false);
  const prevStatusRef = useRef(liveOrderStatus);

  // Cache order to sessionStorage so page refresh preserves all details
  useEffect(() => {
    if (order && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('wrapstore_last_order', JSON.stringify(order));
      } catch (e) {}
    }
  }, [order]);

  // Set document title
  useEffect(() => {
    setPageMeta({
      title: 'Order confirmed | WrapStore',
      description: 'Your WrapStore order has been confirmed.',
    });
  }, []);

  // Screen reader initial announcement
  useEffect(() => {
    if (orderNumber) {
      setLiveAnnouncement(`Order confirmed. Your order number is ${orderNumber}.`);
    }
  }, [orderNumber]);

  // Fetch real-time server verification from online_orders table
  useEffect(() => {
    if (!orderId && !orderNumber) return;

    let isMounted = true;
    let timeoutTimer = null;

    async function verifyServerOrder() {
      try {
        let query = supabase.from('online_orders').select('*');
        if (orderId) {
          query = query.eq('id', orderId);
        } else {
          query = query.eq('order_number', orderNumber);
        }

        const { data, error } = await query.single();
        if (!error && data && isMounted) {
          setServerPaymentStatus(data.payment_status || 'PAID');
          setLiveOrderStatus(data.order_status || 'CONFIRMED');
        }
      } catch (err) {
        console.warn('Notice verifying server order:', err);
      }
    }

    verifyServerOrder();

    // 15-second timeout for payment confirmation
    timeoutTimer = setTimeout(() => {
      if (isMounted) {
        setIsTimedOut((prev) => {
          if (serverPaymentStatus !== 'PAID') return true;
          return prev;
        });
      }
    }, 15000);

    // Subscribe to realtime changes on this specific order
    const channelTopic = `order-confirm-${orderId || orderNumber}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_orders',
        },
        (payload) => {
          if (!isMounted || !payload?.new) return;
          const updated = payload.new;
          if (updated.id === orderId || updated.order_number === orderNumber) {
            if (updated.payment_status) {
              setServerPaymentStatus(updated.payment_status);
            }
            if (updated.order_status) {
              const prev = prevStatusRef.current;
              setLiveOrderStatus(updated.order_status);
              if (updated.order_status.toUpperCase().includes('PACK') && !prev.toUpperCase().includes('PACK')) {
                setJustPacked(true);
                setTimeout(() => setJustPacked(false), 300);
              }
              prevStatusRef.current = updated.order_status;
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      supabase.removeChannel(channel);
    };
  }, [orderId, orderNumber, serverPaymentStatus]);

  // Calculate current active 4-step index
  const currentStepIndex = (() => {
    const s = (liveOrderStatus || '').toUpperCase();
    if (s.includes('DELIVER')) return 3;
    if (s.includes('SHIP')) return 2;
    if (s.includes('PACK')) return 1;
    return 0; // 'Order placed'
  })();

  const handleCopy = () => {
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setLiveAnnouncement(`Order number ${orderNumber} copied to clipboard.`);
    setTimeout(() => setCopied(false), 1500);
  };

  // WhatsApp support link with prefilled order number
  const whatsappUrl = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
    `Hi WrapStore, I have an inquiry about my Order #${orderNumber}`
  )}`;

  if (!order) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.025em]">We couldn't load this order</h1>
        <p className="text-[14px] text-[#6B6B6B] max-w-md mx-auto">
          If you recently placed an order, you can track it with your order number, or continue shopping.
        </p>
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/track-order"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-[#141414] text-white text-[14px] font-semibold rounded-[6px] hover:bg-[#262626] transition-colors"
          >
            Track order
          </Link>
          <Link
            to="/"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 bg-white border border-[#E5E5E3] text-[#141414] text-[14px] font-semibold rounded-[6px] hover:bg-[#FAFAF9] transition-colors"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-8 lg:py-10">
      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" role="status">
        {liveAnnouncement}
      </div>

      {/* 2-Column Responsive Layout: Mobile (Scene top, Info bottom), Desktop (Scene left, Info right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-start">
        
        {/* LEFT COLUMN: Animated Delivery Scene (16:9) + 4-Step Status Stepper */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Animated Delivery Scene */}
          <Suspense
            fallback={
              <div className="w-full aspect-[16/9] rounded-[6px] bg-[#F4F3F0] animate-pulse flex items-center justify-center">
                <span className="text-[13px] text-[#6B6B6B]">Loading scene...</span>
              </div>
            }
          >
            <OrderConfirmedScene
              mode="confirmation"
              orderStatus={liveOrderStatus}
              paymentStatus={isTimedOut ? 'PENDING' : serverPaymentStatus}
              orderNumber={orderNumber}
              className="border border-[#E5E5E3] shadow-sm"
            />
          </Suspense>

          {/* Waiting / Timeout Notice if payment not confirmed yet */}
          {serverPaymentStatus !== 'PAID' && !isTimedOut && (
            <div className="p-3 bg-[#F4F3F0] border border-[#E5E5E3] rounded-[6px] text-center">
              <p className="text-[13px] font-medium text-[#141414]">Confirming your payment...</p>
            </div>
          )}

          {isTimedOut && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[6px] text-[13px] text-amber-900 flex items-center justify-between">
              <span>Payment confirmation is taking longer than expected.</span>
              <Link to="/track-order" state={{ orderId: orderNumber, phone: customerPhone }} className="font-semibold underline ml-2">
                Check status
              </Link>
            </div>
          )}

          {/* 4-Step Live Status Line: Order placed, Packed, Shipped, Delivered */}
          <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-4 sm:p-5">
            <p className="text-[12px] font-semibold text-[#141414] mb-4">
              Order status
            </p>

            <div className="relative flex items-center justify-between">
              {/* Horizontal Connecting Bar */}
              <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-[#E5E5E3] -z-0" />
              <div
                className="absolute left-4 top-3.5 h-[2px] bg-[#141414] transition-all duration-500 -z-0"
                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isPackedStep = step.key === 'packed';

                return (
                  <div key={step.key} className="flex flex-col items-center text-center z-10 px-1">
                    {/* Circle Indicator */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#141414] text-white'
                          : 'bg-white border-2 border-[#E5E5E3] text-[#A8A29E]'
                      } ${isCurrent ? 'ring-4 ring-[#141414]/10' : ''} ${
                        isPackedStep && justPacked ? 'scale-125 duration-200' : ''
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`text-[12px] mt-2 transition-colors ${
                        isCurrent
                          ? 'font-semibold text-[#141414]'
                          : isCompleted
                          ? 'font-medium text-[#141414]'
                          : 'text-[#737373]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real Accessible Order Details & Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header & Subtitle (Always visible above the fold on mobile & desktop) */}
          <div className="space-y-1.5 border-b border-[#E5E5E3] pb-4">
            <h1 className="text-[28px] sm:text-[34px] font-semibold text-[#141414] tracking-[-0.025em] leading-tight">
              Order confirmed
            </h1>
            <p className="text-[14px] text-[#6B6B6B] leading-normal">
              We will update this page as your order moves.
            </p>
          </div>

          {/* Order Number & Copy Button */}
          <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] text-[#737373]">Order reference</p>
              <p className="text-[16px] font-bold text-[#141414] tracking-wide tabular-nums">
                {orderNumber}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#E5E5E3] hover:border-[#141414] bg-[#FAFAF9] hover:bg-white text-[12px] font-medium text-[#141414] transition-colors cursor-pointer select-none"
              aria-label="Copy order reference number"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5">
            <Link
              to="/track-order"
              state={{ orderId: orderNumber, phone: customerPhone }}
              className="w-full min-h-[44px] px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-[14px] font-semibold rounded-[6px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Track your order</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="w-full min-h-[44px] px-5 py-2.5 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#141414] text-[14px] font-semibold rounded-[6px] flex items-center justify-center transition-colors cursor-pointer"
            >
              Continue shopping
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[40px] px-4 py-2 text-[#737373] hover:text-[#141414] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Need help? Chat with us on WhatsApp</span>
            </a>
          </div>

          {/* Short Item Summary */}
          {groupedItems.length > 0 && (
            <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-4 sm:p-5 space-y-3">
              <h2 className="text-[14px] font-bold text-[#141414] pb-2 border-b border-[#E5E5E3]">
                Items ordered
              </h2>

              <div className="divide-y divide-[#E5E5E3] max-h-[300px] overflow-y-auto pr-1">
                {groupedItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#141414] truncate">{item.name}</p>
                        <p className="text-[12px] text-[#737373]">
                          {item.selected_model || item.mobile_model || 'Universal'}
                          {item.color ? ' · ' + item.color : ''} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-[#141414] shrink-0 tabular-nums">
                        {formatINR((item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>

                    {item.is_combo && Array.isArray(item.components) && item.components.length > 0 && (
                      <CompactComboComponentList components={item.components} quantity={item.quantity} />
                    )}
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-[#E5E5E3] space-y-1 text-[13px]">
                <div className="flex justify-between text-[#737373]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatINR(order?.subtotal || order?.total || 0)}</span>
                </div>
                {order?.shippingFee !== undefined && (
                  <div className="flex justify-between text-[#737373]">
                    <span>Shipping</span>
                    <span className="tabular-nums">{formatINR(order.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#141414] text-[15px] pt-1 border-t border-[#E5E5E3]">
                  <span>Total</span>
                  <span className="text-[#B0521F] tabular-nums">{formatINR(order?.total || order?.grand_total || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          <div className="p-4 bg-white border border-[#E5E5E3] rounded-[6px] text-[13px] text-[#6B6B6B] space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#141414]">Estimated delivery</p>
              
            </div>
            {orderState ? (
              <p>{getDeliveryLine(orderState)}</p>
            ) : (
              <div className="space-y-0.5">
                <p>Orders delivered within {policies.delivery.tn.label}: {policies.delivery.tn.text}.</p>
                <p>Orders delivered to {policies.delivery.other.label.toLowerCase()}: {policies.delivery.other.text.toLowerCase()}.</p>
              </div>
            )}
            <p className="pt-1">
              <Link to="/shipping-policy" className="text-[#B0521F] hover:underline font-medium inline-flex items-center gap-1">
                View shipping policy →
              </Link>
            </p>
          </div>

          {/* Delivery Address Preview */}
          {order?.delivery && (
            <div className="p-4 bg-white border border-[#E5E5E3] rounded-[6px] text-[13px] text-[#737373] space-y-1">
              <p className="font-semibold text-[#141414]">Delivery address</p>
              <p>{order.delivery.address}</p>
              <p>{order.delivery.city}{order.delivery.state ? `, ${order.delivery.state}` : ''} {order.delivery.pincode ? `- ${order.delivery.pincode}` : ''}</p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
