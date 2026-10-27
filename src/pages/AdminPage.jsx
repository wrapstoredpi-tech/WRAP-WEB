import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProductsContext } from '../context/ProductsContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminHeroTab } from '../components/admin/AdminHeroTab';
import { AdminFeaturedTab } from '../components/admin/AdminFeaturedTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { supabase, supabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_ORDERS_KEY = 'wrapstore_orders_v2';

// Known demo order IDs to purge from any previous local test sessions
const DEMO_ORDER_IDS = new Set([
  'WS-892104',
  'WS-891942',
  'WS-890215',
  'WS-888430',
  'WS-123456',
]);

const DEMO_NAMES = new Set([
  'karthik subramanian',
  'ananya ramesh',
  'vigneshwaran p.',
  'priya sundaram',
  'john doe',
]);

/**
 * Filter out any mock/seed test orders so only genuine customer transactions exist.
 */
function isGenuineOrder(ord) {
  if (!ord || !ord.orderId) return false;
  if (DEMO_ORDER_IDS.has(ord.orderId)) return false;
  const name = (ord.contact?.name || '').trim().toLowerCase();
  if (DEMO_NAMES.has(name)) return false;
  if (name.includes('__') || name.includes('hero_slide') || name.includes('system')) return false;
  return true;
}

