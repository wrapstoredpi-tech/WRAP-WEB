import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Check, AlertCircle, Loader2 } from 'lucide-react';
import { trackOrder } from '../lib/checkout';
import { formatINR } from '../lib/currency';
import { Button } from '../components/ui/Button';

const STEPPER_STAGES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export function TrackOrderPage() {
  const { state } = useLocation();

  const [orderIdInput, setOrderIdInput] = useState(state?.orderId || '');
  const [phoneInput, setPhoneInput] = useState(state?.phone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-search if passed state with orderId
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
      setErrorMessage('Please enter a valid Order ID (e.g. WS-123456)');
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
        setErrorMessage(res.message || 'Order not found. Please verify Order ID and phone number.');
      }
    } catch (err) {
      setErrorMessage('Could not track order. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStepStatusIndex = (status) => {
    const idx = STEPPER_STAGES.indexOf(status);
    return idx >= 0 ? idx : 2; // Default to Processing if unknown
  };

  return (
    <main className="flex-1 bg-base min-h-screen py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <span className="text-caption uppercase font-semibold text-neutral-500 tracking-wider">
            Live Tracking
          </span>
          <h1 className="text-display font-semibold text-neutral-900 tracking-tight">Track Your Order</h1>
          <p className="text-body text-neutral-500">Enter your order ID and mobile number to see live fulfillment updates.</p>
        </div>

        {/* Search Card */}
        <form onSubmit={handleSearch} className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order-id-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                Order ID *
              </label>
              <input
                id="order-id-input"
                type="text"
                placeholder="WS-123456"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full bg-base border border-neutral-300 rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="track-phone-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                Mobile Number (Optional)
              </label>
              <input
                id="track-phone-input"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-base border border-neutral-300 rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#F8EBE7] border border-[#ECCEC5] rounded-lg text-accent text-caption flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            isFullWidth
            isLoading={isSearching}
            leftIcon={!isSearching && <Search className="w-4 h-4" />}
          >
            Track Order
          </Button>
        </form>

        {/* Status Result */}
        {result && result.order && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <span className="text-caption uppercase font-semibold text-neutral-500 tracking-wider">
                  Order #{result.order.orderId}
                </span>
                <p className="text-body font-semibold text-neutral-900 mt-0.5">
                  Status: <span className="text-accent">{result.order.status || 'Processing'}</span>
                </p>
              </div>
              <span className="text-caption text-neutral-500 font-medium">
                {new Date(result.order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Stepper Progress */}
            <div className="py-4 space-y-4">
              <p className="text-caption uppercase font-semibold text-neutral-500 tracking-wider">Fulfillment Stage</p>
              
              <div className="relative flex items-center justify-between max-w-lg mx-auto">
                {/* Connector Line */}
                <div className="absolute top-4 left-0 right-0 h-[2px] bg-neutral-200 -translate-y-1/2 z-0" />
                
                {STEPPER_STAGES.map((stage, idx) => {
                  const currentIdx = getStepStatusIndex(result.order.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={stage} className="relative z-10 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-caption border transition-colors ${
                          isCompleted
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-400 border-neutral-300'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-medium ${isCurrent ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <span className="text-caption uppercase font-semibold text-neutral-500 tracking-wider">Items in Shipment</span>
              <div className="space-y-2">
                {result.order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-body">
                    <span className="text-neutral-900 font-medium">{item.name} {item.color && `(${item.color})`} &times; {item.quantity}</span>
                    <span className="text-neutral-600 font-semibold">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-neutral-100 flex justify-between font-semibold text-body text-neutral-900">
                <span>Total Amount</span>
                <span className="text-accent">{formatINR(result.order.total || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default TrackOrderPage;
