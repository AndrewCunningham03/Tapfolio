-- Customers design their own profile page: colour theme, profile photo,
-- cover photo, and a gallery of photos and videos.

alter table public.profiles
  -- { "preset": "classic" | "midnight" | … | "custom", "accent": "#rrggbb", "background": "#rrggbb" }
  add column theme jsonb not null default '{}'::jsonb check (jsonb_typeof(theme) = 'object'),
  add column cover_path text; -- object in the public "profile-media" bucket

grant update (theme, cover_path) on public.profiles to authenticated;

create table public.profile_media (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('photo', 'video')),
  path        text not null unique, -- object in the "profile-media" bucket
  width       integer,
  height      integer,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index profile_media_profile_idx on public.profile_media (profile_id, position, id);

-- Managed only through server actions that check the owner first.
alter table public.profile_media enable row level security;
revoke all on public.profile_media from anon, authenticated;
grant all on public.profile_media to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Public bucket: profile pages are public by design. 50 MB is the free-plan
-- limit per file; uploads go through short-lived signed URLs from the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media', 'profile-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;
