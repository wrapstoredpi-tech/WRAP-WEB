import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to update password. Your recovery link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 max-w-[540px] w-full mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display font-normal text-[26px] sm:text-[30px] text-[#141414] tracking-[-0.01em] mb-2">
          Set new password
        </h1>
        <p className="font-sans text-[14px] text-[#6B6B6B] mb-6">
          Choose a secure password for your WrapStore account.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-[6px] text-[14px]">
              Your password has been reset successfully.
            </div>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="w-full min-h-[44px] bg-[#141414] hover:bg-[#383836] text-white text-[14px] font-semibold rounded-[6px] transition-colors"
            >
              Continue to account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-[6px] text-[13px]">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="reset-password" className="block text-[14px] font-medium text-[#141414] mb-1">
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white border border-[#E5E5E3] rounded-[6px] px-3 py-2 text-[14px] text-[#141414] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#141414] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-[14px] font-medium text-[#141414] mb-1">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-white border border-[#E5E5E3] rounded-[6px] px-3 py-2 text-[14px] text-[#141414] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#141414]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] bg-[#141414] hover:bg-[#383836] text-white text-[14px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                'Update password'
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-[13px] text-[#6B6B6B] hover:text-[#141414]">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default ResetPasswordPage;
