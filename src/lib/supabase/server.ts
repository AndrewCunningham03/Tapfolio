import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client acting as the signed-in visitor (publishable key + their
 * session cookie), so row-level security applies. Use getAdminClient() only
 * for server work that must bypass it.
 */
export async function getServerClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called while rendering a Server Component, where cookies are read-only.
          // src/proxy.ts keeps the session fresh, so this is safe to ignore.
        }
      },
    },
  });
}
