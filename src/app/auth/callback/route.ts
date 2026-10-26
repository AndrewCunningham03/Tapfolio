import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

// The sign-in email links here with a one-time code; swap it for a session cookie.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    console.error("sign-in link exchange failed", error.message);
  }
  return NextResponse.redirect(new URL(`/login?error=link&next=${encodeURIComponent(next)}`, req.nextUrl.origin));
}
