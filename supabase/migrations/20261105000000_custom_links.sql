-- Custom link buttons: up to six buttons such as "Book a quote" or "Leave a
-- Google review", each with its own words and link, shown on the public page.

alter table public.profiles
  -- [ { "label": "Book a quote", "url": "https://…" }, … ]
  -- At most 6; label 1-40 characters, url an http(s) link. The dashboard checks
  -- those, and the public page cleans the list again when it reads it. The
  -- database only guarantees the shape (a list of at most 6).
  add column custom_links jsonb not null default '[]'::jsonb
    check (
      case
        when jsonb_typeof(custom_links) = 'array' then jsonb_array_length(custom_links) <= 6
        else false
      end
    );

-- Owners already update their own row only (row-level security); this lets
-- them change this column too.
grant update (custom_links) on public.profiles to authenticated;
