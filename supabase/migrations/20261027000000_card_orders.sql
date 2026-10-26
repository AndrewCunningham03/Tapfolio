-- Card orders placed through the online card designer.
-- Each order carries the customer's design; production engraves it.

create table public.card_orders (
  id            bigint generated always as identity primary key,
  status        text not null default 'requested'
                check (status in ('requested', 'paid', 'in_production', 'shipped', 'cancelled')),

  -- Customer
  name          text not null check (length(name) between 1 and 120),
  email         text not null check (length(email) <= 200),
  business      text check (length(business) <= 160),
  phone         text check (length(phone) <= 40),
  country       text not null,
  quantity      text,
  message       text check (length(message) <= 4000),

  -- Design
  finish        text not null check (finish in ('black', 'silver', 'gold', 'rose_gold')),
  layout        text not null check (layout in ('logo', 'name', 'minimal')),
  name_on_card  text check (length(name_on_card) <= 40),
  title_on_card text check (length(title_on_card) <= 50),
  back_text     text check (length(back_text) <= 40),
  logo_path     text,                       -- object in the private "card-logos" bucket
  logo_invert   boolean not null default false,

  -- Price shown when ordering (in case prices change later)
  currency      text not null check (currency in ('GBP', 'EUR')),
  card_price    numeric(8, 2) not null,
  monthly_price numeric(8, 2) not null,

  card_id       text references public.cards (id) on delete set null, -- set once a card is made for it
  created_at    timestamptz not null default now()
);

create index card_orders_status_idx on public.card_orders (status, created_at desc);

alter table public.card_orders enable row level security;
revoke all on public.card_orders from anon, authenticated;
grant all on public.card_orders to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Private storage for uploaded logos (only the server can read or write).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-logos', 'card-logos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
