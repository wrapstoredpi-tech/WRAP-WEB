import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ArrowRight, Smartphone } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { formatINR } from '../../lib/currency';

export function Header({
  cartCount: propCartCount,
  activeCategory = 'All',
  onCategorySelect,
}) {
  const { itemCount } = useCart();
  const { products: liveProducts, categories: liveCategories } = useProductsContext();
  const { savedPhone, openPhoneSheet } = usePhoneContext();
  const effectiveCartCount = propCartCount !== undefined ? propCartCount : itemCount;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Search results filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return liveProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.mobile_brand || '').toLowerCase().includes(q) ||
          (p.compatible_models || []).some((m) => m.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [searchQuery, liveProducts]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleProductSelect = (productId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FAFAF9]/90 backdrop-blur-md border-b border-[#E7E5E4]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Left: Mobile Menu & Search Trigger */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-10 h-10 flex items-center justify-center text-[#141414] hover:text-[#666664] rounded-lg transition-colors focus-visible:outline-[#141414]"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 flex items-center justify-center text-[#141414] hover:text-[#666664] rounded-lg transition-colors focus-visible:outline-[#141414]"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Wordmark Logo */}
            <div className="flex items-center">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className="inline-flex items-center focus-visible:outline-[#141414] py-1"
                aria-label="WrapStore Home"
              >
                <Logo size="md" />
              </Link>
            </div>

            {/* Desktop Navigation: Real Categories from Supabase */}
            <nav className="hidden md:flex items-center space-x-7" aria-label="Main Navigation">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className={`text-[14px] py-1 transition-colors ${
                  activeCategory === 'All'
                    ? 'text-[#141414] font-semibold border-b border-[#141414]'
                    : 'text-[#666664] hover:text-[#141414] font-normal'
                }`}
              >
                All Products
              </Link>

              {liveCategories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <Link
                    key={cat.id}
                    to={`/?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => onCategorySelect && onCategorySelect(cat.name)}
                    className={`text-[14px] py-1 transition-colors ${
                      isActive
                        ? 'text-[#141414] font-semibold border-b border-[#141414]'
                        : 'text-[#666664] hover:text-[#141414] font-normal'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions: Search, Phone context, Cart */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 text-[#666664] hover:text-[#141414] text-[13px] h-9 px-3 rounded-lg border border-[#E7E5E4] hover:border-[#D6D3D1] transition-colors"
                aria-label="Search catalog"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="font-normal">Search</span>
              </button>

              <button
                type="button"
                onClick={openPhoneSheet}
                className="hidden sm:flex items-center gap-1.5 text-[13px] text-[#141414] hover:text-[#666664] h-9 px-3 rounded-lg border border-[#E7E5E4] hover:border-[#D6D3D1] transition-colors"
                title="Select phone model"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#666664]" />
                <span className="truncate max-w-[130px] font-normal">
                  {savedPhone ? savedPhone.model : 'Select Phone'}
                </span>
              </button>

              <Link
                to="/cart"
                className="relative w-10 h-10 flex items-center justify-center text-[#141414] hover:text-[#666664] rounded-lg transition-colors focus-visible:outline-[#141414]"
                aria-label={`Shopping bag, ${effectiveCartCount} items`}
              >
                <ShoppingBag className="w-4 h-4" />
                {effectiveCartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#141414] text-white text-[10px] font-semibold flex items-center justify-center rounded-full leading-none">
                    {effectiveCartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search Dialog (Quiet modal elevation) ────────────────────────── */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#141414]/30 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg border border-[#E7E5E4] shadow-modal p-5 sm:p-6 animate-slide-down"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Search catalog"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
              <span className="text-[12px] font-semibold tracking-tight text-[#666664] uppercase">
                Search Catalog
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#666664] hover:text-[#141414] rounded-md transition-colors"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                autoFocus
                placeholder="Type device, case name, or accessory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-4 py-2.5 pl-9 text-[14px] text-[#141414] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#141414] transition-colors"
              />
              <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3 pointer-events-none" />
            </div>

            {searchQuery.trim() && (
              <div className="mt-4 border-t border-[#E7E5E4] pt-3 space-y-1 max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleProductSelect(prod.id)}
                      className="w-full text-left p-2.5 rounded-md hover:bg-[#FAFAF9] flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-9 h-11 object-cover rounded-md bg-[#F5F5F4]"
                          loading="lazy"
                        />
                        <div>
                          <p className="text-[14px] font-semibold text-[#141414]">{prod.name}</p>
                          <p className="text-[12px] text-[#666664]">{prod.category}</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold text-[#141414]">
                        {formatINR(prod.selling_price)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-[13px] text-[#666664] py-6 text-center">
                    No results found for &ldquo;{searchQuery}&rdquo;.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Navigation Drawer ────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#141414]/30 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-[#FAFAF9] border-r border-[#E7E5E4] shadow-modal flex flex-col justify-between p-6 animate-drawer-in overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 flex items-center justify-center text-[#666664] hover:text-[#141414] rounded-md"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Phone Selector Quick Action */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openPhoneSheet();
                }}
                className="w-full mt-4 p-3 bg-white border border-[#E7E5E4] rounded-lg flex items-center justify-between text-[13px] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#666664]" />
                  <span className="font-semibold text-[#141414]">
                    {savedPhone ? savedPhone.model : 'Select Phone Model'}
                  </span>
                </div>
                <span className="text-[12px] text-[#666664]">Edit</span>
              </button>

              <nav className="mt-6 flex flex-col space-y-1">
                <span className="text-[11px] uppercase font-semibold text-[#A8A29E] px-3 mb-1">
                  Catalog
                </span>
                <Link
                  to="/"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onCategorySelect) onCategorySelect('All');
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-[14px] transition-colors ${
                    activeCategory === 'All'
                      ? 'bg-[#E7E5E4]/60 text-[#141414] font-semibold'
                      : 'text-[#666664] hover:text-[#141414]'
                  }`}
                >
                  <span>All Products</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                </Link>

                {liveCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onCategorySelect) onCategorySelect(cat.name);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-[14px] transition-colors ${
                      activeCategory === cat.name
                        ? 'bg-[#E7E5E4]/60 text-[#141414] font-semibold'
                        : 'text-[#666664] hover:text-[#141414]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E7E5E4]">
              <Link
                to="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[13px] text-[#666664] hover:text-[#141414] px-3 py-1 font-normal"
              >
                Track Order
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
