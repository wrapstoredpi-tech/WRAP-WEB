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
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { PhoneProvider } from './context/PhoneContext';
import { Check, X } from 'lucide-react';

function AppContent() {
  const [activeCategoryNav, setActiveCategoryNav] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddToCart = (product, quantity = 1) => {
    // Navigate directly to the full /cart page on add to bag
    navigate('/cart');
  };

  const handleCategoryNavSelect = (categoryName) => {
    setActiveCategoryNav(categoryName);
    if (location.pathname !== '/') {
      navigate(categoryName === 'All' ? '/' : `/?category=${encodeURIComponent(categoryName)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base text-neutral-900 font-sans selection:bg-neutral-200 selection:text-neutral-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 shadow-modal border border-neutral-800 flex items-center gap-3 animate-fade-in rounded-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-body font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Header with Bag Counter Link to /cart */}
      <Header
        activeCategory={activeCategoryNav}
        onCategorySelect={handleCategoryNavSelect}
      />

      {/* Global Phone Selection Modal */}
      <PhoneSelectionModal />

      {/* Page Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onAddToCart={handleAddToCart}
              activeCategoryNav={activeCategoryNav}
            />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetailPage
              onAddToCart={handleAddToCart}
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
        <div style={{ padding: '40px', fontFamily: 'Poppins, sans-serif', backgroundColor: '#FAFAF9', color: '#141414' }}>
          <h1 style={{ color: '#9E381A', fontSize: '24px', fontWeight: 600 }}>Application Render Error</h1>
          <p style={{ marginTop: '12px' }}><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
          <pre style={{ marginTop: '16px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', overflow: 'auto', border: '1px solid #E7E5E4', fontSize: '13px' }}>
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
