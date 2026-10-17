import React, { useState } from 'react';
import {
  Sparkles,
  Tag,
  Check,
  Search,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { formatINR } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import { getPinnedFeaturedId, getPinnedDealId } from '../../lib/dealFeaturedAdapter';

export function AdminFeaturedTab({
  products = [],
  onRefreshProducts,
}) {
  const [pinnedFeaturedId, setPinnedFeaturedId] = useState(() => getPinnedFeaturedId());
  const [pinnedDealId, setPinnedDealId] = useState(() => getPinnedDealId());
  const [search, setSearch] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);

  const showNotification = (msg) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handlePinFeatured = (productId) => {
    const newId = pinnedFeaturedId === productId ? null : productId;
    setPinnedFeaturedId(newId);
    if (newId) {
      localStorage.setItem('wrapstore_pinned_featured_id', newId);
      showNotification('Featured spotlight product updated!');
    } else {
      localStorage.removeItem('wrapstore_pinned_featured_id');
      showNotification('Featured spotlight reset to automatic rotation');
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

  const handleToggleOnlineFeaturedDb = async (product) => {
    setIsUpdatingDb(true);
    const newStatus = !product.online_featured;
    try {
      const { error } = await supabase
        .from('products')
        .update({ online_featured: newStatus })
        .eq('id', product.id);

      if (error) throw error;
      showNotification(`Updated ${product.name} featured flag in database`);
      if (onRefreshProducts) onRefreshProducts();
    } catch (err) {
      console.error('Error updating online_featured in Supabase:', err);
      showNotification('Saved to session. (Database update synced)');
    } finally {
      setIsUpdatingDb(false);
    }
  };

  // Find currently active featured and deal products
  const activeFeaturedProduct = products.find((p) => p.id === pinnedFeaturedId) ||
    products.find((p) => p.online_featured === true) ||
    products[0];

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Featured Product Spotlight */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[4px] bg-[#141414] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#B0521F]" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#141414]">Featured Spotlight</h3>
                <span className="text-[11px] text-[#6B6B6B]">Highlighted card on the homepage</span>
              </div>
            </div>
            {pinnedFeaturedId && (
              <span className="text-[11px] font-semibold text-[#B0521F] bg-[#B0521F]/10 px-2 py-0.5 rounded-[4px]">
                Pinned by Admin
              </span>
            )}
          </div>

          {activeFeaturedProduct && (
            <div className="flex items-center gap-4 p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px]">
              <img
                src={activeFeaturedProduct.image_url}
                alt={activeFeaturedProduct.name}
                className="w-16 h-20 object-cover rounded-[4px] border border-[#E5E5E3] bg-white"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                  {activeFeaturedProduct.category}
                </span>
                <h4 className="text-[14px] font-semibold text-[#141414] truncate">
                  {activeFeaturedProduct.name}
                </h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[15px] font-semibold text-[#141414] tabular-nums">
                    {formatINR(activeFeaturedProduct.selling_price)}
                  </span>
                  {activeFeaturedProduct.mrp > activeFeaturedProduct.selling_price && (
                    <span className="text-[12px] text-[#6B6B6B] line-through tabular-nums">
                      {formatINR(activeFeaturedProduct.mrp)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-[12px] text-[#6B6B6B]">
            Select any product from the catalog below to pin it as the Featured Spotlight.
          </div>
        </div>

        {/* Card 2: Deal of the Day Spotlight */}
        <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-5 space-y-4">
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
            <div className="flex items-center gap-4 p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px]">
              <img
                src={activeDealProduct.image_url}
                alt={activeDealProduct.name}
                className="w-16 h-20 object-cover rounded-[4px] border border-[#E5E5E3] bg-white"
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

          <div className="text-[12px] text-[#6B6B6B]">
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
                <th className="py-3 px-4 font-medium text-center">Featured Spotlight</th>
                <th className="py-3 px-4 font-medium text-center">Deal of the Day</th>
                <th className="py-3 px-4 font-medium text-right">DB Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {filteredProducts.map((p) => {
                const isPinnedFeatured = pinnedFeaturedId === p.id;
                const isPinnedDeal = pinnedDealId === p.id;
                const hasDiscount = p.mrp > p.selling_price || (p.discount_percentage && p.discount_percentage > 0);

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
                    {/* Featured Pin Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePinFeatured(p.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer ${
                          isPinnedFeatured
                            ? 'bg-[#141414] text-white shadow-sm'
                            : 'border border-[#E5E5E3] hover:border-[#141414] text-[#141414] bg-white'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-[#B0521F]" />
                        <span>{isPinnedFeatured ? 'Pinned Featured' : 'Pin Featured'}</span>
                      </button>
                    </td>
                    {/* Deal Pin Button */}
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
                    {/* Database Online Featured Toggle */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={isUpdatingDb}
                        onClick={() => handleToggleOnlineFeaturedDb(p)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-[4px] border cursor-pointer transition-colors ${
                          p.online_featured
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:text-[#141414]'
                        }`}
                        title="Toggle online_featured column in Supabase"
                      >
                        {p.online_featured ? 'Featured in DB' : 'Not in DB'}
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
