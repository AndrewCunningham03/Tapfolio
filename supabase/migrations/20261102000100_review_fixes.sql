-- Only the server sets profile photo and cover paths (after checking the upload is the
-- customer's own). Customers writing them directly could point them at someone else's
-- file and then have the server delete it.
revoke update (photo_path, cover_path) on public.profiles from authenticated;

-- New site pages that must never be taken as a profile address.
insert into public.reserved_slugs (slug) values ('start'), ('checkout'), ('terms'), ('billing')
on conflict (slug) do nothing;
