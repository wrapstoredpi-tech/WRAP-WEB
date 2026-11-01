import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/auth/AuthForm';
import { homeConfig } from '../config/home';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const returnTo = searchParams.get('returnTo') || '/';
  const pendingFavorite = searchParams.get('pendingFavorite');

  // Signed-in visitors who open /login go to returnTo or /account
  useEffect(() => {
    if (!isLoading && user) {
      const destination = returnTo && returnTo !== '/' ? returnTo : '/account';
      navigate(destination, { replace: true });
    }
  }, [user, isLoading, navigate, returnTo]);

  const handleAuthSuccess = () => {
    const destination = returnTo && returnTo !== '/' ? returnTo : '/account';
    navigate(destination, { replace: true });
  };

  const benefits = homeConfig.accountBenefits || [
    {
      id: 'saved-favourites',
      title: 'Save your favourites',
      description: 'Bookmark phone cases and accessories you love to easily view and buy them anytime.',
    },
    {
      id: 'track-orders',
      title: 'Track your orders',
      description: 'Check the real-time shipping status and order history for all your purchases.',
    },
    {
      id: 'saved-addresses',
      title: 'Saved addresses',
      description: 'Store multiple delivery addresses for faster checkout on your mobile device.',
    },
    {
      id: 'faster-checkout',
      title: 'Faster checkout',
      description: 'Pre-fill your contact details and review previous orders instantly.',
    },
  ];

  if (isLoading) {
    return (
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Breadcrumb back to store */}
      <div className="mb-6">
        <Link to="/" className="text-[13px] text-[#6B6B6B] hover:text-[#141414] transition-colors">
          ← Back to store
        </Link>
      </div>

      {/* Two columns on desktop: Left Form, Right Benefits Panel. Single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="font-display font-normal text-[28px] sm:text-[32px] text-[#141414] tracking-[-0.01em]">
              Welcome to WrapStore
            </h1>
            <p className="font-sans text-[14px] text-[#6B6B6B] mt-1">
              Sign in to manage your orders, saved favourites, and account.
            </p>
          </div>

          {/* Pending Favourite Callout Banner */}
          {pendingFavorite && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-[#141414] flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                <Heart className="w-4 h-4 fill-red-600" />
              </div>
              <div className="text-[13px] leading-snug">
                <strong className="block font-semibold text-red-700">Save to your favourites</strong>
                <span className="text-[#404040]">
                  Sign in or create an account to save this item. It will be added to your favourites automatically!
                </span>
              </div>
            </div>
          )}

          <AuthForm onSuccess={handleAuthSuccess} returnTo={returnTo} />
        </div>

        {/* Right Column: Plain Benefits Panel */}
        <div className="lg:col-span-5 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 space-y-6">
          <h2 className="text-[18px] font-semibold text-[#141414] border-b border-[#E5E5E3] pb-3">
            Benefits of an account
          </h2>

          <div className="space-y-5">
            {benefits.map((b) => (
              <div key={b.id} className="space-y-1">
                <h3 className="text-[15px] font-semibold text-[#141414]">
                  {b.title}
                </h3>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E5E5E3] text-[13px] text-[#8C8C8C]">
            <p>
              WrapStore does not share your contact details. All accounts use secure tokenized authentication.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
