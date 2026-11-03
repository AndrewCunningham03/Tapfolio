-- Orders now come from Stripe Checkout (login first, then pay), not the order form.
-- The webhook writes one row per checkout: who paid, where to post the card, and what they paid.

alter table public.card_orders
  add column user_id            uuid references auth.users (id) on delete set null,
  add column stripe_session_id  text unique,
  add column stripe_customer_id text,
  add column shipping_address   jsonb;

create index card_orders_user_id_idx on public.card_orders (user_id);
