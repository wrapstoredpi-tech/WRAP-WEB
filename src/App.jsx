import React, { Suspense, lazy } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { PhoneProvider } from './context/PhoneContext';
import { IntroProvider } from './context/IntroContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { PurchaseSheetProvider } from './context/PurchaseSheetContext';
import { CompleteYourPurchaseSheet } from './components/cart/CompleteYourPurchaseSheet';
import { ScrollToTop } from './components/common/ScrollToTop';
import { modelToSlug } from './lib/models';

// Route-level code splitting
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const CasesPickerPage = lazy(() => import('./pages/CasesPickerPage').then((m) => ({ default: m.CasesPickerPage })));
const ModelCasesPage = lazy(() => import('./pages/ModelCasesPage').then((m) => ({ default: m.ModelCasesPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const TypeTestPage = import.meta.env.DEV
  ? lazy(() => import('./pages/TypeTestPage').then((m) => ({ default: m.TypeTestPage })))
  : null;
const IntroTestPage = import.meta.env.DEV
  ? lazy(() => import('./pages/IntroTestPage').then((m) => ({ default: m.IntroTestPage })))
  : null;
const StaticPage = lazy(() => import('./pages/StaticPage').then((m) => ({ default: m.StaticPage })));
const ShippingPolicyPage = lazy(() => import('./pages/ShippingPolicyPage').then((m) => ({ default: m.ShippingPolicyPage })));
const ReturnsPolicyPage = lazy(() => import('./pages/ReturnsPolicyPage').then((m) => ({ default: m.ReturnsPolicyPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function RouteFallback() {
  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-24 flex items-center justify-center">
      <p className="text-[14px] text-[#6B6B6B]">Loading page...</p>
    </div>
  );
}

function LegacyCasesRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const subcategory = params.get('subcategory');
    const brand = params.get('brand');
    const model = params.get('model') || params.get('series');

    const isCaseCategory =
      category &&
      (category.toLowerCase().includes('mobile case') ||
        category.toLowerCase() === 'cases' ||
        category.toLowerCase() === 'case');
    const isBrandCaseQuery =
      !category &&
      brand &&
      (brand.toLowerCase() === 'apple' || brand.toLowerCase() === 'samsung');

    if (isCaseCategory || isBrandCaseQuery) {
      if (brand && model) {
        navigate(`/cases/${brand.toLowerCase()}/${modelToSlug(model)}`, { replace: true });
      } else if (brand) {
        const brandCap = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
        navigate(`/cases?brand=${brandCap}`, { replace: true });
      } else {
        navigate('/cases', { replace: true });
      }
      return;
    }

    // Accessories legacy query param redirect
    if (category && category.toLowerCase().includes('accessor')) {
      if (subcategory) {
        navigate(`/accessories/${modelToSlug(subcategory)}`, { replace: true });
      } else {
        navigate('/accessories', { replace: true });
      }
      return;
    }

    // Combos legacy query param redirect
    if (category && category.toLowerCase().includes('combo')) {
      navigate('/combos', { replace: true });
      return;
    }
  }, [location, navigate]);

  return null;
}

function CasesBrandRedirect() {
  const { brand } = useParams();
  const brandCap = brand ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase() : 'Apple';
  return <Navigate to={`/cases?brand=${brandCap}`} replace />;
}

function AppContent() {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const isCallback = location.pathname === '/auth/callback';
  const isAdmin = location.pathname.startsWith('/wrapwebadmin');
  const isHeaderHidden = isCallback || isAdmin;
  const isFooterHidden = isCheckout || isCallback || isAdmin;

  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.__DISMISS_WRAPSTORE_INTRO__ === 'function') {
      window.__DISMISS_WRAPSTORE_INTRO__();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#141414] font-sans antialiased overflow-x-hidden w-full">
      <ScrollToTop />
      <LegacyCasesRedirect />

      {/* Header (reduced on /cart and /checkout; hidden on auth callback or admin) */}
      {!isHeaderHidden && <Header />}

      {/* Page Routes with Suspense code splitting */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cases" element={<CasesPickerPage />} />
          <Route path="/cases/:brand" element={<CasesBrandRedirect />} />
          <Route path="/cases/:brand/:model" element={<ModelCasesPage />} />
          <Route path="/accessories" element={<ModelCasesPage isAccessoryPage={true} />} />
          <Route path="/accessories/:subcategory" element={<ModelCasesPage isAccessoryPage={true} />} />
          <Route path="/combos" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/wishlist" element={<FavoritesPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />

          {/* Dedicated Admin Portal */}
          <Route path="/wrapwebadmin" element={<AdminPage />} />

          {/* Auth & Account Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Dedicated About & Contact Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Temporary Typography Pairing Route (Dev Only) */}
          {import.meta.env.DEV && <Route path="/type-test" element={<TypeTestPage />} />}

          {/* Temporary Logo Intro Animation QA Route (Dev Only) */}
          {import.meta.env.DEV && <Route path="/intro-test" element={<IntroTestPage />} />}

          {/* Policy Pages */}
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/returns-and-refunds" element={<ReturnsPolicyPage />} />
          <Route path="/shipping-returns" element={<Navigate to="/shipping-policy" replace />} />
          <Route path="/privacy-policy" element={<StaticPage pageKey="privacy" />} />
          <Route path="/privacy" element={<StaticPage pageKey="privacy" />} />
          <Route path="/terms-and-conditions" element={<StaticPage pageKey="terms" />} />
          <Route path="/terms" element={<StaticPage pageKey="terms" />} />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>

      {/* Footer (Hidden on reduced checkout, callback, or admin flows) */}
      {!isFooterHidden && <Footer />}

      {/* Floating WhatsApp fixed bottom-left (Hidden on reduced checkout, callback, or admin flows) */}
      {!isFooterHidden && <FloatingWhatsApp />}

      {/* Complete Your Purchase Sheet / Panel (Triggered after Add to Bag) */}
      <CompleteYourPurchaseSheet />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 font-sans bg-[#FAFAF9] text-[#141414]">
          <h1 className="text-[20px] font-semibold text-[#B0521F]">Unable to render page</h1>
          <p className="text-[14px] text-[#6B6B6B] mt-2">
            An unexpected error occurred. Please refresh the page or return home.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="mt-4 px-4 py-2 bg-[#141414] text-white text-[14px] font-semibold rounded-[6px]"
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const initialRoute = typeof window !== 'undefined' ? window.__INITIAL_ROUTE__ : null;
  const RouterComponent = initialRoute ? MemoryRouter : BrowserRouter;
  const routerProps = initialRoute ? { initialEntries: [initialRoute] } : {};

  return (
    <ErrorBoundary>
      <RouterComponent {...routerProps}>
        <IntroProvider>
          <AuthProvider>
            <CartProvider>
              <ProductsProvider>
                <FavoritesProvider>
                  <PhoneProvider>
                    <PurchaseSheetProvider>
                      <AppContent />
                    </PurchaseSheetProvider>
                  </PhoneProvider>
                </FavoritesProvider>
              </ProductsProvider>
            </CartProvider>
          </AuthProvider>
        </IntroProvider>
      </RouterComponent>
    </ErrorBoundary>
  );
}

export default App;
