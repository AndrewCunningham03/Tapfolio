import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  CUSTOM_LINK_LABEL_MAX,
  CUSTOM_LINK_URL_MAX,
  MAX_CUSTOM_LINKS,
  PAY_METHODS,
  SOCIAL_NETWORKS,
  type CustomLink,
  type HideableField,
  type PayMethod,
  type SocialNetwork,
} from "./profile-fields";
import { getAdminClient } from "./supabase/admin";
import { normaliseTheme, type ThemeChoice } from "./themes";

export type { CustomLink, PayMethod, SocialNetwork } from "./profile-fields";

export type Socials = Partial<Record<SocialNetwork, string>>;
export type PayLinks = Partial<Record<PayMethod, string>>;

export type BankDetails = {
  accountName?: string;
  sortCode?: string; // formatted 12-34-56
  accountNumber?: string;
  iban?: string; // formatted in groups of four
  bic?: string;
};

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
  payLinks: PayLinks;
  bank?: BankDetails;
  customLinks: CustomLink[];
  photoUrl?: string;
  coverUrl?: string;
  theme: ThemeChoice;
  media: MediaItem[];
  plan: "free" | "pro";
};

export type MediaItem = { id: number; kind: "photo" | "video"; url: string; width: number | null; height: number | null };

/** A profiles table row, as stored. */
export type ProfileRow = {
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
  pay_links: Record<string, unknown> | null;
  bank: Record<string, unknown> | null;
  custom_links: unknown; // a list of { label, url } when healthy; read it through cleanCustomLinks()
  photo_path: string | null;
  cover_path: string | null;
  theme: Record<string, unknown> | null;
  hidden_fields: string[];
  plan: "free" | "pro";
};

export const PROFILE_COLUMNS =
  "id, slug, full_name, job_title, organisation, about, phone, email, website, street, city, postcode, country, socials, pay_links, bank, custom_links, photo_path, cover_path, theme, hidden_fields, plan";

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

// Named pay links must point at that service, so a profile can't dress up
// another site as "Revolut". The card link may be any https payment page.
const PAY_HOSTS: Record<Exclude<PayMethod, "card">, RegExp> = {
  revolut: /^(www\.)?revolut\.me$/,
  paypal: /^(www\.)?paypal\.(me|com)$/,
  monzo: /^(www\.)?monzo\.me$/,
};

/** Valid pay links only (also used to clean what an owner saves). */
export function cleanPayLinks(raw: Record<string, unknown> | null): PayLinks {
  const links: PayLinks = {};
  for (const method of PAY_METHODS) {
    const url = safeUrl(raw?.[method]);
    if (!url || !url.startsWith("https:")) continue;
    if (method !== "card" && !PAY_HOSTS[method].test(new URL(url).hostname)) continue;
    links[method] = url;
  }
  return links;
}

function text(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

// Custom buttons -------------------------------------------------------------------

/** Letters in a button's label. Counts what people see (an emoji is one), not UTF-16 units. */
export const labelLength = (label: string) => Array.from(label).length;

/**
 * A button's words, tidied: control and direction-override characters become
 * spaces, runs of spaces collapse, the ends are trimmed. "" if nothing is left.
 * Not capped: callers decide whether too long is an error or gets cut.
 */
export function tidyLinkLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keep the first CUSTOM_LINK_LABEL_MAX letters, never splitting an emoji in half. */
const capLabel = (label: string) => Array.from(label).slice(0, CUSTOM_LINK_LABEL_MAX).join("").trim();

/**
 * Custom buttons that are safe to show: anything stored (null, not a list,
 * half-filled items, a javascript: link) is dropped or tidied, never trusted.
 * Used when a profile is read, so a bad value can't break or endanger the page.
 */
export function cleanCustomLinks(raw: unknown): CustomLink[] {
  if (!Array.isArray(raw)) return [];
  const links: CustomLink[] = [];
  for (const item of raw) {
    if (links.length >= MAX_CUSTOM_LINKS) break;
    if (!item || typeof item !== "object") continue;
    const label = capLabel(tidyLinkLabel((item as Record<string, unknown>).label));
    const url = safeUrl((item as Record<string, unknown>).url);
    if (label && url && url.length <= CUSTOM_LINK_URL_MAX) links.push({ label, url });
  }
  return links;
}

function bankDetails(raw: Record<string, unknown> | null): BankDetails | undefined {
  const digits = (v: unknown) => (typeof v === "string" ? v.replace(/\D/g, "") : "");
  const sort = digits(raw?.sort_code);
  const account = digits(raw?.account_number);
  const iban = typeof raw?.iban === "string" ? raw.iban.replace(/\s/g, "").toUpperCase() : "";
  const details: BankDetails = {
    accountName: text(raw?.account_name, 70),
    sortCode: sort.length === 6 ? sort.replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3") : undefined,
    accountNumber: account.length === 8 ? account : undefined,
    iban: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban) ? iban.replace(/(.{4})(?=.)/g, "$1 ") : undefined,
    bic: text(raw?.bic, 11)?.toUpperCase(),
  };
  const usable = (details.sortCode && details.accountNumber) || details.iban;
  return usable ? details : undefined;
}

/**
 * Bank details as stored: digits only for UK numbers, IBAN without spaces.
 * Returns a message instead when something the owner typed isn't valid.
 */
export function cleanBankForSave(raw: Record<string, string>): { bank: Record<string, string> } | { error: string } {
  const digits = (v = "") => v.replace(/\D/g, "");
  const sort = digits(raw.sort_code);
  const account = digits(raw.account_number);
  const iban = (raw.iban ?? "").replace(/\s/g, "").toUpperCase();
  const bic = (raw.bic ?? "").replace(/\s/g, "").toUpperCase();
  if (sort && sort.length !== 6) return { error: "A UK sort code has 6 digits." };
  if (account && account.length !== 8) return { error: "A UK account number has 8 digits." };
  if (Boolean(sort) !== Boolean(account)) return { error: "Add both the sort code and the account number, or neither." };
  if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return { error: "That IBAN doesn't look right." };
  if (bic && !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(bic)) return { error: "A BIC has 8 or 11 letters and numbers." };

  const bank: Record<string, string> = {};
  const name = (raw.account_name ?? "").trim().slice(0, 70);
  if (name) bank.account_name = name;
  if (sort) bank.sort_code = sort;
  if (account) bank.account_number = account;
  if (iban) bank.iban = iban;
  if (bic) bank.bic = bic;
  return { bank };
}

export const MEDIA_BUCKET = "profile-media";

/** Public URL of a file in the profile-media bucket. */
export function mediaUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(path)}` : undefined;
}

type MediaRow = { id: number; kind: "photo" | "video"; path: string; width: number | null; height: number | null };

function toProfile(row: ProfileRow, media: MediaRow[]): Profile {
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
    payLinks: cleanPayLinks(row.pay_links),
    bank: bankDetails(row.bank),
    customLinks: cleanCustomLinks(row.custom_links),
    photoUrl: mediaUrl(row.photo_path),
    coverUrl: mediaUrl(row.cover_path),
    theme: normaliseTheme(row.theme),
    media: media.map((m) => ({ id: m.id, kind: m.kind, url: mediaUrl(m.path)!, width: m.width, height: m.height })),
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
  if (!data) return null;

  const { data: media } = await db
    .from("profile_media")
    .select("id, kind, path, width, height")
    .eq("profile_id", data.id)
    .order("position")
    .order("id")
    .returns<MediaRow[]>();
  return toProfile(data, media ?? []);
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
