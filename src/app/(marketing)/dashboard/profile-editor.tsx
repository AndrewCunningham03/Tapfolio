"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import {
  HIDEABLE_FIELDS,
  PAY_LABELS,
  PAY_METHODS,
  PROFILE_LIMITS,
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  type CustomLink,
  type HideableField,
  type PayMethod,
  type SocialNetwork,
} from "@/lib/profile-fields";
import { slugify } from "@/lib/slugs";
import { saveProfile, type SaveState } from "./actions";
import { describedBy, Field, tidyLink } from "./form-fields";
import { LinkButtonsEditor } from "./link-buttons-editor";
import { PUBLIC_HOST, SECTIONS } from "./sections";
import ds from "./dashboard.module.css";
import styles from "../marketing.module.css";

export type EditableProfile = {
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
  socials: Record<string, string>;
  pay_links: Record<string, string>;
  bank: Record<string, string>;
  custom_links: CustomLink[];
  hidden_fields: string[];
};

const initial: SaveState = { status: "idle" };

// Help text ------------------------------------------------------------------

const PAY_HINTS: Record<PayMethod, string> = {
  revolut: "Your Revolut.me link. It looks like https://revolut.me/yourname and you'll find it in the Revolut app.",
  paypal: "Your PayPal.me link. It looks like https://paypal.me/yourname. You can set one up at paypal.me.",
  monzo: "Your Monzo.me link. It looks like https://monzo.me/yourname and you'll find it in the Monzo app.",
  card: "So customers can pay by card: a payment link from SumUp, Square, Stripe or similar. Copy the whole link from that app and paste it here.",
};

const PAY_HOST_HINT: Record<PayMethod, string> = {
  revolut: "starting https://revolut.me/",
  paypal: "starting https://paypal.me/",
  monzo: "starting https://monzo.me/",
  card: "starting https://",
};

const SOCIAL_PLACEHOLDERS: Record<SocialNetwork, string> = {
  facebook: "https://facebook.com/yourbusiness",
  instagram: "@yourname",
  linkedin: "https://linkedin.com/in/yourname",
  tiktok: "@yourname",
  x: "@yourname",
  whatsapp: "07700 900123",
};

const tidySlug = (raw: string) => slugify(raw) || raw.trim();

// Matching errors to fields ------------------------------------------------------

/** Which fields a message from saveProfile (actions.ts) or the bank checks (lib/profiles.ts) is about. */
function fieldsFor(message: string): string[] {
  const m = message.toLowerCase();
  // "Button 2: the link must start with https://" is about row 2's link box; the other
  // button messages don't say "link" and are about its words (readCustomLinks, actions.ts).
  const button = /^button (\d+):/.exec(m);
  if (button) return [`${/\blink\b/.test(m) ? "link_url" : "link_label"}_${Number(button[1]) - 1}`];
  if (m.includes("enter your name")) return ["full_name"];
  if (m.includes("profile address")) return ["slug"];
  if (m.includes("website")) return ["website"];
  const network = SOCIAL_NETWORKS.find((n) => m.startsWith(`your ${n} link`));
  if (network) return [`social_${network}`];
  if (m.startsWith("check your")) {
    return PAY_METHODS.filter((p) => new RegExp(`\\b${p}\\b`).test(m)).map((p) => `pay_${p}`);
  }
  if (m.includes("sort code") && m.includes("account number")) return ["bank_sort_code", "bank_account_number"];
  if (m.includes("sort code")) return ["bank_sort_code"];
  if (m.includes("account number")) return ["bank_account_number"];
  if (/\biban\b/.test(m)) return ["bank_iban"];
  if (/\bbic\b/.test(m)) return ["bank_bic"];
  return [];
}

/** The message to show under a field, in plainer words where the server's are technical. */
function fieldMessage(field: string, message: string): string {
  if (field.startsWith("pay_")) {
    const method = field.slice(4) as PayMethod;
    return `This needs to be your ${PAY_LABELS[method].label} link, ${PAY_HOST_HINT[method]}`;
  }
  if (field === "social_whatsapp") return "Type your mobile number, or a link starting https://wa.me/";
  if (field.startsWith("social_")) {
    return `Paste the full link to your ${SOCIAL_LABELS[field.slice(7) as SocialNetwork]} page, starting https://`;
  }
  return message;
}

