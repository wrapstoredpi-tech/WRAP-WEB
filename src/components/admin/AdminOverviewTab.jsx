import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertCircle,
  Sliders,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '../../lib/currency';

export function AdminOverviewTab({
  orders = [],
  products = [],
  onNavigateTab,
  onSelectOrder,
}) {
  // Aggregate sales calculations
  const totalRevenue = orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
  const totalOrdersCount = orders.length;
  const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const inStockCount = products.filter(
    (p) => (p.available_stock ?? p.current_stock ?? 0) > 0 && p.stock_status !== 'OUT_OF_STOCK'
  ).length;

  const lowStockCount = products.filter(
    (p) => (p.available_stock ?? p.current_stock ?? 0) > 0 && (p.available_stock ?? p.current_stock ?? 0) <= 5
  ).length;

  const outOfStockCount = products.filter(
    (p) => (p.available_stock ?? p.current_stock ?? 0) === 0 || p.stock_status === 'OUT_OF_STOCK'
  ).length;

  const recentOrders = orders.slice(0, 5);

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s.includes('shipped')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 text-[11px] font-semibold">
          <span>Shipped</span>
        </span>
      );
    }
    if (s.includes('packed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 text-[11px] font-semibold">
          <span>Packed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FAFAF9] border border-[#E5E5E3] text-[#141414] text-[11px] font-semibold">
        <Clock className="w-3 h-3 text-[#B0521F]" />
        <span>{status || 'Payment received'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Quick summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[24px] font-semibold text-[#141414] tracking-tight">
            Store Performance & Sales
          </h1>
          <p className="text-[13px] text-[#6B6B6B] mt-0.5">
            Real-time metrics from your Dharmapuri storefront and online store
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('hero')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E5E5E3] bg-white hover:border-[#141414] text-[12px] font-semibold text-[#141414] transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#B0521F]" />
            <span>Edit Hero Slides</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('featured')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B0521F]" />
            <span>Manage Featured</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[13px] font-medium">Total Online Revenue</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center text-[#B0521F]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[26px] font-semibold text-[#141414] tabular-nums tracking-tight">
              {formatINR(totalRevenue)}
            </span>
          </div>
          <div className="mt-2 text-[12px] text-emerald-600 font-medium flex items-center gap-1">
            <span>Razorpay online payments</span>
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[13px] font-medium">Completed Orders</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center text-[#141414]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[26px] font-semibold text-[#141414] tabular-nums tracking-tight">
              {totalOrdersCount}
            </span>
          </div>
          <div className="mt-2 text-[12px] text-[#6B6B6B]">
            <span>Average Order Value: <strong>{formatINR(aov)}</strong></span>
          </div>
        </div>

        {/* Metric 3: Active Products */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[13px] font-medium">Catalog Products</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center text-[#141414]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[26px] font-semibold text-[#141414] tabular-nums tracking-tight">
              {products.length}
            </span>
          </div>
          <div className="mt-2 text-[12px] text-[#6B6B6B]">
            <span><strong>{inStockCount}</strong> in stock</span>
          </div>
        </div>

        {/* Metric 4: Stock Alerts */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[13px] font-medium">Inventory Alerts</span>
            <div className="w-8 h-8 rounded-[6px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[26px] font-semibold text-[#B0521F] tabular-nums tracking-tight">
              {lowStockCount}
            </span>
            <span className="text-[13px] text-[#6B6B6B]">low stock</span>
          </div>
          <div className="mt-2 text-[12px] text-[#6B6B6B]">
            <span>{outOfStockCount} items currently out of stock</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-[#E5E5E3] rounded-[8px] overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E3] flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-[#141414]">
              Recent Customer Orders
            </h2>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">
              Latest transactions placed on the online storefront
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#B0521F] hover:underline cursor-pointer"
          >
            <span>View all orders ({orders.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E5E3] text-[#6B6B6B]">
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Items</th>
                  <th className="py-3 px-4 font-medium">Total</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {recentOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-[#FAFAF9]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#141414]">
                      {ord.orderId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#141414]">
                        {ord.contact?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        {ord.contact?.phone || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#6B6B6B]">
                      {ord.items?.length || 1} {ord.items?.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#141414] tabular-nums">
                      {formatINR(ord.total)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(ord.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectOrder(ord);
                          onNavigateTab('orders');
                        }}
                        className="text-[12px] font-semibold text-[#B0521F] hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#6B6B6B]">
            <p className="text-[14px]">No customer orders recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOverviewTab;
