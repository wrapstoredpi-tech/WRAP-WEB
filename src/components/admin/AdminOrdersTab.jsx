import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  X,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatINR } from '../../lib/currency';

export function AdminOrdersTab({
  orders = [],
  onUpdateOrderStatus,
  selectedOrder,
  onSelectOrder,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter !== 'ALL') {
      result = result.filter(
        (o) => (o.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          (o.orderId || '').toLowerCase().includes(q) ||
          (o.contact?.name || '').toLowerCase().includes(q) ||
          (o.contact?.phone || '').includes(q) ||
          (o.delivery?.city || '').toLowerCase().includes(q) ||
          (o.items || []).some((item) => (item.name || '').toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, statusFilter, search]);

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s.includes('shipped')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
          <Truck className="w-3 h-3 text-blue-600" />
          <span>Shipped</span>
        </span>
      );
    }
    if (s.includes('packed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
          <Package className="w-3 h-3 text-amber-600" />
          <span>Packed</span>
        </span>
      );
    }
    if (s.includes('cancel')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-red-50 text-red-800 text-[11px] font-semibold border border-red-200">
          <X className="w-3 h-3 text-red-600" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#FAFAF9] text-[#141414] text-[11px] font-semibold border border-[#E5E5E3]">
        <Clock className="w-3 h-3 text-[#B0521F]" />
        <span>{status || 'Payment received'}</span>
      </span>
    );
  };

  const handleStatusChange = (orderId, newStatus) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#141414] tracking-tight">
            Orders & Shipments
          </h1>
          <p className="text-[13px] text-[#6B6B6B] mt-0.5">
            Monitor incoming customer purchases, inspect order lines, and manage fulfillment
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, phone, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-[13px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414] focus:bg-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'Payment received', label: 'Paid' },
            { id: 'Packed', label: 'Packed' },
            { id: 'Shipped', label: 'Shipped' },
            { id: 'Delivered', label: 'Delivered' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-[#141414] text-white'
                  : 'bg-[#FAFAF9] text-[#6B6B6B] hover:text-[#141414] hover:bg-[#E5E5E3]/50 border border-[#E5E5E3]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E5E3] text-[#6B6B6B]">
                <th className="py-3 px-4 font-medium">Order ID</th>
                <th className="py-3 px-4 font-medium">Date & Time</th>
                <th className="py-3 px-4 font-medium">Customer Details</th>
                <th className="py-3 px-4 font-medium">Items & Models</th>
                <th className="py-3 px-4 font-medium">Total Amount</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.orderId}
                    onClick={() => onSelectOrder(ord)}
                    className="hover:bg-[#FAFAF9]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#141414]">
                      {ord.orderId}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B] whitespace-nowrap">
                      {ord.createdAt
                        ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Today'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#141414]">
                        {ord.contact?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        {ord.contact?.phone || '—'}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        {ord.delivery?.city || 'Dharmapuri'}, {ord.delivery?.pincode || '636701'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {(ord.items || []).slice(0, 2).map((it, idx) => (
                          <div key={idx} className="text-[#141414] text-[12px] line-clamp-1">
                            <span>{it.quantity}x {it.name}</span>
                            {it.selected_model && it.selected_model !== 'Universal' && (
                              <span className="text-[#6B6B6B] ml-1">({it.selected_model})</span>
                            )}
                            {it.color && (
                              <span className="text-[#B0521F] ml-1">[{it.color}]</span>
                            )}
                          </div>
                        ))}
                        {(ord.items?.length || 0) > 2 && (
                          <span className="text-[11px] text-[#6B6B6B]">
                            +{ord.items.length - 2} more items
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#141414] tabular-nums">
                      {formatINR(ord.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(ord.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ord.status || 'Payment received'}
                        onChange={(e) => handleStatusChange(ord.orderId, e.target.value)}
                        className="text-[12px] font-medium bg-[#FAFAF9] border border-[#E5E5E3] rounded-[4px] px-2 py-1 text-[#141414] focus:outline-none focus:border-[#141414] cursor-pointer"
                      >
                        <option value="Payment received">Payment received</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-[#6B6B6B]">
                    <div className="w-12 h-12 rounded-full bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center mx-auto mb-3 text-[#8C8C8C]">
                      <Package className="w-6 h-6 text-[#8C8C8C]" />
                    </div>
                    {orders.length === 0 ? (
                      <>
                        <p className="text-[15px] font-semibold text-[#141414]">No Orders Recorded Yet</p>
                        <p className="text-[12px] text-[#6B6B6B] mt-1 max-w-sm mx-auto">
                          New orders placed online or completed via POS will stream in here in real time.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[15px] font-semibold text-[#141414]">No Matching Orders</p>
                        <p className="text-[12px] text-[#6B6B6B] mt-1 max-w-sm mx-auto">
                          No orders match your search query or status filter. Try clearing filters.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E5E3]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E5E5E3] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">
                  Order Details
                </span>
                <h3 className="text-[18px] font-semibold text-[#141414] font-mono">
                  {selectedOrder.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-[#FAFAF9] flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Status & Transitions */}
              <div className="p-4 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#6B6B6B]">Fulfillment Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {['Packed', 'Shipped', 'Delivered'].map((next) => (
                    <button
                      key={next}
                      type="button"
                      onClick={() => handleStatusChange(selectedOrder.orderId, next)}
                      className="flex-1 py-1 text-[11px] font-semibold rounded-[4px] border border-[#E5E5E3] bg-white hover:border-[#141414] text-[#141414] transition-colors cursor-pointer"
                    >
                      Mark {next}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Contact & Address */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold text-[#141414]">Customer & Delivery</h4>
                <div className="border border-[#E5E5E3] rounded-[6px] p-3.5 space-y-2 text-[13px]">
                  <div className="font-semibold text-[#141414]">{selectedOrder.contact?.name || 'Customer'}</div>
                  <div className="flex items-center gap-2 text-[#6B6B6B]">
                    <Phone className="w-3.5 h-3.5 text-[#141414]" />
                    <span>{selectedOrder.contact?.phone || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[#6B6B6B]">
                    <MapPin className="w-3.5 h-3.5 text-[#141414] shrink-0 mt-0.5" />
                    <span>
                      {selectedOrder.delivery?.address || 'Railway Station Rd'}, {selectedOrder.delivery?.city || 'Dharmapuri'}, {selectedOrder.delivery?.pincode || '636701'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold text-[#141414]">Ordered Items ({selectedOrder.items?.length || 0})</h4>
                <div className="divide-y divide-[#E5E5E3] border border-[#E5E5E3] rounded-[6px] overflow-hidden">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center gap-3">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-12 h-14 object-cover rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9]"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#141414] truncate">{it.name}</div>
                        {it.selected_model && (
                          <div className="text-[11px] text-[#6B6B6B]">Model: {it.selected_model}</div>
                        )}
                        {it.color && (
                          <div className="text-[11px] text-[#B0521F]">Colour: {it.color}</div>
                        )}
                        <div className="text-[12px] text-[#6B6B6B] mt-0.5">
                          Qty: {it.quantity} × {formatINR(it.price)}
                        </div>
                      </div>
                      <div className="text-[13px] font-semibold text-[#141414] tabular-nums">
                        {formatINR((it.price || 0) * (it.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Financials */}
              <div className="border border-[#E5E5E3] rounded-[6px] p-4 space-y-2 bg-[#FAFAF9] text-[13px]">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-[#141414]">{formatINR(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Shipping Fee</span>
                  <span className="tabular-nums font-medium text-[#141414]">
                    {selectedOrder.shippingFee > 0 ? formatINR(selectedOrder.shippingFee) : 'Free'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E5E5E3] flex justify-between text-[15px] font-semibold text-[#141414]">
                  <span>Total Paid</span>
                  <span className="tabular-nums">{formatINR(selectedOrder.total)}</span>
                </div>
                <div className="pt-1 text-[11px] text-emerald-700 font-medium">
                  Payment verified via Razorpay online
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersTab;
