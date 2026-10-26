import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

// Does the signed-in visitor own the profile at ?slug=? Lets the public profile
// page stay cached for everyone while owners still get an "Edit my card" button.
export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") ?? "").toLowerCase();
  let owner = false;
  if (slug) {
    const supabase = await getServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      // Row-level security only returns profiles this user owns.
      const { data } = await supabase.from("profiles").select("id").eq("slug", slug).maybeSingle();
      owner = Boolean(data);
    }
  }
  return NextResponse.json({ owner }, { headers: { "Cache-Control": "private, no-store" } });
}
