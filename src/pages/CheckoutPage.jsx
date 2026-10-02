import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, CreditCard,
  Banknote, ChevronDown, ChevronUp,
  ShieldCheck, ArrowLeft, Loader2, Package, Check
} from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { submitOrder } from '../lib/checkout';
import { formatINR } from '../lib/currency';
import { Button } from '../components/ui/Button';
import { CrossSellSection } from '../components/cart/CrossSellSection';

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

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      errs.phone = '10-digit mobile phone number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit phone number';
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
      errs.pincode = 'Valid 6-digit PIN code is required';
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
      <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
          <Package className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-display font-semibold text-neutral-900 tracking-tight">Your bag is empty</h1>
          <p className="text-body text-neutral-500">Please add items to your cart before proceeding to checkout.</p>
        </div>
        <div>
          <Link to="/">
            <Button variant="primary" size="lg" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Catalog
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-base min-h-screen py-8 sm:py-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white px-4 py-3 shadow-modal border border-neutral-800 flex items-center gap-2.5 rounded-lg animate-fade-in text-[13px] font-medium">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          {/* Back Link */}
          <div className="mb-6">
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-body font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bag</span>
            </Link>
          </div>

          {/* Title */}
          <div className="mb-8 border-b border-neutral-200 pb-6">
            <span className="text-caption uppercase text-neutral-500 font-semibold tracking-wider block">
              Express Checkout
            </span>
            <h1 className="text-display font-semibold text-neutral-900 tracking-tight mt-1">Checkout</h1>
            <p className="text-body text-neutral-500 mt-1">Provide your shipping address and preferred payment method.</p>
          </div>

          {/* Layout: Single Column Form + Sticky Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="lg:col-span-7 space-y-8 bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 shadow-card"
            >
              {/* 1. Contact Section */}
              <section className="space-y-4">
                <div className="pb-3 border-b border-neutral-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-700" />
                  <h2 className="text-subheading font-semibold text-neutral-900">1. Contact Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                      Full Name *
                    </label>
                    <input
                      id="name-input"
                      name="name"
                      type="text"
                      autoFocus
                      placeholder="e.g. John Doe"
                      value={fields.name}
                      onChange={handleChange}
                      className={`w-full bg-base border rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                        errors.name ? 'border-accent' : 'border-neutral-300 focus:border-neutral-900'
                      }`}
                    />
                    {errors.name && <p className="text-caption text-accent mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                        Mobile Number *
                      </label>
                      <input
                        id="phone-input"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="9876543210"
                        value={fields.phone}
                        onChange={handleChange}
                        className={`w-full bg-base border rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                          errors.phone ? 'border-accent' : 'border-neutral-300 focus:border-neutral-900'
                        }`}
                      />
                      {errors.phone && <p className="text-caption text-accent mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="email-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                        Email Address (Optional)
                      </label>
                      <input
                        id="email-input"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={fields.email}
                        onChange={handleChange}
                        className={`w-full bg-base border rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                          errors.email ? 'border-accent' : 'border-neutral-300 focus:border-neutral-900'
                        }`}
                      />
                      {errors.email && <p className="text-caption text-accent mt-1">{errors.email}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Delivery Section */}
              <section className="space-y-4 pt-4 border-t border-neutral-200">
                <div className="pb-3 border-b border-neutral-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-700" />
                  <h2 className="text-subheading font-semibold text-neutral-900">2. Delivery Address</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="address-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                      Flat / House No., Street, Landmark *
                    </label>
                    <input
                      id="address-input"
                      name="address"
                      type="text"
                      placeholder="e.g. 102, Sunrise Apts, 5th Main Road"
                      value={fields.address}
                      onChange={handleChange}
                      className={`w-full bg-base border rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                        errors.address ? 'border-accent' : 'border-neutral-300 focus:border-neutral-900'
                      }`}
                    />
                    {errors.address && <p className="text-caption text-accent mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                        City *
                      </label>
                      <input
                        id="city-input"
                        name="city"
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={fields.city}
                        onChange={handleChange}
                        className={`w-full bg-base border rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                          errors.city ? 'border-accent' : 'border-neutral-300 focus:border-neutral-900'
                        }`}
                      />
                      {errors.city && <p className="text-caption text-accent mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="pincode-input" className="block text-caption uppercase font-semibold text-neutral-500 mb-1.5 tracking-wider">
                        PIN Code *
                      </label>
                      <input
                        id="pincode-input"
                        name="pincode"
                        type="text"
                        inputMode="numeric"
                        placeholder="400001"
                        value={fields.pincode}
                        onChange={handleChange}
                        className={`w-full bg-base border rounded-lg px-3.5 py-2.5 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                          errors.pincode ? 'border-accent' : 'border-neutral-300 focus:border-neutral-900'
                        }`}
                      />
                      {errors.pincode && <p className="text-caption text-accent mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Payment Method Section */}
              <section className="space-y-4 pt-4 border-t border-neutral-200">
                <div className="pb-3 border-b border-neutral-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-neutral-700" />
                  <h2 className="text-subheading font-semibold text-neutral-900">3. Payment Selection</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash on Delivery')}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      paymentMethod === 'Cash on Delivery'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-body">
                      <Banknote className={`w-4 h-4 ${paymentMethod === 'Cash on Delivery' ? 'text-white' : 'text-neutral-600'}`} />
                      <span>Cash on Delivery</span>
                    </div>
                    <p className={`text-caption mt-1 ${paymentMethod === 'Cash on Delivery' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Pay when your package arrives at your doorstep
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Pay Online')}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      paymentMethod === 'Pay Online'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-body">
                      <CreditCard className={`w-4 h-4 ${paymentMethod === 'Pay Online' ? 'text-white' : 'text-neutral-600'}`} />
                      <span>Pay Online</span>
                    </div>
                    <p className={`text-caption mt-1 ${paymentMethod === 'Pay Online' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Instant UPI, Cards, Net Banking
                    </p>
                  </button>
                </div>
              </section>

              {/* Place Order Button */}
              <div className="pt-4 border-t border-neutral-200">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  isFullWidth
                  isLoading={isSubmitting}
                >
                  Place Order • {formatINR(estimatedTotal)}
                </Button>
              </div>
            </form>

            {/* Sticky Summary Side / Collapsible on Mobile */}
            <aside className="lg:col-span-5 space-y-4">
              {/* Mobile Collapsible Header */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsSummaryOpen((prev) => !prev)}
                  className="w-full p-4 bg-white border border-neutral-200 rounded-lg flex items-center justify-between font-semibold text-body text-neutral-900 shadow-card"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-600" />
                    <span>Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatINR(estimatedTotal)}</span>
                    {isSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
              </div>

              {/* Summary Content Body */}
              <div
                className={`bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-card ${
                  isSummaryOpen ? 'block' : 'hidden lg:block'
                } sticky top-28`}
              >
                <h2 className="text-caption uppercase font-semibold text-neutral-900 pb-3 border-b border-neutral-200 tracking-wider">
                  Order Items
                </h2>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-neutral-100">
                  {items.map(({ id, product, quantity }) => (
                    <div key={id} className="flex items-center gap-3 pt-3 first:pt-0">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-15 aspect-[4/5] object-cover rounded-lg bg-neutral-100 shrink-0 border border-neutral-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-semibold text-neutral-900 truncate">{product.name}</p>
                        <p className="text-caption text-neutral-500">
                          Qty: {quantity}
                        </p>
                      </div>
                      <span className="text-body font-semibold text-neutral-900">
                        {formatINR(product.selling_price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-neutral-200 space-y-2 text-caption text-neutral-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-neutral-900">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-neutral-900">
                      {shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between text-body font-semibold text-neutral-900">
                    <span>Total Amount</span>
                    <span className="text-section font-semibold text-accent">{formatINR(estimatedTotal)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200 text-caption text-neutral-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <p>30-day exchange and replacement coverage included.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Cross-Sell Section: "Complete the ecosystem" on Checkout */}
        <CrossSellSection
          onAdded={(prod) => showToast(`Added "${prod.name}" to your order.`)}
        />
      </div>
    </main>
  );
}

export default CheckoutPage;
