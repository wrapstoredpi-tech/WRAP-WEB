import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { supabase } from '../lib/supabase';
import { useFavorites } from '../context/FavoritesContext';
import {
  getAuthIntent,
  clearAuthIntent,
  sanitizeReturnTo,
  dispatchToast,
  getFirstName,
} from '../lib/authRedirect';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { mergeAndAddFavorite } = useFavorites();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    // 1. Check for OAuth cancellation or error query params
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const error = searchParams.get('error') || hashParams.get('error');
    const errorDescription =
      searchParams.get('error_description') || hashParams.get('error_description');

    if (error) {
      const isCancel =
        error === 'access_denied' ||
        (errorDescription && errorDescription.toLowerCase().includes('cancel'));
      const calmMsg = isCancel
        ? 'Google sign-in was cancelled. You can sign in using your email below, or try Google again.'
        : errorDescription || 'Sign in could not be completed. Please use your email below.';

      const intent = getAuthIntent();
      const returnTo = sanitizeReturnTo(intent?.returnTo || '/');
      clearAuthIntent();

      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}&authNote=${encodeURIComponent(calmMsg)}`, {
        replace: true,
      });
      return;
    }

    if (!supabase) {
      navigate('/login', { replace: true });
      return;
    }

    let isCompleted = false;

    // Timeout: 10s maximum wait
    const timeoutId = setTimeout(() => {
      if (!isCompleted) {
        isCompleted = true;
        const intent = getAuthIntent();
        const returnTo = sanitizeReturnTo(intent?.returnTo || '/');
        clearAuthIntent();
        navigate(
          `/login?returnTo=${encodeURIComponent(returnTo)}&authNote=${encodeURIComponent('Sign in took longer than expected. Please try again.')}`,
          { replace: true }
        );
      }
    }, 10000);

    // Complete login and execute continuation
    const finalizeLogin = async (user) => {
      if (isCompleted) return;
      isCompleted = true;
      clearTimeout(timeoutId);

      // Clean URL: remove code/auth parameters
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      // Retrieve intent
      const intent = getAuthIntent();
      const returnTo = sanitizeReturnTo(intent?.returnTo || '/');
      const action = intent?.pendingAction;

      // Execute next step automatically, no extra screens
      if (action?.type === 'favourite' && action.productId) {
        mergeAndAddFavorite(action.productId);
      } else if (action?.type === 'checkout') {
        // Will return to checkout with details prefilled
      } else {
        const firstName = getFirstName(user);
        dispatchToast(`Welcome, ${firstName}`);
      }

      clearAuthIntent();

      // Navigate to destination with replace so Back does not return to login
      navigate(returnTo, { replace: true });
    };

    // 2. PKCE code exchange or session check
    const code = searchParams.get('code');
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data: { session }, error: exchangeErr }) => {
          if (exchangeErr) {
            console.warn('PKCE exchange note:', exchangeErr.message);
          }
          if (session?.user) {
            finalizeLogin(session.user);
          }
        })
        .catch((err) => {
          console.warn('PKCE exchange error:', err);
        });
    }

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isCompleted) {
        finalizeLogin(session.user);
      }
    });

    // Listen for SIGNED_IN auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !isCompleted) {
        finalizeLogin(session.user);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [navigate, mergeAndAddFavorite]);

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-5 animate-fade-in max-w-[320px] w-full">
        <Logo size="lg" />
        <div className="flex items-center gap-2.5 text-[#6B6B6B] text-[14px] font-medium">
          <div className="w-4 h-4 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
          <span>Signing you in...</span>
        </div>
      </div>
    </main>
  );
}

export default AuthCallbackPage;

