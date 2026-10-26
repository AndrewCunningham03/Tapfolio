-- "Pay me": let a business show how customers can pay them.
-- Money goes straight from the customer to the business; Tapfolio only
-- displays the links and details.

alter table public.profiles
  -- { "revolut": "https://revolut.me/…", "paypal": "https://paypal.me/…",
  --   "monzo": "https://monzo.me/…", "card": "https://<SumUp or Stripe link>" }
  add column pay_links jsonb not null default '{}'::jsonb check (jsonb_typeof(pay_links) = 'object'),
  -- { "account_name": "…", "sort_code": "123456", "account_number": "12345678",
  --   "iban": "IE…", "bic": "…" }  (UK details, Irish details, or both)
  add column bank jsonb not null default '{}'::jsonb check (jsonb_typeof(bank) = 'object');

grant update (pay_links, bank) on public.profiles to authenticated;
