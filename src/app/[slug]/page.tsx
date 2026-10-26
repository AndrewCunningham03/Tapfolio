import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatAddress, getProfileBySlug, initials, mapsUrl, telHref, type SocialNetwork } from "@/lib/profiles";
import {
  AddContactIcon,
  GlobeIcon,
  MailIcon,
  MobileIcon,
  PhoneIcon,
  PinIcon,
  SOCIAL_ICONS,
  TextIcon,
} from "./icons";
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

export const viewport: Viewport = { themeColor: "#1F9D55" };

// Params are only known at request time, so the profile streams in behind a
// Suspense boundary (required with Cache Components).
export default function ProfilePage({ params }: PageProps<"/[slug]">) {
  return (
    <div className={styles.shell}>
      <div className={styles.page}>
        <div className={styles.banner} />
        <Suspense fallback={<div className={styles.skeleton} />}>
          {params.then(({ slug }) => (
            <ProfileContent slug={slug} />
          ))}
        </Suspense>
        <footer className={styles.footer}>
          Get your own tap card at <Link href="/">Tapfolio</Link> · <Link href="/privacy">Privacy</Link>
        </footer>
      </div>
    </div>
  );
}

async function ProfileContent({ slug }: { slug: string }) {
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  const address = formatAddress(profile);
  const maps = mapsUrl(profile);
  const socials = (Object.entries(profile.socials) as [SocialNetwork, string][]).filter(([, url]) => url);
  const websiteLabel = profile.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <>
      <div className={styles.avatar} aria-hidden={!profile.photoUrl}>
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads from Supabase Storage
          <img src={profile.photoUrl} alt={profile.fullName} />
        ) : (
          initials(profile.fullName)
        )}
      </div>

      <div className={styles.intro}>
        <h1>{profile.fullName}</h1>
        {profile.jobTitle && <p className={styles.role}>{profile.jobTitle}</p>}
        {profile.organisation && <p className={styles.org}>{profile.organisation}</p>}
      </div>

      {/* Plain link, not next/link: the browser must fetch the .vcf itself so the phone opens Contacts. */}
      <a className={styles.save} href={`/${profile.slug}/vcard`}>
        <AddContactIcon />
        Save contact
      </a>

      <div className={styles.quick}>
        {profile.phone && (
          <>
            <a href={telHref(profile.phone)}>
              <PhoneIcon />
              Call
            </a>
            <a href={`sms:${profile.phone.replace(/[^\d+]/g, "")}`}>
              <TextIcon />
              Text
            </a>
          </>
        )}
        {profile.email && (
          <a href={`mailto:${profile.email}`}>
            <MailIcon />
            Email
          </a>
        )}
        {maps && (
          <a href={maps} target="_blank" rel="noopener">
            <PinIcon />
            Directions
          </a>
        )}
      </div>

      {profile.about && <p className={styles.about}>{profile.about}</p>}

      <ul className={styles.details}>
        {profile.phone && (
          <DetailRow href={telHref(profile.phone)} icon={<MobileIcon />} label="Mobile" value={profile.phone} />
        )}
        {profile.email && (
          <DetailRow href={`mailto:${profile.email}`} icon={<MailIcon />} label="Email" value={profile.email} />
        )}
        {profile.website && (
          <DetailRow href={profile.website} icon={<GlobeIcon />} label="Website" value={websiteLabel!} external />
        )}
        {address && maps && <DetailRow href={maps} icon={<PinIcon />} label="Address" value={address} external />}
      </ul>

      {socials.length > 0 && (
        <div className={styles.socials}>
          {socials.map(([network, url]) => (
            <a key={network} href={url} target="_blank" rel="noopener" aria-label={SOCIAL_ICONS[network].label}>
              {SOCIAL_ICONS[network].icon}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function DetailRow(props: { href: string; icon: React.ReactNode; label: string; value: string; external?: boolean }) {
  return (
    <li>
      <a href={props.href} {...(props.external ? { target: "_blank", rel: "noopener" } : {})}>
        <span className={styles.ico}>{props.icon}</span>
        <span>
          <small>{props.label}</small>
          {props.value}
        </span>
      </a>
    </li>
  );
}
