/**
 * src/lib/supabase.js
 * WrapStore Website — Supabase client (anon key ONLY, never service-role).
 *
 * The project connects to the same Supabase instance as the WrapStore POS.
 * All reads are gated by existing RLS policies; no schema changes are made here.
 */
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ── URL sanity guard ──────────────────────────────────────────────────────────
const isDashboardUrl = rawUrl.includes('supabase.com/dashboard');
if (isDashboardUrl) {
  console.error(
    '[WrapStore] WRONG SUPABASE URL — you pasted the dashboard URL, not the project API URL.\n' +
    'Correct format: https://<project-ref>.supabase.co'
  );
}

// ── Service-role key guard ────────────────────────────────────────────────────
if (anonKey) {
  try {
    const payload = JSON.parse(atob(anonKey.split('.')[1]));
    if (payload?.role === 'service_role') {
      console.error(
        '[WrapStore] SECURITY: VITE_SUPABASE_ANON_KEY contains a SERVICE ROLE KEY.\n' +
        'This key bypasses RLS and must NEVER be used in a browser frontend.\n' +
        'Replace it with the public anon key.'
      );
    }
  } catch {
    // malformed key — will fail gracefully on first API call
  }
}

const supabaseUrl = isDashboardUrl ? '' : rawUrl;

export const supabaseConfigured = !!(
  supabaseUrl &&
  anonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.includes('.supabase.co')
);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false, // website doesn't need auth sessions
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    })
  : null;

export default supabase;
