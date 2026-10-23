# Tapfolio

NFC + QR business cards. Each card opens a profile page with a **Save contact** button; customers edit their details online and the card never needs reprogramming.

## How card links work

Every card is encoded with a permanent random ID, never a name:

```
HTTPS://TAPFOLIO.CO.UK/C/7KQ2XMP   (chip + printed QR)
        │
        ├─ unclaimed  → activation page (needs the one-time claim code from the insert)
        ├─ active     → 302 redirect to the profile, e.g. /john-smith
        └─ disabled   → "card deactivated" page
```

The profile address (`/john-smith`) can change without breaking any card. Lost cards can be disabled and cards reassigned.

## Stack

- **Next.js 16** (App Router, Cache Components) on **Vercel**
- **Supabase**: Postgres, logins, photo storage
- **Stripe Billing** for Pro (later milestone)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev
```

Open http://localhost:3000. The landing page and the example profile at `/john-smith` work before Supabase is configured; the order form needs it.

### Database

Schema lives in `supabase/migrations/`, demo data in `supabase/seed.sql`. To apply them to your Supabase project:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push --include-seed
```

Demo cards from the seed: `/C/7KQ2XMP` (active, John Smith) and `/C/4RD9WZT` (unclaimed, claim code `TEST-K3YS-2026`).

## Project layout

| Path | What |
|---|---|
| `src/app/(marketing)/` | Landing page, order form, privacy policy |
| `src/app/[slug]/` | Public profile page and `/<slug>/vcard` contact download |
| `src/lib/` | Profiles, vCard builder, card ID / claim code helpers, slug rules |
| `supabase/` | Migrations and seed data |

## Milestones

1. ✅ Foundations: Next.js app, V1 pages ported, database schema and seed
2. Card links (`/C/<ID>`) and profiles read from the database
3. Batch command: generate card IDs + claim codes, supplier CSV
4. Claim flow and logins
5. Customer dashboard
6. Admin: batch QA, disable/reassign cards, tap counts
7. Stripe for Pro, then launch on the real domain
