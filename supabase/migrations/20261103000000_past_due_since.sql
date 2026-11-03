-- When a subscription's payment first failed. The grace period (GRACE_DAYS) runs from here;
-- the webhook sets it when the status becomes past_due and clears it once paid again.
alter table public.subscriptions add column past_due_since timestamptz;
