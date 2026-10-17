import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Check, AlertCircle } from 'lucide-react';
import { trackOrder, ORDER_STATUS_STEPS } from '../lib/checkout';
import { formatINR } from '../lib/currency';

export function TrackOrderPage() {
  const { state } = useLocation();

  const [orderIdInput, setOrderIdInput] = useState(state?.orderId || '');
  const [phoneInput, setPhoneInput] = useState(state?.phone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-lookup if navigated with state
  useEffect(() => {
    if (state?.orderId) {
      handleSearch(null, state.orderId, state.phone || '');
    }
  }, [state]);

  const handleSearch = async (e, forceId = null, forcePhone = null) => {
    if (e) e.preventDefault();
    const targetId = forceId !== null ? forceId : orderIdInput;
    const targetPhone = forcePhone !== null ? forcePhone : phoneInput;

    if (!targetId.trim()) {
      setErrorMessage('Please enter an order number (e.g. WS-123456).');
      return;
    }

    setErrorMessage('');
    setIsSearching(true);
    setResult(null);

    try {
      const res = await trackOrder(targetId, targetPhone);
      if (res.success) {
        setResult(res);
      } else {
        setErrorMessage(res.message || 'No order found with this order number and phone.');
      }
    } catch (err) {
      setErrorMessage('Could not track order. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIndex = (currentStatus) => {
    const idx = ORDER_STATUS_STEPS.indexOf(currentStatus);
    return idx >= 0 ? idx : 1; // Default to Payment received
  };

  const isCancelledOrRefunded = result?.status === 'Cancelled' || result?.status === 'Refunded';

  return (
    <main className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          Track order
        </h1>
        <p className="text-[14px] text-[#6B6B6B]">
          Enter your order number and phone to check real-time fulfillment status.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="orderId" className="block text-[14px] font-semibold text-[#141414] mb-1">
              Order Number *
            </label>
            <input
              id="orderId"
              type="text"
              required
              placeholder="WS-123456"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-[14px] font-semibold text-[#141414] mb-1">
              Mobile Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="9876543210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#F9EDE7] border border-[#B0521F] rounded-[6px] text-[#B0521F] text-[14px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSearching}
          className="min-h-[44px] px-6 py-2.5 bg-[#B0521F] hover:bg-[#994518] text-white text-[14px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSearching ? (
            <span>Looking up...</span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Track Order</span>
            </>
          )}
        </button>
      </form>

      {/* Result Status */}
      {result && result.order && (
        <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E3] gap-2">
            <div>
              <span className="text-[12px] text-[#6B6B6B]">Order #{result.order.orderId}</span>
              <h2 className="text-[20px] font-semibold text-[#141414]">
                Status: <span className="text-[#B0521F]">{result.order.status}</span>
              </h2>
            </div>
            <span className="text-[12px] text-[#6B6B6B]">
              Ordered on {new Date(result.order.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Stepper (for standard stages) */}
          {!isCancelledOrRefunded ? (
            <div className="py-4 space-y-4">
              <h3 className="text-[14px] font-semibold text-[#141414]">Fulfillment Progress</h3>
              
              <div className="grid grid-cols-5 gap-2 text-center">
                {ORDER_STATUS_STEPS.map((stage, idx) => {
                  const currentIdx = getStatusIndex(result.order.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={stage} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-[6px] flex items-center justify-center text-[12px] font-semibold border ${
                          isDone
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white text-[#6B6B6B] border-[#E5E5E3]'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[12px] leading-tight ${
                          isCurrent ? 'font-semibold text-[#141414]' : 'text-[#6B6B6B]'
                        }`}
                      >
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#F9EDE7] border border-[#B0521F] rounded-[6px] text-[14px] text-[#B0521F]">
              This order has been {result.order.status.toLowerCase()}. Please contact WhatsApp support if you have questions.
            </div>
          )}

          {/* Items preview with model */}
          <div className="pt-4 border-t border-[#E5E5E3] space-y-2">
            <h3 className="text-[14px] font-semibold text-[#141414]">Items in Shipment</h3>
            <div className="divide-y divide-[#E5E5E3]">
              {result.order.items?.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-[14px]">
                  <div>
                    <span className="font-semibold text-[#141414]">{item.name}</span>
                    <span className="text-[12px] text-[#6B6B6B] block">
                      Model: {item.selected_model || item.mobile_model || 'Universal'} • Qty: {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold text-[#141414]">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default TrackOrderPage;
