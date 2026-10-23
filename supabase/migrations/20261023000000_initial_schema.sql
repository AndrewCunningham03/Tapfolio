-- Tapfolio initial schema
--
-- Cards carry a permanent random ID (printed in the QR and encoded on the chip
-- as https://<domain>/C/<ID>). The ID points at a profile, which the customer
-- edits and whose slug (/<slug>) they can change without breaking the card.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.card_tier as enum ('standard', 'platinum');
create type public.card_status as enum ('unclaimed', 'active', 'disabled');
create type public.profile_plan as enum ('free', 'pro');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Slugs that would collide with app routes. Keep in sync with src/lib/slugs.ts.
create table public.reserved_slugs (
  slug text primary key
);

insert into public.reserved_slugs (slug) values
  ('about'), ('account'), ('admin'), ('api'), ('app'), ('auth'), ('billing'),
  ('c'), ('card'), ('cards'), ('claim'), ('contact'), ('dashboard'), ('help'),
  ('login'), ('logout'), ('order'), ('p'), ('pricing'), ('privacy'), ('pro'),
  ('profile'), ('register'), ('settings'), ('signin'), ('signup'), ('static'),
  ('support'), ('tapfolio'), ('terms'), ('www');

-- ---------------------------------------------------------------------------
-- Profiles: the public page a card points at
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null, -- null for demo/unowned profiles
  slug          text not null unique
                check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$' and slug !~ '--'),
  full_name     text not null check (length(full_name) between 1 and 120),
  job_title     text check (length(job_title) <= 120),
  organisation  text check (length(organisation) <= 160),
  about         text check (length(about) <= 600),
  phone         text check (length(phone) <= 40),
  email         text check (length(email) <= 200),
  website       text check (length(website) <= 300),
  street        text check (length(street) <= 200),
  city          text check (length(city) <= 100),
  postcode      text check (length(postcode) <= 20),
  country       text not null default 'United Kingdom',
  socials       jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  photo_path    text,                                   -- path in the "profile-photos" storage bucket
  hidden_fields text[] not null default '{}',           -- e.g. {'street','postcode'}: kept but not shown
  plan          public.profile_plan not null default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles (user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.profiles_check_reserved_slug() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'The address "%" is reserved', new.slug using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_reserved_slug
  before insert or update of slug on public.profiles
  for each row execute function public.profiles_check_reserved_slug();

-- ---------------------------------------------------------------------------
-- Batches and cards
-- ---------------------------------------------------------------------------
create table public.batches (
  id         bigint generated always as identity primary key,
  label      text not null,                -- e.g. "2026-11 ZipNFC standard"
  supplier   text,
  tier       public.card_tier not null,
  quantity   integer not null check (quantity > 0),
  notes      text,
  created_at timestamptz not null default now()
);

create table public.cards (
  -- 7 characters of Crockford base32 (no I, L, O, U): ~34 billion combinations.
  id          text primary key check (id ~ '^[0-9A-HJKMNP-TV-Z]{7}$'),
  batch_id    bigint references public.batches (id) on delete set null,
  tier        public.card_tier not null default 'standard',
  status      public.card_status not null default 'unclaimed',
  profile_id  uuid references public.profiles (id) on delete set null,
  claimed_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint active_card_has_profile check (status <> 'active' or profile_id is not null)
);

create index cards_profile_id_idx on public.cards (profile_id);
create index cards_batch_id_idx on public.cards (batch_id);

-- One-time activation code printed on the insert, never on the card.
-- Only a SHA-256 hash is stored; the plain code exists only on paper.
create table public.claim_codes (
  card_id          text primary key references public.cards (id) on delete cascade,
  code_hash        text not null,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  used_at          timestamptz
);

-- ---------------------------------------------------------------------------
-- Taps: one row per card tap or profile view. No IP addresses are stored.
-- ---------------------------------------------------------------------------
create table public.taps (
  id          bigint generated always as identity primary key,
  card_id     text references public.cards (id) on delete set null,
  profile_id  uuid references public.profiles (id) on delete cascade,
  source      text not null check (source in ('card', 'link', 'vcard')),
  device      text not null check (device in ('ios', 'android', 'desktop', 'other')),
  created_at  timestamptz not null default now()
);

create index taps_profile_created_idx on public.taps (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Subscriptions (filled by the Stripe webhook in a later milestone)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  status                  text not null,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Enquiries from the website order form
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  business    text,
  phone       text,
  tier        text,
  quantity    text,
  message     text,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
--
-- The public profile page, card redirects, claims, enquiries and admin all run
-- on the server with the secret key, which bypasses RLS. The policies below
-- only cover what a signed-in customer may do directly: read and edit their
-- own profile, and see their own cards.
-- ---------------------------------------------------------------------------
alter table public.reserved_slugs enable row level security;
alter table public.profiles       enable row level security;
alter table public.batches        enable row level security;
alter table public.cards          enable row level security;
alter table public.claim_codes    enable row level security;
alter table public.taps           enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.enquiries      enable row level security;

create policy "Owners can read their profiles"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners can update their profiles"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Customers may edit content fields only, never ownership or plan.
revoke update on public.profiles from authenticated;
grant update (slug, full_name, job_title, organisation, about, phone, email, website,
              street, city, postcode, country, socials, photo_path, hidden_fields)
  on public.profiles to authenticated;

create policy "Owners can read their cards"
  on public.cards for select to authenticated
  using (profile_id in (select p.id from public.profiles p where p.user_id = (select auth.uid())));

create policy "Owners can read their subscription"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- No anonymous access to any table.
revoke all on all tables in schema public from anon;
