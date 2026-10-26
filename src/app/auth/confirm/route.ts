import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

// Sign-in links that carry a one-time token hash (works even if the link is
// opened in a different browser from the one that asked for it). Used once a
// custom email template is set up, and by admin-generated links.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = safeNext(params.get("next"));

  if (tokenHash && type) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    console.error("sign-in token failed", error.message);
  }
  return NextResponse.redirect(new URL(`/login?error=link&next=${encodeURIComponent(next)}`, req.nextUrl.origin));
}
