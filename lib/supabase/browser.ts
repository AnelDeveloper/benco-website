import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Public-key client for the browser, used only to upload photos to signed
 * URLs the server issued. The signed token is what authorises the upload, so
 * no session or elevated key is needed here.
 *
 * The env vars are read literally so Next inlines them into the bundle.
 */
export function browserClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
