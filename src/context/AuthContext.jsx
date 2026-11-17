import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Helper to fetch customer profile strictly from public.online_user
  const fetchCustomerProfile = useCallback(async (userId) => {
    if (!supabaseConfigured || !supabase || !userId) return null;
    setIsLoadingProfile(true);
    try {
      let { data, error } = await supabase
        .from('online_user')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // If null (e.g. immediately after new signup), retry once after a brief delay
      if (!data && !error) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const retry = await supabase
          .from('online_user')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (retry?.data) data = retry.data;
      }

      if (error) {
        console.warn('[AuthContext] Note loading customer profile:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[AuthContext] Unexpected error fetching customer profile:', err);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Update customer profile with strict client-allowed fields
  const updateCustomerProfile = useCallback(async (updates) => {
    if (!supabaseConfigured || !supabase || !user) {
      throw new Error('User is not authenticated');
    }

    // Only allow safe, customer-owned fields
    const allowedKeys = ['full_name', 'phone', 'avatar_url', 'default_shipping_address'];
    const safePayload = {};
    for (const key of allowedKeys) {
      if (key in updates) {
        safePayload[key] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from('online_user')
      .update(safePayload)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      setCustomerProfile(data);
    }
    return data;
  }, [user]);

  // Derive first name cleanly (Prioritize customerProfile, then metadata, then email)
  const firstName = React.useMemo(() => {
    if (customerProfile?.full_name) {
      return customerProfile.full_name.trim().split(/\s+/)[0];
    }
    if (!user) return '';
    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || '';
    if (fullName) return fullName.trim().split(/\s+/)[0];
    if (meta.first_name) return meta.first_name.trim();
    if (user.email) return user.email.split('@')[0];
    return 'Account';
  }, [user, customerProfile]);

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
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.warn('[AuthContext] getSession error:', error.message);
        }
        if (isMounted) {
          const authUser = session?.user ?? null;
          setUser(authUser);
          if (authUser) {
            const profile = await fetchCustomerProfile(authUser.id);
            if (isMounted) {
              setCustomerProfile(profile);
            }
          }
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const authUser = session?.user ?? null;
      setUser(authUser);
      setIsLoading(false);

      if (authUser) {
        // Record login timestamp ONLY on explicit SIGNED_IN event (never on background TOKEN_REFRESHED)
        if (event === 'SIGNED_IN') {
          supabase.rpc('record_customer_login').catch((err) => {
            console.warn('[AuthContext] record_customer_login telemetry note:', err.message);
          });
        }

        const profile = await fetchCustomerProfile(authUser.id);
        if (isMounted) {
          setCustomerProfile(profile);
        }
      } else {
        setCustomerProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchCustomerProfile]);

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

  // Sign In with Google (Redirects to /auth/callback via PKCE)
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
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
      setCustomerProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profile = await fetchCustomerProfile(user.id);
      setCustomerProfile(profile);
      return profile;
    }
    return null;
  }, [user, fetchCustomerProfile]);

  const value = {
    user,
    customerProfile,
    firstName,
    isAuthenticated: Boolean(user),
    isLoading,
    isLoadingProfile,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    signOut,
    refreshProfile,
    updateCustomerProfile,
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
