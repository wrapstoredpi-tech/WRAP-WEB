import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, User, LogOut, ArrowRight, Heart, Check, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/currency';
import { groupOrderItems, CompactComboComponentList } from '../components/cart/OrderItemsList';

export function AccountPage() {
  const { user, customerProfile, firstName, isLoading, signOut, updateCustomerProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'orders';
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Address Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState('');
  const [addressErr, setAddressErr] = useState('');

  // Sync initial profile values
  useEffect(() => {
    if (customerProfile) {
      setEditFullName(customerProfile.full_name || '');
      setEditPhone(customerProfile.phone || '');
      const addr = customerProfile.default_shipping_address || {};
      setAddressLine1(addr.line1 || '');
      setAddressLine2(addr.line2 || '');
      setAddressCity(addr.city || '');
      setAddressState(addr.state || '');
      setAddressPincode(addr.postal_code || addr.pincode || '');
    } else if (user) {
      const meta = user.user_metadata || {};
      setEditFullName(meta.full_name || meta.name || '');
      setEditPhone(meta.phone || user.phone || '');
    }
  }, [customerProfile, user]);

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const local = JSON.parse(localStorage.getItem('wrapstore_orders_v2') || '[]');
        const userEmail = (user?.email || '').toLowerCase().trim();
        const userPhone = (customerProfile?.phone || user?.user_metadata?.phone || '').replace(/\D/g, '');

        let matchedLocal = local.filter((o) => {
          const oEmail = (o.contact?.email || '').toLowerCase().trim();
          const oPhone = (o.contact?.phone || '').replace(/\D/g, '');
          return (userEmail && oEmail === userEmail) || (userPhone && oPhone && oPhone.includes(userPhone));
        });

        const queryFilters = [];
        if (userEmail) queryFilters.push(`customer_email.eq.${userEmail}`);
        if (userPhone) queryFilters.push(`customer_phone.eq.${userPhone}`);

        if (queryFilters.length > 0) {
          const { data: dbOrders } = await supabase
            .from('online_orders')
            .select('*, online_order_items(*)')
            .or(queryFilters.join(','))
            .order('created_at', { ascending: false });

          if (dbOrders && dbOrders.length > 0) {
            const formattedDb = dbOrders.map((o) => ({
              id: o.id,
              order_number: o.order_number,
              orderId: o.order_number,
              createdAt: o.created_at,
              status: o.order_status,
              total: o.grand_total,
              items: (o.online_order_items || []).map((it) => ({
                name: it.product_name,
                product_name: it.product_name,
                product_id_code: it.product_id_code,
                product_id: it.product_id,
                price: Number(it.unit_price || 0),
                unit_price: Number(it.unit_price || 0),
                quantity: it.quantity,
                line_total: Number(it.line_total || 0),
                selected_model: it.mobile_model,
                mobile_model: it.mobile_model,
                is_combo: it.product_type === 'combo',
              })),
            }));

            const seen = new Set();
            const merged = [];
            [...formattedDb, ...matchedLocal].forEach((ord) => {
              const num = ord.order_number || ord.orderId;
              if (num && !seen.has(num)) {
                seen.add(num);
                merged.push(ord);
              }
            });
            setUserOrders(merged);
            setLoadingOrders(false);
            return;
          }
        }

        setUserOrders(matchedLocal);
      } catch (e) {
        console.warn('Error loading user orders:', e);
      } finally {
        setLoadingOrders(false);
      }
    }

    if (user) {
      loadOrders();
    }
  }, [user, customerProfile]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login?returnTo=/account', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    if (!editFullName.trim()) {
      setProfileErr('Please enter your full name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateCustomerProfile({
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
      });
      setProfileMsg('Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (err) {
      setProfileErr(err.message || 'Unable to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressMsg('');
    setAddressErr('');

    if (!addressLine1.trim() || !addressCity.trim() || !addressState.trim()) {
      setAddressErr('Please fill in line 1, city, and state.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const newAddress = {
        line1: addressLine1.trim(),
        line2: addressLine2.trim(),
        city: addressCity.trim(),
        state: addressState.trim(),
        postal_code: addressPincode.trim(),
        country: 'India',
      };
      await updateCustomerProfile({
        default_shipping_address: newAddress,
      });
      setAddressMsg('Saved delivery address updated successfully.');
      setIsEditingAddress(false);
    } catch (err) {
      setAddressErr(err.message || 'Unable to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  if (isLoading || !user) {
    return (
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const meta = user.user_metadata || {};
  const displayFullName = customerProfile?.full_name || meta.full_name || meta.name || firstName || 'User';
  const displayPhone = customerProfile?.phone || meta.phone || 'Not provided';
  const savedAddress = customerProfile?.default_shipping_address || {};
  const hasSavedAddress = Boolean(savedAddress.line1 && savedAddress.city);

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16">
      
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E3] mb-8">
        <div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold text-[#141414] tracking-[-0.025em]">
            Hello, {firstName || 'there'}
          </h1>
          <p className="font-sans text-[14px] text-[#6B6B6B]">
            {user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5E3] hover:border-[#141414] text-[14px] font-semibold text-[#141414] rounded-[6px] transition-colors self-start cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#B0521F]" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Tabs (Sidebar) */}
        <div className="md:col-span-4 bg-white border border-[#E5E5E3] rounded-[6px] p-2 space-y-1">
          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-[#FAFAF9]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders</span>
          </button>

          <Link
            to="/favorites"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[4px] text-[14px] font-medium transition-colors text-left text-[#141414] hover:bg-[#FAFAF9]"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-[#DC2626]" />
              <span>My Favourites</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </Link>

          <button
            type="button"
            onClick={() => handleTabChange('addresses')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-[#FAFAF9]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved addresses</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-[#FAFAF9]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile details</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-8 bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8">
          
          {/* TAB 1: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                <h2 className="text-[18px] font-semibold text-[#141414]">Order History</h2>
                <Link
                  to="/track-order"
                  className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1"
                >
                  <span>Track specific order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingOrders ? (
                <div className="p-8 text-center text-[#737373] text-[14px]">
                  Loading order history...
                </div>
              ) : userOrders.length > 0 ? (
                <div className="space-y-4">
                  {userOrders.map((ord, oIdx) => {
                    const grouped = groupOrderItems(ord.items || []);
                    return (
                      <div key={ord.order_number || oIdx} className="bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E3] pb-3 text-[13px]">
                          <div>
                            <span className="font-semibold text-[#141414]">Order #{ord.order_number}</span>
                            {ord.createdAt && (
                              <span className="text-[#737373] ml-2 block sm:inline">
                                {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#E5E5E3] text-[#141414]">
                              {ord.status || 'Confirmed'}
                            </span>
                            <span className="font-bold text-[#141414] tabular-nums">
                              {formatINR(ord.total || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 pt-1 text-[13px]">
                          {grouped.map((item, iIdx) => (
                            <div key={iIdx} className="space-y-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-[#141414]">{item.name}</p>
                                  <p className="text-[12px] text-[#737373]">
                                    Qty {item.quantity} {item.selected_model && item.selected_model.toLowerCase() !== 'universal' && ('• ' + item.selected_model)}
                                  </p>
                                </div>
                                <span className="font-medium text-[#141414] tabular-nums">
                                  {formatINR((item.price || 0) * (item.quantity || 1))}
                                </span>
                              </div>

                              {item.is_combo && Array.isArray(item.components) && item.components.length > 0 && (
                                <CompactComboComponentList components={item.components} quantity={item.quantity} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] space-y-3">
                  <Package className="w-8 h-8 text-[#6B6B6B] mx-auto" />
                  <p className="text-[14px] text-[#6B6B6B]">
                    No recent online orders found for this email address.
                  </p>
                  <Link
                    to="/?category=Mobile%20Cases"
                    className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 bg-[#141414] text-white text-[13px] font-semibold rounded-[4px] hover:bg-[#383836] transition-colors"
                  >
                    Browse phone cases
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                <h2 className="text-[18px] font-semibold text-[#141414]">
                  Saved Delivery Addresses
                </h2>
                {!isEditingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#141414] hover:text-[#B0521F] cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{hasSavedAddress ? 'Edit address' : 'Add address'}</span>
                  </button>
                )}
              </div>

              {addressMsg && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-[6px] text-[13px] flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{addressMsg}</span>
                </div>
              )}
              {addressErr && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-[6px] text-[13px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addressErr}</span>
                </div>
              )}

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="House / Flat / Street address"
                      className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apartment, suite, landmark"
                      className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        placeholder="City"
                        className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        placeholder="State"
                        className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={addressPincode}
                      onChange={(e) => setAddressPincode(e.target.value)}
                      placeholder="600001"
                      className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-[#141414] text-white text-[13px] font-semibold rounded-[4px] hover:bg-[#383836] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAddress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-4 py-2 border border-[#E5E5E3] text-[#141414] text-[13px] font-semibold rounded-[4px] hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : hasSavedAddress ? (
                <div className="p-5 bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] space-y-1 text-[14px]">
                  <p className="font-semibold text-[#141414]">{displayFullName}</p>
                  <p className="text-[#404040]">{savedAddress.line1}</p>
                  {savedAddress.line2 && <p className="text-[#404040]">{savedAddress.line2}</p>}
                  <p className="text-[#404040]">
                    {savedAddress.city}, {savedAddress.state} {savedAddress.postal_code || savedAddress.pincode}
                  </p>
                  <p className="text-[#737373] text-[13px] pt-1">Default Shipping Address</p>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] space-y-2">
                  <MapPin className="w-8 h-8 text-[#6B6B6B] mx-auto" />
                  <p className="text-[14px] text-[#6B6B6B]">
                    No saved address yet. You can add one above or during checkout.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                <h2 className="text-[18px] font-semibold text-[#141414]">
                  Profile Details
                </h2>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#141414] hover:text-[#B0521F] cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit details</span>
                  </button>
                )}
              </div>

              {profileMsg && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-[6px] text-[13px] flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}
              {profileErr && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-[6px] text-[13px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileErr}</span>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] px-3.5 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Email Address (Locked)
                    </label>
                    <p className="text-[14px] text-[#737373] bg-[#F4F4F2] px-3.5 py-2 rounded-[6px] border border-[#E5E5E3]">
                      {user.email}
                    </p>
                    <span className="text-[11px] text-[#8C8C8C] mt-1 block">
                      Email address changes require authentication verification.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-[#141414] text-white text-[13px] font-semibold rounded-[4px] hover:bg-[#383836] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 border border-[#E5E5E3] text-[#141414] text-[13px] font-semibold rounded-[4px] hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 max-w-md text-[14px]">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Full Name
                    </label>
                    <p className="text-[15px] font-medium text-[#141414]">{displayFullName}</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Phone Number
                    </label>
                    <p className="text-[15px] font-medium text-[#141414]">{displayPhone}</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-medium text-[#141414]">{user.email}</p>
                      {customerProfile?.email_verified && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                      Account ID
                    </label>
                    <p className="text-[13px] font-mono text-[#8C8C8C]">{user.id}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AccountPage;
