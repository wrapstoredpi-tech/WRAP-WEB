import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Tag,
  Check,
  Search,
  Zap,
  X,
} from 'lucide-react';
import { formatINR } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import { getPinnedDealId } from '../../lib/dealFeaturedAdapter';

export function AdminFeaturedTab({
  products = [],
  onRefreshProducts,
}) {
  const [pinnedDealId, setPinnedDealId] = useState(() => getPinnedDealId());
  const [search, setSearch] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [updatingProductIds, setUpdatingProductIds] = useState(new Set());
  const [optimisticOverrides, setOptimisticOverrides] = useState({});

  const showNotification = (msg) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const getIsFeatured = (product) => {
    if (optimisticOverrides[product.id] !== undefined) {
      return optimisticOverrides[product.id];
    }
    return Boolean(product.online_featured);
  };

  // Toggle online_featured in Supabase
  const handleToggleOnlineFeatured = async (product) => {
    const currentStatus = getIsFeatured(product);
    const newStatus = !currentStatus;

    // Apply optimistic override immediately for fast UI feedback
    setOptimisticOverrides((prev) => ({ ...prev, [product.id]: newStatus }));
    setUpdatingProductIds((prev) => new Set(prev).add(product.id));

    try {
      const { error } = await supabase
        .from('products')
        .update({ online_featured: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      showNotification(
        newStatus
          ? `Added "${product.name}" to Featured Products`
          : `Removed "${product.name}" from Featured Products`
      );

      if (onRefreshProducts) {
        await onRefreshProducts();
      }
    } catch (err) {
      console.error('Error updating online_featured in Supabase:', err);
      // Revert optimistic override on error
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      showNotification(`Failed to update ${product.name}: ${err.message || 'Database error'}`);
    } finally {
      setUpdatingProductIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handlePinDeal = (productId) => {
    const newId = pinnedDealId === productId ? null : productId;
    setPinnedDealId(newId);
    if (newId) {
      localStorage.setItem('wrapstore_pinned_deal_id', newId);
      showNotification('Deal of the Day product updated!');
    } else {
      localStorage.removeItem('wrapstore_pinned_deal_id');
      showNotification('Deal of the Day reset to daily discount rotation');
    }
  };

  // All active featured products (source of truth: online_featured === true)
  const featuredProducts = useMemo(() => {
    return products.filter(getIsFeatured);
  }, [products, optimisticOverrides]);

  const activeDealProduct = products.find((p) => p.id === pinnedDealId) ||
    products.find((p) => (p.mrp && p.mrp > p.selling_price) || (p.discount_percentage && p.discount_percentage > 0)) ||
    products[0];

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.mobile_brand || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#141414] tracking-tight">
            Featured Products & Deal Management
          </h1>
          <p className="text-[13px] text-[#6B6B6B] mt-0.5">
            Choose which mobile cases and accessories are highlighted on the home screen
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[6px] text-[12px] font-semibold animate-fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      {/* 2 Spotlight Cards (Live Previews) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Featured Products (Supports Multiple Products) */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[#141414] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#B0521F]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#141414]">
                    Featured Products ({featuredProducts.length})
                  </h3>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Active products showcased across the storefront
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#141414] bg-[#F5F5F3] px-2 py-0.5 rounded-[4px] border border-[#E5E5E3]">
                {featuredProducts.length} Active
              </span>
            </div>

            {/* List or Empty State */}
            <div className="mt-3">
              {featuredProducts.length === 0 ? (
                <div className="py-8 px-4 text-center border border-dashed border-[#E5E5E3] rounded-[6px] bg-[#FAFAF9]">
                  <Sparkles className="w-6 h-6 text-[#9E9E9C] mx-auto mb-2 opacity-60" />
                  <p className="text-[13px] font-medium text-[#141414]">
                    No featured products selected
                  </p>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                    Click &ldquo;Pin Featured&rdquo; on any item in the catalogue below to feature it.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {featuredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-2.5 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] hover:border-[#141414]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-14 object-cover rounded-[4px] border border-[#E5E5E3] bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[13px] font-semibold text-[#141414] truncate">
                              {p.name}
                            </h4>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              Featured
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-[13px] font-semibold text-[#141414] tabular-nums">
                              {formatINR(p.selling_price)}
                            </span>
                            {p.mrp > p.selling_price && (
                              <span className="text-[11px] text-[#6B6B6B] line-through tabular-nums">
                                {formatINR(p.mrp)}
                              </span>
                            )}
                            <span className="text-[11px] text-[#8C8C8C] truncate">
                              · {p.category || 'Accessories'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={updatingProductIds.has(p.id)}
                        onClick={() => handleToggleOnlineFeatured(p)}
                        aria-label={`Remove ${p.name} from Featured`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-[4px] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        title="Remove from featured"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-[12px] text-[#6B6B6B] pt-3 border-t border-[#E5E5E3]">
            Featured products are displayed dynamically on the storefront. Add as many as needed without limit.
          </div>
        </div>

        {/* Card 2: Deal of the Day Spotlight (Independent) */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[#B0521F] text-white flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#141414]">Deal of the Day</h3>
                  <span className="text-[11px] text-[#6B6B6B]">Daily discounted item banner</span>
                </div>
              </div>
              {pinnedDealId && (
                <span className="text-[11px] font-semibold text-[#B0521F] bg-[#B0521F]/10 px-2 py-0.5 rounded-[4px]">
                  Pinned by Admin
                </span>
              )}
            </div>

            {activeDealProduct && (
              <div className="flex items-center gap-4 p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] mt-3">
                <img
                  src={activeDealProduct.image_url}
                  alt={activeDealProduct.name}
                  className="w-16 h-20 object-cover rounded-[4px] border border-[#E5E5E3] bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                    {activeDealProduct.category}
                  </span>
                  <h4 className="text-[14px] font-semibold text-[#141414] truncate">
                    {activeDealProduct.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[15px] font-semibold text-[#141414] tabular-nums">
                      {formatINR(activeDealProduct.selling_price)}
                    </span>
                    {activeDealProduct.mrp > activeDealProduct.selling_price && (
                      <span className="text-[12px] text-[#6B6B6B] line-through tabular-nums">
                        {formatINR(activeDealProduct.mrp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[12px] text-[#6B6B6B] pt-3 border-t border-[#E5E5E3]">
            Select any discounted product from the catalog below to pin it as the Deal of the Day.
          </div>
        </div>
      </div>

      {/* Catalog Selector Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-[8px] overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#141414]">
              Choose Products from Catalog
            </h3>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">
              Click Pin Featured or Pin Deal to update storefront spotlights immediately
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] text-[#141414] focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E5E3] text-[#6B6B6B]">
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-4 font-medium">Category / Brand</th>
                <th className="py-3 px-4 font-medium">Price</th>
                <th className="py-3 px-4 font-medium">Stock</th>
                <th className="py-3 px-4 font-medium text-center">Featured</th>
                <th className="py-3 px-4 font-medium text-center">Deal of the Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {filteredProducts.map((p) => {
                const isFeatured = getIsFeatured(p);
                const isPinnedDeal = pinnedDealId === p.id;
                const isUpdatingThis = updatingProductIds.has(p.id);

                return (
                  <tr key={p.id} className="hover:bg-[#FAFAF9]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9]"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#141414] truncate max-w-xs">{p.name}</div>
                          <div className="text-[11px] text-[#6B6B6B] font-mono">{p.product_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#6B6B6B]">
                      <div>{p.category}</div>
                      <div className="text-[11px] text-[#141414]">{p.mobile_brand}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#141414] tabular-nums">
                      {formatINR(p.selling_price)}
                    </td>
                    <td className="py-3 px-4 text-[#6B6B6B]">
                      {p.available_stock ?? p.current_stock ?? 0} in stock
                    </td>
                    {/* Featured Toggle Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => handleToggleOnlineFeatured(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-[4px] transition-all cursor-pointer ${
                          isFeatured
                            ? 'bg-[#141414] text-white hover:bg-black shadow-xs'
                            : 'border border-[#E5E5E3] hover:border-[#141414] text-[#141414] bg-white hover:bg-[#FAFAF9]'
                        } ${isUpdatingThis ? 'opacity-60 cursor-wait' : ''}`}
                        title={isFeatured ? 'Click to remove from featured' : 'Click to feature this product'}
                      >
                        {isFeatured ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Featured</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#B0521F]" />
                            <span>Pin Featured</span>
                          </>
                        )}
                      </button>
                    </td>
                    {/* Deal Pin Button (Independent) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePinDeal(p.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer ${
                          isPinnedDeal
                            ? 'bg-[#B0521F] text-white shadow-sm'
                            : 'border border-[#E5E5E3] hover:border-[#B0521F] text-[#141414] bg-white'
                        }`}
                      >
                        <Tag className="w-3 h-3 text-[#B0521F]" />
                        <span>{isPinnedDeal ? 'Pinned Deal' : 'Pin Deal'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminFeaturedTab;
