import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Copy, Check, Phone, Mail, ArrowLeft } from 'lucide-react';
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
  defaultMethod = 'phone',
  defaultStep = 'input',
  defaultPhone = '',
  returnTo = '/',
  pendingAction = null,
  authNote = '',
}) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    resetPassword,
  } = useAuth();
  const { mergeAndAddFavorite, showToast } = useFavorites();
  const navigate = useNavigate();

  // Mode and Method state
  const [activeTab, setActiveTab] = useState(defaultTab); // 'signin' | 'signup' | 'forgot'
  const [authMethod, setAuthMethod] = useState(defaultMethod); // 'phone' | 'email'

  // Phone OTP state
  const [phone, setPhone] = useState(defaultPhone);
  const [otpStep, setOtpStep] = useState(defaultStep); // 'input' | 'verify'
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(defaultStep === 'verify' ? 30 : 0);
  const [isSimulated, setIsSimulated] = useState(defaultStep === 'verify');
  const otpInputRef = useRef(null);

  // Email / Shared state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
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
    setOtpStep('input');
    setOtp('');
    clearMessages();
  };

  // Timer for OTP resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus OTP input when entering verify step
  useEffect(() => {
    if (otpStep === 'verify') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [otpStep]);

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
      const currentIntent = getAuthIntent();
      const resolvedReturnTo = sanitizeReturnTo(returnTo || currentIntent?.returnTo || '/');
      const resolvedAction = pendingAction || currentIntent?.pendingAction || null;

      saveAuthIntent({
        returnTo: resolvedReturnTo,
        pendingAction: resolvedAction,
      });

      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setErrorMsg(err.message || 'Unable to open Google sign in. Please try mobile OTP or email.');
      setIsGoogleLoading(false);
    }
  };

  // Post-auth continuation logic
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
        (userResult?.phone ? userResult.phone.replace(/\D/g, '').slice(-10) : '') ||
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

  // ─────────────────────────────────────────────────────────────
  // PHONE OTP HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleSendPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    clearMessages();

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name to create an account.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPhoneOtp(cleanPhone, name.trim());
      setIsSimulated(Boolean(result.isSimulated));
      setOtpStep('verify');
      setResendTimer(30);
      if (result.isSimulated) {
        setSuccessMsg('Test OTP active: use code 123456 to verify.');
      } else {
        setSuccessMsg(`Verification code sent to +91 ${cleanPhone}`);
      }
    } catch (err) {
      console.error('Phone OTP request failed:', err);
      setErrorMsg(err.message || 'Unable to send OTP. Please check the number or use email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    clearMessages();

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPhoneOtp(phone, cleanOtp, name.trim(), isSimulated);
      executeContinuation(result.user, name);
    } catch (err) {
      console.error('Phone OTP verification failed:', err);
      setErrorMsg(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    clearMessages();
    setIsLoading(true);
    try {
      const result = await signInWithPhoneOtp(phone, name.trim());
      setIsSimulated(Boolean(result.isSimulated));
      setResendTimer(30);
      setSuccessMsg('A new verification code has been sent.');
    } catch (err) {
      setErrorMsg(err.message || 'Unable to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EMAIL HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
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

        if (signUpData?.user && !signUpData?.session) {
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

  // ─────────────────────────────────────────────────────────────
  // FOCUSED OTP VERIFICATION VIEW
  // ─────────────────────────────────────────────────────────────
  if (otpStep === 'verify') {
    return (
      <div className="w-full space-y-5 animate-fade-in">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => {
            setOtpStep('input');
            setOtp('');
            clearMessages();
          }}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B6B6B] hover:text-[#141414] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change phone number</span>
        </button>

        {/* Verification Header */}
        <div className="space-y-1">
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#141414]">
            Verify mobile number
          </h2>
          <p className="text-[14px] text-[#6B6B6B]">
            We sent a 6-digit OTP code to <strong className="text-[#141414] font-semibold">+91 {phone}</strong>
          </p>
        </div>

        {/* Inline Alerts */}
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 bg-[#F8EBE7] border border-[#ECCEC5] rounded-[6px] text-[13px] text-[#9E381A] leading-normal animate-fade-in"
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[6px] text-[13px] text-[#166534] leading-normal animate-fade-in"
          >
            {successMsg}
          </div>
        )}

        {/* Demo Mode Helper Banner */}
        {isSimulated && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[8px] text-[13px] text-amber-900 leading-snug flex items-center justify-between">
            <span>Demo Mode: Use OTP <strong>123456</strong> to verify.</span>
            <button
              type="button"
              onClick={() => setOtp('123456')}
              className="px-2.5 py-1 bg-amber-200/60 hover:bg-amber-200 text-amber-950 font-semibold text-[11px] rounded uppercase tracking-wider cursor-pointer transition-colors"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="auth-otp-field" className="block text-[13px] font-semibold text-[#141414]">
              Enter 6-digit OTP
            </label>
            <input
              ref={otpInputRef}
              id="auth-otp-field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(digits);
              }}
              placeholder="······"
              className="w-full min-h-[52px] px-4 py-2.5 bg-white border border-[#E5E5E3] focus:border-[#141414] rounded-[8px] text-center font-mono text-[24px] sm:text-[26px] tracking-[0.45em] sm:tracking-[0.65em] font-semibold text-[#141414] placeholder:text-[#A3A3A3] focus:outline-none transition-colors"
            />
          </div>

          {/* Resend Row */}
          <div className="flex items-center justify-between text-[13px] pt-1">
            <span className="text-[#6B6B6B]">Didn't receive code?</span>
            {resendTimer > 0 ? (
              <span className="text-[#8C8C8C] font-medium">Resend in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="font-semibold text-[#B0521F] hover:underline cursor-pointer disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Verify button */}
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full min-h-[48px] px-5 py-3 bg-[#B0521F] hover:bg-[#994518] disabled:bg-[#E5E5E3] text-white disabled:text-[#6B6B6B] text-[15px] font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {activeTab === 'signup' ? 'Verify & Create account' : 'Verify & Sign in'}
            </span>
          </button>
        </form>

        {/* Back to other login methods */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setOtpStep('input');
              setOtp('');
              clearMessages();
            }}
            className="text-[13px] text-[#6B6B6B] hover:text-[#141414] hover:underline cursor-pointer"
          >
            Use a different sign-in method
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN AUTH VIEW (SIGN IN / CREATE ACCOUNT / FORGOT)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-5">
      {/* ─────────────────────────────────────────────────────────────
          1. MODE TABS (Sign In / Create Account)
          ───────────────────────────────────────────────────────────── */}
      {activeTab !== 'forgot' && (
        <div className="flex border-b border-[#E5E5E3]">
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className={`flex-1 pb-3 text-[14px] sm:text-[15px] font-semibold transition-colors cursor-pointer text-center ${
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
            className={`flex-1 pb-3 text-[14px] sm:text-[15px] font-semibold transition-colors cursor-pointer text-center ${
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
            Enter your registered email address to receive a password reset link.
          </p>
        </div>
      )}

      {/* Calm Notice (e.g. Google Cancellation / Friendly Notice) */}
      {authNote && !errorMsg && !successMsg && (
        <div className="p-3.5 bg-[#F5F5F4] border border-[#E7E5E4] rounded-[6px] text-[13px] text-[#44403C] leading-normal flex items-start gap-2 animate-fade-in">
          <span>{authNote}</span>
        </div>
      )}

      {/* Inline Alerts */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 bg-[#F8EBE7] border border-[#ECCEC5] rounded-[6px] text-[13px] text-[#9E381A] leading-normal animate-fade-in"
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[6px] text-[13px] text-[#166534] leading-normal animate-fade-in"
        >
          {successMsg}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. RESPONSIVE "CONTINUE WITH GOOGLE" BUTTON
          Single tap: Google creates account on first use or signs in instantly.
          ───────────────────────────────────────────────────────────── */}
      {activeTab !== 'forgot' && (
        <div className="space-y-4">
          {isBlockedBrowser ? (
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] text-[#92400E] text-[13px] leading-relaxed space-y-3">
              <p className="font-medium">
                Google sign-in is restricted inside this in-app browser. Open this page in Safari/Chrome, or use mobile number/email.
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
              className="w-full min-h-[48px] px-4 py-3 sm:py-3.5 bg-white border border-[#E5E5E3] hover:border-[#141414] hover:bg-[#FAFAF9] text-[#141414] text-[14px] sm:text-[15px] font-semibold rounded-[8px] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs hover:shadow-xs active:scale-[0.99]"
              aria-label={activeTab === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#141414]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                  <span>{activeTab === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
                </>
              )}
            </button>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-[#E5E5E3]" />
            <span className="absolute bg-white px-3 text-[12px] sm:text-[13px] text-[#6B6B6B] select-none font-medium">
              or continue with
            </span>
          </div>

          {/* Segmented Switcher: Mobile OTP vs Email */}
          <div className="p-1 bg-[#F5F5F4] rounded-[8px] flex gap-1 border border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setOtpStep('input');
                clearMessages();
              }}
              className={`flex-1 py-2 px-3 rounded-[6px] text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMethod === 'phone'
                  ? 'bg-white text-[#141414] shadow-2xs border border-[#E5E5E3]'
                  : 'text-[#6B6B6B] hover:text-[#141414] border border-transparent'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                clearMessages();
              }}
              className={`flex-1 py-2 px-3 rounded-[6px] text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMethod === 'email'
                  ? 'bg-white text-[#141414] shadow-2xs border border-[#E5E5E3]'
                  : 'text-[#6B6B6B] hover:text-[#141414] border border-transparent'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE NUMBER INPUT FORM
          ───────────────────────────────────────────────────────────── */}
      {activeTab !== 'forgot' && authMethod === 'phone' && (
        <form onSubmit={handleSendPhoneOtp} className="space-y-4">
          {/* Full Name (Sign Up only) */}
          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-phone-name" className="block text-[13px] font-semibold text-[#141414]">
                Full name
              </label>
              <input
                id="auth-phone-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#8C8C8C] focus:outline-none focus:border-[#141414] transition-colors"
              />
            </div>
          )}

          {/* Mobile Number with clean +91 prefix badge */}
          <div className="space-y-1.5">
            <label htmlFor="auth-phone-number" className="block text-[13px] font-semibold text-[#141414]">
              Mobile number
            </label>
            <div className="flex items-center rounded-[6px] border border-[#E5E5E3] focus-within:border-[#141414] bg-white transition-colors overflow-hidden">
              <div className="flex items-center px-3.5 py-2.5 bg-[#FAFAF9] border-r border-[#E5E5E3] text-[14px] font-semibold text-[#141414] select-none shrink-0">
                <span>+91</span>
              </div>
              <input
                id="auth-phone-number"
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  if (digits.length <= 10) setPhone(digits);
                }}
                placeholder="10-digit mobile number"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-transparent text-[14px] sm:text-[15px] text-[#141414] placeholder:text-[#8C8C8C] focus:outline-none"
              />
            </div>
            <p className="text-[12px] text-[#6B6B6B]">
              We'll send a 6-digit OTP code to verify your mobile number.
            </p>
          </div>

          {/* Send OTP button */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading || phone.length < 10}
            className="w-full min-h-[46px] px-5 py-2.5 bg-[#B0521F] hover:bg-[#994518] disabled:bg-[#E5E5E3] text-white disabled:text-[#6B6B6B] text-[15px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {activeTab === 'signup' ? 'Get OTP to create account' : 'Send OTP'}
            </span>
          </button>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. EMAIL & PASSWORD FLOW
          ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'forgot' || authMethod === 'email') && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {/* Name input on create account */}
          {activeTab === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-email-name" className="block text-[13px] font-semibold text-[#141414]">
                Full name
              </label>
              <input
                id="auth-email-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#8C8C8C] focus:outline-none focus:border-[#141414] transition-colors"
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
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#8C8C8C] focus:outline-none focus:border-[#141414] transition-colors"
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
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 bg-white border border-[#E5E5E3] rounded-[6px] text-[14px] text-[#141414] placeholder:text-[#8C8C8C] focus:outline-none focus:border-[#141414] transition-colors"
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
            className="w-full min-h-[46px] px-5 py-2.5 bg-[#B0521F] hover:bg-[#994518] disabled:bg-[#E5E5E3] text-white disabled:text-[#6B6B6B] text-[15px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
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
      )}
    </div>
  );
}

export default AuthForm;
