/**
 * src/lib/authRedirect.js
 * ────────────────────────
 * Manages auth intents, post-auth continuations, return-to paths,
 * and in-app browser detection for one-step shopper authentication.
 */

export const AUTH_INTENT_KEY = 'wrapstore_auth_intent';
export const MAX_INTENT_AGE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Validates returnTo path: accepts only relative paths starting with a single '/'.
 * Rejects external URLs, protocol-relative '//', or empty inputs, falling back to '/'.
 */
export function sanitizeReturnTo(url) {
  if (!url || typeof url !== 'string') return '/';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return '/';
}

/**
 * Saves auth intent to sessionStorage before redirecting to Google or completing email auth.
 */
export function saveAuthIntent({ returnTo = '/', pendingAction = null }) {
  try {
    const payload = {
      returnTo: sanitizeReturnTo(returnTo),
      pendingAction,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[authRedirect] Could not save auth intent:', e);
  }
}

/**
 * Retrieves the stored auth intent from sessionStorage.
 * Ignores any action older than 15 minutes.
 */
export function getAuthIntent() {
  try {
    const raw = sessionStorage.getItem(AUTH_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_INTENT_AGE_MS) {
      sessionStorage.removeItem(AUTH_INTENT_KEY);
      return null;
    }

    return {
      returnTo: sanitizeReturnTo(parsed.returnTo),
      pendingAction: parsed.pendingAction || null,
      savedAt: parsed.savedAt,
    };
  } catch (e) {
    console.warn('[authRedirect] Could not parse auth intent:', e);
    return null;
  }
}

/**
 * Clears any saved auth intent.
 */
export function clearAuthIntent() {
  try {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
  } catch {}
}

/**
 * Detects whether the current session is inside an in-app browser
 * (Facebook App, Instagram, Line, etc.) where Google blocks OAuth.
 */
export function isInAppBrowser() {
  if (typeof window === 'undefined' || !navigator || !navigator.userAgent) return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger/i.test(ua);
}

/**
 * Dispatches a global toast notification to the floating toast in FavoritesContext.
 */
export function dispatchToast(message) {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(new CustomEvent('wrapstore_toast', { detail: message }));
}

/**
 * Derives a clean first name from user metadata or email.
 */
export function getFirstName(user) {
  if (!user) return 'there';
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || '';
  if (fullName) return fullName.trim().split(/\s+/)[0];
  if (meta.first_name) return meta.first_name.trim();
  if (user.email) return user.email.split('@')[0];
  return 'there';
}

