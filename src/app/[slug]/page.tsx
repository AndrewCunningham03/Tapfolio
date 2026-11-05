import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatAddress,
  getProfileBySlug,
  initials,
  mapsUrl,
  telHref,
  type MediaItem,
  type Profile,
  type SocialNetwork,
} from "@/lib/profiles";
import { isProfilePaused } from "@/lib/paused";
import { themeVars } from "@/lib/themes";
import {
  AddContactIcon,
  ChevronIcon,
  GlobeIcon,
  MailIcon,
  MobileIcon,
  PauseIcon,
  PhoneIcon,
  PinIcon,
  SOCIAL_ICONS,
  TapIcon,
  TextIcon,
} from "./icons";
import { OwnerBar } from "./owner-bar";
import { PaySection } from "./pay";
import { ProfileSkeleton } from "./skeleton";
import styles from "./profile.module.css";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const profile = await getProfileBySlug((await params).slug);
  if (!profile) return { title: "Profile not found" };
  const title = [profile.fullName, profile.organisation].filter(Boolean).join(" · ");
  const description = [profile.jobTitle, "Tap to save my contact details."].filter(Boolean).join(". ");
  return {
    title: { absolute: title },
    description,
    openGraph: { type: "profile", title, description, images: profile.photoUrl ? [profile.photoUrl] : undefined },
  };
}

// Params are only known at request time, so the profile streams in behind a
// Suspense boundary (required with Cache Components). The (cached) profile
// arrives first and sets the owner's colours; the paused check runs on every
// view, so a placeholder in those colours shows while it does.
export default function ProfilePage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className={`${styles.shell} ${styles.neutral}`}>
          <ProfileSkeleton />
        </div>
      }
    >
      {params.then(({ slug }) => (
        <ProfileShell slug={slug} />
      ))}
    </Suspense>
  );
}

async function ProfileShell({ slug }: { slug: string }) {
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();
  return (
    <div className={styles.shell} style={themeVars(profile.theme) as React.CSSProperties}>
      <Suspense
        fallback={
          <ProfileSkeleton
            lines={[profile.organisation, profile.jobTitle].filter(Boolean).length}
            actions={quickActions(profile).length}
          />
        }
      >
        <ProfileContent profile={profile} />
      </Suspense>
    </div>
  );
}

type QuickAction = { label: string; href: string; icon: React.ReactNode; external?: boolean };

function quickActions(profile: Profile): QuickAction[] {
  const maps = mapsUrl(profile);
  const actions: QuickAction[] = [];
  if (profile.phone) {
    actions.push({ label: "Call", href: telHref(profile.phone), icon: <PhoneIcon /> });
    actions.push({ label: "Text", href: `sms:${profile.phone.replace(/[^\d+]/g, "")}`, icon: <TextIcon /> });
  }
  if (profile.email) actions.push({ label: "Email", href: `mailto:${profile.email}`, icon: <MailIcon /> });
  if (maps) actions.push({ label: "Directions", href: maps, icon: <PinIcon />, external: true });
  return actions;
}

async function ProfileContent({ profile }: { profile: Profile }) {
  // Checked on every view (never cached): the answer changes when a payment fails or is fixed.
  if (await isProfilePaused({ slug: profile.slug })) return <PausedNotice />;

  const address = formatAddress(profile);
  const maps = mapsUrl(profile);
  const socials = (Object.entries(profile.socials) as [SocialNetwork, string][]).filter(([, url]) => url);
  const websiteLabel = profile.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const actions = quickActions(profile);
  const firstName = profile.fullName.split(/\s+/)[0];
  const hasDetails = Boolean(profile.phone || profile.email || profile.website || (address && maps));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.banner}>
          {profile.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads from Supabase Storage
            <img src={profile.coverUrl} alt="" />
          )}
        </div>
        {/* The name follows straight after, so the photo itself needs no alt text. */}
        <div className={styles.avatar} aria-hidden="true">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads from Supabase Storage
            <img src={profile.photoUrl} alt="" />
          ) : (
            initials(profile.fullName)
          )}
        </div>

        <div className={styles.intro}>
          <h1 className={styles.name}>{profile.fullName}</h1>
          {profile.organisation && <p className={styles.org}>{profile.organisation}</p>}
          {profile.jobTitle && <p className={styles.role}>{profile.jobTitle}</p>}
        </div>

        {/* Plain link, not next/link: the browser must fetch the .vcf itself so the phone opens Contacts. */}
        <a className={styles.save} href={`/${profile.slug}/vcard`}>
          <AddContactIcon />
          Save contact
        </a>

        {actions.length > 0 && (
          <div
            className={actions.length > 2 ? styles.quick : `${styles.quick} ${styles.quickFew}`}
            role="group"
            aria-label={`Contact ${firstName}`}
          >
            {actions.map((a) => (
              <a key={a.label} href={a.href} {...(a.external ? { target: "_blank", rel: "noopener" } : {})}>
                {a.icon}
                {a.label}
              </a>
            ))}
          </div>
        )}

        <PaySection profile={profile} />

        {profile.about && (
          <section className={styles.section} aria-labelledby="about-heading">
            <h2 id="about-heading" className={styles.sectionTitle}>
              About
            </h2>
            <p className={styles.about}>{profile.about}</p>
          </section>
        )}

        <Gallery media={profile.media} owner={profile.organisation ?? profile.fullName} />

        {hasDetails && (
          <section className={styles.section} aria-labelledby="details-heading">
            <h2 id="details-heading" className={styles.sectionTitle}>
              Contact details
            </h2>
            <ul className={styles.details}>
              {profile.phone && (
                <DetailRow href={telHref(profile.phone)} icon={<MobileIcon />} label="Mobile" value={profile.phone} />
              )}
              {profile.email && (
                <DetailRow
                  href={`mailto:${profile.email}`}
                  icon={<MailIcon />}
                  label="Email"
                  value={<BreakBefore text={profile.email} at="@" />}
                />
              )}
              {profile.website && (
                <DetailRow href={profile.website} icon={<GlobeIcon />} label="Website" value={websiteLabel!} external />
              )}
              {address && maps && <DetailRow href={maps} icon={<PinIcon />} label="Address" value={address} external />}
            </ul>
          </section>
        )}

        {socials.length > 0 && (
          <ul className={styles.socials} aria-label={`${firstName} on social media`}>
            {socials.map(([network, url]) => (
              <li key={network}>
                <a href={url} target="_blank" rel="noopener" aria-label={SOCIAL_ICONS[network].label}>
                  {SOCIAL_ICONS[network].icon}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>

      <ProfileFooter />
      <OwnerBar slug={profile.slug} />
    </div>
  );
}

function ProfileFooter() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.footerCta} href="/">
        <TapIcon />
        <span>
          Get your own tap card at <strong>Tapfolio</strong>
        </span>
      </Link>
      <Link className={styles.footerLink} href="/privacy">
        Privacy
      </Link>
    </footer>
  );
}

