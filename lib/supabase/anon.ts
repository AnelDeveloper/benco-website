import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { optionalEnv } from '@/lib/env';
import type { Database } from './types';

/**
 * Read-only client for public data.
 *
 * Returns null instead of throwing when Supabase is not configured, so that
 * `next build` succeeds in an environment without secrets. Callers treat null
 * as "no data available".
 */
export function createAnonClient(): SupabaseClient<Database> | null {
  const url = optionalEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = optionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
