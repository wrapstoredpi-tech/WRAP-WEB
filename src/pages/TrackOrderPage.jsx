import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search, Package, CheckCircle2, Truck, Home,
  ClipboardCheck, Loader2, AlertCircle, Phone, Hash,
  MapPin, Calendar, ChevronRight
} from 'lucide-react';

/* ─── Mock status lookup ─── */
const MOCK_ORDERS = {
  // Pre-seeded demo orders
  'WRP-DEMO1234': { status: 2, name: 'Jane Appleseed', address: '123 Main St, New York, NY 10001', placedAt: '2026-09-22T10:00:00Z', estimatedDelivery: '2026-09-27' },
  'WRP-DEMO5678': { status: 4, name: 'Alex Chen', address: '456 Oak Ave, San Francisco, CA 94102', placedAt: '2026-09-15T08:30:00Z', estimatedDelivery: '2026-09-20' },
};

const STEPS = [
  { label: 'Pending', description: 'Order received, awaiting confirmation.', icon: ClipboardCheck },
  { label: 'Confirmed', description: 'Order confirmed and queued for processing.', icon: CheckCircle2 },
  { label: 'Processing', description: 'Being carefully packed at our studio.', icon: Package },
  { label: 'Shipped', description: 'On its way — handed off to courier.', icon: Truck },
  { label: 'Delivered', description: 'Package delivered to your door.', icon: Home },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StepIndicator({ steps, currentStep }) {
  return (
    <div className="w-full">
      {/* Horizontal stepper — desktop */}
      <div className="hidden sm:flex items-start w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isActive = idx === currentStep;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Circle */}
                <div className={[
                  'relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0',
                  isCompleted
                    ? isActive
                      ? 'border-neutral-900 bg-neutral-900 shadow-md'
                      : 'border-neutral-700 bg-neutral-800'
                    : 'border-neutral-200 bg-white',
                ].join(' ')}>
                  <Icon className={['w-4.5 h-4.5 transition-colors', isCompleted ? 'text-white' : 'text-neutral-300'].join(' ')} />
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border-2 border-neutral-400 animate-ping opacity-40" />
                  )}
                </div>
                {/* Label */}
                <p className={[
                  'text-body-sm font-semibold mt-2 text-center transition-colors',
                  isActive ? 'text-neutral-900' : isCompleted ? 'text-neutral-600' : 'text-neutral-300',
                ].join(' ')}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-neutral-500 mt-1 text-center max-w-[100px] leading-tight hidden lg:block">
                    {step.description}
                  </p>
                )}
              </div>
              {/* Connector */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mt-5 mx-1 transition-all duration-700" style={{
                  background: idx < currentStep
                    ? '#1A1A1A'
                    : '#E7E7E1'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Vertical stepper — mobile */}
      <div className="flex sm:hidden flex-col gap-0">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isActive = idx === currentStep;
          const isLast = idx === steps.length - 1;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={[
                  'relative w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-500',
                  isCompleted
                    ? isActive
                      ? 'border-neutral-900 bg-neutral-900 shadow-md'
                      : 'border-neutral-700 bg-neutral-800'
                    : 'border-neutral-200 bg-white',
                ].join(' ')}>
                  <Icon className={['w-4 h-4', isCompleted ? 'text-white' : 'text-neutral-300'].join(' ')} />
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border-2 border-neutral-400 animate-ping opacity-40" />
                  )}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 my-1 min-h-[28px]" style={{
                    background: idx < currentStep ? '#1A1A1A' : '#E7E7E1'
                  }} />
                )}
              </div>
              <div className="pb-6">
                <p className={[
                  'text-body-sm font-semibold leading-tight',
                  isActive ? 'text-neutral-900' : isCompleted ? 'text-neutral-600' : 'text-neutral-300',
                ].join(' ')}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-neutral-500 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mock result panel ─── */
