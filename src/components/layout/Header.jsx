import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ArrowRight, Smartphone } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';

export function Header({
  cartCount: propCartCount,
  activeCategory = 'All',
  onCategorySelect,
  onCartClick,
}) {
  const { itemCount, openMiniCart } = useCart();
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
      <header className="sticky top-0 z-40 w-full bg-base-offwhite/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Left: Hamburger & Search on Mobile */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-11 h-11 flex items-center justify-center text-neutral-900 hover:text-accent focus-visible:outline-neutral-900 rounded-xl transition-colors"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-11 h-11 flex items-center justify-center text-neutral-900 hover:text-accent focus-visible:outline-neutral-900 rounded-xl transition-colors"
                aria-label="Search collection"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Wordmark Logo */}
            <div className="flex items-center">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className="inline-flex items-center focus-visible:outline-neutral-900 py-1"
                aria-label="WrapStore Home"
              >
                <Logo size="md" className="h-6 sm:h-7" />
              </Link>
            </div>

            {/* Desktop Navigation: Real Categories from Supabase */}
            <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className={`py-2 text-body-sm font-semibold transition-colors ${
                  activeCategory === 'All' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
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
                    className={`py-2 text-body-sm font-semibold transition-colors ${
                      isActive ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions: Search, Phone context, Cart button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 text-neutral-500 hover:text-neutral-900 text-body-sm h-11 px-3 rounded-xl border border-neutral-200 transition-colors"
                aria-label="Search site"
              >
                <Search className="w-4 h-4 text-neutral-600" />
                <span className="text-xs text-neutral-500">Search</span>
              </button>

              <button
                type="button"
                onClick={openPhoneSheet}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 h-11 px-3 rounded-xl border border-neutral-200 transition-colors"
                title="Change active phone model"
              >
                <Smartphone className="w-3.5 h-3.5 text-accent" />
                <span className="truncate max-w-[120px]">{savedPhone ? savedPhone.model : 'Select Phone'}</span>
              </button>

              <button
                type="button"
                onClick={onCartClick || openMiniCart}
                className="relative w-11 h-11 flex items-center justify-center text-neutral-900 hover:text-accent focus-visible:outline-neutral-900 rounded-xl transition-colors"
                aria-label={`Shopping bag, ${effectiveCartCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {effectiveCartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white font-sans text-[10px] font-semibold flex items-center justify-center rounded-full ring-2 ring-base-offwhite">
                    {effectiveCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-xs flex items-start justify-center pt-16 px-4 animate-fade-in"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-base-offwhite rounded-2xl border border-neutral-200 shadow-2xl p-6 animate-slide-down"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Search catalog"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs uppercase font-semibold tracking-wide text-neutral-500">Search Catalog</span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                autoFocus
                placeholder="Search phone models, cases, chargers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 pl-10 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            </div>

            {searchQuery.trim() && (
              <div className="mt-4 border-t border-neutral-200 pt-3 space-y-2 max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleProductSelect(prod.id)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-lg bg-neutral-200"
                          loading="lazy"
                        />
                        <div>
                          <p className="text-body-sm font-semibold text-neutral-900">{prod.name}</p>
                          <p className="text-xs text-neutral-500">{prod.category}</p>
                        </div>
                      </div>
                      <span className="text-body-sm font-semibold text-neutral-900">
                        ₹{prod.selling_price.toLocaleString()}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-body-sm text-neutral-500 py-4 text-center">No products found matching &quot;{searchQuery}&quot;.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-base-offwhite shadow-2xl flex flex-col justify-between p-6 animate-drawer-in overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <Logo size="sm" className="h-6" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-11 h-11 flex items-center justify-center text-neutral-600 hover:text-neutral-900"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Phone Selector Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openPhoneSheet();
                }}
                className="w-full mt-4 p-3.5 bg-neutral-900 text-white rounded-xl flex items-center justify-between font-semibold text-body-sm shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-accent" />
                  <span>{savedPhone ? savedPhone.model : 'Select Phone Model'}</span>
                </div>
                <span className="text-xs text-accent font-normal">Change</span>
              </button>

              <nav className="mt-6 flex flex-col space-y-1">
                <span className="text-xs uppercase font-semibold text-neutral-400 px-3 mb-1">
                  Categories
                </span>
                <Link
                  to="/"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onCategorySelect) onCategorySelect('All');
                  }}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-body transition-colors ${
                    activeCategory === 'All' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span>All Products</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>

                {liveCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onCategorySelect) onCategorySelect(cat.name);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-body transition-colors ${
                      activeCategory === cat.name ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-neutral-200 space-y-3">
              <Link
                to="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-body-sm font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-2"
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
