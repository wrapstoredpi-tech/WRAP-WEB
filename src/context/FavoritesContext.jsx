import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { saveAuthIntent, sanitizeReturnTo } from '../lib/authRedirect';

const FavoritesContext = createContext(null);

const STORAGE_KEY_PENDING = 'wrapstore_pending_favorite';
const GUEST_FAVORITES_KEY = 'wrapstore_guest_favorites';
const LEGACY_WISHLIST_KEY = 'wrapstore_wishlist_ids';

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active user's favorites key for localStorage
  const userStorageKey = useMemo(() => {
    return user ? `wrapstore_favorites_${user.id}` : null;
  }, [user]);

  // Load initial favorites from localStorage (user-specific or guest device)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      if (user) {
        const saved = localStorage.getItem(`wrapstore_favorites_${user.id}`);
        if (saved) return new Set(JSON.parse(saved));
      } else {
        const guest = localStorage.getItem(GUEST_FAVORITES_KEY) || localStorage.getItem(LEGACY_WISHLIST_KEY);
        if (guest) {
          const parsed = JSON.parse(guest);
          if (Array.isArray(parsed)) return new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not load favorites from storage:', e);
    }
    return new Set();
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    if (!message) return;
    setToastMessage(message);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // Global listener for custom toast events (e.g. from auth callback)
  useEffect(() => {
    const handleCustomToast = (e) => {
      if (e.detail) showToast(e.detail);
    };
    window.addEventListener('wrapstore_toast', handleCustomToast);
    return () => window.removeEventListener('wrapstore_toast', handleCustomToast);
  }, [showToast]);

  // When user signs in or changes, load and merge favorites
  useEffect(() => {
    if (!user) {
      // Guest mode: load device favorites
      try {
        const guest = localStorage.getItem(GUEST_FAVORITES_KEY) || localStorage.getItem(LEGACY_WISHLIST_KEY);
        if (guest) {
          const parsed = JSON.parse(guest);
          setFavoriteIds(new Set(Array.isArray(parsed) ? parsed : []));
        } else {
          setFavoriteIds(new Set());
        }
      } catch {
        setFavoriteIds(new Set());
      }
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
          if (Array.isArray(arr)) arr.forEach((id) => mergedSet.add(String(id)));
        }
      } catch (e) {
        console.warn('Error reading local user favorites:', e);
      }

      // 2. Check Supabase user_metadata
      const metaFavorites = user.user_metadata?.favorites;
      if (Array.isArray(metaFavorites)) {
        metaFavorites.forEach((id) => mergedSet.add(String(id)));
      }

      // 3. Try to fetch from customer_favourites table if it exists
      if (supabase) {
        try {
          const { data: dbFavs } = await supabase
            .from('customer_favourites')
            .select('product_id')
            .eq('user_id', user.id);
          if (Array.isArray(dbFavs)) {
            dbFavs.forEach((row) => {
              if (row.product_id) mergedSet.add(String(row.product_id));
            });
          }
        } catch (e) {
          // Table may not be created yet, non-fatal
        }
      }

      // 4. Merge any guest favorites saved on this device without duplicates
      try {
        const guestRaw = localStorage.getItem(GUEST_FAVORITES_KEY);
        const legacyRaw = localStorage.getItem(LEGACY_WISHLIST_KEY);
        const guestArr = [
          ...(guestRaw ? JSON.parse(guestRaw) : []),
          ...(legacyRaw ? JSON.parse(legacyRaw) : []),
        ];
        if (Array.isArray(guestArr)) {
          guestArr.forEach((id) => mergedSet.add(String(id)));
        }
      } catch {}

      // 5. Check for any pending favorite from before signin/registration
      let pendingId = null;
      try {
        pendingId = sessionStorage.getItem(STORAGE_KEY_PENDING) || localStorage.getItem(STORAGE_KEY_PENDING);
      } catch {}

      if (pendingId) {
        mergedSet.add(String(pendingId));
        try {
          sessionStorage.removeItem(STORAGE_KEY_PENDING);
          localStorage.removeItem(STORAGE_KEY_PENDING);
        } catch {}
        if (isMounted) {
          showToast('Saved to your favourites');
        }
      }

      // Update in-memory state
      if (isMounted) {
        setFavoriteIds(new Set(mergedSet));
      }

      const finalArray = Array.from(mergedSet);

      // Persist to user localStorage and legacy key
      try {
        localStorage.setItem(`wrapstore_favorites_${user.id}`, JSON.stringify(finalArray));
        localStorage.setItem(LEGACY_WISHLIST_KEY, JSON.stringify(finalArray));
        // Clear guest device favorites so they don't linger for other users
        localStorage.removeItem(GUEST_FAVORITES_KEY);
        window.dispatchEvent(new Event('wrapstore_wishlist_updated'));
      } catch {}

      // Sync to Supabase user metadata
      if (supabase && (!Array.isArray(metaFavorites) || metaFavorites.length !== mergedSet.size)) {
        try {
          await supabase.auth.updateUser({
            data: { favorites: finalArray },
          });
        } catch (err) {
          console.warn('Could not sync favorites to user metadata:', err);
        }
      }

      // Sync to customer_favourites table if exists
      if (supabase && finalArray.length > 0) {
        try {
          const rows = finalArray.map((pid) => ({
            user_id: user.id,
            product_id: pid,
          }));
          await supabase.from('customer_favourites').upsert(rows, { onConflict: 'user_id,product_id' });
        } catch (err) {
          // Table may not be created yet, non-fatal
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
      } else {
        // Guest mode: save to guest storage
        try {
          localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(arrayVal));
        } catch {}
      }

      try {
        localStorage.setItem(LEGACY_WISHLIST_KEY, JSON.stringify(arrayVal));
        window.dispatchEvent(new Event('wrapstore_wishlist_updated'));
      } catch {}

      // Sync to Supabase if user is logged in
      if (user && supabase) {
        try {
          await supabase.auth.updateUser({
            data: { favorites: arrayVal },
          });
        } catch (e) {
          console.warn('Could not update favorites in user metadata:', e);
        }

        try {
          const rows = arrayVal.map((pid) => ({
            user_id: user.id,
            product_id: pid,
          }));
          await supabase.from('customer_favourites').upsert(rows, { onConflict: 'user_id,product_id' });
        } catch (e) {
          // Non-fatal if table does not exist
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
   * Helper to merge and add a favorite item programmatically (e.g. from OAuth callback or post-auth continuation)
   */
  const mergeAndAddFavorite = useCallback(
    (productId) => {
      if (!productId) return;
      const idStr = String(productId);
      setFavoriteIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(idStr);
        persistFavorites(nextSet);
        return nextSet;
      });
      showToast('Saved to your favourites');
    },
    [persistFavorites, showToast]
  );

  /**
   * Toggle favorite:
   * - If user is NOT logged in: saves auth intent with pendingAction { type: 'favourite', productId }
   *   and redirects to /login.
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

      // 1. If user is NOT logged in -> save intent and prompt signin
      if (!user) {
        const returnUrl = sanitizeReturnTo(options.returnUrl || window.location.pathname);
        try {
          sessionStorage.setItem(STORAGE_KEY_PENDING, productId);
          localStorage.setItem(STORAGE_KEY_PENDING, productId);
        } catch {}

        saveAuthIntent({
          returnTo: returnUrl,
          pendingAction: { type: 'favourite', productId },
        });

        const loginUrl = `/login?returnTo=${encodeURIComponent(returnUrl)}&pendingFavorite=${encodeURIComponent(productId)}`;
        showToast('Please sign in or create an account to add to favourites.');
        navigate(loginUrl);
        return false;
      }

      // 2. User IS logged in -> add/remove
      const nextSet = new Set(favoriteIds);
      let isNowFav = false;

      if (nextSet.has(productId)) {
        nextSet.delete(productId);
        isNowFav = false;
        showToast('Removed from your favourites');

        // Delete from DB table if exists
        if (supabase) {
          supabase.from('customer_favourites').delete().eq('user_id', user.id).eq('product_id', productId).catch(() => {});
        }
      } else {
        nextSet.add(productId);
        isNowFav = true;
        showToast('Saved to your favourites');
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
        const returnUrl = sanitizeReturnTo(window.location.pathname);
        try {
          sessionStorage.setItem(STORAGE_KEY_PENDING, idStr);
          localStorage.setItem(STORAGE_KEY_PENDING, idStr);
        } catch {}
        saveAuthIntent({
          returnTo: returnUrl,
          pendingAction: { type: 'favourite', productId: idStr },
        });
        navigate(`/login?returnTo=${encodeURIComponent(returnUrl)}&pendingFavorite=${encodeURIComponent(idStr)}`);
        return;
      }

      const nextSet = new Set(favoriteIds);
      if (!nextSet.has(idStr)) {
        nextSet.add(idStr);
        setFavoriteIds(nextSet);
        persistFavorites(nextSet);
        showToast('Saved to your favourites');
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

        if (user && supabase) {
          supabase.from('customer_favourites').delete().eq('user_id', user.id).eq('product_id', idStr).catch(() => {});
        }
      }
    },
    [user, favoriteIds, persistFavorites, showToast]
  );

  const value = {
    favoriteIds,
    favoriteCount: favoriteIds.size,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    mergeAndAddFavorite,
    showToast,
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

export const useWishlist = useFavorites;

export default FavoritesContext;
