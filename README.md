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

Open http://localhost:3000. The landing page works on its own; profiles, card links and the order form need Supabase configured.

### Hosting regions

The business is based in Northern Ireland and serves the UK and Ireland. The Supabase project is in **EU North (Stockholm)**, and `vercel.json` pins the server functions to Stockholm (`arn1`) so every request stays close to the database. The live site is https://tapfolio.co.uk (www redirects to it); card chips and QR codes use `HTTPS://TAPFOLIO.CO.UK/C/<ID>`.

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
| `design/cards/` | Card artwork generator, print files and supplier spec (`cd design/cards && npm install && npm run build`) |

## Milestones

1. ✅ Foundations: Next.js app, V1 pages ported, database schema and seed
2. ✅ Card links (`/C/<ID>`) with tap counting; profiles and vCards read from the database
   - ✅ Pay me on profiles (Revolut, PayPal, Monzo, card link, UK/IE bank details)
   - ✅ Card designer at `/design`: black, silver, gold, rose gold; name, title, logo, layout, back line; orders saved to `card_orders`, logos to the private `card-logos` bucket
3. ✅ Stock cards (see "Making cards" below): make batches of card links in `/admin` and download the supplier pack; admin assigns a stock card to an order by its code
4. ✅ Sign-in: email link (`/login`), no public sign-up; accounts are created from the admin page
5. ✅ Customer dashboard (`/dashboard`): edit profile, Pay me, socials, hidden fields, profile address; tap counts; "Edit my card" on their own profile
   - ✅ Design your page: six colour themes or any custom background + button colour (text contrast automatic), profile photo/logo, cover photo, gallery of up to 12 photos and 3 videos (50 MB each), stored in the public `profile-media` bucket via signed uploads
6. ✅ Admin (`/admin`, emails in `ADMIN_EMAILS`): orders with design preview, status, "Create card + account", engraving SVGs with the real QR code
   - To do: disable/reassign cards, photo uploads
7. Stripe for the £10/month subscription, card included with no upfront cost (grace period, then pause)

## Making cards

Every card is the standard Tapfolio design (`design/cards/`), with its own code on the chip and the QR on the back. The card designer at `/design` is switched off for now (see `redirects` in `next.config.ts`).

1. In `/admin` → **Card stock**, enter how many metal and plastic cards to order and press **Make card links**. This adds the cards to the database as unclaimed (one batch per supplier order; a batch can mix materials).
2. Download the batch's **Supplier pack (.zip)** and send it to the supplier. It holds the Excel sheet and CSV of links (`card_id,url,material`), `design/cards/SPEC.md` and the print artwork for the materials in the batch. They encode each `url` on the chip, lock it, and print the same `url` as the card's QR code. The pack is rebuilt from the database on every download, so it can be downloaded again at any time.
3. When an order comes in, open `/admin`, type the code of a card from stock (the 7 characters after `/C/`) and press **Assign card + create account**.

Card stock per batch comes from the `batch_stock` view. From the command line, `npm run batch -- --qty 50 --material plastic --label "First run"` makes a single-material batch and writes its CSV to the git-ignored `batches/` folder.

## Accounts and email

- Sign-in emails come from Supabase's built-in sender, which (on the free plan) only delivers to members of your Supabase organisation and can't use a custom template. Before real customers sign in, connect an SMTP provider such as Resend (Supabase → Authentication → Emails → SMTP), then enable the 6-digit code template in `supabase/templates/magic_link.html` via `supabase/config.toml`.
- Auth settings live in `supabase/config.toml`; apply them with `supabase config push`.
