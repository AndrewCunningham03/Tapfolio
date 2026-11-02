"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

/** Sign in (or sign up) with a Google account. Google sends the visitor back to /auth/callback. */
export async function signInWithGoogle(form: FormData) {
  const next = safeNext(form.get("next"));
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    console.error("google sign-in failed", error?.message);
    redirect(`/login?error=google&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}
