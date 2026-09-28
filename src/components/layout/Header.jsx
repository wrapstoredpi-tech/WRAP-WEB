import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Logo } from '../ui/Logo';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';

export function Header({
  cartCount: propCartCount,
  activeCategory = 'New Arrivals',
  onCategorySelect,
  onCartClick,
}) {
  const { itemCount, openMiniCart } = useCart();
  const { products: liveProducts, categories: liveCategories, subcategories: liveSubcategories } = useProductsContext();
  const effectiveCartCount = propCartCount !== undefined ? propCartCount : itemCount;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const navigate = useNavigate();

  // Build nav from real categories + "New Arrivals" sentinel
  const navCategories = useMemo(() => {
    const catItems = liveCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      href: `/?category=${encodeURIComponent(cat.name)}`,
      // subcategories nested under this category
      subs: liveSubcategories.filter((s) => s.category_id === cat.id),
    }));
    return [
      { id: '__new', name: 'New Arrivals', href: '/', badge: 'New', subs: [] },
      ...catItems,
      { id: '__brand', name: 'Shop by Brand', href: '/#brand-select', subs: [] },
    ];
  }, [liveCategories, liveSubcategories]);

  // Filter search results dynamically
  const searchResults = searchQuery.trim()
    ? liveProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.mobile_brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.compatible_models || []).some((m) =>
            m.toLowerCase().includes(searchQuery.toLowerCase())
          )
      ).slice(0, 4)
    : [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProductSelect = (productId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  return (
    <>
      <header
        className={`
          sticky top-0 z-40 w-full transition-all duration-300
          ${
            isScrolled
              ? 'bg-base-offwhite/95 backdrop-blur-md shadow-subtle-header border-b border-neutral-200/80 py-3'
              : 'bg-base-offwhite border-b border-neutral-200/50 py-3.5 sm:py-4'
          }
        `}
      >
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left: Mobile Hamburger Toggle */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-neutral-900 hover:text-accent focus-visible:outline-accent transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-5 h-5" strokeWidth={1.8} />
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-neutral-900 hover:text-accent focus-visible:outline-accent transition-colors ml-1"
                aria-label="Search items"
              >
                <Search className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('New Arrivals')}
                className="group inline-flex items-center focus-visible:outline-accent py-0.5"
                aria-label="WrapStore Home"
              >
                <Logo size="md" className="h-7 sm:h-8 hover:opacity-90 transition-opacity" />
              </Link>
            </div>

            {/* Desktop Navigation — built from real categories */}
            <nav
              className="hidden md:flex items-center space-x-7 lg:space-x-9"
              aria-label="Primary Navigation"
            >
              {navCategories.map((cat) => {
                const isActive = activeCategory === cat.name;
                const hasSubs = cat.subs && cat.subs.length > 0;
                return (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => hasSubs && setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      to={cat.href}
                      onClick={() => {
                        if (onCategorySelect) onCategorySelect(cat.name);
                        setHoveredCategory(null);
                      }}
                      className={`
                        relative py-1.5 text-body-sm font-medium tracking-wide transition-colors
                        flex items-center gap-1
                        ${
                          isActive
                            ? 'text-neutral-900 font-semibold'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }
                      `}
                    >
                      <span>{cat.name}</span>
                      {cat.badge && (
                        <span className="ml-1.5 align-middle">
                          <Badge variant="accent" size="sm">
                            {cat.badge}
                          </Badge>
                        </span>
                      )}
                      {hasSubs && <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full animate-fade-in" />
                      )}
                    </Link>

                    {/* Subcategory dropdown */}
                    {hasSubs && hoveredCategory === cat.id && (
                      <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-base-offwhite border border-neutral-200 shadow-lg z-50 py-1 animate-fade-in">
                        {cat.subs.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                            onClick={() => {
                              if (onCategorySelect) onCategorySelect(cat.name);
                              setHoveredCategory(null);
                            }}
                            className="block px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {/* Desktop Search */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 text-neutral-500 hover:text-neutral-900 text-body-sm py-1.5 px-2.5 rounded-none border border-transparent hover:border-neutral-200 transition-colors"
                aria-label="Search collection"
              >
                <Search className="w-4 h-4 text-neutral-700" strokeWidth={1.8} />
                <span className="text-xs text-neutral-400 font-sans tracking-wide">Search</span>
              </button>

              {/* Account Icon */}
              <button
                type="button"
                onClick={() => navigate('/track-order')}
                className="p-2 text-neutral-700 hover:text-accent transition-colors focus-visible:outline-accent flex items-center justify-center"
                aria-label="Account & Orders"
                title="Account & Orders"
              >
                <User className="w-5 h-5" strokeWidth={1.8} />
              </button>

              {/* Cart Button */}
              <button
                type="button"
                onClick={onCartClick || openMiniCart}
                className="relative p-2 text-neutral-900 hover:text-accent transition-colors focus-visible:outline-accent flex items-center justify-center"
                aria-label={`Shopping bag, ${effectiveCartCount} items`}
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.8} />
                {effectiveCartCount > 0 && (
                  <span
                    className="
                      absolute top-1 right-0.5 min-w-[17px] h-[17px] px-1
                      flex items-center justify-center
                      bg-accent text-white font-sans text-[10px] font-semibold
                      leading-none tracking-tight rounded-full ring-2 ring-base-offwhite
                    "
                  >
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
          className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-base-offwhite border border-neutral-300 shadow-2xl p-6 sm:p-8 animate-slide-down"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search store"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <span className="text-metadata uppercase text-neutral-500">Search Catalog</span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 p-1"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 relative">
              <input
                type="text"
                autoFocus
                placeholder="Search phone cases, leather sleeves, desk mats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-100 border border-neutral-300 px-4 py-3.5 pl-11 text-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-accent"
              />
              <Search className="w-5 h-5 text-neutral-500 absolute left-3.5 top-3.5" />
            </div>

            {searchQuery.trim() && (
              <div className="mt-4 border-t border-neutral-200 pt-4 space-y-2 max-h-64 overflow-y-auto">
                <span className="text-metadata uppercase text-neutral-400 font-semibold block">
                  Results ({searchResults.length})
                </span>
                {searchResults.length > 0 ? (
                  searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleProductSelect(prod.id)}
                      className="w-full text-left p-2.5 hover:bg-neutral-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-10 h-10 object-cover bg-neutral-200"
                        />
                        <div>
                          <p className="text-body-sm font-medium text-neutral-900">{prod.name}</p>
                          <p className="text-xs text-neutral-500">{prod.category} &bull; {prod.mobile_brand}</p>
                        </div>
                      </div>
                      <span className="text-body-sm font-semibold text-neutral-900">
                        ₹{prod.selling_price.toLocaleString()}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-body-sm text-neutral-500 py-2">No matching products found.</p>
                )}
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-editorial text-neutral-400 font-semibold mb-3">
                  Suggested Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {['iPhone 16 Pro', 'MacBook Felt Sleeve', 'Desk Mat', 'MagSafe Card'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 border border-neutral-200/80 transition-colors"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Slide-out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            className="
              fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-base-offwhite
              shadow-2xl border-r border-neutral-200 flex flex-col justify-between
              animate-drawer-in p-6 z-10 overflow-y-auto
            "
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                <Logo size="sm" className="h-6" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-neutral-600 hover:text-neutral-900 focus-visible:outline-accent"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" strokeWidth={1.8} />
                </button>
              </div>

              {/* Mobile Nav — real categories with subcategories */}
              <nav className="mt-6 flex flex-col space-y-1">
                <span className="text-metadata uppercase text-neutral-400 mb-2 px-3">
                  Categories
                </span>

                {/* New Arrivals */}
                <Link
                  to="/"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onCategorySelect) onCategorySelect('New Arrivals');
                  }}
                  className={`
                    flex items-center justify-between px-3 py-3.5 text-body font-medium transition-colors
                    ${
                      activeCategory === 'New Arrivals'
                        ? 'bg-neutral-100 text-neutral-950 font-semibold border-l-2 border-accent pl-3.5'
                        : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/50'
                    }
                  `}
                >
                  <span className="tracking-wide">New Arrivals</span>
                  <Badge variant="accent" size="sm">New</Badge>
                </Link>

                {/* Real categories */}
                {liveCategories.map((cat) => {
                  const isActive = activeCategory === cat.name;
                  const subs = liveSubcategories.filter((s) => s.category_id === cat.id);
                  return (
                    <div key={cat.id}>
                      <Link
                        to={`/?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onCategorySelect) onCategorySelect(cat.name);
                        }}
                        className={`
                          flex items-center justify-between px-3 py-3.5 text-body font-medium transition-colors
                          ${
                            isActive
                              ? 'bg-neutral-100 text-neutral-950 font-semibold border-l-2 border-accent pl-3.5'
                              : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/50'
                          }
                        `}
                      >
                        <span className="tracking-wide">{cat.name}</span>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                      </Link>
                      {/* Nested subcategories */}
                      {isActive && subs.length > 0 && (
                        <div className="ml-4 border-l border-neutral-200 pl-3 pb-1 space-y-0.5">
                          {subs.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block px-2 py-2 text-body-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Link
                  to="/#brand-select"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-3.5 text-body font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/50 transition-colors"
                >
                  <span className="tracking-wide">Shop by Brand</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-neutral-200 space-y-4">
              <div className="space-y-2 text-body-sm text-neutral-500">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-1.5 hover:text-neutral-900"
                >
                  All Carry Objects
                </Link>
              </div>

              <div className="px-3 pt-2 text-metadata uppercase text-neutral-400">
                Crafted for longevity
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
