import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  Package,
  MapPin,
  Heart,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { MobileMenuPage } from './MobileMenuPage';
import { useCart } from '../../context/CartContext';
import { useProductsContext } from '../../context/ProductsContext';
import { usePhoneContext } from '../../context/PhoneContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { store } from '../../config/store';
import { formatINR } from '../../lib/currency';
import { useIntroReveal } from '../../hooks/useIntroReveal';
import {
  getLiveModelsWithCases,
  hasLiveCasesForBrand,
  getModelCaseDesigns,
  getLiveAccessorySubcategories,
  getLiveCombos,
  modelToSlug,
} from '../../lib/models';
import { ComboThumbnail } from '../cart/ComboThumbnail';

export function Header({ _activeCategory = 'All', onCategorySelect }) {
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const { products = [], subcategories = [] } = useProductsContext();
  const { user, firstName, isLoading: isAuthLoading, signOut } = useAuth();
  const { savedPhone } = usePhoneContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isProductPage = location.pathname.startsWith('/product/');
  const isReducedHeader = location.pathname === '/cart' || location.pathname === '/checkout';

  const handleProductBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      navigate(-1);
    } else if (savedPhone?.model) {
      navigate(`/cases/${(savedPhone.brand || 'apple').toLowerCase()}/${modelToSlug(savedPhone.model)}`);
    } else {
      navigate('/cases');
    }
  };

  const handleProductShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title || 'WrapStore Case',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      window.dispatchEvent(new CustomEvent('wrapstore:toast', { detail: 'Link copied' }));
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.__TEST_MOBILE_MENU_OPEN__) return true;
    return false;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null); // 'account' | null
  const [activeMegaMenu, setActiveMegaMenu] = useState(() => {
    if (typeof window !== 'undefined' && window.__TEST_ACTIVE_MEGA_MENU__) return window.__TEST_ACTIVE_MEGA_MENU__;
    return null;
  }); // 'iphone' | 'samsung' | 'accessories' | 'combos' | null

  const headerRef = useRef(null);
  const accountRef = useRef(null);
  const megaMenuTimeoutRef = useRef(null);

  // Close mega menu and account dropdown on Escape or outside click
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActiveMegaMenu(null);
        setActiveDropdown(null);
        setIsSearchOpen(false);
      }
    }

    function handleClickOutside(event) {
      if (typeof window !== 'undefined' && (window.__TEST_ACTIVE_MEGA_MENU__ || window.__TEST_MOBILE_MENU_OPEN__)) return;
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        if (activeDropdown === 'account') {
          setActiveDropdown(null);
        }
      }
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveMegaMenu(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Close menus on route change
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.__TEST_ACTIVE_MEGA_MENU__ || window.__TEST_MOBILE_MENU_OPEN__)) return;
    setActiveMegaMenu(null);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

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

  // Derived live catalogue data
  const hasSamsungCases = useMemo(() => {
    return hasLiveCasesForBrand(products, 'Samsung');
  }, [products]);

  const liveAppleModels = useMemo(() => {
    return getLiveModelsWithCases(products, 'Apple');
  }, [products]);

  const liveSamsungModels = useMemo(() => {
    return getLiveModelsWithCases(products, 'Samsung');
  }, [products]);

  // Mega menu model cards (max 6 columns)
  const appleMenuColumns = useMemo(() => {
    const models = liveAppleModels.slice(0, 6);
    return models.map((m) => getModelCaseDesigns(products, m, 'Apple'));
  }, [products, liveAppleModels]);

  const samsungMenuColumns = useMemo(() => {
    const models = liveSamsungModels.slice(0, 6);
    return models.map((m) => getModelCaseDesigns(products, m, 'Samsung'));
  }, [products, liveSamsungModels]);

  const liveAccessorySubs = useMemo(() => {
    return getLiveAccessorySubcategories(products, subcategories);
  }, [products, subcategories]);

  const liveCombos = useMemo(() => {
    return getLiveCombos(products, 3);
  }, [products]);

  const hasCombos = liveCombos.length > 0;

  // Search results for dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter((p) => {
        const nameMatch = (p?.name || '').toLowerCase().includes(q);
        const catMatch =
          (p.category || '').toLowerCase().includes(q) ||
          (Array.isArray(p.categories) && p.categories.some((c) => (c || '').toLowerCase().includes(q)));
        const subMatch =
          (p.subcategory || '').toLowerCase().includes(q) ||
          (Array.isArray(p.subcategories) && p.subcategories.some((s) => (s || '').toLowerCase().includes(q)));
        const modelMatch = (p.compatible_models || []).some((m) => m.toLowerCase().includes(q));
        const comboMatch = p.is_combo && 'combo'.includes(q);
        return nameMatch || catMatch || subMatch || modelMatch || comboMatch;
      })
      .slice(0, 6);
  }, [searchQuery, products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveMegaMenu(null);
      setIsSearchOpen(false);
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectProduct = (productId) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setActiveMegaMenu(null);
    navigate(`/product/${productId}`);
  };

  const handleSignOut = async () => {
    setActiveDropdown(null);
    await signOut();
    navigate('/');
  };

  // Mega menu hover delay handler (120ms debounce)
  const handleNavMouseEnter = (menuKey) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(menuKey);
    }, 120);
  };

  const handleNavMouseLeave = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 180);
  };

  const handleNavClick = (menuKey) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    setActiveMegaMenu(activeMegaMenu === menuKey ? null : menuKey);
  };

  const cancelMenuClose = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
  };

  // Active check for desktop navigation links
  const isIphoneActive = location.pathname.startsWith('/cases/apple') || (location.pathname === '/cases' && location.search.toLowerCase().includes('apple'));
  const isSamsungActive = location.pathname.startsWith('/cases/samsung') || (location.pathname === '/cases' && location.search.toLowerCase().includes('samsung'));
  const isAccessoriesActive = location.search.toLowerCase().includes('category=accessories') || location.pathname === '/accessories';
  const isCombosActive = location.pathname === '/combos' || location.search.toLowerCase().includes('category=combos');
  const isStoreActive = location.pathname === '/contact';

  const isHome = location.pathname === '/';
  const headerRevealStyle = useIntroReveal(0);

  // Reusable Account dropdown menu for desktop header
  const renderAccountMenu = () => (
    <div ref={accountRef} className="relative">
      {isAuthLoading ? (
        <div className="w-10 h-10 rounded-full bg-[#E5E5E3] animate-pulse" aria-hidden="true" />
      ) : user ? (
        <div>
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'account' ? null : 'account')}
            className="h-11 min-h-[44px] px-3 flex items-center gap-2 text-[#141414] hover:text-[#B0521F] hover:bg-[#F4F3F0] rounded-[6px] transition-colors cursor-pointer text-[14px] font-medium"
            aria-label="Account menu"
            aria-expanded={activeDropdown === 'account'}
          >
            <User className="w-4 h-4 text-[#B0521F]" />
            <span className="truncate max-w-[120px]">{firstName || 'Account'}</span>
          </button>

          {activeDropdown === 'account' && (
            <div className="absolute right-0 top-full mt-2 w-[220px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg py-2 z-50 animate-fade-in">
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
                <span>My Orders</span>
              </Link>
              <Link
                to="/favorites"
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
              >
                <Heart className="w-4 h-4 text-[#B0521F]" />
                <span>Favourites ({favoriteCount})</span>
              </Link>
              <Link
                to="/track-order"
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                <span>Track order</span>
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
        <div>
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'account' ? null : 'account')}
            className="h-11 min-h-[44px] px-3 flex items-center gap-2 text-[#141414] hover:text-[#B0521F] hover:bg-[#F4F3F0] rounded-[6px] transition-colors cursor-pointer text-[14px] font-medium"
            aria-label="Guest menu"
            aria-expanded={activeDropdown === 'account'}
          >
            <User className="w-4 h-4 text-[#6B6B6B]" />
            <span>Guest</span>
          </button>

          {activeDropdown === 'account' && (
            <div className="absolute right-0 top-full mt-2 w-[220px] bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg py-2 z-50 animate-fade-in">
              <Link
                to="/login"
                onClick={() => setActiveDropdown(null)}
                className="block px-3 py-2 text-[14px] font-semibold text-[#B0521F] hover:bg-[#FAFAF9] transition-colors"
              >
                Log in or sign up →
              </Link>
              <Link
                to="/favorites"
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
              >
                <Heart className="w-4 h-4 text-[#B0521F]" />
                <span>Favourites ({favoriteCount})</span>
              </Link>
              <Link
                to="/track-order"
                onClick={() => setActiveDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#141414] hover:bg-[#FAFAF9] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                <span>Track order</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div ref={headerRef} style={headerRevealStyle} className="w-full relative z-40">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. INFO BAR (36px, static - hidden on reduced header for cart/checkout)
          ─────────────────────────────────────────────────────────────────────────── */}
      {!isReducedHeader && (
        <aside
          aria-label="Store contact and location info"
          className="w-full h-[36px] bg-[#141414] text-[#FAFAF9] border-b border-[#141414] flex items-center px-4 md:px-6 lg:px-8 select-none z-50 text-[12px]"
        >
          <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-1.5 truncate">
              <span className="text-[#A3A3A3]">Visit us:</span>
              <Link
                to="/contact"
                className="text-[#FAFAF9] font-medium hover:underline transition-colors"
              >
                {store.addressShort}
              </Link>
            </div>

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
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          2. MAIN HEADER (72px Desktop, 56px Mobile)
          Solid white, 1px bottom border, sticky, no blur
          ─────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 w-full bg-white border-b border-[#E5E5E3] select-none z-30">
        {/* MOBILE & TABLET HEADER (< 1024px): 56px */}
        {isReducedHeader ? (
          /* Reduced mobile header for /cart and /checkout (Logo and account only) */
          <div className="lg:hidden h-[56px] px-4 flex items-center justify-between relative">
            <Link
              to="/"
              onClick={() => onCategorySelect && onCategorySelect('All')}
              className="inline-flex items-center py-1"
              aria-label="WrapStore Home"
            >
              <Logo size="sm" />
            </Link>

            <Link
              to={user ? '/account' : '/login'}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] rounded-[6px] transition-colors"
              aria-label={user ? `Account (${firstName || 'User'})` : 'Login'}
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        ) : isProductPage ? (
          /* Minimal top bar for product page (back, share, bag) */
          <div className="lg:hidden h-[56px] px-3 md:px-4 flex items-center justify-between relative">
            <button
              type="button"
              onClick={handleProductBack}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] rounded-[6px] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Quiet Centred Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className="inline-flex items-center py-1"
                aria-label="WrapStore Home"
              >
                <Logo size="sm" />
              </Link>
            </div>

            {/* Right: Share + Bag */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleProductShare}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] rounded-[6px] transition-colors cursor-pointer"
                aria-label="Share product"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <Link
                to="/cart"
                className="relative w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] rounded-[6px] transition-colors"
                aria-label={`Shopping bag with ${itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 bg-[#B0521F] text-white text-[10px] font-semibold rounded-full flex items-center justify-center tabular-nums leading-none">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        ) : (
          /* Standard mobile header (menu, search, centred logo, account, bag) */
          <div className="lg:hidden h-[56px] px-3 md:px-4 flex items-center justify-between relative">
            {/* Left: Menu Icon + Search Icon */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#6B6B6B] rounded-[6px] transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#6B6B6B] rounded-[6px] transition-colors cursor-pointer"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Centred Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className="inline-flex items-center py-1"
                aria-label="WrapStore Home"
              >
                <Logo size="sm" />
              </Link>
            </div>

            {/* Right: Account + Bag */}
            <div className="flex items-center gap-0.5">
              <Link
                to={user ? '/account' : '/login'}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] rounded-[6px] transition-colors"
                aria-label={user ? `Account (${firstName || 'User'})` : 'Login'}
              >
                <User className="w-5 h-5" />
              </Link>

              <Link
                to="/cart"
                className="relative w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] rounded-[6px] transition-colors"
                aria-label={`Shopping bag with ${itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 bg-[#B0521F] text-white text-[10px] font-semibold rounded-full flex items-center justify-center tabular-nums leading-none">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}

        {/* DESKTOP HEADER (≥ 1024px): 72px */}
        <div className="hidden lg:block">
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
            {isReducedHeader ? (
              /* Reduced desktop header for /cart and /checkout (Logo and account only) */
              <div className="flex items-center justify-between h-[72px]">
                <Link
                  to="/"
                  onClick={() => onCategorySelect && onCategorySelect('All')}
                  className="inline-flex items-center py-1 shrink-0"
                  aria-label="WrapStore Home"
                >
                  <Logo size="md" />
                </Link>

                {renderAccountMenu()}
              </div>
            ) : (
              <div className="flex items-center justify-between h-[72px] gap-8">
              
              {/* Left: Logo */}
              <Link
                to="/"
                onClick={() => onCategorySelect && onCategorySelect('All')}
                className="inline-flex items-center py-1 shrink-0"
                aria-label="WrapStore Home"
              >
                <Logo size="md" />
              </Link>

              {/* Centre: Nav links in Poppins 500 14px with active 2px accent underline */}
              <nav
                className="flex items-center space-x-6 xl:space-x-8 h-[72px]"
                aria-label="Main Navigation"
              >
                {/* iPhone Cases */}
                <div
                  className="relative h-full flex items-center"
                  onMouseEnter={() => handleNavMouseEnter('iphone')}
                  onMouseLeave={handleNavMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => handleNavClick('iphone')}
                    className={`h-full flex items-center text-[14px] font-medium tracking-tight transition-colors cursor-pointer relative py-2 ${
                      isIphoneActive || activeMegaMenu === 'iphone'
                        ? 'text-[#141414] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B0521F]'
                        : 'text-[#141414] hover:text-[#B0521F]'
                    }`}
                  >
                    iPhone Cases
                  </button>
                </div>

                {/* Samsung Cases (Rendered ONLY if products exist) */}
                {hasSamsungCases && (
                  <div
                    className="relative h-full flex items-center"
                    onMouseEnter={() => handleNavMouseEnter('samsung')}
                    onMouseLeave={handleNavMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => handleNavClick('samsung')}
                      className={`h-full flex items-center text-[14px] font-medium tracking-tight transition-colors cursor-pointer relative py-2 ${
                        isSamsungActive || activeMegaMenu === 'samsung'
                          ? 'text-[#141414] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B0521F]'
                          : 'text-[#141414] hover:text-[#B0521F]'
                      }`}
                    >
                      Samsung Cases
                    </button>
                  </div>
                )}

                {/* Accessories */}
                <div
                  className="relative h-full flex items-center"
                  onMouseEnter={() => handleNavMouseEnter('accessories')}
                  onMouseLeave={handleNavMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => handleNavClick('accessories')}
                    className={`h-full flex items-center text-[14px] font-medium tracking-tight transition-colors cursor-pointer relative py-2 ${
                      isAccessoriesActive || activeMegaMenu === 'accessories'
                        ? 'text-[#141414] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B0521F]'
                        : 'text-[#141414] hover:text-[#B0521F]'
                    }`}
                  >
                    Accessories
                  </button>
                </div>

                {/* Combos (Rendered ONLY when eligible combos exist) */}
                {hasCombos && (
                  <div
                    className="relative h-full flex items-center"
                    onMouseEnter={() => handleNavMouseEnter('combos')}
                    onMouseLeave={handleNavMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => handleNavClick('combos')}
                      className={`h-full flex items-center text-[14px] font-medium tracking-tight transition-colors cursor-pointer relative py-2 ${
                        isCombosActive || activeMegaMenu === 'combos'
                          ? 'text-[#141414] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B0521F]'
                          : 'text-[#141414] hover:text-[#B0521F]'
                      }`}
                    >
                      Combos
                    </button>
                  </div>
                )}

                {/* Visit store */}
                <div className="relative h-full flex items-center">
                  <Link
                    to="/contact"
                    className={`h-full flex items-center text-[14px] font-medium tracking-tight transition-colors cursor-pointer relative py-2 ${
                      isStoreActive
                        ? 'text-[#141414] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B0521F]'
                        : 'text-[#141414] hover:text-[#B0521F]'
                    }`}
                  >
                    Visit store
                  </Link>
                </div>
              </nav>

              {/* Right: Search icon + Account (Guest or first name) + Bag with accent badge */}
              <div className="flex items-center gap-3 xl:gap-4 shrink-0">
                {/* Search Icon Button */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] hover:bg-[#F4F3F0] rounded-[6px] transition-colors cursor-pointer"
                  aria-label="Toggle search"
                  aria-expanded={isSearchOpen}
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Account / Guest Menu */}
                {renderAccountMenu()}

                {/* Bag with Accent Count Badge */}
                <Link
                  to="/cart"
                  className="relative w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#141414] hover:text-[#B0521F] hover:bg-[#F4F3F0] rounded-[6px] transition-colors cursor-pointer"
                  aria-label={`Shopping bag with ${itemCount} items`}
                  title={itemCount > 0 ? `${itemCount} items in bag` : 'Shopping bag'}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-[#B0521F] text-white text-[11px] font-semibold rounded-full flex items-center justify-center tabular-nums leading-none">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* ───────────────────────────────────────────────────────────────────────────
            SEARCH POPDOWN OVERLAY (Desktop & Mobile)
            ─────────────────────────────────────────────────────────────────────────── */}
        {isSearchOpen && (
          <div className="border-t border-[#E5E5E3] bg-[#FAFAF9] p-4 animate-fade-in shadow-inner">
            <div className="w-full max-w-[720px] mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-5 h-5 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search cases, models, or accessories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E5E5E3] rounded-[6px] pl-11 pr-10 py-2.5 min-h-[44px] text-[15px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Instant Search Results */}
              {searchQuery.trim().length > 1 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#E5E5E3] rounded-[6px] shadow-lg p-2 space-y-1 z-50 animate-fade-in max-h-[340px] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p.id)}
                        className="w-full px-3 py-2.5 text-left hover:bg-[#FAFAF9] rounded-[6px] flex items-center justify-between text-[14px] transition-colors cursor-pointer"
                      >
                        <span className="text-[#141414] truncate mr-3 font-medium">{p.name}</span>
                        <span className="text-[#B0521F] font-semibold shrink-0 text-[13px] tabular-nums">
                          {formatINR(p.selling_price)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-[13px] text-[#6B6B6B] text-center">
                      No matching products found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────────────
            MEGA MENU PANEL (Desktop)
            Full-width white panel under header, closes on mouse leave, Escape or outside click
            ─────────────────────────────────────────────────────────────────────────── */}
        {activeMegaMenu && (
          <div
            onMouseEnter={cancelMenuClose}
            onMouseLeave={handleNavMouseLeave}
            className="hidden lg:block absolute top-full left-0 right-0 w-full bg-white border-b border-[#E5E5E3] shadow-lg z-40 animate-fade-in"
          >
            <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8">
              {/* 1. iPhone Cases Mega Menu */}
              {activeMegaMenu === 'iphone' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                    <h3 className="text-[13px] font-semibold text-[#6B6B6B] font-sans">
                      Shop iPhone cases by model
                    </h3>
                    <Link
                      to="/cases?brand=Apple"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1"
                    >
                      <span>View all iPhone models</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-7 gap-4">
                    {/* Live Model Columns (max 6) */}
                    {appleMenuColumns.map((col) => {
                      const photo =
                        col.heroProduct?.image_url ||
                        (Array.isArray(col.heroProduct?.images) && col.heroProduct.images[0]) ||
                        '/subcategories/iphone.jpg';

                      return (
                        <div
                          key={col.model}
                          className="group flex flex-col justify-between bg-white rounded-[6px] border border-[#E5E5E3] hover:border-[#141414] p-2.5 transition-all"
                        >
                          <div>
                            {/* Real Case Photo on #F4F3F0 (4:5) */}
                            <div className="w-full aspect-[4/5] bg-[#F4F3F0] rounded-[4px] overflow-hidden mb-2.5 relative">
                              <img
                                src={photo}
                                alt={col.model}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = '/subcategories/iphone.jpg';
                                }}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              />
                            </div>

                            {/* Model name in Poppins 600 */}
                            <h4 className="text-[14px] font-semibold text-[#141414] line-clamp-1 leading-snug">
                              {col.model}
                            </h4>

                            {/* Line: N designs */}
                            <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                              {col.designsCount} {col.designsCount === 1 ? 'design' : 'designs'}
                            </p>
                          </div>

                          {/* "Shop" link */}
                          <div className="pt-3 mt-2 border-t border-[#E5E5E3]">
                            <Link
                              to={`/cases/apple/${col.slug}`}
                              onClick={() => setActiveMegaMenu(null)}
                              className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center justify-between"
                            >
                              <span>Shop</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {/* Last Column: Other iPhone models */}
                    <div className="flex flex-col justify-between bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] p-4 text-center">
                      <div className="space-y-2 my-auto">
                        <span className="text-[12px] font-medium text-[#6B6B6B] block">Older generation?</span>
                        <h4 className="text-[15px] font-semibold text-[#141414] leading-snug">
                          Other iPhone models
                        </h4>
                        <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                          Find cases for other iPhone series.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#E5E5E3]">
                        <Link
                          to="/cases?brand=Apple"
                          onClick={() => setActiveMegaMenu(null)}
                          className="w-full py-2 px-3 bg-[#141414] text-white hover:bg-[#B0521F] rounded-[6px] text-[13px] font-semibold transition-colors block"
                        >
                          Find your model
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Samsung Cases Mega Menu (Only if products exist) */}
              {activeMegaMenu === 'samsung' && hasSamsungCases && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                    <h3 className="text-[13px] font-semibold text-[#6B6B6B] font-sans">
                      Shop Samsung cases by model
                    </h3>
                    <Link
                      to="/cases?brand=Samsung"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1"
                    >
                      <span>View all Samsung models</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-7 gap-4">
                    {samsungMenuColumns.map((col) => {
                      const photo =
                        col.heroProduct?.image_url ||
                        (Array.isArray(col.heroProduct?.images) && col.heroProduct.images[0]) ||
                        '/subcategories/iphone.jpg';

                      return (
                        <div
                          key={col.model}
                          className="group flex flex-col justify-between bg-white rounded-[6px] border border-[#E5E5E3] hover:border-[#141414] p-2.5 transition-all"
                        >
                          <div>
                            <div className="w-full aspect-[4/5] bg-[#F4F3F0] rounded-[4px] overflow-hidden mb-2.5 relative">
                              <img
                                src={photo}
                                alt={col.model}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              />
                            </div>
                            <h4 className="text-[14px] font-semibold text-[#141414] line-clamp-1 leading-snug">
                              {col.model}
                            </h4>
                            <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                              {col.designsCount} {col.designsCount === 1 ? 'design' : 'designs'}
                            </p>
                          </div>
                          <div className="pt-3 mt-2 border-t border-[#E5E5E3]">
                            <Link
                              to={`/cases/samsung/${col.slug}`}
                              onClick={() => setActiveMegaMenu(null)}
                              className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center justify-between"
                            >
                              <span>Shop</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-col justify-between bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] p-4 text-center">
                      <div className="space-y-2 my-auto">
                        <span className="text-[12px] font-medium text-[#6B6B6B] block">Galaxy Series</span>
                        <h4 className="text-[15px] font-semibold text-[#141414] leading-snug">
                          Other Samsung models
                        </h4>
                        <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                          Browse cases for Galaxy S and Z series models.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-[#E5E5E3]">
                        <Link
                          to="/cases?brand=Samsung"
                          onClick={() => setActiveMegaMenu(null)}
                          className="w-full py-2 px-3 bg-[#141414] text-white hover:bg-[#B0521F] rounded-[6px] text-[13px] font-semibold transition-colors block"
                        >
                          Find your model
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Accessories Mega Menu */}
              {activeMegaMenu === 'accessories' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                    <h3 className="text-[13px] font-semibold text-[#6B6B6B] font-sans">
                      Device essentials &amp; add-ons
                    </h3>
                    <Link
                      to="/?category=Accessories"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1"
                    >
                      <span>View all accessories</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {liveAccessorySubs.map((sub) => (
                      <div
                        key={sub.name}
                        className="group flex flex-col justify-between bg-white rounded-[6px] border border-[#E5E5E3] hover:border-[#141414] p-3 transition-all"
                      >
                        <div>
                          <div className="w-full aspect-[4/5] bg-[#F4F3F0] rounded-[4px] overflow-hidden mb-3 relative">
                            <img
                              src={sub.image}
                              alt={sub.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/subcategories/tempered-glass.jpg';
                              }}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                            />
                          </div>
                          <h4 className="text-[15px] font-semibold text-[#141414] leading-snug">
                            {sub.name}
                          </h4>
                          <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                            {sub.productCount} {sub.productCount === 1 ? 'product' : 'products'}
                          </p>
                        </div>
                        <div className="pt-3 mt-3 border-t border-[#E5E5E3]">
                          <Link
                            to={`/?category=Accessories&subcategory=${encodeURIComponent(sub.name)}`}
                            onClick={() => setActiveMegaMenu(null)}
                            className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center justify-between"
                          >
                            <span>Explore</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Combos Mega Menu */}
              {activeMegaMenu === 'combos' && hasCombos && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                    <h3 className="text-[13px] font-semibold text-[#6B6B6B] font-sans">
                      Protection combos &amp; bundles
                    </h3>
                    <Link
                      to="/combos"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center gap-1"
                    >
                      <span>View all combos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-4 gap-5">
                    {liveCombos.map((combo) => {
                      const mrp = combo.mrp || combo.original_value || combo.raw_mrp || 0;
                      const hasDiscount = mrp > combo.selling_price;
                      const saveAmount = mrp - combo.selling_price;

                      return (
                        <div
                          key={combo.id}
                          className="group flex flex-col justify-between bg-white rounded-[6px] border border-[#E5E5E3] hover:border-[#141414] p-3 transition-all"
                        >
                          <div>
                            <div className="w-full aspect-[4/5] bg-[#F4F3F0] rounded-[4px] overflow-hidden mb-3 p-1.5 flex items-center justify-center relative">
                              <ComboThumbnail combo={combo} className="w-full h-full" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#B0521F] block mb-1">
                              Combo offer
                            </span>
                            <h4 className="text-[15px] font-semibold text-[#141414] line-clamp-2 leading-snug">
                              {combo.name}
                            </h4>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-[16px] font-semibold text-[#141414]">
                                {formatINR(combo.selling_price)}
                              </span>
                              {hasDiscount && (
                                <span className="text-[13px] text-[#6B6B6B] line-through">
                                  {formatINR(mrp)}
                                </span>
                              )}
                            </div>
                            {hasDiscount && (
                              <p className="text-[11px] text-[#B0521F] font-medium mt-1">
                                Save {formatINR(saveAmount)}
                              </p>
                            )}
                          </div>
                          <div className="pt-3 mt-3 border-t border-[#E5E5E3]">
                            <Link
                              to={`/product/${combo.id}`}
                              onClick={() => setActiveMegaMenu(null)}
                              className="text-[13px] font-semibold text-[#B0521F] hover:underline flex items-center justify-between"
                            >
                              <span>View bundle</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {/* View All Combos Card */}
                    <div className="flex flex-col justify-between bg-[#F4F3F0] rounded-[6px] border border-[#E5E5E3] p-5 text-center">
                      <div className="space-y-2 my-auto">
                        <span className="text-[12px] font-medium text-[#6B6B6B] block">Better Together</span>
                        <h4 className="text-[16px] font-semibold text-[#141414] leading-snug">
                          Protection combos
                        </h4>
                        <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                          Case + Screen Protector + Lens Guard bundled together for total protection.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-[#E5E5E3]">
                        <Link
                          to="/combos"
                          onClick={() => setActiveMegaMenu(null)}
                          className="w-full py-2.5 px-4 bg-[#141414] text-white hover:bg-[#B0521F] rounded-[6px] text-[13px] font-semibold transition-colors block"
                        >
                          View all combos
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. FULL SCREEN MOBILE MENU PAGE
          ─────────────────────────────────────────────────────────────────────────── */}
      <MobileMenuPage
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        products={products}
        hasSamsungCases={hasSamsungCases}
        liveAccessorySubs={liveAccessorySubs}
        hasCombos={hasCombos}
      />
    </div>
  );
}

export default Header;
