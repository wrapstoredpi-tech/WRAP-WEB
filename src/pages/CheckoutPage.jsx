import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowLeft, Lock, X, ShieldCheck, Truck, Check } from 'lucide-react';
import { useCart, useHydratedCart } from '../context/CartContext';
import { useProductsContext } from '../context/ProductsContext';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/auth/AuthForm';
import { submitOrder } from '../lib/checkout';
import { formatINR } from '../lib/currency';
import { policies, INDIAN_STATES, getShippingFee, getCourierPartner } from '../config/policies';
import { setPageMeta } from '../lib/seo';
import { ComboIncludedItems } from '../components/cart/ComboIncludedItems';

const LOCAL_STORAGE_USER_KEY = 'wrapstore_checkout_user_v2';

export function CheckoutPage() {
  const { products } = useProductsContext();
  const { clearCart } = useCart();
  const { items, subtotal } = useHydratedCart(products);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    setPageMeta({
      title: 'Checkout | WrapStore',
      description: 'Complete your WrapStore order securely online.',
    });
  }, []);

  // Load details from localStorage for returning visitors
  const [fields, setFields] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let initialSavedState = parsed.state;
        if (!initialSavedState && parsed.address) {
          for (const st of INDIAN_STATES) {
            if (new RegExp(`\\b${st}\\b`, 'i').test(parsed.address)) {
              initialSavedState = st;
              break;
            }
          }
        }
        return {
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          address: parsed.address || '',
          city: parsed.city || '',
          state: initialSavedState || 'Tamil Nadu',
          pincode: parsed.pincode || '',
        };
      }
    } catch (e) {
      console.warn('Could not read checkout fields:', e);
    }
    return {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  // Prefill Google name and email if signed in, keeping typed details intact
  useEffect(() => {
    if (user) {
      setFields((prev) => {
        const meta = user.user_metadata || {};
        const googleName = meta.full_name || meta.name || '';
        const userEmail = user.email || '';
        return {
          ...prev,
          name: prev.name.trim() ? prev.name : googleName,
          email: prev.email.trim() ? prev.email : userEmail,
        };
      });
    }
  }, [user]);

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

    if (!fields.state || !INDIAN_STATES.includes(fields.state)) {
      errs.state = 'Please select a valid state';
    }

    const cleanPincode = fields.pincode.replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      errs.pincode = 'Valid 6-digit PIN code required';
    }

    return errs;
  };

  const currentShippingFee = items.length === 0 ? 0 : getShippingFee(fields.state);
  const currentCourier = getCourierPartner(fields.state);
  const checkoutTotal = subtotal + currentShippingFee;

  // Calculate total savings (MRP minus selling price)
  const totalSavings = useMemo(() => {
    return items.reduce((acc, line) => {
      const mrp = Number(line.product.mrp || line.product.raw_mrp || line.product.original_value || 0);
      const sp = Number(line.product.selling_price || 0);
      if (mrp > sp) {
        return acc + (mrp - sp) * line.quantity;
      }
      return acc;
    }, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, line) => acc + line.quantity, 0);
  }, [items]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      // Scroll to the first error
      const firstErrorKey = Object.keys(formErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
          state: fields.state.trim() || 'Tamil Nadu',
          pincode: fields.pincode.trim(),
        },
        shipping_state: fields.state.trim() || 'Tamil Nadu',
        shippingFee: currentShippingFee,
        courier_partner: currentCourier,
        items: items.map((line) => ({
          productId: line.product.id,
          name: line.product.name,
          mobile_model: line.selected_model || 'Universal',
          selected_model: line.selected_model || 'Universal',
          color: line.selected_color,
          price: line.product.selling_price,
          quantity: line.quantity,
          image: line.product.image_url,
          is_combo: line.product.is_combo || false,
          combo_items: line.components || line.product.combo_items || [],
          product: line.product,
        })),
        subtotal,
        total: checkoutTotal,
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

  const cleanPincode = (fields.pincode || '').replace(/\D/g, '');
  const pincodePrefix = parseInt(cleanPincode.slice(0, 3), 10);
  const isTnPincode = !isNaN(pincodePrefix) && pincodePrefix >= 600 && pincodePrefix <= 643;
  const showTnPincodeHint = fields.state === 'Tamil Nadu' && cleanPincode.length >= 3 && !isTnPincode;

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between">
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-4 bg-white border border-[#E5E5E3] rounded-[6px] p-8 shadow-2xs">
            <div className="w-12 h-12 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center mx-auto text-[#6B6B6B]">
              <Lock className="w-6 h-6 text-[#141414]" />
            </div>
            <h1 className="font-serif text-[28px] text-[#141414]">
              Your bag is empty
            </h1>
            <p className="text-[14px] text-[#6B6B6B]">
              There are no items to check out. Add products to your bag to proceed.
            </p>
            <div className="pt-2">
              <Link
                to="/cases"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#B0521F] text-white text-[14px] font-semibold rounded-[6px] hover:bg-[#964317] transition-colors shadow-sm"
              >
                Find your model
              </Link>
            </div>
          </div>
        </main>

        {/* Small Footer */}
        <footer className="w-full border-t border-[#E5E5E3] py-6 text-center text-[12px] text-[#6B6B6B]">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/shipping-policy" className="hover:text-[#141414] transition-colors">
              Shipping policy
            </Link>
            <Link to="/returns-and-refunds" className="hover:text-[#141414] transition-colors">
              Returns and refunds
            </Link>
            <Link to="/contact" className="hover:text-[#141414] transition-colors">
              Contact
            </Link>
            <Link to="/privacy-policy" className="hover:text-[#141414] transition-colors">
              Privacy policy
            </Link>
            <Link to="/terms" className="hover:text-[#141414] transition-colors">
              Terms and conditions
            </Link>
          </div>
          <p className="mt-2 text-[11px] text-[#737373]">
            © {new Date().getFullYear()} WrapStore. 100% online payment via Razorpay. Dharmapuri, Tamil Nadu.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between">
      {/* ───────────────────────────────────────────────────────────────────────────
          CHECKOUT MAIN CONTAINER (Part H One-Page Layout)
          - Centred "Checkout" title (display serif)
          - Numbered sections (1 Contact, 2 Delivery address, 3 Payment)
          - 1px vertical divider on desktop
          - Summary with colour, "Edit bag", "You save", shipping for chosen state, total
          - Mobile collapsible summary at top and sticky "Pay Rs X securely" bar
          - Sentence case headings ("Order summary")
          ─────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-32 lg:pb-16 select-none">
        
        {/* Centred Title in Display Serif */}
        <div className="text-center space-y-1">
          <h1 className="font-serif text-[32px] sm:text-[38px] text-[#141414] tracking-tight">
            Checkout
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            Review your order and enter delivery details
          </p>
        </div>

        {/* Mobile Collapsible Summary Bar (< lg) */}
        <div className="lg:hidden bg-white border border-[#E5E5E3] rounded-[6px] p-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-[14px] font-semibold text-[#141414] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>Order summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <ChevronDown
                className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                  isMobileSummaryOpen ? 'rotate-180' : ''
                }`}
              />
            </span>
            <span className="text-[#B0521F] font-semibold">{formatINR(checkoutTotal)}</span>
          </button>

          {isMobileSummaryOpen && (
            <div className="mt-4 pt-4 border-t border-[#E5E5E3] space-y-3">
              <div className="flex justify-end pb-1">
                <Link to="/cart" className="text-[12px] text-[#B0521F] underline font-medium">
                  Edit bag
                </Link>
              </div>

              {items.map((line) => {
                const itemMrp = Number(line.product.mrp || line.product.raw_mrp || line.product.original_value || 0);
                const hasItemDiscount = itemMrp > line.product.selling_price;

                return (
                  <div key={line.id} className="text-[13px] space-y-1.5 pb-2.5 border-b border-[#E5E5E3] last:border-b-0">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-14 bg-[#F4F3F0] rounded-[4px] border border-[#E5E5E3] overflow-hidden shrink-0">
                        <img
                          src={line.product.image_url}
                          alt={line.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#141414] truncate">{line.product.name}</p>
                        <p className="text-[11px] text-[#6B6B6B]">
                          Model: {line.selected_model || 'Universal'}
                          {line.selected_color && ` · ${line.selected_color}`}
                        </p>
                        <p className="text-[11px] text-[#6B6B6B]">Qty: {line.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-[#141414] block">
                          {formatINR(line.product.selling_price * line.quantity)}
                        </span>
                        {hasItemDiscount && (
                          <span className="text-[11px] text-[#6B6B6B] line-through block">
                            {formatINR(itemMrp * line.quantity)}
                          </span>
                        )}
                      </div>
                    </div>

                    {line.is_combo && Array.isArray(line.components) && line.components.length > 0 && (
                      <div className="pt-1">
                        <ComboIncludedItems
                          components={line.components}
                          comboQuantity={line.quantity}
                          selectedModel={line.selected_model}
                          comboName={line.product.name}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 border-t border-[#E5E5E3] space-y-2 text-[13px]">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span>
                  <span className="text-[#141414] font-semibold tabular-nums">{formatINR(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#B0521F]">
                    <span>You save</span>
                    <span className="font-semibold tabular-nums">{formatINR(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Shipping ({fields.state})</span>
                  <span className="text-[#141414] font-semibold tabular-nums">{formatINR(currentShippingFee)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-[#E5E5E3] text-[#141414] text-[15px]">
                  <span>Total</span>
                  <span className="text-[#B0521F] tabular-nums">{formatINR(checkoutTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Layout split by 1px vertical line on Desktop */}
        <div className="lg:grid lg:grid-cols-[1fr_1px_380px] xl:grid-cols-[1fr_1px_420px] gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Numbered Sections Form (1 Contact, 2 Delivery address, 3 Payment) */}
          <form ref={formRef} onSubmit={handleSubmit} className="w-full space-y-6">
            
            {/* 1. Contact */}
            <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#141414] text-white text-[12px] font-semibold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-[17px] font-semibold text-[#141414]">
                    Contact
                  </h2>
                </div>
                {!user ? (
                  <p className="text-[12px] text-[#6B6B6B]">
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
                  <span className="text-[12px] text-[#6B6B6B]">
                    Signed in as <strong className="text-[#141414] font-medium">{user.email}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-[13px] font-medium text-[#141414] mb-1">
                    Full name <span className="text-[#B0521F]">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fields.name}
                    onChange={handleChange}
                    className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                      errors.name ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                    }`}
                  />
                  {errors.name && <p className="text-[12px] text-[#B0521F] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[13px] font-medium text-[#141414] mb-1">
                    Phone number (10 digits) <span className="text-[#B0521F]">*</span>
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
                  <label htmlFor="email" className="block text-[13px] font-medium text-[#141414] mb-1">
                    Email address (optional)
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

            {/* 2. Delivery address */}
            <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2.5 border-b border-[#E5E5E3] pb-3">
                <span className="w-6 h-6 rounded-full bg-[#141414] text-white text-[12px] font-semibold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-[17px] font-semibold text-[#141414]">
                  Delivery address
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-[13px] font-medium text-[#141414] mb-1">
                    Street address, flat / house no. <span className="text-[#B0521F]">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    placeholder="Door number, street name, landmark"
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
                    <label htmlFor="city" className="block text-[13px] font-medium text-[#141414] mb-1">
                      City <span className="text-[#B0521F]">*</span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      placeholder="e.g. Dharmapuri"
                      value={fields.city}
                      onChange={handleChange}
                      className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] ${
                        errors.city ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                      }`}
                    />
                    {errors.city && <p className="text-[12px] text-[#B0521F] mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-[13px] font-medium text-[#141414] mb-1">
                      State <span className="text-[#B0521F]">*</span>
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={fields.state}
                      onChange={handleChange}
                      className={`w-full bg-[#FAFAF9] border rounded-[6px] px-3.5 py-2.5 min-h-[44px] text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] cursor-pointer ${
                        errors.state ? 'border-[#B0521F]' : 'border-[#E5E5E3]'
                      }`}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#6B6B6B]">
                      <span>
                        Shipping: <strong className="text-[#141414] font-semibold">{formatINR(currentShippingFee)}</strong>
                      </span>
                      <span>
                        {fields.state === policies.delivery.homeState || fields.state === 'Puducherry'
                          ? `Delivery: ${policies.delivery.tn.text}`
                          : `Delivery: ${policies.delivery.other.text.toLowerCase()}`}
                      </span>
                    </div>
                    {errors.state && <p className="text-[12px] text-[#B0521F] mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-[13px] font-medium text-[#141414] mb-1">
                    6-digit PIN code <span className="text-[#B0521F]">*</span>
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
                  {showTnPincodeHint && (
                    <p className="text-[12px] text-[#B0521F] mt-1 font-medium">
                      This PIN code does not look like Tamil Nadu. Please check your state.
                    </p>
                  )}
                  {errors.pincode && <p className="text-[12px] text-[#B0521F] mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </section>

            {/* 3. Payment */}
            <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#141414] text-white text-[12px] font-semibold flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-[17px] font-semibold text-[#141414]">
                    Payment
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-[#141414] bg-[#F4F3F0] border border-[#E5E5E3] px-2 py-0.5 rounded-[4px]">
                  Online prepaid only
                </span>
              </div>

              <div className="p-4 bg-[#FAFAF9] border border-[#141414] rounded-[6px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border-4 border-[#141414] bg-white flex items-center justify-center shrink-0" />
                    <span className="text-[14px] font-semibold text-[#141414]">
                      Razorpay Secure Checkout
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-[#141414]" />
                </div>
                <p className="text-[12px] text-[#6B6B6B] pl-6.5 leading-normal">
                  UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, Net Banking &amp; Wallets.
                </p>
                <div className="pl-6.5 pt-1">
                  <p className="text-[11px] text-[#6B6B6B]">
                    Payment is handled securely through Razorpay. Cash on delivery is not offered.
                  </p>
                </div>
              </div>

              <p className="text-[12px] text-[#6B6B6B] leading-relaxed pt-2">
                By placing this order you agree to our{' '}
                <Link to="/returns-and-refunds" className="text-[#B0521F] hover:underline font-medium">
                  cancellation, returns and refund policy
                </Link>
                : damaged or wrong items are replaced promptly.
              </p>

              {/* Desktop Pay Button */}
              <div className="pt-2 hidden lg:block">
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full h-[48px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white text-[15px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Connecting to Razorpay...'
                      : `Pay ${formatINR(checkoutTotal)} securely`}
                  </span>
                </button>
              </div>
            </section>
          </form>

          {/* MIDDLE: 1px Vertical Divider (Desktop only) */}
          <div className="hidden lg:block w-px bg-[#E5E5E3] self-stretch min-h-[500px]" aria-hidden="true" />

          {/* RIGHT COLUMN: Order Summary (Desktop Sticky) */}
          <div className="hidden lg:block lg:sticky lg:top-[96px] self-start space-y-4">
            <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
                <h2 className="text-[18px] font-semibold text-[#141414]">
                  Order summary
                </h2>
                <Link
                  to="/cart"
                  className="text-[12px] text-[#B0521F] hover:underline font-medium"
                >
                  Edit bag
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                {items.map((line) => {
                  const itemMrp = Number(line.product.mrp || line.product.raw_mrp || line.product.original_value || 0);
                  const hasItemDiscount = itemMrp > line.product.selling_price;

                  return (
                    <div key={line.id} className="text-[13px] space-y-1.5 pb-3 border-b border-[#E5E5E3] last:border-b-0">
                      <div className="flex gap-3">
                        <div className="w-14 h-16 bg-[#F4F3F0] rounded-[4px] border border-[#E5E5E3] overflow-hidden shrink-0">
                          <img
                            src={line.product.image_url}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#141414] truncate">{line.product.name}</p>
                          <p className="text-[11px] text-[#6B6B6B]">
                            Model: {line.selected_model || 'Universal'}
                            {line.selected_color && ` · ${line.selected_color}`}
                          </p>
                          <p className="text-[11px] text-[#6B6B6B]">
                            Qty: {line.quantity} × {formatINR(line.product.selling_price)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-[#141414] block">
                            {formatINR(line.product.selling_price * line.quantity)}
                          </span>
                          {hasItemDiscount && (
                            <span className="text-[11px] text-[#6B6B6B] line-through block">
                              {formatINR(itemMrp * line.quantity)}
                            </span>
                          )}
                        </div>
                      </div>

                      {line.is_combo && Array.isArray(line.components) && line.components.length > 0 && (
                        <div className="pt-1">
                          <ComboIncludedItems
                            components={line.components}
                            comboQuantity={line.quantity}
                            selectedModel={line.selected_model}
                            comboName={line.product.name}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-[#E5E5E3] space-y-2 text-[14px]">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="text-[#141414] font-semibold tabular-nums">{formatINR(subtotal)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#B0521F] font-medium">
                    <span>You save</span>
                    <span className="font-semibold tabular-nums">{formatINR(totalSavings)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#6B6B6B]">
                  <div>
                    <span className="block text-[#141414] font-medium">Shipping</span>
                    <span className="text-[11px] text-[#6B6B6B] block">
                      {fields.state} ({currentCourier})
                    </span>
                  </div>
                  <span className="text-[#141414] font-semibold tabular-nums">
                    {formatINR(currentShippingFee)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#E5E5E3] space-y-1">
                  <div className="flex justify-between text-[16px] font-semibold text-[#141414]">
                    <span>Total</span>
                    <span className="text-[20px] font-bold text-[#B0521F] tabular-nums">
                      {formatINR(checkoutTotal)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B]">Inclusive of all applicable taxes</p>
                </div>
              </div>

              {/* Delivery Note */}
              <div className="pt-3 border-t border-[#E5E5E3] flex items-center gap-2 text-[12px] text-[#6B6B6B]">
                <Truck className="w-4 h-4 text-[#141414] shrink-0" />
                <span>
                  {fields.state === policies.delivery.homeState || fields.state === 'Puducherry'
                    ? `${policies.delivery.tn.text} in ${fields.state}`
                    : `${policies.delivery.other.text.toLowerCase()} for ${fields.state}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar (< lg) */}
        <aside
          aria-label="Checkout action bar"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E5E3] p-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] lg:hidden shadow-lg select-none"
        >
          <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-[#6B6B6B] block">Total</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[18px] font-bold text-[#141414] tabular-nums">
                  {formatINR(checkoutTotal)}
                </span>
                <span className="text-[10px] text-[#6B6B6B]">incl. taxes</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || items.length === 0}
              onClick={() => handleSubmit()}
              className="h-[48px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white font-semibold text-[14px] rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Connecting...' : `Pay ${formatINR(checkoutTotal)} securely`}
              </span>
            </button>
          </div>
        </aside>
      </main>

      {/* Small Footer on Checkout Page (Rule 4) */}
      <footer className="w-full border-t border-[#E5E5E3] py-6 text-center text-[12px] text-[#6B6B6B]">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link to="/shipping-policy" className="hover:text-[#141414] transition-colors">
            Shipping policy
          </Link>
          <Link to="/returns-and-refunds" className="hover:text-[#141414] transition-colors">
            Returns and refunds
          </Link>
          <Link to="/contact" className="hover:text-[#141414] transition-colors">
            Contact
          </Link>
          <Link to="/privacy-policy" className="hover:text-[#141414] transition-colors">
            Privacy policy
          </Link>
          <Link to="/terms" className="hover:text-[#141414] transition-colors">
            Terms and conditions
          </Link>
        </div>
        <p className="mt-2 text-[11px] text-[#737373]">
          © {new Date().getFullYear()} WrapStore. 100% online payment via Razorpay. Dharmapuri, Tamil Nadu.
        </p>
      </footer>

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
              pendingAction={{ type: 'checkout' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
