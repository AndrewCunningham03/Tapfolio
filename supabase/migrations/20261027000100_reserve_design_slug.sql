-- /design is now the card designer, so no profile may use that address.
insert into public.reserved_slugs (slug) values ('design') on conflict do nothing;
