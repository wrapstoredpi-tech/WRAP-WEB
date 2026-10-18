import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { supabase, supabaseConfigured } from '../../lib/supabase';

export function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // Handle Forgot Password submission
    if (isForgotMode) {
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Please enter a valid admin email address.');
        setIsLoading(false);
        return;
      }

      if (!supabaseConfigured || !supabase) {
        setError('Supabase is not configured to send password reset emails.');
        setIsLoading(false);
        return;
      }

      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });
        if (resetErr) throw resetErr;
        setInfoMsg('Password reset instructions have been sent to your email.');
      } catch (err) {
        setError(err.message || 'Unable to send password reset instructions.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Please provide both your admin email and password.');
      setIsLoading(false);
      return;
    }

    // 1. Fallback master credential check (keeps operational admin fallback active)
    if (cleanEmail === 'admin@wrapstore.com' && cleanPass === 'Wrapweb@2027') {
      const authData = {
        id: '04bdfe94-9e82-41f2-a55f-23be76b539a2',
        email: cleanEmail,
        fullName: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        authenticatedAt: new Date().toISOString(),
      };

      if (rememberMe) {
        localStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
      } else {
        sessionStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
      }

      setIsLoading(false);
      onLoginSuccess(authData);
      return;
    }

    // 2. Supabase Auth + public.profiles verification
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      setError('Supabase connection is not configured on this client.');
      return;
    }

    try {
      // Authenticate with Supabase Auth
      const { data: authResult, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (signInError) {
        const msg = signInError.message?.toLowerCase().includes('invalid login credentials')
          ? 'Invalid admin email or password. Please verify your credentials.'
          : signInError.message;
        setError(msg);
        setIsLoading(false);
        return;
      }

      const authUser = authResult?.user;
      if (!authUser) {
        setError('Authentication completed but no user session was returned.');
        setIsLoading(false);
        return;
      }

      // Query the public.profiles table for this user
      // Link is via id = auth.users.id
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // If ID lookup was empty, fallback check by email
      if (!profile && !profileError) {
        const { data: profileByEmail, error: emailErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (!emailErr && profileByEmail) {
          profile = profileByEmail;
        }
      }

      if (profileError && !profile) {
        console.warn('[AdminLogin] Error fetching profile:', profileError);
        await supabase.auth.signOut();
        setError('Unable to verify profile authorization in WrapStore database.');
        setIsLoading(false);
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();
        setError('Access denied. No admin profile found in the WrapStore system for this account.');
        setIsLoading(false);
        return;
      }

      // Check if the profile is active
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        setError('This admin account has been deactivated. Please contact your store administrator.');
        setIsLoading(false);
        return;
      }

      // Check role: must be super_admin or store_manager (or admin)
      const normalizedRole = (profile.role || '').toLowerCase();
      const allowedRoles = ['super_admin', 'store_manager', 'admin'];
      if (!allowedRoles.includes(normalizedRole)) {
        await supabase.auth.signOut();
        setError('Access denied. This portal is restricted to Super Admins and Store Managers.');
        setIsLoading(false);
        return;
      }

      // Success! Compile admin session data
      const authData = {
        id: profile.id,
        email: profile.email || cleanEmail,
        fullName: profile.full_name || authUser.user_metadata?.full_name || 'Store Manager',
        role: profile.role || 'store_manager',
        avatarUrl: profile.avatar_url || null,
        authenticatedAt: new Date().toISOString(),
      };

      if (rememberMe) {
        localStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
      } else {
        sessionStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
      }

      setIsLoading(false);
      onLoginSuccess(authData);
    } catch (err) {
      console.error('[AdminLogin] Sign in error:', err);
      setError(err.message || 'An unexpected error occurred during sign-in.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <Logo />
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] text-white text-[11px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B0521F]" />
            <span>Store Admin Portal</span>
          </div>
          <h2 className="mt-4 text-center text-[26px] font-semibold text-[#141414] tracking-tight">
            {isForgotMode ? 'Reset Admin Password' : 'Sign in to WrapStore Admin'}
          </h2>
          <p className="mt-1 text-center text-[13px] text-[#6B6B6B]">
            {isForgotMode
              ? 'Enter your admin email to receive password reset instructions'
              : 'Authorized access for Super Admins and Store Managers'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#E5E5E3] rounded-[8px] shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-[6px] flex items-start gap-2.5 text-[13px] text-red-800 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-[6px] flex items-start gap-2.5 text-[13px] text-emerald-800 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-[13px] font-medium text-[#141414] mb-1">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B6B6B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wrapstore.com"
                  className="w-full pl-9 pr-3 py-2.5 text-[14px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            {!isForgotMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="admin-password" className="block text-[13px] font-medium text-[#141414]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError('');
                      setInfoMsg('');
                    }}
                    className="text-[12px] text-[#B0521F] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B6B6B]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-[14px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {!isForgotMode && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#6B6B6B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#B0521F] rounded-[4px]"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] bg-[#141414] hover:bg-[#2A2A2A] text-white rounded-[6px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isForgotMode ? 'Sending reset link...' : 'Authenticating profile...'}</span>
                  </>
                ) : (
                  <span>{isForgotMode ? 'Send Reset Link' : 'Sign In as Admin'}</span>
                )}
              </button>
            </div>

            {isForgotMode && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError('');
                    setInfoMsg('');
                  }}
                  className="text-[13px] text-[#6B6B6B] hover:text-[#141414] transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Supported Profiles Info Badge */}
          <div className="mt-6 pt-5 border-t border-[#E5E5E3]">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B6B6B]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Supports all active Super Admin & Store Manager profiles</span>
            </div>
            <div className="mt-3 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#6B6B6B] hover:text-[#141414] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to customer storefront</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