/** Shown instead of the profile while its owner's subscription is paused. */
function PausedNotice() {
  return (
    <div className={styles.page}>
      <main className={`${styles.main} ${styles.paused}`}>
        <span className={styles.pausedIcon} aria-hidden="true">
          <PauseIcon />
        </span>
        <h1 className={styles.name}>This page is paused</h1>
        <p className={styles.pausedLead}>It will be back as soon as its owner updates their payment details.</p>
        <div className={styles.pausedHelp}>
          <p>
            <strong>Trying to get in touch?</strong> Use the number or email they gave you for now.
          </p>
          <p>
            <strong>Is this your page?</strong> Sign in and update your payment details. Your page and card come back as
            soon as the payment goes through.
          </p>
        </div>
        <Link className={styles.save} href="/login?next=/dashboard">
          Sign in
        </Link>
      </main>
      <ProfileFooter />
    </div>
  );
}

/**
 * Photos sit two to a row and videos take the full width. In a run of photos
 * with an odd count, the first one is shown wide, so no row is left half empty.
 */
function Gallery({ media, owner }: { media: MediaItem[]; owner: string }) {
  if (!media.length) return null;
  const wide = new Set<number>();
  let run: MediaItem[] = [];
  for (const m of [...media, null]) {
    if (m?.kind === "photo") {
      run.push(m);
      continue;
    }
    if (run.length % 2 === 1) wide.add(run[0].id);
    run = [];
  }
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");

  return (
    <section className={styles.section} aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className={styles.sectionTitle}>
        {photos.length && videos.length ? "Photos & videos" : photos.length ? "Photos" : "Videos"}
      </h2>
      <div className={styles.galleryGrid}>
        {media.map((m) =>
          m.kind === "video" ? (
            <div
              key={m.id}
              className={styles.video}
              style={m.width && m.height ? { aspectRatio: `${m.width} / ${m.height}` } : undefined}
            >
              {/* #t=0.1 makes iPhones show the first frame instead of a black box. */}
              <video
                src={`${m.url}#t=0.1`}
                controls
                playsInline
                preload="metadata"
                aria-label={`Video ${videos.indexOf(m) + 1} of ${videos.length} from ${owner}`}
              />
            </div>
          ) : (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener"
              className={wide.has(m.id) ? styles.wide : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- user uploads from Supabase Storage */}
              <img
                src={m.url}
                alt={`Photo ${photos.indexOf(m) + 1} of ${photos.length} from ${owner}`}
                loading="lazy"
                decoding="async"
                width={m.width ?? undefined}
                height={m.height ?? undefined}
              />
              <span className={styles.srOnly}>(opens full size)</span>
            </a>
          ),
        )}
      </div>
    </section>
  );
}

/** Lets a long email address wrap before the @ rather than mid-word. */
function BreakBefore({ text, at }: { text: string; at: string }) {
  const i = text.indexOf(at);
  if (i <= 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <wbr />
      {text.slice(i)}
    </>
  );
}

function DetailRow(props: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <a href={props.href} {...(props.external ? { target: "_blank", rel: "noopener" } : {})}>
        <span className={styles.ico}>{props.icon}</span>
        <span className={styles.detailText}>
          <small>{props.label}</small>
          {props.value}
        </span>
        <span className={styles.detailGo}>
          <ChevronIcon />
        </span>
      </a>
    </li>
  );
}
