import { homeConfig } from '../config/home';
import { supabase, supabaseConfigured } from './supabase';

const STORAGE_KEY = 'wrapstore_hero_slides_v4';
const SYSTEM_RECORD_KEY = '__WRAPSTORE_HERO_SLIDES__';

/**
 * Returns the current active hero slider slides synchronously from localStorage cache.
 * Falls back to default slides in homeConfig if no cache exists.
 */
export function getHeroSlides() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('wrapstore_hero_slides_v2');
      localStorage.removeItem('wrapstore_hero_slides_v3');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading hero slides cache:', e);
    }
  }
  return homeConfig.heroSlider?.slides || [];
}

export const getCachedHeroSlides = getHeroSlides;

/**
 * Fetches hero slides from Supabase Database.
 * Persists across page refreshes, devices, and sessions.
 * Automatically updates localStorage cache and dispatches update event.
 */
export async function fetchHeroSlides() {
  if (!supabaseConfigured || !supabase) {
    return getHeroSlides();
  }

  try {
    // 1. Check if dedicated hero_slides table exists
    const dedicated = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!dedicated.error && Array.isArray(dedicated.data) && dedicated.data.length > 0) {
      const formatted = dedicated.data.map((row) => ({
        id: row.id,
        type: row.type || 'image',
        video: row.type === 'video' ? row.media_url : undefined,
        image: row.type === 'video' ? row.poster_url || row.media_url : row.media_url,
        tag: row.tag || '',
        tagSubtitle: row.tag_subtitle || '',
        link: row.link_url || '/?category=Mobile%20Cases',
        alt: row.alt_text || row.tag || 'Hero slide',
      }));

      updateLocalCache(formatted);
      return formatted;
    }

    // 2. Fetch from guaranteed cloud persistence in online_orders system record
    const { data, error } = await supabase
      .from('online_orders')
      .select('shipping_address, created_at')
      .eq('customer_name', SYSTEM_RECORD_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      const raw = data[0].shipping_address;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        updateLocalCache(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[heroSlides] Error fetching hero slides from database:', err);
  }

  return getHeroSlides();
}

/**
 * Saves customized hero slides permanently to the Supabase Database.
 * Also syncs localStorage and notifies active tabs/components.
 */
export async function saveHeroSlides(slides) {
  const list = Array.isArray(slides) ? slides : [];

  // Update local cache & notify local window immediately
  updateLocalCache(list);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wrapstore:hero_slides_updated', { detail: list }));
  }

  if (!supabaseConfigured || !supabase) {
    return list;
  }

  try {
    // 1. Try dedicated table hero_slides if available
    const checkTable = await supabase.from('hero_slides').select('id').limit(1);
    if (!checkTable.error) {
      // Clear existing and re-insert
      await supabase.from('hero_slides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (list.length > 0) {
        const rows = list.map((slide, index) => ({
          type: slide.type || (slide.video ? 'video' : 'image'),
          media_url: slide.video || slide.image,
          poster_url: slide.image || null,
          tag: slide.tag || '',
          tag_subtitle: slide.tagSubtitle || '',
          link_url: slide.link || '/?category=Mobile%20Cases',
          alt_text: slide.alt || slide.tag || '',
          sort_order: index,
          is_active: true,
        }));
        await supabase.from('hero_slides').insert(rows);
      }
      return list;
    }

    // 2. Persist to Supabase DB via system record
    const payload = {
      customer_name: SYSTEM_RECORD_KEY,
      customer_phone: '0000000000',
      order_status: 'CONFIRMED',
      payment_status: 'PAID',
      subtotal: 0,
      shipping_address: JSON.stringify(list),
    };

    const { error } = await supabase.from('online_orders').insert(payload);
    if (error) {
      console.warn('[heroSlides] Failed to write hero slides to database:', error.message);
    }
  } catch (err) {
    console.warn('[heroSlides] Error persisting hero slides to database:', err);
  }

  return list;
}

/**
 * Resets hero slides back to default (0 slides) in the database and local storage.
 */
export async function resetHeroSlides() {
  return await saveHeroSlides([]);
}

/**
 * Helper to update localStorage safely without throwing on quota limit
 */
function updateLocalCache(slides) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
  } catch (e) {
    // If quota exceeded due to large dataUrl images, catch gracefully
    console.warn('[heroSlides] localStorage quota exceeded, skipping local storage cache:', e);
  }
}
