import { after, NextResponse, type NextRequest } from "next/server";
import { lookupCard } from "@/lib/cards";
import { recordTap } from "@/lib/taps";

// Every card's chip and QR code open https://<domain>/C/<ID>. This sends the
// visitor on with a temporary (302) redirect, never a permanent one, so a card
// can be reassigned or disabled at any time.
export async function GET(req: NextRequest, ctx: RouteContext<"/C/[id]">) {
  const { id } = await ctx.params;
  const card = await lookupCard(id);
  const to = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.nextUrl.origin), 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  switch (card.status) {
    case "active": {
      const userAgent = req.headers.get("user-agent");
      after(() => recordTap({ userAgent, source: "card", cardId: card.id, profileId: card.profileId }));
      return to(`/${card.slug}`);
    }
    case "unclaimed":
      return to(`/claim?card=${card.id}`);
    case "disabled":
      return to("/card/disabled");
    default:
      return to("/card/unknown");
  }
}
