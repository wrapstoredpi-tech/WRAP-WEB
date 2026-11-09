import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, User, LogOut, ArrowRight, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/currency';
import { groupOrderItems, CompactComboComponentList } from '../components/cart/OrderItemsList';

export function AccountPage() {
  const { user, firstName, isLoading, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'orders';
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const local = JSON.parse(localStorage.getItem('wrapstore_orders_v2') || '[]');
        const userEmail = (user?.email || '').toLowerCase().trim();
        const userPhone = (user?.user_metadata?.phone || '').replace(/\D/g, '');

        let matchedLocal = local.filter((o) => {
          const oEmail = (o.contact?.email || '').toLowerCase().trim();
          const oPhone = (o.contact?.phone || '').replace(/\D/g, '');
          return (userEmail && oEmail === userEmail) || (userPhone && oPhone && oPhone.includes(userPhone));
        });

        if (userEmail) {
          const { data: dbOrders } = await supabase
            .from('online_orders')
            .select('*, online_order_items(*)')
            .eq('customer_email', userEmail)
            .order('created_at', { ascending: false });

          if (dbOrders && dbOrders.length > 0) {
            const formattedDb = dbOrders.map((o) => ({
              order_number: o.order_number,
              orderId: o.order_number,
              createdAt: o.created_at,
              status: o.order_status,
              total: o.grand_total,
              items: (o.online_order_items || []).map((it) => ({
                name: it.product_name,
                price: it.unit_price,
                quantity: it.quantity,
                selected_model: it.mobile_model,
                combo_id: it.combo_id,
                combo_name: it.combo_name,
                is_combo: it.is_combo || it.product_type === 'combo',
                components: it.combo_components || [],
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
  }, [user]);


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

  if (isLoading || !user) {
    return (
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || firstName || 'User';

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16">
      
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E3] mb-8">
        <div>
          <h1 className="font-display font-normal text-[28px] sm:text-[34px] text-[#141414] tracking-[-0.01em]">
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
                                    Qty {item.quantity} {item.selected_model && ('• ' + item.selected_model)}
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
              <h2 className="text-[18px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-3">
                Saved Delivery Addresses
              </h2>
              <div className="p-8 text-center bg-[#FAFAF9] rounded-[6px] border border-[#E5E5E3] space-y-2">
                <MapPin className="w-8 h-8 text-[#6B6B6B] mx-auto" />
                <p className="text-[14px] text-[#6B6B6B]">
                  Your delivery address will be securely saved when you complete your next order at checkout.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-[18px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-3">
                Profile Details
              </h2>
              <div className="space-y-4 max-w-md text-[14px]">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Full Name
                  </label>
                  <p className="text-[15px] font-medium text-[#141414]">{fullName}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Email Address
                  </label>
                  <p className="text-[15px] font-medium text-[#141414]">{user.email}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Account ID
                  </label>
                  <p className="text-[13px] font-mono text-[#8C8C8C]">{user.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AccountPage;
