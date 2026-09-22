import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from '@/lib/env';
import type { Database } from './types';

/**
 * Full-access client. Bypasses row-level security.
 *
 * The `server-only` import above makes the build fail if this file is ever
 * reached from a client component, which is the guardrail that keeps the
 * service-role key out of the browser bundle.
 */
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
