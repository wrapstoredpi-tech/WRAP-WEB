import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  saveAuthIntent,
  getAuthIntent,
  clearAuthIntent,
  sanitizeReturnTo,
  isInAppBrowser,
} from '../../lib/authRedirect';

export function AuthForm({
  onSuccess,
  defaultTab = 'signin',
  returnTo = '/',
  pendingAction = null,
  authNote = '',
}) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const { mergeAndAddFavorite, showToast } = useFavorites();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'signin' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // In-app browser detection
  const isBlockedBrowser = isInAppBrowser();

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearMessages();
  };

  // Copy current link for in-app browser users
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.warn('Could not copy link:', err);
    }
  };

  // Google OAuth flow
  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsGoogleLoading(true);

    try {
      // 1. Remember where they were in sessionStorage
      const currentIntent = getAuthIntent();
      const resolvedReturnTo = sanitizeReturnTo(returnTo || currentIntent?.returnTo || '/');
      const resolvedAction = pendingAction || currentIntent?.pendingAction || null;

      saveAuthIntent({
        returnTo: resolvedReturnTo,
        pendingAction: resolvedAction,
      });

      // 2. Call Supabase Google OAuth with callback
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setErrorMsg(err.message || 'Unable to open Google sign in. Please try email or try again.');
      setIsGoogleLoading(false);
    }
  };

  // Post-auth continuation logic for email (same as Google)
  const executeContinuation = (userResult, fallbackName) => {
    const currentIntent = getAuthIntent();
    const resolvedReturnTo = sanitizeReturnTo(returnTo || currentIntent?.returnTo || '/');
    const resolvedAction = pendingAction || currentIntent?.pendingAction || null;

    if (resolvedAction?.type === 'favourite' && resolvedAction.productId) {
      mergeAndAddFavorite(resolvedAction.productId);
    } else if (resolvedAction?.type === 'checkout') {
      // Return to checkout directly (prefilling occurs in CheckoutPage)
    } else {
      const meta = userResult?.user_metadata || {};
      const fName =
        meta.full_name?.trim().split(/\s+/)[0] ||
        fallbackName?.trim().split(/\s+/)[0] ||
        userResult?.email?.split('@')[0] ||
        'there';
      showToast(`Welcome, ${fName}`);
    }

    clearAuthIntent();

    if (onSuccess) {
      onSuccess(resolvedReturnTo);
    } else {
      navigate(resolvedReturnTo, { replace: true });
    }
  };

  // Email form submit (Sign in / Create account / Forgot password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (activeTab === 'forgot') {
      setIsLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset instructions have been sent to your email.');
      } catch (err) {
        setErrorMsg(err.message || 'Unable to send password reset email.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Enforce 8 characters for password
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setIsLoading(false);
          return;
        }

        const signUpData = await signUpWithEmail(email.trim(), password, name.trim());

        // Check if email confirmation is required by Supabase
        if (signUpData?.user && !signUpData?.session) {
          // Save intent so /auth/callback can run when user confirms email
          saveAuthIntent({
            returnTo: sanitizeReturnTo(returnTo),
            pendingAction,
          });
          setSuccessMsg('Check your email! We sent a confirmation link to complete your sign in.');
          setIsLoading(false);
          return;
        }

        executeContinuation(signUpData?.user, name);
      } else {
        const signInData = await signInWithEmail(email.trim(), password);
        executeContinuation(signInData?.user, null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Mode Tabs (Sign In / Create Account) */}
      {activeTab !== 'forgot' && (
        <div className="flex border-b border-[#E5E5E3]">
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className={`flex-1 pb-3 text-[14px] font-semibold transition-colors cursor-pointer text-center ${
              activeTab === 'signin'
                ? 'text-[#141414] border-b-2 border-[#141414]'
                : 'text-[#6B6B6B] hover:text-[#141414]'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('signup')}
            className={`flex-1 pb-3 text-[14px] font-semibold transition-colors cursor-pointer text-center ${
              activeTab === 'signup'
                ? 'text-[#141414] border-b-2 border-[#141414]'
                : 'text-[#6B6B6B] hover:text-[#141414]'
            }`}
          >
            Create account
          </button>
        </div>
      )}

      {/* Forgot Password Header */}
      {activeTab === 'forgot' && (
        <div className="space-y-1 pb-2">
          <h2 className="text-[20px] font-semibold text-[#141414]">Reset your password</h2>
          <p className="text-[14px] text-[#6B6B6B]">
            Enter your email to receive a password reset link.
          </p>
        </div>
      )}

      {/* Calm Note (e.g. Google Cancellation / Friendly Notice) */}
      {authNote && !errorMsg && !successMsg && (
        <div className="p-3.5 bg-[#F5F5F4] border border-[#E7E5E4] rounded-[6px] text-[13px] text-[#44403C] leading-normal flex items-start gap-2 animate-fade-in">
          <span>{authNote}</span>
        </div>
      )}

      {/* Inline Notifications */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3 bg-[#F8EBE7] border border-[#ECCEC5] rounded-[6px] text-[13px] text-[#9E381A] leading-normal animate-fade-in"
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[6px] text-[13px] text-[#166534] leading-normal animate-fade-in"
        >
          {successMsg}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. GOOGLE SIGN-IN BUTTON (ABOVE EMAIL FORM ON BOTH TABS)
          Single action: Google creates account on first use or signs in.
          ───────────────────────────────────────────────────────────── */}
      {activeTab !== 'forgot' && (
        <div className="space-y-4">
          {isBlockedBrowser ? (
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] text-[#92400E] text-[13px] leading-relaxed space-y-3">
              <p className="font-medium">
                Google sign-in does not work inside this app. Open this page in your browser, or use email.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D97706] text-[#92400E] text-[12px] font-semibold rounded-[4px] hover:bg-[#FEF3C7] transition-colors cursor-pointer shadow-2xs"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Link copied!' : 'Copy link'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full min-h-[46px] px-4 py-2.5 bg-white border border-[#E5E5E3] hover:border-[#141414] text-[#141414] text-[14px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs hover:shadow-xs"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#141414]" />
                  <span>Opening Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          )}

          {/* Divider: "or use email" */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-[#E5E5E3]" />
            <span className="absolute bg-white px-3 text-[12px] text-[#6B6B6B] select-none font-medium">
              or use email
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EMAIL & PASSWORD FORM
          ───────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input on create account */}
        {activeTab === 'signup' && (
          <div className="space-y-1.5">
            <label htmlFor="auth-name" className="block text-[13px] font-semibold text-[#141414]">
              Full name
            </label>
            <input
              id="auth-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414] transition-colors"
            />
          </div>
        )}

        {/* Email input */}
        <div className="space-y-1.5">
          <label htmlFor="auth-email" className="block text-[13px] font-semibold text-[#141414]">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414] transition-colors"
          />
        </div>

        {/* Password input with 8 characters enforcement */}
        {activeTab !== 'forgot' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="block text-[13px] font-semibold text-[#141414]">
                Password
              </label>
              {activeTab === 'signin' && (
                <button
                  type="button"
                  onClick={() => handleTabChange('forgot')}
                  className="text-[12px] font-semibold text-[#B0521F] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#141414] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[12px] text-[#6B6B6B]">At least 8 characters</p>
          </div>
        )}

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full min-h-[44px] px-5 py-2.5 bg-[#B0521F] hover:bg-[#994518] disabled:bg-[#E5E5E3] text-white disabled:text-[#6B6B6B] text-[15px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>
            {activeTab === 'signin'
              ? 'Sign in'
              : activeTab === 'signup'
              ? 'Create account'
              : 'Send reset instructions'}
          </span>
        </button>

        {activeTab === 'forgot' && (
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className="w-full text-center text-[13px] text-[#6B6B6B] hover:text-[#141414] pt-2 cursor-pointer"
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}

export default AuthForm;
