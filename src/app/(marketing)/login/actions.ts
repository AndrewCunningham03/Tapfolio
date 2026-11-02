"use server";

import { safeNext } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

export type GoogleResult = { ok: true; next: string } | { ok: false };

/**
 * Finish a Google sign-in (or sign-up). The browser gets a signed ID token from
 * Google's own pop-up and hands it over with the nonce it made; Supabase checks
 * both and starts the session.
 */
export async function signInWithGoogleToken(token: string, nonce: string, rawNext: string): Promise<GoogleResult> {
  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token, nonce });
  if (error) {
    console.error("google sign-in failed", error.message);
    return { ok: false };
  }
  return { ok: true, next: safeNext(rawNext) };
}
