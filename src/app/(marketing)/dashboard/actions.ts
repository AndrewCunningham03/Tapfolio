"use server";

import { updateTag } from "next/cache";
import { getUser } from "@/lib/auth";
import {
  CUSTOM_LINK_LABEL_MAX,
  CUSTOM_LINK_URL_MAX,
  HIDEABLE_FIELDS,
  MAX_CUSTOM_LINKS,
  PAY_METHODS,
  PROFILE_LIMITS,
  SOCIAL_NETWORKS,
  type CustomLink,
  type HideableField,
} from "@/lib/profile-fields";
import { cleanBankForSave, cleanPayLinks, labelLength, profileTag, safeUrl, tidyLinkLabel } from "@/lib/profiles";
import { slugProblem } from "@/lib/slugs";
import { getServerClient } from "@/lib/supabase/server";

export type SaveState = { status: "idle" | "ok" | "error"; message?: string; slug?: string };

const text = (form: FormData, name: keyof typeof PROFILE_LIMITS) =>
  String(form.get(name) ?? "").trim().slice(0, PROFILE_LIMITS[name]) || null;

/**
 * The custom buttons from the form (link_label_0..5 with link_url_0..5), or what's wrong with one.
 * Empty rows are skipped. The wording matters: profile-editor.tsx decides which row an error is
 * about from it ("Button 2: …", and the word "link" when it's the link box rather than the words).
 */
function readCustomLinks(form: FormData): { links: CustomLink[] } | { error: string } {
  const links: CustomLink[] = [];
  for (let i = 0; i < MAX_CUSTOM_LINKS; i++) {
    const label = tidyLinkLabel(form.get(`link_label_${i}`));
    const rawUrl = String(form.get(`link_url_${i}`) ?? "").trim();
    if (!label && !rawUrl) continue;

    const n = i + 1;
    if (!label) return { error: `Button ${n}: add the words to show on the button, for example Book a quote.` };
    if (labelLength(label) > CUSTOM_LINK_LABEL_MAX) {
      return { error: `Button ${n}: keep the words on the button to ${CUSTOM_LINK_LABEL_MAX} characters or fewer.` };
    }
    if (!rawUrl) return { error: `Button ${n}: add the link this button goes to, starting https://` };
    const url = safeUrl(rawUrl);
    if (!url) return { error: `Button ${n}: the link must start with https://` };
    if (url.length > CUSTOM_LINK_URL_MAX) return { error: `Button ${n}: that link is too long.` };
    links.push({ label, url });
  }
  return { links };
}

export async function saveProfile(_prev: SaveState, form: FormData): Promise<SaveState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };

  // Runs as the signed-in customer: row-level security only lets them change their own profile,
  // and column grants stop them changing ownership or plan.
  const supabase = await getServerClient();
  const id = String(form.get("profile_id") ?? "");
  const { data: current } = await supabase.from("profiles").select("id, slug").eq("id", id).maybeSingle();
  if (!current) return { status: "error", message: "We couldn't find your profile." };

  const fullName = text(form, "full_name");
  if (!fullName) return { status: "error", message: "Please enter your name." };

  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const problem = slugProblem(slug);
  if (problem) return { status: "error", message: `Profile address: ${problem}` };

  const website = String(form.get("website") ?? "").trim();
  if (website && !safeUrl(website)) return { status: "error", message: "Your website must be a full link starting https://" };

  const socials: Record<string, string> = {};
  for (const network of SOCIAL_NETWORKS) {
    const value = String(form.get(`social_${network}`) ?? "").trim();
    if (!value) continue;
    const url = safeUrl(value);
    if (!url) return { status: "error", message: `Your ${network} link must be a full link starting https://` };
    socials[network] = url;
  }

  const rawPay: Record<string, string> = {};
  for (const method of PAY_METHODS) {
    const value = String(form.get(`pay_${method}`) ?? "").trim();
    if (value) rawPay[method] = value;
  }
  const payLinks = cleanPayLinks(rawPay);
  const rejected = PAY_METHODS.filter((m) => rawPay[m] && !payLinks[m]);
  if (rejected.length) {
    return { status: "error", message: `Check your ${rejected.join(", ")} link: it must be a https link to that service.` };
  }

  const bankResult = cleanBankForSave({
    account_name: String(form.get("bank_account_name") ?? ""),
    sort_code: String(form.get("bank_sort_code") ?? ""),
    account_number: String(form.get("bank_account_number") ?? ""),
    iban: String(form.get("bank_iban") ?? ""),
    bic: String(form.get("bank_bic") ?? ""),
  });
  if ("error" in bankResult) return { status: "error", message: bankResult.error };

  const customLinks = readCustomLinks(form);
  if ("error" in customLinks) return { status: "error", message: customLinks.error };

  const hidden = form.getAll("hidden").map(String).filter((f): f is HideableField => f in HIDEABLE_FIELDS);

  const { error } = await supabase
    .from("profiles")
    .update({
      slug,
      full_name: fullName,
      job_title: text(form, "job_title"),
      organisation: text(form, "organisation"),
      about: text(form, "about"),
      phone: text(form, "phone"),
      email: text(form, "email"),
      website: website ? safeUrl(website)! : null,
      street: text(form, "street"),
      city: text(form, "city"),
      postcode: text(form, "postcode"),
      country: text(form, "country"),
      socials,
      pay_links: payLinks,
      bank: bankResult.bank,
      custom_links: customLinks.links,
      hidden_fields: hidden,
    })
    .eq("id", current.id);

  if (error) {
    if (error.code === "23505") return { status: "error", message: "That profile address is already taken. Try another." };
    if (/reserved/i.test(error.message)) return { status: "error", message: "That profile address is reserved. Try another." };
    console.error("profile save failed", error.message);
    return { status: "error", message: "We couldn't save your changes. Please try again." };
  }

  // Cards show the change straight away.
  updateTag(profileTag(current.slug));
  if (slug !== current.slug) updateTag(profileTag(slug));
  return { status: "ok", message: "Saved. Your card shows the changes now.", slug };
}