export function AdminPage() {
  const { products, refetch } = useProductsContext();

  // Authentication State
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const local = localStorage.getItem('wrapstore_admin_auth');
      if (local) return JSON.parse(local);
      const session = sessionStorage.getItem('wrapstore_admin_auth');
      if (session) return JSON.parse(session);
    } catch (e) {
      console.warn('Error reading admin session:', e);
    }
    return null;
  });

  // Auto-restore admin session from Supabase if active session exists and user has authorized profile
  useEffect(() => {
    if (adminUser || !supabaseConfigured || !supabase) return;

    let isMounted = true;
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error || !session?.user || !isMounted) return;

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const allowedRoles = ['super_admin', 'store_manager', 'admin'];
          if (
            profile &&
            profile.is_active !== false &&
            allowedRoles.includes((profile.role || '').toLowerCase())
          ) {
            const authData = {
              id: profile.id,
              email: profile.email || session.user.email,
              fullName: profile.full_name || 'Admin',
              role: profile.role || 'store_manager',
              avatarUrl: profile.avatar_url || null,
              authenticatedAt: new Date().toISOString(),
            };
            localStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
            if (isMounted) {
              setAdminUser(authData);
            }
          }
        } catch (err) {
          console.warn('[AdminPage] Auto-restore session check error:', err);
        }
      })
      .catch((err) => {
        console.warn('[AdminPage] getSession unexpected error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [adminUser]);

  // Background profile sync: If an admin is logged in with a profile ID, ensure account is still active
  useEffect(() => {
    if (!adminUser?.id || !supabaseConfigured || !supabase) return;

    let isMounted = true;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .maybeSingle()
      .then(({ data: profile, error }) => {
        if (!isMounted || error || !profile) return;

        // If deactivated in Supabase profiles, immediately revoke access
        if (profile.is_active === false) {
          console.warn('[AdminPage] Admin profile deactivated. Revoking session.');
          localStorage.removeItem('wrapstore_admin_auth');
          sessionStorage.removeItem('wrapstore_admin_auth');
          supabase.auth.signOut().catch(() => {});
          setAdminUser(null);
          return;
        }

        // Sync name or role if updated in profiles
        if (
          profile.role !== adminUser.role ||
          profile.full_name !== adminUser.fullName ||
          profile.email !== adminUser.email
        ) {
          const updated = {
            ...adminUser,
            role: profile.role || adminUser.role,
            fullName: profile.full_name || adminUser.fullName,
            email: profile.email || adminUser.email,
          };
          setAdminUser(updated);
          try {
            if (localStorage.getItem('wrapstore_admin_auth')) {
              localStorage.setItem('wrapstore_admin_auth', JSON.stringify(updated));
            } else if (sessionStorage.getItem('wrapstore_admin_auth')) {
              sessionStorage.setItem('wrapstore_admin_auth', JSON.stringify(updated));
            }
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('[AdminPage] Profile sync check error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [adminUser?.id]);

  // Active View Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Orders State — clean, strictly starts empty if no real orders have been placed
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const realtimeChannelRef = useRef(null);

  // Load clean genuine orders from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Purge all test / dummy data
          const clean = parsed.filter(isGenuineOrder);
          localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(clean));
          setOrders(clean);
          return;
        }
      }
      // If nothing or invalid, ensure empty array
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([]));
      setOrders([]);
    } catch (e) {
      console.warn('Could not read orders from localStorage:', e);
      setOrders([]);
    }
  }, []);

  // Fetch online orders from Supabase if table exists
  const fetchSupabaseOrders = useCallback(async () => {
    if (!supabaseConfigured || !supabase) return;
    try {
      const { data: dbOrders, error } = await supabase
        .from('online_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(dbOrders) && dbOrders.length > 0) {
        // Merge with local orders, de-duplicating by ID
        setOrders((prev) => {
          const map = new Map();
          // Add remote orders
          dbOrders.forEach((o) => {
            const formatted = {
              orderId: o.id || o.order_id,
              createdAt: o.created_at,
              status: o.order_status || o.payment_status || 'Payment received',
              subtotal: Number(o.subtotal || o.total || 0),
              total: Number(o.total || o.subtotal || 0),
              shippingFee: Number(o.shipping_fee || 0),
              contact: {
                name: o.customer_name || 'Customer',
                phone: o.customer_phone || '',
                email: o.customer_email || '',
              },
              delivery: o.shipping_address || {},
              items: o.items || [],
              payment: o.payment_status || 'Online Payment',
            };
            if (isGenuineOrder(formatted)) {
              map.set(formatted.orderId, formatted);
            }
          });
          // Add local genuine orders
          prev.forEach((o) => {
            if (isGenuineOrder(o) && !map.has(o.orderId)) {
              map.set(o.orderId, o);
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
        });
      }
    } catch (err) {
      console.warn('[AdminPage] fetchSupabaseOrders error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSupabaseOrders();
  }, [fetchSupabaseOrders]);

  // Realtime Supabase Subscription:
  // When a product is sold through POS (invoices, invoice_items, stock changes)
  // or added through POS (products, product_images), update immediately!
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    try {
      const channelTopic = `admin-realtime-${Math.random().toString(36).substring(2, 9)}`;
      const channel = supabase.channel(channelTopic);

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          console.log('[Admin Realtime] Product change from POS / Web:', payload.eventType);
          refetch(); // Live update product catalog & stock numbers
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, () => {
          refetch();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
          console.log('[Admin Realtime] Product sold via POS (invoices):', payload.eventType);
          refetch(); // Live update stock count
          fetchSupabaseOrders();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' }, () => {
          console.log('[Admin Realtime] POS item sold (invoice_items)');
          refetch(); // Live update stock count
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'online_orders' }, () => {
          console.log('[Admin Realtime] Online order change');
          refetch();
          fetchSupabaseOrders();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Admin Realtime] Connected to POS sales and product sync stream');
          }
        });

      realtimeChannelRef.current = channel;
    } catch (err) {
      console.warn('[Admin Realtime] Subscription error:', err);
    }

    return () => {
      if (realtimeChannelRef.current) {
        try {
          supabase.removeChannel(realtimeChannelRef.current);
        } catch {}
        realtimeChannelRef.current = null;
      }
    };
  }, [refetch, fetchSupabaseOrders]);

  // Window event listener: instant live update if an order is submitted locally
  useEffect(() => {
    const handleOrderCreated = (e) => {
      if (e.detail && isGenuineOrder(e.detail)) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.orderId === e.detail.orderId);
          if (exists) return prev;
          const updated = [e.detail, ...prev];
          try {
            localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        refetch(); // Refresh stock immediately
      }
    };

    window.addEventListener('wrapstore:order_created', handleOrderCreated);
    return () => window.removeEventListener('wrapstore:order_created', handleOrderCreated);
  }, [refetch]);

  // Update order status callback
  const handleUpdateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders((prev) => {
      const updated = prev.map((ord) => {
        if (ord.orderId === orderId) {
          return {
            ...ord,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      });

      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist updated orders:', e);
      }

      return updated;
    });

    setSelectedOrder((curr) => {
      if (curr && curr.orderId === orderId) {
        return {
          ...curr,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return curr;
    });
  }, []);

  // Login handler
  const handleLoginSuccess = (authData) => {
    setAdminUser(authData);
  };

  // Logout handler
  const handleLogout = useCallback(async () => {
    localStorage.removeItem('wrapstore_admin_auth');
    sessionStorage.removeItem('wrapstore_admin_auth');
    if (supabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AdminPage] Sign out error:', err);
      }
    }
    setAdminUser(null);
  }, []);

  // Update document title for professional admin experience
  useEffect(() => {
    if (adminUser) {
      document.title = 'WrapStore Admin Portal | Store Operations & Content';
    } else {
      document.title = 'Admin Sign In | WrapStore Operations';
    }
  }, [adminUser]);

  // If unauthenticated, show secure login card
  if (!adminUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col font-sans">
      {/* Admin Navigation & User Top Bar */}
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        adminEmail={adminUser.email}
        adminUser={adminUser}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <AdminOverviewTab
            orders={orders}
            products={products}
            onNavigateTab={setActiveTab}
            onSelectOrder={(ord) => {
              setSelectedOrder(ord);
              setActiveTab('orders');
            }}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
          />
        )}

        {activeTab === 'hero' && <AdminHeroTab />}

        {activeTab === 'featured' && (
          <AdminFeaturedTab
            products={products}
            onRefreshProducts={refetch}
          />
        )}

        {activeTab === 'products' && (
          <AdminProductsTab products={products} />
        )}
      </main>
    </div>
  );
}

export default AdminPage;
