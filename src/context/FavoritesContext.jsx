import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const FavoritesContext = createContext(null);

const STORAGE_KEY_PENDING = 'wrapstore_pending_favorite';
const LEGACY_WISHLIST_KEY = 'wrapstore_wishlist_ids';

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active user's favorites key for localStorage
  const userStorageKey = useMemo(() => {
    return user ? `wrapstore_favorites_${user.id}` : null;
  }, [user]);

  // Load initial favorites from localStorage (user-specific or fallback)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      if (user) {
        const saved = localStorage.getItem(`wrapstore_favorites_${user.id}`);
        if (saved) return new Set(JSON.parse(saved));
      }
      // Also check legacy wishlist key
      const legacy = localStorage.getItem(LEGACY_WISHLIST_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not load favorites from storage:', e);
    }
    return new Set();
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // When user signs in or changes, load user favorites from Supabase metadata + localStorage
  useEffect(() => {
    if (!user) {
      // Guest: clear favorites state so one user's favorites don't bleed into another
      setFavoriteIds(new Set());
      return;
    }

    let isMounted = true;

    async function loadUserFavorites() {
      const mergedSet = new Set();

      // 1. Check user-specific localStorage
      try {
        const local = localStorage.getItem(`wrapstore_favorites_${user.id}`);
        if (local) {
          const arr = JSON.parse(local);
          if (Array.isArray(arr)) arr.forEach((id) => mergedSet.add(id));
        }
      } catch (e) {
        console.warn('Error reading local user favorites:', e);
      }

      // 2. Check Supabase user_metadata
      const metaFavorites = user.user_metadata?.favorites;
      if (Array.isArray(metaFavorites)) {
        metaFavorites.forEach((id) => mergedSet.add(id));
      }

      // 3. Check for any pending favorite from before signin/registration
      let pendingId = null;
      try {
        pendingId = sessionStorage.getItem(STORAGE_KEY_PENDING) || localStorage.getItem(STORAGE_KEY_PENDING);
      } catch {}

      if (pendingId) {
        mergedSet.add(pendingId);
        try {
          sessionStorage.removeItem(STORAGE_KEY_PENDING);
          localStorage.removeItem(STORAGE_KEY_PENDING);
        } catch {}
        if (isMounted) {
          showToast('Product automatically added to your favourites!');
        }
      }

      // Update state
      if (isMounted) {
        setFavoriteIds(new Set(mergedSet));
      }

      // Persist merged favorites to localStorage
      try {
        const arrayVal = Array.from(mergedSet);
        localStorage.setItem(`wrapstore_favorites_${user.id}`, JSON.stringify(arrayVal));
        localStorage.setItem(LEGACY_WISHLIST_KEY, JSON.stringify(arrayVal));
        window.dispatchEvent(new Event('wrapstore_wishlist_updated'));
      } catch {}

      // Sync back to Supabase user metadata if changed
      if (supabase && (!Array.isArray(metaFavorites) || metaFavorites.length !== mergedSet.size)) {
        try {
          await supabase.auth.updateUser({
            data: { favorites: Array.from(mergedSet) },
          });
        } catch (err) {
          console.warn('Could not sync favorites to Supabase user metadata:', err);
        }
      }
    }

    loadUserFavorites();

    return () => {
      isMounted = false;
    };
  }, [user, showToast]);

  // Persist helper
  const persistFavorites = useCallback(
    async (nextSet) => {
      const arrayVal = Array.from(nextSet);

      if (userStorageKey) {
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(arrayVal));
        } catch {}
      }

      try {
        localStorage.setItem(LEGACY_WISHLIST_KEY, JSON.stringify(arrayVal));
        window.dispatchEvent(new Event('wrapstore_wishlist_updated'));
      } catch {}

      // Sync to Supabase user metadata if user is logged in
      if (user && supabase) {
        try {
          await supabase.auth.updateUser({
            data: { favorites: arrayVal },
          });
        } catch (e) {
          console.warn('Could not update favorites in Supabase:', e);
        }
      }
    },
    [user, userStorageKey]
  );

  const isFavorite = useCallback(
    (productId) => {
      if (!productId) return false;
      return favoriteIds.has(String(productId));
    },
    [favoriteIds]
  );

  /**
   * Toggle favorite:
   * - If user is NOT logged in: prompts login/signin page with pending favorite stored.
   * - If user IS logged in: automatically adds or removes product from favorites.
   */
  const toggleFavorite = useCallback(
    (productOrId, options = {}) => {
      const productId = String(
        typeof productOrId === 'object' && productOrId !== null
          ? productOrId.id || productOrId.product_id
          : productOrId
      );

      if (!productId) return false;

      // 1. If user is NOT logged in -> prompt login/signin page
      if (!user) {
        try {
          sessionStorage.setItem(STORAGE_KEY_PENDING, productId);
          localStorage.setItem(STORAGE_KEY_PENDING, productId);
        } catch {}

        const returnUrl = options.returnUrl || window.location.pathname;
        const loginUrl = `/login?returnTo=${encodeURIComponent(returnUrl)}&pendingFavorite=${encodeURIComponent(productId)}`;

        showToast('Please sign in or create an account to add to favourites.');
        navigate(loginUrl);
        return false;
      }

      // 2. User IS logged in -> add/remove automatically
      const nextSet = new Set(favoriteIds);
      let isNowFav = false;

      if (nextSet.has(productId)) {
        nextSet.delete(productId);
        isNowFav = false;
        showToast('Removed from your favourites');
      } else {
        nextSet.add(productId);
        isNowFav = true;
        showToast('Added to your favourites!');
      }

      setFavoriteIds(nextSet);
      persistFavorites(nextSet);
      return isNowFav;
    },
    [user, favoriteIds, navigate, persistFavorites, showToast]
  );

  const addToFavorites = useCallback(
    (productId) => {
      if (!productId) return;
      const idStr = String(productId);

      if (!user) {
        try {
          sessionStorage.setItem(STORAGE_KEY_PENDING, idStr);
          localStorage.setItem(STORAGE_KEY_PENDING, idStr);
        } catch {}
        navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname)}&pendingFavorite=${encodeURIComponent(idStr)}`);
        return;
      }

      const nextSet = new Set(favoriteIds);
      if (!nextSet.has(idStr)) {
        nextSet.add(idStr);
        setFavoriteIds(nextSet);
        persistFavorites(nextSet);
        showToast('Added to your favourites!');
      }
    },
    [user, favoriteIds, navigate, persistFavorites, showToast]
  );

  const removeFromFavorites = useCallback(
    (productId) => {
      if (!productId) return;
      const idStr = String(productId);
      const nextSet = new Set(favoriteIds);
      if (nextSet.has(idStr)) {
        nextSet.delete(idStr);
        setFavoriteIds(nextSet);
        persistFavorites(nextSet);
        showToast('Removed from your favourites');
      }
    },
    [favoriteIds, persistFavorites, showToast]
  );

  const value = {
    favoriteIds,
    favoriteCount: favoriteIds.size,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    toastMessage,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {/* Global floating toast notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#141414] text-white text-[13px] font-medium shadow-xl flex items-center gap-2 animate-fade-in pointer-events-none select-none max-w-[90vw] text-center"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return ctx;
}

// Alias for backwards compatibility with any existing useWishlist references
export const useWishlist = useFavorites;

export default FavoritesContext;
