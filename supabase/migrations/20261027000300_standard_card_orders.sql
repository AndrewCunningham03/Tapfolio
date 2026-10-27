-- Orders for the standard Tapfolio card carry no custom design, so finish and
-- layout are only set for orders made with the (currently hidden) card designer.
alter table public.card_orders alter column finish drop not null;
alter table public.card_orders alter column layout drop not null;