function TrackResult({ orderNumber, result }) {
  const currentStep = result.status;
  const step = STEPS[currentStep];

  return (
    <div className="animate-fade-in flex flex-col gap-5 mt-8">
      {/* Status header */}
      <div className="bg-neutral-900 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-metadata text-neutral-400 uppercase tracking-widest font-semibold mb-1">Order</p>
          <p className="text-h3 font-bold tracking-widest font-mono">{orderNumber}</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-body-sm font-semibold">
            {currentStep === STEPS.length - 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
            {step.label}
          </span>
          <p className="text-body-sm text-neutral-400 mt-2">{step.description}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-neutral-200 p-6">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Order metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 p-5 flex flex-col gap-3">
          <h3 className="text-body-sm font-bold uppercase tracking-widest text-neutral-900 pb-3 border-b border-neutral-100">
            Recipient
          </h3>
          <div className="flex items-start gap-2.5">
            <Home className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-body-sm font-semibold text-neutral-900">{result.name}</p>
              <p className="text-body-sm text-neutral-500 mt-0.5">{result.address}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 flex flex-col gap-3">
          <h3 className="text-body-sm font-bold uppercase tracking-widest text-neutral-900 pb-3 border-b border-neutral-100">
            Timeline
          </h3>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-metadata text-neutral-400 uppercase tracking-wider">Placed</p>
              <p className="text-body-sm font-medium text-neutral-900">{formatDate(result.placedAt)}</p>
            </div>
          </div>
          {result.estimatedDelivery && currentStep < 4 && (
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <p className="text-metadata text-neutral-400 uppercase tracking-wider">Est. Delivery</p>
                <p className="text-body-sm font-medium text-neutral-900">{formatDate(result.estimatedDelivery)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export function TrackOrderPage() {
  const { state } = useLocation();

  const [orderNumber, setOrderNumber] = useState(state?.orderNumber || '');
  const [phone, setPhone] = useState(state?.phone || '');
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Auto-search if arriving from confirmation page
  useEffect(() => {
    if (state?.orderNumber && state?.phone) {
      handleSearch(null, state.orderNumber, state.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = (on, ph) => {
    const errs = {};
    if (!on.trim()) errs.orderNumber = 'Order number is required.';
    if (!ph.trim()) errs.phone = 'Phone number is required.';
    return errs;
  };

  const handleSearch = async (e, prefillOn, prefillPhone) => {
    if (e) e.preventDefault();
    const on = (prefillOn ?? orderNumber).trim().toUpperCase();
    const ph = (prefillPhone ?? phone).trim();

    const errs = validateForm(on, ph);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSearching(true);
    setResult(null);
    setNotFound(false);

    // Mock 1.2s lookup
    await new Promise(res => setTimeout(res, 1200));

    const found = MOCK_ORDERS[on];
    if (found) {
      setResult(found);
      setNotFound(false);
    } else {
      // Simulate: any order number + valid phone returns a pending order
      if (on.startsWith('WRP-') && on.length >= 8) {
        setResult({
          status: 0,
          name: 'Customer',
          address: 'Your shipping address',
          placedAt: new Date().toISOString(),
          estimatedDelivery: null,
        });
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }
    setIsSearching(false);
  };

  return (
    <main className="flex-1 bg-base-offwhite">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">

        {/* Header */}
        <div className="mb-10">
          <p className="text-metadata text-neutral-400 tracking-widest uppercase font-bold mb-2">WrapStore</p>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight mb-3">Track Your Order</h1>
          <p className="text-body text-neutral-500">
            Enter your order number and phone number to see real-time status updates.
          </p>
        </div>

        {/* Lookup Form */}
        <form
          id="track-order-form"
          onSubmit={handleSearch}
          noValidate
          className="bg-white border border-neutral-200 p-6 flex flex-col gap-5"
        >
          {/* Order Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-order-number" className="text-body-sm font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-neutral-400" />
              Order Number
            </label>
            <input
              id="track-order-number"
              type="text"
              placeholder="e.g. WRP-DEMO1234"
              value={orderNumber}
              onChange={e => {
                setOrderNumber(e.target.value);
                if (errors.orderNumber) setErrors(prev => ({ ...prev, orderNumber: undefined }));
              }}
              className={[
                'w-full h-11 px-4 border bg-white text-neutral-900 text-body placeholder:text-neutral-400 font-mono tracking-wider',
                'focus:outline-none transition-all',
                errors.orderNumber
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100',
              ].join(' ')}
              autoComplete="off"
              spellCheck={false}
            />
            {errors.orderNumber && (
              <p className="text-xs text-red-600 animate-fade-in">{errors.orderNumber}</p>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-phone" className="text-body-sm font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              Phone Number
            </label>
            <input
              id="track-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={e => {
                setPhone(e.target.value);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
              }}
              className={[
                'w-full h-11 px-4 border bg-white text-neutral-900 text-body placeholder:text-neutral-400',
                'focus:outline-none transition-all',
                errors.phone
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100',
              ].join(' ')}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="text-xs text-red-600 animate-fade-in">{errors.phone}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            id="track-search-btn"
            className="h-12 bg-neutral-900 text-white font-bold text-body flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Looking up your order&hellip;
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Track Order
              </>
            )}
          </button>

          {/* Demo hint */}
          <p className="text-xs text-neutral-400 text-center">
            Try order number{' '}
            <button
              type="button"
              onClick={() => { setOrderNumber('WRP-DEMO1234'); setPhone('+1 555 000 0000'); }}
              className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900 transition-colors font-mono"
            >
              WRP-DEMO1234
            </button>
            {' or '}
            <button
              type="button"
              onClick={() => { setOrderNumber('WRP-DEMO5678'); setPhone('+1 555 000 0000'); }}
              className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900 transition-colors font-mono"
            >
              WRP-DEMO5678
            </button>
          </p>
        </form>

        {/* Not found */}
        {notFound && (
          <div className="mt-6 bg-red-50 border border-red-200 p-5 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-semibold text-red-700">Order not found</p>
              <p className="text-body-sm text-red-600 mt-0.5">
                We couldn&rsquo;t find an order matching that number and phone. Please double-check and try again,
                or contact us at{' '}
                <a href="mailto:support@wrapstore.co" className="underline">support@wrapstore.co</a>.
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !notFound && (
          <TrackResult orderNumber={orderNumber.trim().toUpperCase()} result={result} />
        )}
      </div>
    </main>
  );
}

export default TrackOrderPage;
