import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Home, Building2,
  Landmark, Hash, ChevronDown, ChevronUp,
  Banknote, CreditCard, ShieldCheck, Truck,
  Lock, ArrowLeft, Loader2, Check, Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

/* ─────────────── helpers ─────────────── */
const formatPrice = (n) => `$${Number(n).toFixed(2)}`;

const generateOrderNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'WRP-';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

/* ─────────────── validation ─────────────── */
const PHONE_RE = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,14}$/;

function validate(fields) {
  const errors = {};
  if (!fields.name.trim()) errors.name = 'Full name is required.';
  else if (fields.name.trim().length < 2) errors.name = 'Please enter a valid name.';

  if (!fields.phone.trim()) errors.phone = 'Phone number is required.';
  else if (!PHONE_RE.test(fields.phone.trim())) errors.phone = 'Please enter a valid phone number.';

  if (fields.email && fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    errors.email = 'Please enter a valid email address.';

  if (!fields.address.trim()) errors.address = 'Street address is required.';
  if (!fields.city.trim()) errors.city = 'City is required.';
  if (!fields.state.trim()) errors.state = 'State / Province is required.';
  if (!fields.zip.trim()) errors.zip = 'Postal code is required.';

  return errors;
}

/* ─────────────── sub-components ─────────────── */

function FormField({ id, label, icon: Icon, error, optional, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-body-sm font-semibold text-neutral-700 tracking-wide uppercase"
      >
        {label}
        {optional && <span className="text-neutral-400 normal-case font-normal ml-1">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        )}
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 animate-fade-in">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function InputEl({ id, icon, error, ...props }) {
  return (
    <input
      id={id}
      className={[
        'w-full h-11 rounded-none border bg-white text-neutral-900 text-body placeholder:text-neutral-400',
        'transition-all duration-150 outline-none',
        icon ? 'pl-10 pr-4' : 'px-4',
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100',
      ].join(' ')}
      {...props}
    />
  );
}

function PaymentCard({ id, selected, onSelect, icon: Icon, title, subtitle, badge }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onSelect}
      className={[
        'relative w-full text-left p-4 border-2 transition-all duration-200 group',
        selected
          ? 'border-neutral-900 bg-neutral-50 shadow-subtle-card'
          : 'border-neutral-200 bg-white hover:border-neutral-400',
      ].join(' ')}
      aria-pressed={selected}
    >
      <span className={[
        'absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
        selected ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300 bg-white',
      ].join(' ')}>
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>

      <div className="flex items-start gap-3 pr-7">
        <div className={[
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-neutral-900' : 'bg-neutral-100 group-hover:bg-neutral-200',
        ].join(' ')}>
          <Icon className={['w-5 h-5 transition-colors', selected ? 'text-white' : 'text-neutral-600'].join(' ')} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 text-body">{title}</span>
            {badge && (
              <span className="text-metadata font-bold tracking-widest uppercase px-2 py-0.5 bg-accent-light text-accent border border-accent-border">
                {badge}
              </span>
            )}
          </div>
          <p className="text-body-sm text-neutral-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function OrderSummaryContent({ items, subtotal, shippingFee, isFreeShipping, total }) {
  return (
    <div className="flex flex-col gap-0">
      <div className="divide-y divide-neutral-100">
        {items.map(({ id, product, quantity }) => {
          const effectivePrice = product.discount_percentage > 0
            ? product.selling_price * (1 - product.discount_percentage / 100)
            : product.selling_price;
          return (
            <div key={id} className="flex items-center gap-3 py-3">
              <div className="relative w-14 h-14 shrink-0 bg-neutral-100 overflow-hidden">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold text-neutral-900 leading-snug truncate">{product.name}</p>
                <p className="text-metadata text-neutral-400 mt-0.5 uppercase tracking-wider">{product.mobile_model}</p>
              </div>
              <span className="text-body-sm font-semibold text-neutral-900 shrink-0">
                {formatPrice(effectivePrice * quantity)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-neutral-200 pt-4 mt-1 flex flex-col gap-2.5">
        <div className="flex justify-between text-body-sm text-neutral-600">
          <span>Subtotal</span>
          <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-body-sm text-neutral-600">
          <span>Shipping</span>
          {isFreeShipping
            ? <span className="font-semibold text-emerald-600">Free</span>
            : <span className="font-medium text-neutral-900">{formatPrice(shippingFee)}</span>
          }
        </div>
        <div className="border-t border-neutral-200 pt-3 flex justify-between">
          <span className="font-bold text-neutral-900">Total</span>
          <span className="font-bold text-h3 text-neutral-900">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-neutral-100">
        {[
          [Lock, 'Secure & encrypted checkout'],
          [Truck, 'Free shipping on orders over $100'],
          [ShieldCheck, '30-day hassle-free returns'],
        ].map(([Icon, text]) => (
          <div key={text} className="flex items-center gap-2 text-body-sm text-neutral-500">
            <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── main page ─────────────── */
export function CheckoutPage() {
  const { items, subtotal, shippingFee, isFreeShipping, estimatedTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    name: '', phone: '', email: '',
    address: '', city: '', state: '', zip: '', country: 'United States',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const newErrors = validate({ ...fields, [name]: value });
      setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
    }
  }, [fields, touched]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newErrors = validate(fields);
    setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  }, [fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(fields).map(k => [k, true]));
    setTouched(allTouched);
    const validationErrors = validate(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsPlacing(true);
    await new Promise(res => setTimeout(res, 2000));

    const orderNumber = generateOrderNumber();
    const orderData = {
      orderNumber,
      customerName: fields.name,
      email: fields.email,
      phone: fields.phone,
      address: `${fields.address}, ${fields.city}, ${fields.state} ${fields.zip}, ${fields.country}`,
      paymentMethod,
      items: items.map(({ product, quantity }) => ({
        name: product.name,
        model: product.mobile_model,
        price: product.discount_percentage > 0
          ? product.selling_price * (1 - product.discount_percentage / 100)
          : product.selling_price,
        quantity,
        image: product.image_url,
      })),
      subtotal,
      shippingFee,
      total: estimatedTotal,
      placedAt: new Date().toISOString(),
    };

    clearCart();
    navigate('/order-confirmation', { state: { order: orderData } });
  };

  if (items.length === 0 && !isPlacing) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-24">
        <Package className="w-12 h-12 text-neutral-300" />
        <div className="text-center">
          <h1 className="text-h2 font-bold text-neutral-900 mb-2">Your bag is empty</h1>
          <p className="text-body text-neutral-500">Add some items before checking out.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-body font-semibold hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base-offwhite">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-0">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Cart
        </Link>
      </div>

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">Checkout</h1>
          <p className="text-body text-neutral-500 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} &middot; {formatPrice(estimatedTotal)}
          </p>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12 items-start">
          {/* LEFT: Form */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            noValidate
            className="flex-1 min-w-0 flex flex-col gap-8"
          >
            {/* Customer Details */}
            <section className="bg-white border border-neutral-200 p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-5 pb-4 border-b border-neutral-100 flex items-center gap-2">
                <User className="w-[18px] h-[18px] text-neutral-400" />
                Customer Details
              </h2>
              <div className="flex flex-col gap-4">
                <FormField id="name" label="Full Name" icon={User} error={errors.name}>
                  <InputEl
                    id="name" name="name" type="text" icon
                    placeholder="Jane Appleseed"
                    value={fields.name}
                    onChange={handleChange} onBlur={handleBlur}
                    error={errors.name} autoComplete="name"
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="phone" label="Phone" icon={Phone} error={errors.phone}>
                    <InputEl
                      id="phone" name="phone" type="tel" icon
                      placeholder="+1 (555) 000-0000"
                      value={fields.phone}
                      onChange={handleChange} onBlur={handleBlur}
                      error={errors.phone} autoComplete="tel"
                    />
                  </FormField>
                  <FormField id="email" label="Email" icon={Mail} error={errors.email} optional>
                    <InputEl
                      id="email" name="email" type="email" icon
                      placeholder="jane@example.com"
                      value={fields.email}
                      onChange={handleChange} onBlur={handleBlur}
                      error={errors.email} autoComplete="email"
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="bg-white border border-neutral-200 p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-5 pb-4 border-b border-neutral-100 flex items-center gap-2">
                <MapPin className="w-[18px] h-[18px] text-neutral-400" />
                Shipping Address
              </h2>
              <div className="flex flex-col gap-4">
                <FormField id="address" label="Street Address" icon={Home} error={errors.address}>
                  <InputEl
                    id="address" name="address" type="text" icon
                    placeholder="123 Main Street, Apt 4B"
                    value={fields.address}
                    onChange={handleChange} onBlur={handleBlur}
                    error={errors.address} autoComplete="address-line1"
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="city" label="City" icon={Building2} error={errors.city}>
                    <InputEl
                      id="city" name="city" type="text" icon
                      placeholder="New York"
                      value={fields.city}
                      onChange={handleChange} onBlur={handleBlur}
                      error={errors.city} autoComplete="address-level2"
                    />
                  </FormField>
                  <FormField id="state" label="State / Province" icon={Landmark} error={errors.state}>
                    <InputEl
                      id="state" name="state" type="text" icon
                      placeholder="NY"
                      value={fields.state}
                      onChange={handleChange} onBlur={handleBlur}
                      error={errors.state} autoComplete="address-level1"
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="zip" label="Postal Code" icon={Hash} error={errors.zip}>
                    <InputEl
                      id="zip" name="zip" type="text" icon
                      placeholder="10001"
                      value={fields.zip}
                      onChange={handleChange} onBlur={handleBlur}
                      error={errors.zip} autoComplete="postal-code"
                    />
                  </FormField>
                  <FormField id="country" label="Country">
                    <select
                      id="country" name="country"
                      value={fields.country} onChange={handleChange}
                      className="w-full h-11 px-4 border border-neutral-200 bg-white text-neutral-900 text-body focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100 transition-all rounded-none appearance-none"
                      autoComplete="country-name"
                    >
                      {['United States','Canada','United Kingdom','Australia','Germany','France','India','Japan','Singapore'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white border border-neutral-200 p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-5 pb-4 border-b border-neutral-100 flex items-center gap-2">
                <CreditCard className="w-[18px] h-[18px] text-neutral-400" />
                Payment Method
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <PaymentCard
                    id="payment-cod"
                    selected={paymentMethod === 'cod'}
                    onSelect={() => setPaymentMethod('cod')}
                    icon={Banknote}
                    title="Cash on Delivery"
                    subtitle="Pay in cash when your order arrives."
                    badge="Popular"
                  />
                </div>
                <div className="flex-1">
                  <PaymentCard
                    id="payment-online"
                    selected={paymentMethod === 'online'}
                    onSelect={() => setPaymentMethod('online')}
                    icon={CreditCard}
                    title="Pay Online"
                    subtitle="Credit / debit card, UPI or net banking."
                  />
                </div>
              </div>
              {paymentMethod === 'online' && (
                <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 animate-fade-in">
                  <div className="flex items-center gap-2 text-body-sm text-neutral-500">
                    <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>Payment gateway will be integrated at launch. Your order will be recorded as pending.</span>
                  </div>
                </div>
              )}
            </section>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isPlacing}
              id="place-order-btn"
              className="w-full h-14 bg-neutral-900 text-white font-bold text-body flex items-center justify-center gap-2.5 hover:bg-neutral-800 active:bg-neutral-950 transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
            >
              {isPlacing ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  Placing your order&hellip;
                </>
              ) : (
                <>
                  <ShieldCheck className="w-[18px] h-[18px]" />
                  Place Order &middot; {formatPrice(estimatedTotal)}
                </>
              )}
            </button>
          </form>

          {/* RIGHT: Order Summary */}
          <aside className="w-full lg:w-[380px] shrink-0">
            {/* Mobile accordion */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setSummaryOpen(o => !o)}
                className="w-full flex items-center justify-between p-4 bg-white border border-neutral-200 text-body font-semibold text-neutral-900"
                aria-expanded={summaryOpen}
                aria-controls="mobile-order-summary"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-neutral-400" />
                  Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold">{formatPrice(estimatedTotal)}</span>
                  {summaryOpen
                    ? <ChevronUp className="w-4 h-4 text-neutral-500" />
                    : <ChevronDown className="w-4 h-4 text-neutral-500" />
                  }
                </span>
              </button>
              {summaryOpen && (
                <div id="mobile-order-summary" className="bg-white border border-t-0 border-neutral-200 p-4 animate-fade-in">
                  <OrderSummaryContent
                    items={items} subtotal={subtotal}
                    shippingFee={shippingFee} isFreeShipping={isFreeShipping}
                    total={estimatedTotal}
                  />
                </div>
              )}
            </div>

            {/* Desktop sticky */}
            <div className="hidden lg:block sticky top-28">
              <div className="bg-white border border-neutral-200 p-6">
                <h2 className="text-body font-bold text-neutral-900 mb-4 pb-4 border-b border-neutral-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-400" />
                    Order Summary
                  </span>
                  <span className="text-body-sm font-normal text-neutral-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </h2>
                <OrderSummaryContent
                  items={items} subtotal={subtotal}
                  shippingFee={shippingFee} isFreeShipping={isFreeShipping}
                  total={estimatedTotal}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;
