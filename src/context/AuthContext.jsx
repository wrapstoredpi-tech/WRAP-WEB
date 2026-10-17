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
    return 'Account';
  }, [user]);

  // Initial session check and auth state listener
  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('[AuthContext] getSession error:', error.message);
        }
        if (isMounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[AuthContext] getSession unexpected error:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
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
    return data;
  }, []);

  // Sign In with Google
  const signInWithGoogle = useCallback(async (returnTo = '/') => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const redirectTo = `${window.location.origin}${returnTo}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
    return data;
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
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] signOut error:', err);
    } finally {
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
