import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Home, Building2,
  Hash, ChevronDown, ChevronUp,
  Banknote, CreditCard, ShieldCheck, Lock, ArrowLeft, Loader2, Check, Package, AlertCircle
} from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { submitOrder } from '../lib/checkout';

const LOCAL_STORAGE_USER_KEY = 'wrapstore_checkout_user';

export function CheckoutPage() {
  const { products } = useProductsContext();
  const { cartItems, clearCart } = useCart();
  const { items, subtotal, shippingFee, estimatedTotal } = useHydratedCart(products);
  const navigate = useNavigate();

  // Load initial form details from localStorage for returning visitors
  const [fields, setFields] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read checkout fields from localStorage', e);
    }
    return {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      pincode: '',
    };
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery'); // 'Cash on Delivery' | 'Pay Online'
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Save details to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fields));
    } catch (e) {
      console.warn('Could not save checkout fields to localStorage', e);
    }
  }, [fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!fields.name.trim()) {
      errs.name = 'Full name is required';
    }

    const cleanPhone = fields.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = '10-digit phone number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!fields.address.trim()) {
      errs.address = 'Delivery address is required';
    }

    if (!fields.city.trim()) {
      errs.city = 'City is required';
    }

    const cleanPincode = fields.pincode.replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length < 6) {
      errs.pincode = 'Valid 6-digit postal pincode is required';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          color: i.selectedColor,
          price: i.product.selling_price,
          quantity: i.quantity,
          image: i.product.image_url,
        })),
        subtotal,
        shippingFee,
        total: estimatedTotal,
        contact: {
          name: fields.name,
          phone: fields.phone,
          email: fields.email,
        },
        delivery: {
          address: fields.address,
          city: fields.city,
          pincode: fields.pincode,
        },
        payment: paymentMethod,
      };

      const response = await submitOrder(orderPayload);
      if (response.success) {
        clearCart();
        navigate('/order-confirmation', { state: { order: response.order } });
      }
    } catch (e) {
      console.error('Order submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <Package className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-display font-semibold text-neutral-900">Your bag is empty</h1>
          <p className="text-body-sm text-neutral-500">Please add items to your cart before proceeding to checkout.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-neutral-900 text-white font-semibold text-body-sm rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Catalog
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base-offwhite min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-display font-semibold text-neutral-900 tracking-tight">Checkout</h1>
          <p className="text-body-sm text-neutral-500">Complete your contact &amp; delivery details below.</p>
        </div>

        {/* Layout: Single Column Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-7 space-y-8 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs"
          >
            {/* 1. Contact Section */}
            <section className="space-y-4">
              <div className="pb-3 border-b border-neutral-200 flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <h2 className="text-body font-semibold text-neutral-900">1. Contact Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name-input"
                    name="name"
                    type="text"
                    autoFocus
                    placeholder="Enter your full name"
                    value={fields.name}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none ${
                      errors.name ? 'border-red-500' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                      10-Digit Mobile Phone *
                    </label>
                    <input
                      id="phone-input"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={fields.phone}
                      onChange={handleChange}
                      className={`w-full bg-white border rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none ${
                        errors.phone ? 'border-red-500' : 'border-neutral-300 focus:border-neutral-900'
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="email-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      id="email-input"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={fields.email}
                      onChange={handleChange}
                      className={`w-full bg-white border rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none ${
                        errors.email ? 'border-red-500' : 'border-neutral-300 focus:border-neutral-900'
                      }`}
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Delivery Section */}
            <section className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="pb-3 border-b border-neutral-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <h2 className="text-body font-semibold text-neutral-900">2. Delivery Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="address-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                    House / Flat No., Street &amp; Landmark *
                  </label>
                  <input
                    id="address-input"
                    name="address"
                    type="text"
                    placeholder="123 Park Street, Apartment 4B"
                    value={fields.address}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none ${
                      errors.address ? 'border-red-500' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                      City *
                    </label>
                    <input
                      id="city-input"
                      name="city"
                      type="text"
                      placeholder="Mumbai"
                      value={fields.city}
                      onChange={handleChange}
                      className={`w-full bg-white border rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none ${
                        errors.city ? 'border-red-500' : 'border-neutral-300 focus:border-neutral-900'
                      }`}
                    />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="pincode-input" className="block text-xs uppercase font-semibold text-neutral-500 mb-1">
                      Pincode *
                    </label>
                    <input
                      id="pincode-input"
                      name="pincode"
                      type="text"
                      inputMode="numeric"
                      placeholder="400001"
                      value={fields.pincode}
                      onChange={handleChange}
                      className={`w-full bg-white border rounded-xl px-4 py-3 text-body-sm text-neutral-900 focus:outline-none ${
                        errors.pincode ? 'border-red-500' : 'border-neutral-300 focus:border-neutral-900'
                      }`}
                    />
                    {errors.pincode && <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Payment Method Section */}
            <section className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="pb-3 border-b border-neutral-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent" />
                <h2 className="text-body font-semibold text-neutral-900">3. Select Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-semibold text-body-sm">
                    <Banknote className={`w-5 h-5 ${paymentMethod === 'Cash on Delivery' ? 'text-accent' : 'text-neutral-500'}`} />
                    <span>Cash on Delivery</span>
                  </div>
                  <p className={`text-xs mt-1 ${paymentMethod === 'Cash on Delivery' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Pay cash upon delivery at your doorstep
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Pay Online')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'Pay Online'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-semibold text-body-sm">
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'Pay Online' ? 'text-accent' : 'text-neutral-500'}`} />
                    <span>Pay Online</span>
                  </div>
                  <p className={`text-xs mt-1 ${paymentMethod === 'Pay Online' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    UPI, Credit/Debit Card, Net Banking
                  </p>
                </button>
              </div>
            </section>

            {/* Place Order Button */}
            <div className="pt-4 border-t border-neutral-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-body flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Place Order • ₹{estimatedTotal.toLocaleString()}</span>
                )}
              </button>
            </div>
          </form>

          {/* Sticky Summary Side / Collapsible on Mobile */}
          <aside className="lg:col-span-5 space-y-4">
            {/* Mobile Collapsible Header */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setIsSummaryOpen((prev) => !prev)}
                className="w-full p-4 bg-white border border-neutral-200 rounded-xl flex items-center justify-between font-semibold text-body-sm text-neutral-900"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  <span>Order Summary ({items.length} items)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>₹{estimatedTotal.toLocaleString()}</span>
                  {isSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
            </div>

            {/* Summary Content Body */}
            <div className={`bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-xs ${
              isSummaryOpen ? 'block' : 'hidden lg:block'
            } sticky top-24`}>
              <h2 className="text-body font-semibold text-neutral-900 pb-3 border-b border-neutral-200">
                Order Items
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map(({ id, product, quantity, selectedColor }) => (
                  <div key={id} className="flex items-center gap-3 py-1">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-neutral-900 truncate">{product.name}</p>
                      <p className="text-xs text-neutral-500">Qty: {quantity} {selectedColor && `· ${selectedColor}`}</p>
                    </div>
                    <span className="text-body-sm font-semibold text-neutral-900">
                      ₹{(product.selling_price * quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-800">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-body font-semibold text-neutral-900">
                  <span>Total Amount</span>
                  <span className="text-h2">₹{estimatedTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 text-xs text-neutral-500 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Purchase Guarantee</span>
                </div>
                <p>30-day returns and replacement warranty included.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;
