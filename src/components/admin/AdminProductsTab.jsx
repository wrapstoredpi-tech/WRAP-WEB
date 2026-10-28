import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Tag,
  Palette,
} from 'lucide-react';
import { formatINR } from '../../lib/currency';
import { getValidColors, resolveColorStyle } from '../../lib/colors';

export function AdminProductsTab({ products = [] }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc');

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const cat = p.category_name || p.category?.name || (typeof p.category === 'string' ? p.category : null);
      if (cat) set.add(cat);
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c) => set.add(c));
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Stock KPI counts
  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const stock = Number(p.available_stock ?? p.current_stock ?? 0);
      const isOut = stock <= 0 || p.stock_status === 'OUT_OF_STOCK';
      const isLow = stock > 0 && stock <= 5;

      if (isOut) {
        outOfStock++;
      } else if (isLow) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { total: products.length, inStock, lowStock, outOfStock };
  }, [products]);

  // Filtered & sorted product list
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== 'ALL') {
      const targetCat = selectedCategory.toLowerCase();
      list = list.filter((p) => {
        const cat = p.category_name || p.category?.name || (typeof p.category === 'string' ? p.category : '');
        const allCats = Array.isArray(p.categories) ? p.categories : [];
        return cat.toLowerCase() === targetCat || allCats.some((c) => c.toLowerCase() === targetCat);
      });
    }

    // Stock status filter
    if (stockFilter === 'IN_STOCK') {
      list = list.filter((p) => {
        const stock = Number(p.available_stock ?? p.current_stock ?? 0);
        return stock > 5 && p.stock_status !== 'OUT_OF_STOCK';
      });
    } else if (stockFilter === 'LOW_STOCK') {
      list = list.filter((p) => {
        const stock = Number(p.available_stock ?? p.current_stock ?? 0);
        return stock > 0 && stock <= 5;
      });
    } else if (stockFilter === 'OUT_OF_STOCK') {
      list = list.filter((p) => {
        const stock = Number(p.available_stock ?? p.current_stock ?? 0);
        return stock <= 0 || p.stock_status === 'OUT_OF_STOCK';
      });
    }

    // Search query filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.mobile_brand || '').toLowerCase();
        const sku = String(p.id || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || sku.includes(q);
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'price-asc') {
        return (Number(a.selling_price) || 0) - (Number(b.selling_price) || 0);
      }
      if (sortBy === 'price-desc') {
        return (Number(b.selling_price) || 0) - (Number(a.selling_price) || 0);
      }
      if (sortBy === 'stock-asc') {
        const stockA = Number(a.available_stock ?? a.current_stock ?? 0);
        const stockB = Number(b.available_stock ?? b.current_stock ?? 0);
        return stockA - stockB;
      }
      return 0;
    });

    return list;
  }, [products, selectedCategory, stockFilter, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[6px] border border-[#E5E5E3] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Total Catalog
            </span>
            <Package className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[24px] font-semibold text-[#141414] font-mono">
              {stats.total}
            </span>
            <span className="text-[12px] text-[#6B6B6B]">active items</span>
          </div>
        </div>

        <div className="bg-white rounded-[6px] border border-[#E5E5E3] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wider">
              In Stock
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[24px] font-semibold text-emerald-700 font-mono">
              {stats.inStock}
            </span>
            <span className="text-[12px] text-[#6B6B6B]">ready for dispatch</span>
          </div>
        </div>

        <div className="bg-white rounded-[6px] border border-[#E5E5E3] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-amber-700 uppercase tracking-wider">
              Low Stock (≤5)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[24px] font-semibold text-amber-700 font-mono">
              {stats.lowStock}
            </span>
            <span className="text-[12px] text-[#6B6B6B]">reorder needed</span>
          </div>
        </div>

        <div className="bg-white rounded-[6px] border border-[#E5E5E3] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-red-700 uppercase tracking-wider">
              Out of Stock
            </span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[24px] font-semibold text-red-700 font-mono">
              {stats.outOfStock}
            </span>
            <span className="text-[12px] text-[#6B6B6B]">unavailable</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[6px] border border-[#E5E5E3] p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Field */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#8C8C8C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, brand, or SKU..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] focus:outline-none focus:border-[#141414] focus:bg-white text-[#141414] placeholder-[#8C8C8C] transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] focus:outline-none focus:border-[#141414] text-[#141414] transition-colors cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] focus:outline-none focus:border-[#141414] text-[#141414] transition-colors cursor-pointer"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (&gt;5)</option>
              <option value="LOW_STOCK">Low Stock (≤5)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] focus:outline-none focus:border-[#141414] text-[#141414] transition-colors cursor-pointer"
            >
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="price-desc">Price (High → Low)</option>
              <option value="stock-asc">Stock (Lowest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-[6px] border border-[#E5E5E3] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E5E3] flex items-center justify-between bg-[#FAFAF9]">
          <span className="text-[13px] font-semibold text-[#141414]">
            Catalog Inventory ({filteredProducts.length} items)
          </span>
          <span className="text-[12px] text-[#6B6B6B]">
            Syncs live with POS database view
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-8 h-8 text-[#8C8C8C] mx-auto mb-2" />
            <p className="text-[14px] font-medium text-[#141414]">No products found</p>
            <p className="text-[12px] text-[#6B6B6B] mt-1">
              Try adjusting your search query, category, or stock status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#141414]">
              <thead className="bg-[#FAFAF9] text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider border-b border-[#E5E5E3]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock Available</th>
                  <th className="px-4 py-3">POS Color Variants</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {filteredProducts.map((p) => {
                  const stock = Number(p.available_stock ?? p.current_stock ?? 0);
                  const isOut = stock <= 0 || p.stock_status === 'OUT_OF_STOCK';
                  const isLow = stock > 0 && stock <= 5;
                  const validColors = getValidColors(p);
                  const imageUrl =
                    (p.images && p.images[0]?.public_url) ||
                    p.image_url ||
                    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=200&q=70';

                  return (
                    <tr key={p.id} className="hover:bg-[#FAFAF9]/60 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt={p.name}
                            className="w-11 h-11 object-cover rounded-[4px] border border-[#E5E5E3] bg-[#FAFAF9] flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0 max-w-[280px]">
                            <div className="font-medium text-[#141414] truncate flex items-center gap-1.5" title={p.name}>
                              <span>{p.name}</span>
                              {p.is_combo && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#B0521F] text-white shrink-0">
                                  Combo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5 mt-0.5">
                              {p.mobile_brand && (
                                <span className="px-1.5 py-0.2 rounded-[3px] bg-[#EAEAEA] text-[#141414] font-medium">
                                  {p.mobile_brand}
                                </span>
                              )}
                              <span className="font-mono text-[#8C8C8C] text-[10px]">
                                ID: {String(p.id).slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#141414]">
                            {Array.isArray(p.categories) && p.categories.length > 1
                              ? p.categories.join(' + ')
                              : p.category_name || p.category?.name || (typeof p.category === 'string' ? p.category : 'Accessories')}
                          </span>
                          {(p.subcategory_name || p.subcategory) && (
                            <span className="text-[11px] text-[#6B6B6B]">
                              {Array.isArray(p.subcategories) && p.subcategories.length > 1
                                ? p.subcategories.join(' + ')
                                : p.subcategory_name || p.subcategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="font-medium font-mono text-[#141414]">
                          {formatINR(p.selling_price || 0)}
                        </div>
                        {p.discount_percentage > 0 && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            {p.discount_percentage}% off
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${
                              isOut
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOut ? (
                              <>
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span>Out of Stock (0)</span>
                              </>
                            ) : isLow ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Low ({stock} left)</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>In Stock ({stock})</span>
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* POS Color Variants */}
                      <td className="px-4 py-3">
                        {validColors.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {validColors.slice(0, 5).map((colorName, i) => (
                              <span
                                key={i}
                                title={colorName}
                                className="w-4 h-4 rounded-full border border-[#D4D4D2] shadow-xs inline-block"
                                style={resolveColorStyle(colorName)}
                              />
                            ))}
                            {validColors.length > 5 && (
                              <span className="text-[11px] text-[#6B6B6B] font-mono">
                                +{validColors.length - 5}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#8C8C8C]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/product/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-[#141414] bg-[#FAFAF9] hover:bg-[#EAEAEA] border border-[#E5E5E3] rounded-[4px] transition-colors"
                        >
                          <span>Store</span>
                          <ExternalLink className="w-3 h-3 text-[#6B6B6B]" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProductsTab;
