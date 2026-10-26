-- Demo data for development. Mirrors the sample profile in src/lib/profiles.ts.

insert into public.profiles
  (slug, full_name, job_title, organisation, about, phone, email, website, street, city, postcode, country, socials)
values (
  'john-smith',
  'John Smith',
  'Owner, Gas Safe Engineer',
  'Smith Plumbing & Heating',
  'Boiler installs, servicing and emergency repairs across York and North Yorkshire. Gas Safe registered, fully insured.',
  '07700 900123',
  'john@smithplumbing.co.uk',
  'https://smithplumbing.co.uk',
  '12 High Street',
  'York',
  'YO1 7HU',
  'United Kingdom',
  '{"facebook": "https://www.facebook.com/", "instagram": "https://www.instagram.com/", "linkedin": "https://www.linkedin.com/", "whatsapp": "https://wa.me/447700900123"}'
);

insert into public.batches (label, supplier, tier, quantity, notes)
values ('Demo batch', 'none', 'standard', 2, 'Seed data for local testing');

-- An active card already linked to John Smith: /C/7KQ2XMP
insert into public.cards (id, batch_id, tier, status, profile_id, claimed_at)
select '7KQ2XMP', b.id, 'standard', 'active', p.id, now()
from public.batches b, public.profiles p
where b.label = 'Demo batch' and p.slug = 'john-smith';

-- An unclaimed card for testing activation: /C/4RD9WZT with claim code TEST-K3YS-2026.
-- Codes are normalised (upper case, dashes removed) before hashing; see src/lib/ids.ts.
insert into public.cards (id, batch_id, tier)
select '4RD9WZT', b.id, 'standard' from public.batches b where b.label = 'Demo batch';

insert into public.claim_codes (card_id, code_hash)
values ('4RD9WZT', encode(extensions.digest('TESTK3YS2026', 'sha256'), 'hex'));
