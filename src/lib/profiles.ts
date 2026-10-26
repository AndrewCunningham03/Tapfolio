export type SocialNetwork = "facebook" | "instagram" | "linkedin" | "tiktok" | "x" | "whatsapp";

export type Socials = Partial<Record<SocialNetwork, string>>;

// A profile as the public page sees it. Fields the owner has hidden are
// already removed by the time a Profile reaches the page or the vCard.
export type Profile = {
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

// Same record as supabase/seed.sql, so the example works before Supabase is set up.
const SAMPLE_PROFILES: Record<string, Profile> = {
  "john-smith": {
    slug: "john-smith",
    fullName: "John Smith",
    jobTitle: "Owner, Gas Safe Engineer",
    organisation: "Smith Plumbing & Heating",
    about: "Boiler installs, servicing and emergency repairs across York and North Yorkshire. Gas Safe registered, fully insured.",
    phone: "07700 900123",
    email: "john@smithplumbing.co.uk",
    website: "https://smithplumbing.co.uk",
    street: "12 High Street",
    city: "York",
    postcode: "YO1 7HU",
    country: "United Kingdom",
    socials: {
      facebook: "https://www.facebook.com/",
      instagram: "https://www.instagram.com/",
      linkedin: "https://www.linkedin.com/",
      whatsapp: "https://wa.me/447700900123",
    },
    plan: "free",
  },
};

// TODO(milestone 2): read from the Supabase profiles table instead.
export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  return SAMPLE_PROFILES[slug.toLowerCase()] ?? null;
}

export function formatAddress(p: Profile): string | undefined {
  const parts = [p.street, p.city, p.postcode].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

export function mapsUrl(p: Profile): string | undefined {
  const address = formatAddress(p);
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : undefined;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}
