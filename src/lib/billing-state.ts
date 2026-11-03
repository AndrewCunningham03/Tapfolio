import { GRACE_DAYS } from "./site";

/** What we know about a customer's subscription (a row of the subscriptions table). */
export type SubscriptionState = {
  status: string;
  current_period_end: string | null;
  past_due_since: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Should this customer's card and page be working right now?
 *
 * - No subscription at all (the owner's own card, demo pages, cards given away): always on.
 * - Paying (active, or in the paid first month): on.
 * - A payment failed: on for GRACE_DAYS after the first failure, then paused until they pay.
 * - Cancelled: on until the end of the period they have paid for.
 * - Anything else (unpaid, never completed): off.
 */
export function isLive(sub: SubscriptionState | null, now: Date = new Date()): boolean {
  if (!sub) return true;
  switch (sub.status) {
    case "active":
    case "trialing":
      return true;
    case "past_due": {
      const end = graceEndsAt(sub);
      return end === null || now < end;
    }
    case "canceled":
      return sub.current_period_end !== null && now < new Date(sub.current_period_end);
    default:
      return false;
  }
}

/** The last moment a card keeps working after a failed payment, or null if nothing has failed. */
export function graceEndsAt(sub: SubscriptionState): Date | null {
  return sub.past_due_since ? new Date(new Date(sub.past_due_since).getTime() + GRACE_DAYS * DAY) : null;
}
