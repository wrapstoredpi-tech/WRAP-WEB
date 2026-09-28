import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, Loader2 } from 'lucide-react';
import { trackOrder } from '../lib/checkout';

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
        setErrorMessage(res.message || 'Order not found. Please check Order ID and phone number.');
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
    <main className="flex-1 bg-base-offwhite py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-display font-semibold text-neutral-900 tracking-tight">Track Your Order</h1>
          <p className="text-body-sm text-neutral-500">Enter your order number and mobile phone to get live status updates.</p>
        </div>

        {/* Search Card */}
        <form onSubmit={handleSearch} className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order-id-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                Order Number *
              </label>
              <input
                id="order-id-input"
                type="text"
                placeholder="WS-123456"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label htmlFor="track-phone-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="track-phone-input"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full min-h-[48px] bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-body-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Order...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </>
            )}
          </button>
        </form>

        {/* Status Result */}
        {result && result.order && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <span className="text-xs uppercase font-semibold text-neutral-500">Order #{result.order.orderId}</span>
                <p className="text-body font-semibold text-neutral-900">
                  Status: <span className="text-accent">{result.order.status || 'Processing'}</span>
                </p>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {new Date(result.order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Stepper Progress */}
            <div className="py-4 space-y-4">
              <p className="text-xs uppercase font-semibold text-neutral-400">Order Lifecycle Stepper</p>
              
              <div className="relative flex items-center justify-between max-w-lg mx-auto">
                {/* Connector Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
                
                {STEPPER_STAGES.map((stage, idx) => {
                  const currentIdx = getStepStatusIndex(result.order.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={stage} className="relative z-10 flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${
                          isCompleted
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-400 border-neutral-300'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 text-accent" /> : idx + 1}
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
              <span className="text-xs uppercase font-semibold text-neutral-500">Items in Shipment</span>
              <div className="space-y-2">
                {result.order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-body-sm">
                    <span className="text-neutral-900 font-medium">{item.name} {item.color && `(${item.color})`} &times; {item.quantity}</span>
                    <span className="text-neutral-600 font-mono">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-neutral-100 flex justify-between font-semibold text-body-sm text-neutral-900">
                <span>Total Amount</span>
                <span>₹{(result.order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default TrackOrderPage;
