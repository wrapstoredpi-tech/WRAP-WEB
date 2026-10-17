import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Logo } from '../ui/Logo';

export function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      if (cleanEmail === 'admin@wrapstore.com' && cleanPass === 'Wrapweb@2027') {
        const authData = {
          email: cleanEmail,
          role: 'admin',
          authenticatedAt: new Date().toISOString(),
        };

        if (rememberMe) {
          localStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
        } else {
          sessionStorage.setItem('wrapstore_admin_auth', JSON.stringify(authData));
        }

        setIsLoading(false);
        onLoginSuccess(authData);
      } else {
        setIsLoading(false);
        setError('Invalid admin credentials. Please verify your admin ID and password.');
      }
    }, 400);
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
            Sign in to WrapStore Admin
          </h2>
          <p className="mt-1 text-center text-[13px] text-[#6B6B6B]">
            Manage hero photos, featured products, orders & sales
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-[13px] font-medium text-[#141414] mb-1">
                Admin ID / Email
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

            <div>
              <label htmlFor="admin-password" className="block text-[13px] font-medium text-[#141414] mb-1">
                Password
              </label>
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] bg-[#141414] hover:bg-[#2A2A2A] text-white rounded-[6px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <span>Sign In as Admin</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E5E5E3] text-center">
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
  );
}

export default AdminLogin;
