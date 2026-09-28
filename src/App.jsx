import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PhoneSelectionModal } from './components/layout/PhoneSelectionModal';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { MiniCartDrawer } from './components/cart/MiniCartDrawer';
import { CartProvider, useCart } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { PhoneProvider } from './context/PhoneContext';
import { Check, X } from 'lucide-react';

function AppContent() {
  const [activeCategoryNav, setActiveCategoryNav] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);
  const { openMiniCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddToCartFeedback = (product, quantity = 1) => {
    setToastMessage(`Added ${quantity > 1 ? `(${quantity}) ` : ''}"${product.name}" to your bag.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleCategoryNavSelect = (categoryName) => {
    setActiveCategoryNav(categoryName);
    if (location.pathname !== '/') {
      navigate(categoryName === 'All' ? '/' : `/?category=${encodeURIComponent(categoryName)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-offwhite text-neutral-900 font-sans selection:bg-accent-light selection:text-accent">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-base-offwhite px-4 py-3 shadow-2xl border border-neutral-700 flex items-center gap-3 animate-slide-down rounded-xl">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-body-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-neutral-400 hover:text-white"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Header with Context Cart Badge & Drawer Trigger */}
      <Header
        activeCategory={activeCategoryNav}
        onCategorySelect={handleCategoryNavSelect}
        onCartClick={openMiniCart}
      />

      {/* Global Slide-out Mini-Cart Drawer */}
      <MiniCartDrawer />

      {/* Global Phone Selection Modal */}
      <PhoneSelectionModal />

      {/* Page Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onAddToCart={handleAddToCartFeedback}
              activeCategoryNav={activeCategoryNav}
            />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetailPage
              onAddToCart={handleAddToCartFeedback}
            />
          }
        />
        <Route
          path="/cart"
          element={<CartPage />}
        />
        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />
        <Route
          path="/order-confirmation"
          element={<OrderConfirmationPage />}
        />
        <Route
          path="/track-order"
          element={<TrackOrderPage />}
        />
      </Routes>

      {/* Footer */}
      <Footer />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#ffffff', color: '#111111' }}>
          <h1 style={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold' }}>Application Render Error</h1>
          <p style={{ marginTop: '12px' }}><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
          <pre style={{ marginTop: '16px', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', overflow: 'auto', border: '1px solid #d1d5db', fontSize: '13px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
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
        <CartProvider>
          <ProductsProvider>
            <PhoneProvider>
              <AppContent />
            </PhoneProvider>
          </ProductsProvider>
        </CartProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
