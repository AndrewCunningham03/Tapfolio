import "server-only";
import { isLive, type SubscriptionState } from "./billing-state";
import { getAdminClient } from "./supabase/admin";

/** True when the profile's owner has stopped paying and the grace period is over. */
export async function isProfilePaused(by: { slug: string } | { profileId: string }): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;
  const query = db.from("profiles").select("user_id");
  const { data: profile } = await (
    "slug" in by ? query.eq("slug", by.slug) : query.eq("id", by.profileId)
  ).maybeSingle<{
    user_id: string | null;
  }>();
  if (!profile?.user_id) return false;
  const { data: sub } = await db
    .from("subscriptions")
    .select("status, current_period_end, past_due_since")
    .eq("user_id", profile.user_id)
    .maybeSingle<SubscriptionState>();
  return !isLive(sub);
}
