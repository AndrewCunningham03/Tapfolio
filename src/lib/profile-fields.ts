// Profile field definitions shared by the public profile (server) and the
// customer dashboard editor (browser).

export const SOCIAL_NETWORKS = ["facebook", "instagram", "linkedin", "tiktok", "x", "whatsapp"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
  whatsapp: "WhatsApp",
};

export const PAY_METHODS = ["revolut", "paypal", "monzo", "card"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export const PAY_LABELS: Record<PayMethod, { label: string; example: string }> = {
  revolut: { label: "Revolut", example: "https://revolut.me/yourname" },
  paypal: { label: "PayPal", example: "https://paypal.me/yourname" },
  monzo: { label: "Monzo", example: "https://monzo.me/yourname" },
  card: { label: "Card payment link", example: "https://pay.sumup.com/… or a Stripe link" },
};

/** Fields an owner can keep on file but hide from their public page. Values match profiles.hidden_fields. */
export const HIDEABLE_FIELDS = {
  phone: "Phone",
  email: "Email",
  website: "Website",
  street: "Street",
  city: "Town / city",
  postcode: "Postcode",
  country: "Country",
  job_title: "Job title",
  organisation: "Business name",
  about: "About",
} as const;
export type HideableField = keyof typeof HIDEABLE_FIELDS;

export const PROFILE_LIMITS = {
  full_name: 120,
  job_title: 120,
  organisation: 160,
  about: 600,
  phone: 40,
  email: 200,
  website: 300,
  street: 200,
  city: 100,
  postcode: 20,
  country: 60,
} as const;
