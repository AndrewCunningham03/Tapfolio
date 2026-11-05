import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { cleanCustomLinks, mediaUrl, PROFILE_COLUMNS, type ProfileRow } from "@/lib/profiles";
import { graceEndsAt, isLive, type SubscriptionState } from "@/lib/billing-state";
import { CONTACT_EMAIL } from "@/lib/site";
import { normaliseTheme } from "@/lib/themes";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { openBilling } from "./billing";
import { JumpNav } from "./jump-nav";
import { DashboardNotices, WaitForProfile } from "./notices";
import { ColoursSection, GallerySection, PhotoSection, type DesignerMedia } from "./page-designer";
import { ProfileEditor } from "./profile-editor";
import { YourPage, type SetupState } from "./your-page";
import ds from "./dashboard.module.css";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Your card", robots: { index: false } };

const SUB_LABELS: Record<string, string> = {
  trialing: "active (first month paid)",
  active: "active",
  past_due: "payment overdue",
  unpaid: "unpaid",
  canceled: "cancelled",
  incomplete: "payment not finished",
};

export default function DashboardPage() {
  return (
    <div className={`${styles.wrap} ${styles.adminPage}`}>
      <div className={ds.dash}>
        <Suspense fallback={<p className={styles.sub}>Loading your card…</p>}>
          <Dashboard />
        </Suspense>
      </div>
    </div>
  );
}

const smallButton = `${styles.btn} ${styles.ghost} ${styles.btnSmall} ${ds.tap}`;

