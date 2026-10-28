"use server";

import { headers } from "next/headers";
import { safeNext } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; email?: string; message?: string };

export async function sendSignInLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  const next = safeNext(form.get("next"));

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Accounts are only created when a card is made, never by signing in.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  // Same answer whether or not the email has an account, so nobody can use this
  // page to find out who our customers are.
  if (error && !/signups not allowed|not found|user not found/i.test(error.message)) {
    if (/seconds/i.test(error.message)) {
      return { status: "error", message: "Please wait a minute before asking for another link." };
    }
    // Supabase's built-in email sender allows only a few emails an hour in total.
    if (/rate|too many/i.test(error.message)) {
      return { status: "error", message: "Too many sign-in emails have gone out in the last hour. Please try again later." };
    }
    console.error("sign-in link failed", error.message);
    return { status: "error", message: "We couldn't send the email just now. Please try again shortly." };
  }
  return { status: "sent", email };
}
