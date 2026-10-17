import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PhoneSelectionModal } from './components/layout/PhoneSelectionModal';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { PhoneProvider } from './context/PhoneContext';
import { IntroProvider } from './context/IntroContext';

// Route-level code splitting
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const TypeTestPage = lazy(() => import('./pages/TypeTestPage').then((m) => ({ default: m.TypeTestPage })));
const IntroTestPage = lazy(() => import('./pages/IntroTestPage').then((m) => ({ default: m.IntroTestPage })));
const StaticPage = lazy(() => import('./pages/StaticPage').then((m) => ({ default: m.StaticPage })));

function RouteFallback() {
  return (
    <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-24 flex items-center justify-center">
      <p className="text-[14px] text-[#6B6B6B]">Loading page...</p>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#141414] font-sans antialiased">
      {/* Sticky Header with 36px Info Bar & 72px Main Row (Hidden on reduced checkout flow) */}
      {!isCheckout && <Header />}

      {/* Global Phone Selection Modal */}
      <PhoneSelectionModal />

      {/* Page Routes with Suspense code splitting */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />

          {/* Auth & Account Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Dedicated About & Contact Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Temporary Typography Pairing Route */}
          <Route path="/type-test" element={<TypeTestPage />} />

          {/* Temporary Logo Intro Animation QA Route */}
          <Route path="/intro-test" element={<IntroTestPage />} />

          {/* Policy Pages */}
          <Route path="/shipping-returns" element={<StaticPage pageKey="shipping" />} />
          <Route path="/privacy" element={<StaticPage pageKey="privacy" />} />
          <Route path="/terms" element={<StaticPage pageKey="terms" />} />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>

      {/* Footer (Hidden on reduced checkout flow) */}
      {!isCheckout && <Footer />}

      {/* Floating WhatsApp fixed bottom-left (Hidden on reduced checkout flow) */}
      {!isCheckout && <FloatingWhatsApp />}
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
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <IntroProvider>
          <AuthProvider>
            <CartProvider>
              <ProductsProvider>
                <PhoneProvider>
                  <AppContent />
                </PhoneProvider>
              </ProductsProvider>
            </CartProvider>
          </AuthProvider>
        </IntroProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
