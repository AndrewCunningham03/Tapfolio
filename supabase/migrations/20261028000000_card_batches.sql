-- A batch is one order from the card supplier and can mix metal and plastic
-- cards. Each card already records its own tier, so a batch only has a tier
-- when all of its cards share one.
alter table public.batches alter column tier drop not null;

-- Stock per batch for the admin page: how many of each material were made,
-- how many are still blank (in stock) and how many belong to customers.
create view public.batch_stock
with (security_invoker = true) as
select
  b.id,
  b.label,
  b.supplier,
  b.created_at,
  count(c.id) filter (where c.tier = 'platinum')                             as metal,
  count(c.id) filter (where c.tier = 'standard')                             as plastic,
  count(c.id) filter (where c.tier = 'platinum' and c.status = 'unclaimed') as metal_in_stock,
  count(c.id) filter (where c.tier = 'standard' and c.status = 'unclaimed') as plastic_in_stock,
  count(c.id) filter (where c.status = 'active')                             as assigned,
  count(c.id) filter (where c.status = 'disabled')                           as disabled
from public.batches b
left join public.cards c on c.batch_id = b.id
group by b.id;

revoke all on public.batch_stock from anon, authenticated;
grant select on public.batch_stock to service_role;