/** Our own wording for the browser's checks (instead of its pop-up bubble). */
function browserMessage(el: HTMLInputElement | HTMLTextAreaElement): string {
  if (el.name === "full_name") return "Please enter your name.";
  if (el.name === "email") return "That email address doesn't look right. It should be like name@example.co.uk.";
  if (el.name === "slug") {
    return el.validity.valueMissing
      ? "Choose a page address, for example joes-plumbing."
      : "Use 3 to 40 lower-case letters, numbers and dashes, starting and ending with a letter or number.";
  }
  return el.validationMessage;
}

/** Focus the first of these fields, preferring an empty one ("add both the sort code and account number"). */
function focusField(names: string[]) {
  const els = names
    .map((n) => document.getElementById(n))
    .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement);
  (els.find((el) => !el.value) ?? els[0])?.focus();
}

function SectionHead({ title, intro }: { title: string; intro?: React.ReactNode }) {
  return (
    <>
      <legend>
        <h2 className={ds.sectionTitle}>{title}</h2>
      </legend>
      {intro && <p className={ds.sectionIntro}>{intro}</p>}
    </>
  );
}

// The form -----------------------------------------------------------------------

export function ProfileEditor({ profile }: { profile: EditableProfile }) {
  const [state, action, pending] = useActionState(saveProfile, initial);
  const [dirty, setDirty] = useState(false);
  const [browserErrors, setBrowserErrors] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(0);
  const [aboutLength, setAboutLength] = useState(profile.about?.length ?? 0);
  const form = useRef<HTMLFormElement>(null);
  const slug = state.slug ?? profile.slug;
  const hidden = new Set(profile.hidden_fields);

  // What's wrong right now: the browser's own checks if they stopped the save,
  // otherwise whatever the server said about the last save.
  const serverFields = state.status === "error" && !pending ? fieldsFor(state.message ?? "") : [];
  const errors: Record<string, string> = Object.keys(browserErrors).length
    ? browserErrors
    : Object.fromEntries(serverFields.map((f, i) => [f, i === 0 ? fieldMessage(f, state.message ?? "") : ""]));
  const errorFields = Object.keys(errors);
  const failed = !pending && (Object.keys(browserErrors).length > 0 || state.status === "error");
  const failMessage =
    Object.values(browserErrors)[0] ?? (serverFields.length ? errors[serverFields[0]] : state.message);
  const unsaved = dirty || state.status === "error";

  // Take the customer to the field the server rejected. Their typed values stay put.
  useEffect(() => {
    if (state.status === "error") focusField(fieldsFor(state.message ?? ""));
  }, [state]);

  // The browser's own checks (email, required name, page address): show our message by the
  // field instead of its pop-up. "invalid" doesn't bubble, so listen while it travels down.
  useEffect(() => {
    const el = form.current;
    if (!el) return;
    let round = false;
    const onInvalid = (e: Event) => {
      const field = e.target as HTMLInputElement;
      e.preventDefault();
      const first = !round;
      if (first) {
        round = true;
        setTimeout(() => (round = false), 0);
        field.focus();
        setAttempt((a) => a + 1);
      }
      setBrowserErrors((prev) => ({ ...(first ? {} : prev), [field.name]: browserMessage(field) }));
    };
    el.addEventListener("invalid", onInvalid, true);
    return () => el.removeEventListener("invalid", onInvalid, true);
  }, []);

  // Warn before leaving with changes that aren't saved.
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const tone = pending ? "pending" : failed ? "error" : dirty ? "dirty" : state.status === "ok" ? "ok" : "idle";
  const grid = (children: React.ReactNode) => <div className={styles.form}>{children}</div>;

  return (
    <form
      ref={form}
      className={`${styles.designForm} ${ds.editor}`}
      aria-label="Your details"
      onChange={() => {
        if (!dirty) setDirty(true);
      }}
      onSubmit={(e) => {
        // Submitted by hand, not through the form's action, so React doesn't reset the
        // fields: if a save is rejected the customer keeps what they typed.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setBrowserErrors({});
        setDirty(false);
        setAttempt((a) => a + 1);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="profile_id" value={profile.id} />

      <fieldset className={ds.section} id={SECTIONS.details.id}>
        <SectionHead title="About you" intro="Shown at the top of your page, under your photo." />
        {grid(
          <>
            <Field
              name="full_name"
              label="Your name"
              value={profile.full_name}
              autoComplete="name"
              required
              error={errors.full_name}
            />
            <Field
              name="job_title"
              label="Job title"
              value={profile.job_title}
              placeholder="Plumber"
              autoComplete="organization-title"
            />
            <Field
              name="organisation"
              label="Business name"
              value={profile.organisation}
              placeholder="Smith Plumbing and Heating"
              autoComplete="organization"
              full
            />
            <div className={styles.full}>
              <label htmlFor="about">A line or two about your work</label>
              <p id="about-hint" className={ds.hint}>
                What you do and where. For example: Family-run plumbing and heating across Belfast and North Down. Free
                quotes.
              </p>
              <textarea
                id="about"
                name="about"
                defaultValue={profile.about ?? ""}
                maxLength={PROFILE_LIMITS.about}
                aria-describedby="about-hint about-count"
                onInput={(e) => setAboutLength(e.currentTarget.value.length)}
              />
              <p id="about-count" className={ds.counter}>
                {aboutLength} of {PROFILE_LIMITS.about} characters
              </p>
            </div>
          </>,
        )}
      </fieldset>

      <fieldset className={ds.section} id={SECTIONS.contact.id}>
        <SectionHead title="Contact" intro="How customers get in touch. Anything you leave blank won't show." />
        {grid(
          <>
            <Field
              name="phone"
              label="Phone"
              value={profile.phone}
              type="tel"
              autoComplete="tel"
              hint="People can tap to ring you."
            />
            <Field
              name="email"
              label="Email"
              value={profile.email}
              type="email"
              autoComplete="email"
              hint="People can tap to email you."
              error={errors.email}
            />
            <Field
              name="website"
              label="Website"
              value={profile.website}
              placeholder="https://yourbusiness.co.uk"
              inputMode="url"
              hint="If you have one. We'll add the https:// if you leave it off."
              tidy={(v) => tidyLink(v)}
              error={errors.website}
              full
            />
          </>,
        )}
        <h3 className={ds.subTitle}>Address</h3>
        <p className={ds.subIntro}>
          Shows on your page with a link to the map. Work from home? You can hide your street in{" "}
          <a href={`#${SECTIONS.privacy.id}`}>Hide details</a>.
        </p>
        {grid(
          <>
            <Field name="street" label="Street" value={profile.street} autoComplete="address-line1" full />
            <Field name="city" label="Town or city" value={profile.city} autoComplete="address-level2" />
            <Field name="postcode" label="Postcode or Eircode" value={profile.postcode} autoComplete="postal-code" />
            <Field name="country" label="Country" value={profile.country} autoComplete="country-name" />
          </>,
        )}
      </fieldset>

      <fieldset className={ds.section} id={SECTIONS.buttons.id}>
        <SectionHead
          title="Your link buttons"
          intro="Big buttons on your page, just under Call, Text and Email, for the things customers ask for most. For example: Book a quote, See our prices or Leave a Google review. Each one has the words on it and a link. You can have up to 6."
        />
        <LinkButtonsEditor
          initial={profile.custom_links}
          errors={errors}
          attempt={attempt}
          onEdit={() => setDirty(true)}
        />
      </fieldset>

      <fieldset className={ds.section} id={SECTIONS.pay.id}>
        <SectionHead
          title="Get paid"
          intro="Let customers pay you there and then. The money goes straight to you: Tapfolio never touches it. Fill in only what you use."
        />
        <h3 className={ds.subTitle}>Payment links</h3>
        <p className={ds.subIntro}>Copy your link from the app and paste it in. Each one shows as a button.</p>
        {grid(
          PAY_METHODS.map((m) => (
            <Field
              key={m}
              name={`pay_${m}`}
              label={PAY_LABELS[m].label}
              value={profile.pay_links[m]}
              placeholder={m === "card" ? "https://" : PAY_LABELS[m].example}
              inputMode="url"
              hint={PAY_HINTS[m]}
              tidy={(v) => tidyLink(v, { pay: true })}
              error={errors[`pay_${m}`]}
              full
            />
          )),
        )}
        <h3 className={ds.subTitle}>Bank transfer</h3>
        <p className={ds.subIntro}>
          Customers can copy these from your page. Fill in the UK details, the Irish ones, or both.
        </p>
        {grid(
          <>
            <Field
              name="bank_account_name"
              label="Name on the account"
              value={profile.bank.account_name}
              hint="So customers can see they're paying the right person."
              full
            />
            <Field
              name="bank_sort_code"
              label="Sort code (UK)"
              value={profile.bank.sort_code}
              placeholder="12-34-56"
              inputMode="numeric"
              autoComplete="off"
              error={errors.bank_sort_code}
            />
            <Field
              name="bank_account_number"
              label="Account number (UK)"
              value={profile.bank.account_number}
              placeholder="12345678"
              inputMode="numeric"
              autoComplete="off"
              error={errors.bank_account_number}
            />
            <Field
              name="bank_iban"
              label="IBAN (Ireland)"
              value={profile.bank.iban}
              placeholder="IE29 AIBK 9311 5212 3456 78"
              autoComplete="off"
              error={errors.bank_iban}
            />
            <Field
              name="bank_bic"
              label="BIC (Ireland)"
              value={profile.bank.bic}
              placeholder="AIBKIE2D"
              autoComplete="off"
              error={errors.bank_bic}
            />
          </>,
        )}
      </fieldset>

      <fieldset className={ds.section} id={SECTIONS.socials.id}>
        <SectionHead
          title="Social links"
          intro="Add the ones you use and leave the rest blank. Paste the link to your page, or for Instagram, TikTok and X just type your @name."
        />
        {grid(
          SOCIAL_NETWORKS.map((n) => (
            <Field
              key={n}
              name={`social_${n}`}
              label={SOCIAL_LABELS[n]}
              value={profile.socials[n]}
              placeholder={SOCIAL_PLACEHOLDERS[n]}
              inputMode={n === "whatsapp" ? "tel" : "url"}
              hint={n === "whatsapp" ? "Type your mobile number and we'll turn it into a WhatsApp link." : undefined}
              tidy={(v) => tidyLink(v, { network: n })}
              error={errors[`social_${n}`]}
            />
          )),
        )}
      </fieldset>

      <fieldset className={ds.section} id={SECTIONS.privacy.id}>
        <SectionHead
          title="Hide details"
          intro="Tick anything you'd rather keep private. It stays saved here, but won't show on your page or when someone saves your contact. Handy if you work from home and don't want your street on show."
        />
        <div className={styles.checkGrid}>
          {(Object.keys(HIDEABLE_FIELDS) as HideableField[]).map((f) => (
            <label key={f} className={`${styles.check} ${ds.checkRow}`}>
              <input type="checkbox" name="hidden" value={f} defaultChecked={hidden.has(f)} />
              Hide {f === "about" ? "the line about your work" : HIDEABLE_FIELDS[f].toLowerCase()}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={ds.section} id={SECTIONS.address.id}>
        <SectionHead
          title="Page address"
          intro="The link to your page, for texts, emails, quotes or the side of your van. Your card keeps working if you change it, because the card has its own code. Links you've already shared with the old address will stop working, though."
        />
        <label htmlFor="slug" className={ds.srOnly}>
          Page address
        </label>
        {errors.slug && (
          <p id="slug-error" className={ds.fieldError}>
            {errors.slug}
          </p>
        )}
        <div className={ds.prefixField}>
          <span aria-hidden="true">{PUBLIC_HOST}/</span>
          <input
            id="slug"
            name="slug"
            className={ds.prefixInput}
            defaultValue={profile.slug}
            pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={errors.slug !== undefined || undefined}
            aria-describedby={describedBy(errors.slug && "slug-error", "slug-hint")}
            onBlur={(e) => {
              const tidied = tidySlug(e.currentTarget.value);
              if (tidied !== e.currentTarget.value) e.currentTarget.value = tidied;
            }}
          />
        </div>
        <p id="slug-hint" className={`${ds.hint} ${ds.hintAfter}`}>
          Lower-case letters, numbers and dashes, for example joes-plumbing. We&apos;ll tidy it up for you.
        </p>
      </fieldset>

      <div className={ds.saveBar} data-tone={tone}>
        <div className={ds.saveText}>
          <p aria-live="polite" className={tone === "ok" ? ds.saveOk : ds.saveIdle}>
            {pending && "Saving…"}
            {tone === "ok" && (
              <>
                Saved. Your page shows the changes now.{" "}
                <a href={`/${slug}`} target="_blank" rel="noopener">
                  View my page<span className={ds.srOnly}> (opens in a new tab)</span>
                </a>
              </>
            )}
          </p>
          {tone === "dirty" && <p className={ds.saveDirty}>You have changes that aren&apos;t saved yet.</p>}
          {tone === "idle" && <p className={ds.saveIdle}>Changes show on your page as soon as you save.</p>}
          {failed && (
            <p key={attempt} role="alert" className={ds.saveError}>
              <strong>Not saved.</strong> {failMessage}{" "}
              {errorFields.length > 0 && (
                <button
                  type="button"
                  className={`${styles.linkButton} ${ds.textButton}`}
                  onClick={() => focusField(errorFields)}
                >
                  Show me
                </button>
              )}
            </p>
          )}
        </div>
        <button className={`${styles.btn} ${ds.saveButton}`} type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
