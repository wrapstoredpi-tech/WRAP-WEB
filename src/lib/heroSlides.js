import { homeConfig } from '../config/home';

const STORAGE_KEY = 'wrapstore_hero_slides_v2';

/**
 * Returns the current active hero slider slides.
 * Prefers admin-customized slides from localStorage if available,
 * otherwise falls back to the default slides in homeConfig.
 */
export function getHeroSlides() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((s) => s.video || s.id === 'unlimited-prints-video')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading hero slides from localStorage:', e);
    }
  }
  return homeConfig.heroSlider?.slides || [];
}

/**
 * Saves customized hero slides and notifies active tabs/components.
 */
export function saveHeroSlides(slides) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
    window.dispatchEvent(new CustomEvent('wrapstore:hero_slides_updated', { detail: slides }));
  } catch (e) {
    console.warn('Error saving hero slides:', e);
  }
}

/**
 * Resets hero slides back to default storefront slides.
 */
export function resetHeroSlides() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    const defaults = homeConfig.heroSlider?.slides || [];
    window.dispatchEvent(new CustomEvent('wrapstore:hero_slides_updated', { detail: defaults }));
    return defaults;
  } catch (e) {
    console.warn('Error resetting hero slides:', e);
    return homeConfig.heroSlider?.slides || [];
  }
}
