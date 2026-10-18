import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, User, LogOut, Package, MapPin } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../config/store';
import { formatINR } from '../../lib/currency';
import { useIntroReveal } from '../../hooks/useIntroReveal';

export function Header({ _activeCategory = 'All', onCategorySelect }) {
  const { itemCount } = useCart();
  const { products, categories, subcategories } = useProductsContext();
  const { user, firstName, isLoading: isAuthLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null); // 'iphone' | 'samsung' | 'accessories' | 'account' | null
  const [mobileAccordion, setMobileAccordion] = useState(null);

  const navRef = useRef(null);
  const accountRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        if (activeDropdown !== 'account') {
          setActiveDropdown(null);
        }
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        if (activeDropdown === 'account') {
          setActiveDropdown(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Prevent scroll when mobile menu is open
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

  // Count products by subcategory and category (hide anything with 0 products)
  const productCountBySubcategory = useMemo(() => {
    const counts = {};
    for (const p of products) {
      if (p.subcategory_id) {
        counts[p.subcategory_id] = (counts[p.subcategory_id] || 0) + 1;
      }
      if (p.subcategory) {
        counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  // Model series groupings
  const iphoneSeries = useMemo(() => {
    const seriesMap = {
      'iPhone 16 Series': ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16'],
      'iPhone 15 Series': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'],
      'iPhone 14 Series': ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14'],
      'iPhone 13 Series': ['iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini'],
    };

    const liveSeries = [];
    for (const [title, models] of Object.entries(seriesMap)) {
      const hasProducts = products.some((p) => {
        const isCase = (p.category || '').toLowerCase().includes('case');
        const pModels = p.compatible_models || [];
        return isCase && models.some((m) => pModels.some((pm) => pm.toLowerCase().includes(m.toLowerCase())));
      });
      if (hasProducts || liveSeries.length < 2) {
        liveSeries.push({ title, models });
      }
    }
    return liveSeries;
  }, [products]);

  const samsungSeries = useMemo(() => {
    const seriesMap = {
      'Galaxy S24 Series': ['Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+', 'Samsung Galaxy S24'],
      'Galaxy S23 Series': ['Samsung Galaxy S23 Ultra', 'Samsung Galaxy S23+', 'Samsung Galaxy S23'],
      'Galaxy Z Series': ['Samsung Galaxy Z Fold 5', 'Samsung Galaxy Z Flip 5'],
    };

    const liveSeries = [];
    for (const [title, models] of Object.entries(seriesMap)) {
      const hasProducts = products.some((p) => {
        const isCase = (p.category || '').toLowerCase().includes('case');
        const pModels = p.compatible_models || [];
        return isCase && models.some((m) => pModels.some((pm) => pm.toLowerCase().includes(m.toLowerCase())));
      });
      if (hasProducts || liveSeries.length < 2) {
        liveSeries.push({ title, models });
      }
    }
    return liveSeries;
  }, [products]);

  // Accessories subcategories that have > 0 products
  const liveAccessoriesSubcategories = useMemo(() => {
    const accCat = categories.find((c) => c.name.toLowerCase().includes('accessor') || c.name.toLowerCase().includes('gadget'));
    const accCatId = accCat?.id;

    return subcategories.filter((sub) => {
      const matchesCat = accCatId ? sub.category_id === accCatId : true;
      const count = productCountBySubcategory[sub.id] || productCountBySubcategory[sub.name] || 0;
      return matchesCat && count > 0;
    });
  }, [categories, subcategories, productCountBySubcategory]);

  const iphoneSubcategories = useMemo(() => {
    return subcategories.filter((sub) => {
      const name = sub.name.toLowerCase();
      const isApple = name.includes('apple') || name.includes('iphone');
      const count = productCountBySubcategory[sub.id] || productCountBySubcategory[sub.name] || 0;
      return isApple && count > 0;
    });
  }, [subcategories, productCountBySubcategory]);

  const samsungSubcategories = useMemo(() => {
    return subcategories.filter((sub) => {
      const name = sub.name.toLowerCase();
      const isSamsung = name.includes('samsung') || name.includes('galaxy');
      const count = productCountBySubcategory[sub.id] || productCountBySubcategory[sub.name] || 0;
      return isSamsung && count > 0;
    });
  }, [subcategories, productCountBySubcategory]);

  // Search results for dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const modelMatch = (p.compatible_models || []).some((m) => m.toLowerCase().includes(q));
        return nameMatch || catMatch || modelMatch;
      })
      .slice(0, 6);
  }, [searchQuery, products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveDropdown(null);
      setIsMobileMenuOpen(false);
      setIsSearchOpenMobile(false);
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectProduct = (productId) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    setIsSearchOpenMobile(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  const handleNavigateToListing = (params) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    const searchParams = new URLSearchParams(params);
    navigate(`/?${searchParams.toString()}`);
  };

  const handleSignOut = async () => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
  };

  const headerRevealStyle = useIntroReveal(0);

  return (
    <div style={headerRevealStyle} className="w-full">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. INFO BAR (36px, static, not rotating)
          - Left: "Visit us: <short address>"
          - Right: Call <phone> (tel: link) and WhatsApp (wa.me link)
          - Mobile: A single line with Call and WhatsApp only
          ─────────────────────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Store contact and location info"
        className="w-full h-[36px] bg-[#141414] text-[#FAFAF9] border-b border-[#141414] flex items-center px-4 sm:px-6 lg:px-8 xl:px-12 select-none z-50 text-[12px]"
      >
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between">
          {/* Desktop Left: Visit us <addressShort> linking to mapsUrl */}
          <div className="hidden sm:flex items-center gap-1.5 truncate">
            <span className="text-[#A3A3A3]">Visit us:</span>
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FAFAF9] font-medium hover:underline transition-colors"
            >
              {store.addressShort}
            </a>
          </div>

          {/* Desktop Right & Mobile Centre/Right: Call + WhatsApp */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-5">
            <a
              href={`tel:${store.phoneTel}`}
              className="text-[#FAFAF9] hover:text-[#E5E5E3] transition-colors underline-offset-2 hover:underline"
              aria-label={`Call WrapStore at ${store.phoneDisplay}`}
            >
              Call {store.phoneDisplay}
            </a>
            {store.whatsappNumber && (
              <>
                <span className="text-[#404040] select-none" aria-hidden="true">|</span>
                <a
                  href={`https://wa.me/${store.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FAFAF9] hover:text-[#E5E5E3] transition-colors underline-offset-2 hover:underline font-medium"
                  aria-label="Chat with WrapStore on WhatsApp"
                >
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. MAIN ROW (72px, solid, sticky, no blur)
          - Logo
          - Nav: iPhone Cases, Samsung Cases, Accessories, About, Contact
          - Search field
          - Account control: signed out shows "Guest", signed in shows first name with dropdown
          - Bag with count
          ─────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#FAFAF9] border-b border-[#E5E5E3] select-none">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-[72px] gap-4">
            
            {/* Left: Mobile Menu Trigger + Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden w-11 h-11 flex items-center justify-center text-[#141414] hover:text-[#6B6B6B] rounded-[6px] transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className="inline-flex items-center py-1 rounded-[6px]"
                aria-label="WrapStore Home"
              >
                <Logo size="md" />
              </Link>
            </div>

            {/* Centre Nav (Desktop Only) */}
            <nav
              ref={navRef}
              className="hidden md:flex items-center space-x-7 lg:space-x-8"
              aria-label="Main Navigation"
            >
              {/* iPhone Cases Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('iphone')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => handleNavigateToListing({ brand: 'Apple', category: 'Mobile Cases' })}
                  className={`flex items-center gap-1 text-[14px] py-4 transition-colors cursor-pointer ${
                    activeDropdown === 'iphone' ? 'font-semibold text-[#B0521F]' : 'font-medium text-[#141414] hover:text-[#B0521F]'
                  }`}
                >
                  <span>iPhone Cases</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {activeDropdown === 'iphone' && (
                  <div className="absolute top-full left-0 w-[440px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg p-4 grid grid-cols-2 gap-4 animate-fade-in z-50">
                    <div>
                      <p className="text-[12px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-1.5 mb-2">
                        By Model Series
                      </p>
                      <ul className="space-y-1.5">
                        {iphoneSeries.map((s) => (
                          <li key={s.title}>
                            <button
                              type="button"
                              onClick={() => handleNavigateToListing({ brand: 'Apple', series: s.title })}
                              className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                            >
                              {s.title}
                            </button>
                          </li>
                        ))}
                        <li>
                          <button
                            type="button"
                            onClick={() => handleNavigateToListing({ brand: 'Apple', category: 'Mobile Cases' })}
                            className="text-[12px] font-semibold text-[#B0521F] hover:underline pt-1 block cursor-pointer"
                          >
                            All iPhone Cases →
                          </button>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-1.5 mb-2">
                        Types &amp; Styles
                      </p>
                      <ul className="space-y-1.5">
                        {iphoneSubcategories.length > 0 ? (
                          iphoneSubcategories.map((sub) => (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={() => handleNavigateToListing({ subcategory: sub.name, category: 'Mobile Cases' })}
                                className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                              >
                                {sub.name}
                              </button>
                            </li>
                          ))
                        ) : (
                          <>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleNavigateToListing({ brand: 'Apple' })}
                                className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                              >
                                Protective Cases
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleNavigateToListing({ brand: 'Apple' })}
                                className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                              >
                                Leather Cases
                              </button>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Samsung Cases Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('samsung')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => handleNavigateToListing({ brand: 'Samsung', category: 'Mobile Cases' })}
                  className={`flex items-center gap-1 text-[14px] py-4 transition-colors cursor-pointer ${
                    activeDropdown === 'samsung' ? 'font-semibold text-[#B0521F]' : 'font-medium text-[#141414] hover:text-[#B0521F]'
                  }`}
                >
                  <span>Samsung Cases</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {activeDropdown === 'samsung' && (
                  <div className="absolute top-full left-0 w-[440px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg p-4 grid grid-cols-2 gap-4 animate-fade-in z-50">
                    <div>
                      <p className="text-[12px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-1.5 mb-2">
                        By Model Series
                      </p>
                      <ul className="space-y-1.5">
                        {samsungSeries.map((s) => (
                          <li key={s.title}>
                            <button
                              type="button"
                              onClick={() => handleNavigateToListing({ brand: 'Samsung', series: s.title })}
                              className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                            >
                              {s.title}
                            </button>
                          </li>
                        ))}
                        <li>
                          <button
                            type="button"
                            onClick={() => handleNavigateToListing({ brand: 'Samsung', category: 'Mobile Cases' })}
                            className="text-[12px] font-semibold text-[#B0521F] hover:underline pt-1 block cursor-pointer"
                          >
                            All Samsung Cases →
                          </button>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-1.5 mb-2">
                        Types &amp; Styles
                      </p>
                      <ul className="space-y-1.5">
                        {samsungSubcategories.length > 0 ? (
                          samsungSubcategories.map((sub) => (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={() => handleNavigateToListing({ subcategory: sub.name, category: 'Mobile Cases' })}
                                className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                              >
                                {sub.name}
                              </button>
                            </li>
                          ))
                        ) : (
                          <>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleNavigateToListing({ brand: 'Samsung' })}
                                className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                              >
                                Armor Cases
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleNavigateToListing({ brand: 'Samsung' })}
                                className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors w-full text-left py-1 cursor-pointer"
                              >
                                Clear Hybrid Cases
                              </button>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Accessories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('accessories')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => handleNavigateToListing({ category: 'Accessories' })}
                  className={`flex items-center gap-1 text-[14px] py-4 transition-colors cursor-pointer ${
                    activeDropdown === 'accessories' ? 'font-semibold text-[#B0521F]' : 'font-medium text-[#141414] hover:text-[#B0521F]'
                  }`}
                >
                  <span>Accessories</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {activeDropdown === 'accessories' && (
                  <div className="absolute top-full left-0 w-[420px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg p-4 animate-fade-in z-50">
                    <p className="text-[12px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-1.5 mb-2">
                      Accessories Collection
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {liveAccessoriesSubcategories.length > 0 ? (
                        liveAccessoriesSubcategories.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleNavigateToListing({ subcategory: sub.name, category: 'Accessories' })}
                            className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors text-left py-1 cursor-pointer"
                          >
                            {sub.name}
                          </button>
                        ))
                      ) : (
                        ['Tempered Glass', 'Lens Protector', 'Cables', 'Power Bank', 'Watch Strap', 'AirPods Cases'].map(
                          (name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => handleNavigateToListing({ subcategory: name, category: 'Accessories' })}
                              className="text-[14px] text-[#6B6B6B] hover:text-[#141414] transition-colors text-left py-1 cursor-pointer"
                            >
                              {name}
                            </button>
                          )
                        )
                      )}
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#E5E5E3]">
                      <button
                        type="button"
                        onClick={() => handleNavigateToListing({ category: 'Accessories' })}
                        className="text-[12px] font-semibold text-[#B0521F] hover:underline cursor-pointer"
                      >
                        Browse all accessories →
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </nav>

            {/* Right: Search + Account Control + Bag */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Desktop Visible Search Field */}
              <div className="relative hidden md:block w-[200px] lg:w-[260px] xl:w-[300px]">
                <form onSubmit={handleSearchSubmit}>
                  <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search phone or case"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-[6px] pl-9 pr-3 py-1.5 min-h-[40px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414] transition-colors"
                  />
                </form>

                {/* Instant Search Dropdown on Desktop */}
                {searchQuery.trim().length > 1 && (
                  <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg p-2 space-y-1 z-50 animate-fade-in max-h-[300px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p.id)}
                          className="w-full px-2.5 py-2 text-left hover:bg-[#FAFAF9] rounded-[6px] flex items-center justify-between text-[14px] transition-colors cursor-pointer"
                        >
                          <span className="text-[#141414] truncate mr-2 font-medium">{p.name}</span>
                          <span className="text-[#B0521F] font-semibold shrink-0 text-[12px] tabular-nums">{formatINR(p.selling_price)}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-[12px] text-[#6B6B6B] text-center">
                        No matches found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setIsSearchOpenMobile((prev) => !prev)}
                className="md:hidden w-11 h-11 flex items-center justify-center text-[#141414] hover:text-[#6B6B6B] rounded-[6px] cursor-pointer"
                aria-label="Toggle mobile search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* ─────────────────────────────────────────────────────────────────
                  Account Control (Desktop & Mobile)
                  - Auth loading: neutral placeholder, NEVER "Guest"
                  - Signed out: "Login" linking to /login
                  - Signed in: first name with dropdown menu (Orders, Saved addresses, Profile, Sign out)
                  ───────────────────────────────────────────────────────────────── */}
              <div ref={accountRef} className="relative">
                {isAuthLoading ? (
                  <div className="w-12 h-5 bg-[#E5E5E3] rounded animate-pulse" aria-hidden="true" />
                ) : user ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'account' ? null : 'account')}
                      className="inline-flex items-center gap-1 text-[14px] font-medium text-[#141414] hover:text-[#B0521F] transition-colors min-h-[44px] px-2 rounded-[6px] cursor-pointer"
                      aria-label="Account menu"
                      aria-expanded={activeDropdown === 'account'}
                    >
                      <User className="w-4 h-4 text-[#6B6B6B]" />
                      <span className="hidden sm:inline">{firstName || 'Account'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    </button>

                    {activeDropdown === 'account' && (
                      <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg py-2 z-50 animate-fade-in">
                        <div className="px-3 py-1.5 border-b border-[#E5E5E3] mb-1">
                          <p className="text-[12px] text-[#6B6B6B]">Signed in as</p>
                          <p className="text-[14px] font-medium text-[#141414] truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/account?tab=orders"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
                        >
                          <Package className="w-4 h-4 text-[#6B6B6B]" />
                          <span>Orders</span>
                        </Link>
                        <Link
                          to="/account?tab=addresses"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                          <span>Saved addresses</span>
                        </Link>
                        <Link
                          to="/account?tab=profile"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
                        >
                          <User className="w-4 h-4 text-[#6B6B6B]" />
                          <span>Profile</span>
                        </Link>
                        <div className="border-t border-[#E5E5E3] my-1" />
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#B0521F] hover:bg-[#FAFAF9] transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center text-[14px] font-medium text-[#141414] hover:text-[#B0521F] transition-colors min-h-[44px] px-2"
                  >
                    Login
                  </Link>
                )}
              </div>

              {/* Bag with Count */}
              <Link
                to="/cart"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#141414] hover:text-[#B0521F] transition-colors min-h-[44px] px-2 rounded-[6px]"
                aria-label={`Shopping bag with ${itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="tabular-nums">Bag ({itemCount})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Expandable */}
        {isSearchOpenMobile && (
          <div className="md:hidden border-t border-[#E5E5E3] bg-[#FAFAF9] p-3 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search phone or case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5E5E3] rounded-[6px] pl-9 pr-3 py-2 min-h-[44px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414]"
              />
            </form>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. MOBILE FULL-SCREEN ACCORDION MENU
          ─────────────────────────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#FAFAF9] flex flex-col animate-fade-in md:hidden overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between h-[72px] px-4 border-b border-[#E5E5E3]">
            <Logo size="md" />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center text-[#141414] rounded-[6px] cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Accordions & Links */}
          <div className="p-4 space-y-3 flex-1">
            
            {/* Accordion: iPhone Cases */}
            <div className="border border-[#E5E5E3] rounded-[6px] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileAccordion(mobileAccordion === 'iphone' ? null : 'iphone')}
                className="w-full min-h-[48px] px-4 flex items-center justify-between text-[16px] font-semibold text-[#141414] cursor-pointer"
              >
                <span>iPhone Cases</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                    mobileAccordion === 'iphone' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileAccordion === 'iphone' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#E5E5E3] space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-semibold text-[#6B6B6B]">Series</p>
                    {iphoneSeries.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => handleNavigateToListing({ brand: 'Apple', series: s.title })}
                        className="block w-full text-left py-1 text-[14px] text-[#141414] cursor-pointer"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigateToListing({ brand: 'Apple', category: 'Mobile Cases' })}
                    className="text-[12px] font-semibold text-[#B0521F] underline block pt-1 cursor-pointer"
                  >
                    View All iPhone Cases →
                  </button>
                </div>
              )}
            </div>

            {/* Accordion: Samsung Cases */}
            <div className="border border-[#E5E5E3] rounded-[6px] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileAccordion(mobileAccordion === 'samsung' ? null : 'samsung')}
                className="w-full min-h-[48px] px-4 flex items-center justify-between text-[16px] font-semibold text-[#141414] cursor-pointer"
              >
                <span>Samsung Cases</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                    mobileAccordion === 'samsung' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileAccordion === 'samsung' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#E5E5E3] space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-semibold text-[#6B6B6B]">Series</p>
                    {samsungSeries.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => handleNavigateToListing({ brand: 'Samsung', series: s.title })}
                        className="block w-full text-left py-1 text-[14px] text-[#141414] cursor-pointer"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigateToListing({ brand: 'Samsung', category: 'Mobile Cases' })}
                    className="text-[12px] font-semibold text-[#B0521F] underline block pt-1 cursor-pointer"
                  >
                    View All Samsung Cases →
                  </button>
                </div>
              )}
            </div>

            {/* Accordion: Accessories */}
            <div className="border border-[#E5E5E3] rounded-[6px] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileAccordion(mobileAccordion === 'accessories' ? null : 'accessories')}
                className="w-full min-h-[48px] px-4 flex items-center justify-between text-[16px] font-semibold text-[#141414] cursor-pointer"
              >
                <span>Accessories</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#6B6B6B] transition-transform ${
                    mobileAccordion === 'accessories' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileAccordion === 'accessories' && (
                <div className="px-4 pb-4 pt-1 border-t border-[#E5E5E3] space-y-1.5">
                  {liveAccessoriesSubcategories.length > 0 ? (
                    liveAccessoriesSubcategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleNavigateToListing({ subcategory: sub.name, category: 'Accessories' })}
                        className="block w-full text-left py-1 text-[14px] text-[#141414] cursor-pointer"
                      >
                        {sub.name}
                      </button>
                    ))
                  ) : (
                    ['Tempered Glass', 'Lens Protector', 'Cables', 'Watch Strap'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleNavigateToListing({ subcategory: name, category: 'Accessories' })}
                        className="block w-full text-left py-1 text-[14px] text-[#141414] cursor-pointer"
                      >
                        {name}
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => handleNavigateToListing({ category: 'Accessories' })}
                    className="text-[12px] font-semibold text-[#B0521F] underline block pt-1 cursor-pointer"
                  >
                    View All Accessories →
                  </button>
                </div>
              )}
            </div>

            {/* Direct Links: About, Contact, Account, Track order */}
            <div className="pt-2 space-y-2">
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block min-h-[44px] px-4 py-2.5 rounded-[6px] bg-white border border-[#E5E5E3] text-[14px] font-medium text-[#141414]"
              >
                About WrapStore
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block min-h-[44px] px-4 py-2.5 rounded-[6px] bg-white border border-[#E5E5E3] text-[14px] font-medium text-[#141414]"
              >
                Contact &amp; Store Location
              </Link>
              <Link
                to={user ? '/account' : '/login'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block min-h-[44px] px-4 py-2.5 rounded-[6px] bg-white border border-[#E5E5E3] text-[14px] font-medium text-[#141414]"
              >
                {user ? `Account (${firstName || 'User'})` : 'Login'}
              </Link>
              <Link
                to="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block min-h-[44px] px-4 py-2.5 rounded-[6px] bg-white border border-[#E5E5E3] text-[14px] font-medium text-[#141414]"
              >
                Track order
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
