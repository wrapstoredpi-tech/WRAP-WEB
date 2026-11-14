import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derive first name cleanly
  const firstName = React.useMemo(() => {
    if (!user) return '';
    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || '';
    if (fullName) return fullName.trim().split(/\s+/)[0];
    if (meta.first_name) return meta.first_name.trim();
    if (user.email) return user.email.split('@')[0];
    if (user.phone) {
      const clean = user.phone.replace(/\D/g, '');
      return clean.length >= 10 ? clean.slice(-10) : user.phone;
    }
    return 'Account';
  }, [user]);

  // Initial session check and auth state listener
  useEffect(() => {
    let isMounted = true;

    const restoreLocalPhoneSession = () => {
      try {
        const localPhone = localStorage.getItem('wrapstore_phone_session');
        if (localPhone) {
          const parsed = JSON.parse(localPhone);
          if (parsed && typeof parsed === 'object') {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.warn('[AuthContext] error reading phone session:', e);
      }
    };

    if (!supabaseConfigured || !supabase) {
      restoreLocalPhoneSession();
      setIsLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('[AuthContext] getSession error:', error.message);
        }
        if (isMounted) {
          if (session?.user) {
            setUser(session.user);
          } else {
            restoreLocalPhoneSession();
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[AuthContext] getSession unexpected error:', err);
        if (isMounted) {
          restoreLocalPhoneSession();
          setIsLoading(false);
        }
      });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          setUser(session.user);
          try {
            localStorage.removeItem('wrapstore_phone_session');
          } catch {}
        } else {
          // If Supabase signed out, check if a phone session exists or null
          try {
            const localPhone = localStorage.getItem('wrapstore_phone_session');
            setUser(localPhone ? JSON.parse(localPhone) : null);
          } catch {
            setUser(null);
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Sign In with Email & Password
  const signInWithEmail = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    try {
      localStorage.removeItem('wrapstore_phone_session');
    } catch {}
    return data;
  }, []);

  // Sign Up with Email, Password & Name
  const signUpWithEmail = useCallback(async (email, password, name) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name?.trim() || '',
          name: name?.trim() || '',
        },
      },
    });
    if (error) throw error;
    try {
      localStorage.removeItem('wrapstore_phone_session');
    } catch {}
    return data;
  }, []);

  // Sign In with Google (Redirects to /auth/callback via PKCE)
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    try {
      localStorage.removeItem('wrapstore_phone_session');
    } catch {}
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  // Send OTP to Mobile Number
  const signInWithPhoneOtp = useCallback(async (phone, name = '') => {
    const cleanDigits = String(phone || '').replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    if (supabase) {
      try {
        const options = {
          channel: 'sms',
        };
        if (name?.trim()) {
          options.data = {
            full_name: name.trim(),
            name: name.trim(),
            phone: formattedPhone,
          };
        }
        const { data, error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options,
        });

        if (error) {
          const isProviderDisabled =
            error.code === 'phone_provider_disabled' ||
            error.status === 400 ||
            (error.message && /unsupported phone provider|provider disabled|sms provider/i.test(error.message));

          if (isProviderDisabled) {
            console.info('[AuthContext] Supabase SMS provider not active in dashboard. Using demo OTP mode (123456).');
            return {
              isSimulated: true,
              phone: formattedPhone,
              demoOtp: '123456',
              message: 'Demo mode active: use OTP 123456 to verify.',
            };
          }
          throw error;
        }
        return { isSimulated: false, phone: formattedPhone, data };
      } catch (err) {
        const isProviderDisabled =
          err.code === 'phone_provider_disabled' ||
          err.status === 400 ||
          (err.message && /unsupported phone provider|provider disabled|sms provider/i.test(err.message));

        if (isProviderDisabled) {
          console.info('[AuthContext] Supabase SMS provider not active in dashboard. Using demo OTP mode (123456).');
          return {
            isSimulated: true,
            phone: formattedPhone,
            demoOtp: '123456',
            message: 'Demo mode active: use OTP 123456 to verify.',
          };
        }
        throw err;
      }
    }
    return {
      isSimulated: true,
      phone: formattedPhone,
      demoOtp: '123456',
      message: 'Demo mode active: use OTP 123456 to verify.',
    };
  }, []);

  // Verify Mobile Number OTP
  const verifyPhoneOtp = useCallback(async (phone, token, name = '', isSimulated = false) => {
    const cleanDigits = String(phone || '').replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    if (!isSimulated && supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token.trim(),
        type: 'sms',
      });
      if (error) throw error;

      if (data?.user && name?.trim()) {
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: name.trim(),
              name: name.trim(),
            },
          });
        } catch (metaErr) {
          console.warn('[AuthContext] updateUser metadata warning:', metaErr);
        }
      }
      try {
        localStorage.removeItem('wrapstore_phone_session');
      } catch {}
      return { user: data.user, session: data.session };
    }

    // Simulated verification (for testing/demo when Supabase SMS provider is not active)
    if (token.trim().length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    const cleanName = name?.trim() || '';
    const userSession = {
      id: `phone_${cleanDigits}`,
      phone: formattedPhone,
      email: '',
      user_metadata: {
        phone: formattedPhone,
        full_name: cleanName,
        name: cleanName,
      },
      app_metadata: { provider: 'phone' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('wrapstore_phone_session', JSON.stringify(userSession));
    } catch (storageErr) {
      console.warn('[AuthContext] localStorage error:', storageErr);
    }
    setUser(userSession);
    return { user: userSession, session: null };
  }, []);

  // Reset Password Request
  const resetPassword = useCallback(async (email) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const redirectTo = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
    return data;
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    if (!supabase) {
      try {
        localStorage.removeItem('wrapstore_phone_session');
      } catch {}
      setUser(null);
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] signOut error:', err);
    } finally {
      try {
        localStorage.removeItem('wrapstore_phone_session');
      } catch {}
      setUser(null);
    }
  }, []);

  const value = {
    user,
    firstName,
    isAuthenticated: Boolean(user),
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
