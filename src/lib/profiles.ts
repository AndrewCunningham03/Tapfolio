import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getAdminClient } from "./supabase/admin";

export type SocialNetwork = "facebook" | "instagram" | "linkedin" | "tiktok" | "x" | "whatsapp";

export type Socials = Partial<Record<SocialNetwork, string>>;

// A profile as the public page sees it. Fields the owner has hidden are
// already removed by the time a Profile reaches the page or the vCard.
export type Profile = {
  id: string;
  slug: string;
  fullName: string;
  jobTitle?: string;
  organisation?: string;
  about?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  city?: string;
  postcode?: string;
  country?: string;
  socials: Socials;
  photoUrl?: string;
  plan: "free" | "pro";
};

type ProfileRow = {
  id: string;
  slug: string;
  full_name: string;
  job_title: string | null;
  organisation: string | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  street: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  socials: Record<string, unknown> | null;
  photo_path: string | null;
  hidden_fields: string[];
  plan: "free" | "pro";
};

const PROFILE_COLUMNS =
  "id, slug, full_name, job_title, organisation, about, phone, email, website, street, city, postcode, country, socials, photo_path, hidden_fields, plan";

const SOCIAL_NETWORKS: SocialNetwork[] = ["facebook", "instagram", "linkedin", "tiktok", "x", "whatsapp"];

// Fields an owner may hide from their public page (names match hidden_fields values).
type HideableField =
  | "job_title" | "organisation" | "about" | "phone" | "email" | "website" | "street" | "city" | "postcode" | "country";

/** Only allow http(s) links, so a profile can never carry a javascript: or data: URL. */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function photoUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/profile-photos/${encodeURI(path)}` : undefined;
}

function toProfile(row: ProfileRow): Profile {
  const hidden = new Set(row.hidden_fields);
  const show = (field: HideableField) => (hidden.has(field) ? undefined : row[field] || undefined);

  const socials: Socials = {};
  for (const network of SOCIAL_NETWORKS) {
    const url = safeUrl(row.socials?.[network]);
    if (url) socials[network] = url;
  }

  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    jobTitle: show("job_title"),
    organisation: show("organisation"),
    about: show("about"),
    phone: show("phone"),
    email: show("email"),
    website: hidden.has("website") ? undefined : safeUrl(row.website),
    street: show("street"),
    city: show("city"),
    postcode: show("postcode"),
    country: show("country"),
    socials,
    photoUrl: photoUrl(row.photo_path),
    plan: row.plan,
  };
}

/** Tag for on-demand refresh when the owner edits their profile (milestone 5). */
export const profileTag = (slug: string) => `profile:${slug}`;

/**
 * Public profile by its address. Cached briefly; editing a profile will
 * refresh it immediately via profileTag().
 */
export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  "use cache";
  const normalised = slug.toLowerCase();
  cacheTag(profileTag(normalised));
  cacheLife("minutes");

  const db = getAdminClient();
  if (!db) return null;

  const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).eq("slug", normalised).maybeSingle<ProfileRow>();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return data ? toProfile(data) : null;
}

export function formatAddress(p: Profile): string | undefined {
  const parts = [p.street, p.city, p.postcode].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

export function mapsUrl(p: Profile): string | undefined {
  const address = formatAddress(p);
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : undefined;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}
