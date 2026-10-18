import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowLeft, Lock, X } from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/auth/AuthForm';
import { submitOrder } from '../lib/checkout';
import { formatINR } from '../lib/currency';
import { CrossSellSection } from '../components/cart/CrossSellSection';
import { Logo } from '../components/ui/Logo';

const LOCAL_STORAGE_USER_KEY = 'wrapstore_checkout_user_v2';

export function CheckoutPage() {
  const { products } = useProductsContext();
  const { clearCart } = useCart();
  const { items, subtotal, shippingFee, estimatedTotal } = useHydratedCart(products);
  const navigate = useNavigate();

  // Load details from localStorage for returning visitors
  const [fields, setFields] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read checkout fields:', e);
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  // Remember details for returning visitors
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fields));
    } catch (e) {
      console.warn('Could not save checkout fields:', e);
    }
  }, [fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!fields.name.trim()) {
      errs.name = 'Full name is required';
    }

    const cleanPhone = fields.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Valid 10-digit mobile number required';
    }

    if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errs.email = 'Valid email address required';
    }

    if (!fields.address.trim()) {
      errs.address = 'Delivery address is required';
    }

    if (!fields.city.trim()) {
      errs.city = 'City is required';
    }

    const cleanPincode = fields.pincode.replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      errs.pincode = 'Valid 6-digit PIN code required';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        contact: {
          name: fields.name.trim(),
          phone: fields.phone.trim(),
          email: fields.email.trim(),
        },
        delivery: {
          address: fields.address.trim(),
          city: fields.city.trim(),
          pincode: fields.pincode.trim(),
        },
        items: items.map((line) => ({
          productId: line.product.id,
          name: line.product.name,
          mobile_model: line.selected_model || 'Universal',
          selected_model: line.selected_model || 'Universal',
          color: line.selected_color,
          price: line.product.selling_price,
          quantity: line.quantity,
          image: line.product.image_url,
        })),
        subtotal,
        shippingFee,
        total: estimatedTotal,
      };

      const result = await submitOrder(orderPayload);

      if (result.success) {
        clearCart();
        navigate('/order-confirmation', { state: { order: result.order } });
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Reduced Header: Logo and 'Back to bag' only */}
      <header className="w-full bg-[#FAFAF9] border-b border-[#E5E5E3] h-[64px] flex items-center px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between">
          <Link to="/" aria-label="WrapStore Home">
            <Logo size="md" />
          </Link>

          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to bag</span>
          </Link>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-10">
        
        {/* Mobile Collapsible Order Summary Bar */}
        <div className="lg:hidden bg-white border border-[#E5E5E3] rounded-[6px] p-4">
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-[14px] font-semibold text-[#141414]"
          >
            <span className="flex items-center gap-2">
              <span>Order summary ({items.length} items)</span>
              <ChevronDown
                className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                  isMobileSummaryOpen ? 'rotate-180' : ''
                }`}
              />
            </span>
            <span className="text-[#B0521F]">{formatINR(estimatedTotal)}</span>
          </button>

          {isMobileSummaryOpen && (
            <div className="mt-4 pt-4 border-t border-[#E5E5E3] space-y-3">
              {items.map((line) => (
                <div key={line.id} className="flex justify-between text-[14px]">
                  <div>
                    <p className="font-semibold text-[#141414]">{line.product.name}</p>
                    <p className="text-[12px] text-[#6B6B6B]">
                      Qty {line.quantity} {line.selected_model && `• ${line.selected_model}`}
                    </p>
                  </div>
                  <span className="font-semibold text-[#141414]">
                    {formatINR(line.product.selling_price * line.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#E5E5E3] flex justify-between text-[14px] font-semibold">
                <span>Total</span>
                <span>{formatINR(estimatedTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Guest Contact, Delivery, Payment */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            
            {/* Contact Section */}
            <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-[#141414]">
                  Contact
                </h2>
                {!user ? (
                  <p className="text-[13px] text-[#6B6B6B]">
                    Have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="font-medium text-[#B0521F] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                ) : (
                  <span className="text-[13px] text-[#6B6B6B]">
                    Signed in as <strong className="text-[#141414] font-medium">{user.email}</strong>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-[14px] font-medium text-[#141414] mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={fields.name}
                    onChange={handleChange}
                    className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                      errors.name ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                    }`}
                  />
                  {errors.name && <p className="text-[12px] text-[#B0521F] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[14px] font-medium text-[#141414] mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    placeholder="9876543210"
                    value={fields.phone}
                    onChange={handleChange}
                    className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                      errors.phone ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                    }`}
                  />
                  {errors.phone && <p className="text-[12px] text-[#B0521F] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-[14px] font-medium text-[#141414] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={fields.email}
                    onChange={handleChange}
                    className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                  {errors.email && <p className="text-[12px] text-[#B0521F] mt-1">{errors.email}</p>}
                </div>
              </div>
            </section>

            {/* Delivery Section */}
            <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-4">
              <h2 className="text-[20px] font-semibold text-[#141414]">
                Delivery Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-[14px] font-medium text-[#141414] mb-1">
                    Street Address, House / Flat No. *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={fields.address}
                    onChange={handleChange}
                    className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                      errors.address ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                    }`}
                  />
                  {errors.address && <p className="text-[12px] text-[#B0521F] mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-[14px] font-medium text-[#141414] mb-1">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={fields.city}
                      onChange={handleChange}
                      className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                        errors.city ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                      }`}
                    />
                    {errors.city && <p className="text-[12px] text-[#B0521F] mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-[14px] font-medium text-[#141414] mb-1">
                      6-digit PIN Code *
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      placeholder="636701"
                      value={fields.pincode}
                      onChange={handleChange}
                      className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                        errors.pincode ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                      }`}
                    />
                    {errors.pincode && <p className="text-[12px] text-[#B0521F] mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Section: One Plain Line Only */}
            <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 space-y-3">
              <h2 className="text-[20px] font-semibold text-[#141414]">
                Payment
              </h2>
              <div className="p-4 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#6B6B6B] shrink-0" />
                <p className="text-[14px] text-[#141414] font-normal leading-normal">
                  Pay securely online by UPI, card, net banking or wallet
                </p>
              </div>
            </section>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full min-h-[48px] px-6 py-3 bg-[#B0521F] hover:bg-[#994518] text-white text-[16px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing online payment...</span>
                ) : (
                  <span>Pay {formatINR(estimatedTotal)} Online</span>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Order Summary (Desktop Sticky) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24">
            <div className="bg-white border border-[#E5E5E3] rounded-[6px] subtle-elevation p-6 space-y-5">
              <h2 className="text-[20px] font-semibold text-[#141414] pb-3 border-b border-[#E5E5E3]">
                Order Summary
              </h2>

              {/* Items List */}
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {items.map((line) => (
                  <div key={line.id} className="flex gap-3 text-[14px]">
                    <div className="w-14 aspect-[4/5] bg-[#FAFAF9] rounded-[6px] overflow-hidden border border-[#E5E5E3] shrink-0">
                      <img
                        src={line.product.image_url}
                        alt={line.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#141414] truncate">{line.product.name}</p>
                      <p className="text-[12px] text-[#6B6B6B]">
                        Qty: {line.quantity} {line.selected_model && `• ${line.selected_model}`}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B]">
                        {formatINR(line.product.selling_price)} each
                      </p>
                    </div>
                    <span className="font-semibold text-[#141414]">
                      {formatINR(line.product.selling_price * line.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="pt-4 border-t border-[#E5E5E3] space-y-2 text-[14px]">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span>
                  <span className="text-[#141414] font-semibold">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Shipping</span>
                  <span className="text-[#141414] font-semibold">
                    {shippingFee === 0 ? 'Free' : formatINR(shippingFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#E5E5E3] flex justify-between text-[16px] font-semibold text-[#141414]">
                  <span>Total</span>
                  <span className="text-[#B0521F]">{formatINR(estimatedTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keep the "Complete the ecosystem" row */}
        <CrossSellSection />
      </main>

      {/* Sign In Dialog for Checkout */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-auth-title"
        >
          <div className="bg-white rounded-[6px] border border-[#E5E5E3] max-w-[460px] w-full p-6 sm:p-8 shadow-xl relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute right-4 top-4 text-[#6B6B6B] hover:text-[#141414] p-1 rounded cursor-pointer"
              aria-label="Close sign in dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="checkout-auth-title" className="font-display text-[24px] font-normal text-[#141414] mb-1">
              Sign in to WrapStore
            </h3>
            <p className="text-[13px] text-[#6B6B6B] mb-5">
              Your typed checkout details will be preserved.
            </p>

            <AuthForm
              onSuccess={() => {
                setIsAuthModalOpen(false);
              }}
              returnTo="/checkout"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
