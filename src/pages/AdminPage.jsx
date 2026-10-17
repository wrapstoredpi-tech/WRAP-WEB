import React, { useState, useEffect, useCallback } from 'react';
import { useProductsContext } from '../context/ProductsContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminHeroTab } from '../components/admin/AdminHeroTab';
import { AdminFeaturedTab } from '../components/admin/AdminFeaturedTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_ORDERS_KEY = 'wrapstore_orders_v2';

// Seed sample orders for initial showcase if no real customer orders exist yet
const INITIAL_DEMO_ORDERS = [
  {
    orderId: 'WS-892104',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    status: 'Payment received',
    subtotal: 1299,
    shippingFee: 0,
    total: 1299,
    contact: {
      name: 'Karthik Subramanian',
      phone: '98402 18942',
      email: 'karthik.sub@gmail.com',
    },
    delivery: {
      address: '42, 3rd Cross Street, Gandhinagar',
      city: 'Dharmapuri',
      state: 'Tamil Nadu',
      pincode: '636701',
    },
    payment: 'Online Payment (Razorpay - UPI)',
    items: [
      {
        name: 'Nomad Vachetta Leather Case',
        selected_model: 'iPhone 16 Pro Max',
        color: 'Saddle Brown',
        price: 1299,
        quantity: 1,
        image: '/hero/slide-2.webp',
      },
    ],
  },
  {
    orderId: 'WS-891942',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    status: 'Packed',
    subtotal: 1798,
    shippingFee: 0,
    total: 1798,
    contact: {
      name: 'Ananya Ramesh',
      phone: '94431 82740',
      email: 'ananya.ramesh@outlook.com',
    },
    delivery: {
      address: '12B, Lake View Enclave, Anna Nagar',
      city: 'Salem',
      state: 'Tamil Nadu',
      pincode: '636007',
    },
    payment: 'Online Payment (Razorpay - Card)',
    items: [
      {
        name: 'Matte Liquid Silicone Case',
        selected_model: 'Samsung Galaxy S24 Ultra',
        color: 'Midnight Blue',
        price: 999,
        quantity: 1,
        image: '/hero/slide-1.webp',
      },
      {
        name: '9H HD Tempered Glass Screen Guard',
        selected_model: 'Samsung Galaxy S24 Ultra',
        color: 'Clear',
        price: 799,
        quantity: 1,
        image: '/hero/slide-3.webp',
      },
    ],
  },
  {
    orderId: 'WS-890215',
    createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(), // Yesterday
    status: 'Shipped',
    subtotal: 1499,
    shippingFee: 0,
    total: 1499,
    contact: {
      name: 'Vigneshwaran P.',
      phone: '81240 55198',
      email: 'vignesh.dpi@gmail.com',
    },
    delivery: {
      address: '78, Bazaar Street, Near Town Bus Stand',
      city: 'Dharmapuri',
      state: 'Tamil Nadu',
      pincode: '636701',
    },
    payment: 'Online Payment (Razorpay - Net Banking)',
    items: [
      {
        name: 'Carbon Fiber Rugged Armor Case',
        selected_model: 'iPhone 15',
        color: 'Matte Black',
        price: 1499,
        quantity: 1,
        image: '/hero/slide-1.webp',
      },
    ],
  },
  {
    orderId: 'WS-888430',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 days ago
    status: 'Delivered',
    subtotal: 899,
    shippingFee: 0,
    total: 899,
    contact: {
      name: 'Priya Sundaram',
      phone: '97890 23411',
      email: 'priya.sundaram@gmail.com',
    },
    delivery: {
      address: '15, Railway Station Road',
      city: 'Dharmapuri',
      state: 'Tamil Nadu',
      pincode: '636701',
    },
    payment: 'Online Payment (Razorpay - UPI)',
    items: [
      {
        name: 'Frosted Translucent MagSafe Case',
        selected_model: 'iPhone 16 Pro',
        color: 'Titanium Gray',
        price: 899,
        quantity: 1,
        image: '/hero/slide-2.webp',
      },
    ],
  },
];

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

  // Active View Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load orders from localStorage or seed
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
          return;
        }
      }
      // If no customer orders in storage yet, seed initial demo orders
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      setOrders(INITIAL_DEMO_ORDERS);
    } catch (e) {
      console.warn('Could not read orders from localStorage:', e);
      setOrders(INITIAL_DEMO_ORDERS);
    }
  }, []);

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
  const handleLogout = () => {
    localStorage.removeItem('wrapstore_admin_auth');
    sessionStorage.removeItem('wrapstore_admin_auth');
    setAdminUser(null);
  };

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
