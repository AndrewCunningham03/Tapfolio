import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side client using the secret key. It bypasses row-level security, so
// it must never be imported into client components (server-only enforces that).
// Returns null until Supabase is configured in .env.local.
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
