import "server-only";
import { getAdminClient } from "./supabase/admin";

export type TapSource = "card" | "link" | "vcard";
type Device = "ios" | "android" | "desktop" | "other";

// Link-preview fetchers and crawlers aren't people tapping a card.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|slack|skype|embedly|vkshare|headless/i;

function deviceFrom(userAgent: string): Device {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/windows|macintosh|linux|cros/i.test(userAgent)) return "desktop";
  return "other";
}

/**
 * Record a tap. Stores only the time, source and device type: never an IP
 * address. Call it inside after() so it never slows the response.
 */
export async function recordTap({
  userAgent,
  source,
  cardId,
  profileId,
}: {
  userAgent: string | null;
  source: TapSource;
  cardId?: string;
  profileId?: string;
}) {
  if (!userAgent || BOT.test(userAgent)) return;
  const db = getAdminClient();
  if (!db) return;
  const { error } = await db.from("taps").insert({
    card_id: cardId ?? null,
    profile_id: profileId ?? null,
    source,
    device: deviceFrom(userAgent),
  });
  if (error) console.error("tap insert failed", error.message);
}