function Head({ title, admin }: { title: string; admin: boolean }) {
  return (
    <div className={`${styles.adminHead} ${ds.head}`}>
      <div>
        <p className={styles.eyebrow}>Your card</p>
        <h1>{title}</h1>
      </div>
      <div className={ds.headActions}>
        {admin && (
          <Link className={smallButton} href="/admin">
            Admin
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button className={smallButton} type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

async function tapCounts(profileId: string) {
  const db = getAdminClient();
  if (!db) return null;
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const count = async (source: string, recent = false) => {
    let q = db
      .from("taps")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("source", source);
    if (recent) q = q.gte("created_at", since);
    return (await q).count ?? 0;
  };
  const [taps, recentTaps, saves] = await Promise.all([count("card"), count("card", true), count("vcard")]);
  return { taps, recentTaps, saves };
}

/** The customer's gallery. Only called with a profile id that row-level security already returned to them. */
async function galleryFor(profileId: string): Promise<DesignerMedia[]> {
  const db = getAdminClient();
  if (!db) return [];
  const { data } = await db
    .from("profile_media")
    .select("id, kind, path")
    .eq("profile_id", profileId)
    .order("position")
    .order("id")
    .returns<{ id: number; kind: "photo" | "video"; path: string }[]>();
  return (data ?? []).map((m) => ({ id: m.id, kind: m.kind, url: mediaUrl(m.path)! }));
}

/** What's filled in so far, for the set-up checklist. */
function setupOf(profile: ProfileRow): SetupState {
  const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";
  const bank = profile.bank ?? {};
  return {
    photo: Boolean(profile.photo_path),
    about: filled(profile.about),
    phone: filled(profile.phone),
    pay:
      Object.values(profile.pay_links ?? {}).some(filled) ||
      (filled(bank.sort_code) && filled(bank.account_number)) ||
      filled(bank.iban),
    socials: Object.values(profile.socials ?? {}).some(filled),
  };
}

async function Dashboard() {
  await connection(); // always per request: private, live data
  const user = await requireUser("/dashboard");
  const admin = isAdmin(user);
  const supabase = await getServerClient();

  // Row-level security returns only this customer's own profile and cards.
  const { data: profile } = await supabase.from("profiles").select(PROFILE_COLUMNS).limit(1).maybeSingle<ProfileRow>();
  if (!profile) {
    return (
      <>
        <Head title="No card yet" admin={admin} />
        <div className={ds.top}>
          {/* Just back from paying: the page is made a moment later, so wait for it. */}
          <WaitForProfile>
            <p className={styles.sub}>
              You&apos;re signed in as {user.email}, but there&apos;s no card linked to this email yet.{" "}
              {admin ? (
                "Cards are made from the admin page."
              ) : (
                <>
                  Once your card is ordered it will appear here. <Link href="/start">Get your card</Link>.
                </>
              )}
            </p>
          </WaitForProfile>
        </div>
      </>
    );
  }

  const [{ data: cards }, stats, media, { data: sub }] = await Promise.all([
    supabase
      .from("cards")
      .select("id, status")
      .eq("profile_id", profile.id)
      .returns<{ id: string; status: string }[]>(),
    tapCounts(profile.id),
    galleryFor(profile.id),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, past_due_since")
      .maybeSingle<SubscriptionState>(),
  ]);

  const warning = sub ? billingWarning(sub) : null;
  const cardCount = cards?.length ?? 0;
  // Nothing to count yet for a brand new customer, so the checklist gets the space.
  const showStats = stats && (cardCount > 0 || stats.taps > 0 || stats.saves > 0);

  return (
    <>
      <Head title={`Hi ${profile.full_name.split(/\s+/)[0]}`} admin={admin} />

      <div className={ds.top}>
        {sub && warning && (
          <section className={ds.billingWarn} aria-labelledby="billing-title">
            <h2 className={ds.billingTitle} id="billing-title">
              {warningTitle(sub)}
            </h2>
            <p role="alert">{warning}</p>
            <div className={ds.billingActions}>
              <form action={openBilling}>
                <button className={`${styles.btn} ${ds.tap}`} type="submit">
                  Manage billing
                </button>
              </form>
              <span>
                Need a hand? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </span>
            </div>
          </section>
        )}
        <DashboardNotices />
        <YourPage slug={profile.slug} setup={setupOf(profile)} />
        {sub && !warning && (
          <form action={openBilling} className={ds.billing}>
            <p className={ds.billingStatus}>
              Subscription: <strong>{SUB_LABELS[sub.status] ?? sub.status}</strong>
              <br />
              Change your payment card, see receipts or cancel.
            </p>
            <button className={smallButton} type="submit">
              Manage billing
            </button>
          </form>
        )}
      </div>

      {showStats && (
        <div className={styles.statRow}>
          <div>
            <strong>{stats.recentTaps}</strong>
            <span>taps in the last 30 days</span>
          </div>
          <div>
            <strong>{stats.taps}</strong>
            <span>taps in total</span>
          </div>
          <div>
            <strong>{stats.saves}</strong>
            <span>contacts saved</span>
          </div>
          <div>
            <strong>{cardCount}</strong>
            <span>
              {cardCount === 1 ? "card linked" : "cards linked"}
              {cardCount ? `: ${cards!.map((c) => c.id).join(", ")}` : ""}
            </span>
          </div>
        </div>
      )}

      <JumpNav />

      <div className={`${styles.designForm} ${ds.sections}`}>
        <PhotoSection photoUrl={mediaUrl(profile.photo_path)} coverUrl={mediaUrl(profile.cover_path)} />
        <ProfileEditor
          profile={{
            id: profile.id,
            slug: profile.slug,
            full_name: profile.full_name,
            job_title: profile.job_title,
            organisation: profile.organisation,
            about: profile.about,
            phone: profile.phone,
            email: profile.email,
            website: profile.website,
            street: profile.street,
            city: profile.city,
            postcode: profile.postcode,
            country: profile.country,
            socials: (profile.socials ?? {}) as Record<string, string>,
            pay_links: (profile.pay_links ?? {}) as Record<string, string>,
            bank: (profile.bank ?? {}) as Record<string, string>,
            custom_links: cleanCustomLinks(profile.custom_links),
            hidden_fields: profile.hidden_fields,
          }}
        />
        <ColoursSection theme={normaliseTheme(profile.theme)} name={profile.full_name} />
        <GallerySection media={media} />
      </div>
    </>
  );
}

const dateOf = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" });

/** What the customer needs to know about their subscription right now, or null if all is well. */
function billingWarning(sub: SubscriptionState): string | null {
  const live = isLive(sub);
  if (sub.status === "past_due") {
    const end = graceEndsAt(sub);
    return live
      ? `Your last payment didn't go through. Your card keeps working until ${end ? dateOf(end) : "your payment is fixed"}. Press Manage billing to update your payment details.`
      : "Your card is paused because a payment didn't go through. Press Manage billing to update your payment details and it will come straight back.";
  }
  if (sub.status === "canceled") {
    const end = sub.current_period_end ? dateOf(new Date(sub.current_period_end)) : null;
    return live
      ? `Your subscription is cancelled. Your card keeps working until ${end}.`
      : "Your subscription has ended, so your card is paused. Your details are kept: start a new subscription to bring it back.";
  }
  if (!live) return "Your card is paused because your subscription isn't active. Press Manage billing to put it right.";
  return null;
}

/** A short heading for the warning above (only called when there is one). */
function warningTitle(sub: SubscriptionState): string {
  if (!isLive(sub)) return "Your card is paused";
  return sub.status === "canceled" ? "Subscription cancelled" : "There's a problem with your payment";
}
