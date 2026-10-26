import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { PROFILE_COLUMNS, type ProfileRow } from "@/lib/profiles";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./profile-editor";
import styles from "../marketing.module.css";

export const metadata: Metadata = { title: "Your card", robots: { index: false } };

export default function DashboardPage() {
  return (
    <div className={`${styles.wrap} ${styles.adminPage}`}>
      <Suspense fallback={<p className={styles.sub}>Loading your card…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

function Head({ title, admin }: { title: string; admin: boolean }) {
  return (
    <div className={styles.adminHead}>
      <div>
        <p className={styles.eyebrow}>Your card</p>
        <h1>{title}</h1>
      </div>
      <div className={styles.ctaRow} style={{ marginTop: 0 }}>
        {admin && (
          <Link className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} href="/admin">
            Admin
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} type="submit">
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
    let q = db.from("taps").select("id", { count: "exact", head: true }).eq("profile_id", profileId).eq("source", source);
    if (recent) q = q.gte("created_at", since);
    return (await q).count ?? 0;
  };
  const [taps, recentTaps, saves] = await Promise.all([count("card"), count("card", true), count("vcard")]);
  return { taps, recentTaps, saves };
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
        <p className={styles.sub}>
          You&apos;re signed in as {user.email}, but there&apos;s no card linked to this email yet.{" "}
          {admin ? "Cards are made from the admin page." : <>Once your card is made it will appear here. <Link href="/design">Design a card</Link>.</>}
        </p>
      </>
    );
  }

  const [{ data: cards }, stats] = await Promise.all([
    supabase.from("cards").select("id, status").eq("profile_id", profile.id).returns<{ id: string; status: string }[]>(),
    tapCounts(profile.id),
  ]);

  return (
    <>
      <Head title={`Hi ${profile.full_name.split(/\s+/)[0]}`} admin={admin} />
      {stats && (
        <div className={styles.statRow}>
          <div><strong>{stats.recentTaps}</strong><span>taps in the last 30 days</span></div>
          <div><strong>{stats.taps}</strong><span>taps in total</span></div>
          <div><strong>{stats.saves}</strong><span>contacts saved</span></div>
          <div>
            <strong>{cards?.length ?? 0}</strong>
            <span>
              {cards?.length === 1 ? "card" : "cards"}
              {cards?.length ? `: ${cards.map((c) => c.id).join(", ")}` : ""}
            </span>
          </div>
        </div>
      )}
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
          hidden_fields: profile.hidden_fields,
        }}
      />
    </>
  );
}
