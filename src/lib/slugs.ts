// Profile addresses (/<slug>). Rules match the check constraint and reserved
// list in supabase/migrations/20261023000000_initial_schema.sql.
export const RESERVED_SLUGS = new Set([
  "about", "account", "admin", "api", "app", "auth", "billing", "c", "card", "cards", "claim",
  "contact", "dashboard", "help", "login", "logout", "order", "p", "pricing", "privacy", "pro",
  "profile", "register", "settings", "signin", "signup", "static", "support", "tapfolio", "terms", "www",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

/** "John Smith & Co." → "john-smith-co" */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function slugProblem(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug) || slug.includes("--")) {
    return "Use 3–40 lower-case letters, numbers and single dashes, starting and ending with a letter or number.";
  }
  if (RESERVED_SLUGS.has(slug)) return "That address is reserved. Please choose another.";
  return null;
}
