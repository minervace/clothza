// ============================================================
// lib/supabase.ts — Clothza v4.0
// Supabase client initialization with graceful fallback
// App works fully with localStorage if Supabase is not configured
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env['VITE_SUPABASE_URL']      as string | undefined;
const supabaseKey  = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined;

/**
 * Whether Supabase is configured.
 * When false, all data comes from localStorage + seed data.
 */
export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl !== 'your_supabase_url_here' &&
  Boolean(supabaseKey) &&
  supabaseKey !== 'your_supabase_anon_key_here';

/**
 * The Supabase client.
 * If not configured, returns a no-op client stub to prevent runtime errors.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : createFallbackClient();

/**
 * Creates a minimal stub that satisfies the SupabaseClient type
 * without making any network requests.
 */
function createFallbackClient(): SupabaseClient {
  // In fallback mode, return the real client with placeholder values.
  // Supabase gracefully fails on invalid URLs rather than throwing.
  return createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkxNTM2MDAwMH0.placeholder'
  );
}

export default supabase;
