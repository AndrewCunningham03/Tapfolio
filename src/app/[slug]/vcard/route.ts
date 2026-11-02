import { after, type NextRequest } from "next/server";
import { getProfileBySlug } from "@/lib/profiles";
import { recordTap } from "@/lib/taps";
import { buildVCard, vCardFilename } from "@/lib/vcard";

// Generated from the same record as the profile page, so the two never disagree.
export async function GET(req: NextRequest, ctx: RouteContext<"/[slug]/vcard">) {
  const { slug } = await ctx.params;
  const profile = await getProfileBySlug(slug);
  if (!profile) return new Response("Not found", { status: 404 });

  const userAgent = req.headers.get("user-agent");
  after(() => recordTap({ userAgent, source: "vcard", profileId: profile.id }));

  const profileUrl = `${req.nextUrl.origin}/${profile.slug}`;
  return new Response(buildVCard(profile, profileUrl), {
    headers: {
      // text/vcard makes iOS open the "Add to Contacts" sheet and Android open Contacts.
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": contentDisposition(vCardFilename(profile)),
      "Cache-Control": "no-store",
    },
  });
}

/** Header values must be plain ASCII; names like "Łukasz" go in the UTF-8 filename* form. */
function contentDisposition(filename: string): string {
  const ascii =
    filename
      .normalize("NFKD")
      .replace(/[^\x20-\x7e]/g, "")
      .replace(/["\\]/g, "") || "contact.vcf";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
