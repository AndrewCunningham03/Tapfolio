-- Demo data for development. Mirrors the sample profile in src/lib/profiles.ts.

insert into public.profiles
  (slug, full_name, job_title, organisation, about, phone, email, website, street, city, postcode, country,
   socials, pay_links, bank, theme)
values (
  'ash-and-oak-interiors',
  'Conor Walsh',
  'Bespoke Kitchens & Bedroom Units',
  'Ash & Oak Interiors',
  'This is an example Tapfolio page, so none of the details are real. Fitted kitchens, bedroom units, wardrobes and utility rooms, made to measure. Tap Save contact, call, or pay below to see how your own page would work.',
  '+353 1 234 5678',
  'hello@example.com',
  'https://example.com/',
  '1 Example Street',
  'Dublin',
  'D01 X000',
  'Ireland',
  '{"facebook": "https://www.facebook.com/", "instagram": "https://www.instagram.com/", "linkedin": "https://www.linkedin.com/", "tiktok": "https://www.tiktok.com/", "x": "https://x.com/", "whatsapp": "https://wa.me/"}',
  '{"revolut": "https://revolut.me/example", "paypal": "https://paypal.me/example", "card": "https://pay.sumup.com/b2c/QEXAMPLE"}',
  '{"account_name": "Ash & Oak Interiors (example)", "sort_code": "000000", "account_number": "12345678", "iban": "IE29AIBK93115212345678", "bic": "AIBKIE2D"}',
  '{"preset": "custom", "background": "#3a2b20", "accent": "#c9a77c"}'
);

insert into public.batches (label, supplier, tier, quantity, notes)
values ('Demo batch', 'none', 'standard', 2, 'Seed data for local testing');

-- An active card already linked to Ash & Oak Interiors: /C/7KQ2XMP
insert into public.cards (id, batch_id, tier, status, profile_id, claimed_at)
select '7KQ2XMP', b.id, 'standard', 'active', p.id, now()
from public.batches b, public.profiles p
where b.label = 'Demo batch' and p.slug = 'ash-and-oak-interiors';

-- An unclaimed card for testing activation: /C/4RD9WZT with claim code TEST-K3YS-2026.
-- Codes are normalised (upper case, dashes removed) before hashing; see src/lib/ids.ts.
insert into public.cards (id, batch_id, tier)
select '4RD9WZT', b.id, 'standard' from public.batches b where b.label = 'Demo batch';

insert into public.claim_codes (card_id, code_hash)
values ('4RD9WZT', encode(extensions.digest('TESTK3YS2026', 'sha256'), 'hex'));
