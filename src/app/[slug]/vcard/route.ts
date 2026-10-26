import type { NextRequest } from "next/server";
import { getProfileBySlug } from "@/lib/profiles";
import { buildVCard, vCardFilename } from "@/lib/vcard";

// Generated from the same record as the profile page, so the two never disagree.
export async function GET(req: NextRequest, ctx: RouteContext<"/[slug]/vcard">) {
  const { slug } = await ctx.params;
  const profile = await getProfileBySlug(slug);
  if (!profile) return new Response("Not found", { status: 404 });

  const profileUrl = `${req.nextUrl.origin}/${profile.slug}`;
  return new Response(buildVCard(profile, profileUrl), {
    headers: {
      // text/vcard makes iOS open the "Add to Contacts" sheet and Android open Contacts.
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vCardFilename(profile)}"`,
      "Cache-Control": "no-store",
    },
  });
}
