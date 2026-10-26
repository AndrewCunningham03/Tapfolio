"use client";

import { useActionState } from "react";
import { HIDEABLE_FIELDS, PAY_LABELS, PAY_METHODS, SOCIAL_LABELS, SOCIAL_NETWORKS, type HideableField } from "@/lib/profile-fields";
import { saveProfile, type SaveState } from "./actions";
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
  hidden_fields: string[];
};

const initial: SaveState = { status: "idle" };

function Field(props: { name: string; label: string; value: string | null | undefined; type?: string; placeholder?: string; full?: boolean; hint?: string }) {
  return (
    <div className={props.full ? styles.full : undefined}>
      <label htmlFor={props.name}>{props.label}</label>
      <input id={props.name} name={props.name} type={props.type ?? "text"} defaultValue={props.value ?? ""} placeholder={props.placeholder} />
      {props.hint && <p className={styles.fieldHint}>{props.hint}</p>}
    </div>
  );
}

export function ProfileEditor({ profile }: { profile: EditableProfile }) {
  const [state, action, pending] = useActionState(saveProfile, initial);
  const slug = state.slug ?? profile.slug;
  const hidden = new Set(profile.hidden_fields);

  return (
    <form className={styles.designForm} action={action}>
      <input type="hidden" name="profile_id" value={profile.id} />

      <fieldset>
        <legend>About you</legend>
        <div className={styles.form}>
          <Field name="full_name" label="Your name" value={profile.full_name} />
          <Field name="job_title" label="Job title" value={profile.job_title} />
          <Field name="organisation" label="Business name" value={profile.organisation} full />
          <div className={styles.full}>
            <label htmlFor="about">About (a line or two)</label>
            <textarea id="about" name="about" defaultValue={profile.about ?? ""} maxLength={600} placeholder="What you do and where you work" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Contact</legend>
        <div className={styles.form}>
          <Field name="phone" label="Phone" value={profile.phone} type="tel" />
          <Field name="email" label="Email" value={profile.email} type="email" />
          <Field name="website" label="Website" value={profile.website} placeholder="https://yourbusiness.co.uk" full />
          <Field name="street" label="Street" value={profile.street} full />
          <Field name="city" label="Town / city" value={profile.city} />
          <Field name="postcode" label="Postcode or Eircode" value={profile.postcode} />
          <Field name="country" label="Country" value={profile.country} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Get paid</legend>
        <p className={styles.fieldHint}>Customers pay you directly. We never touch the money. Leave anything blank to hide it.</p>
        <div className={styles.form}>
          {PAY_METHODS.map((m) => (
            <Field key={m} name={`pay_${m}`} label={PAY_LABELS[m].label} value={profile.pay_links[m]} placeholder={PAY_LABELS[m].example} full={m === "card"} />
          ))}
          <Field name="bank_account_name" label="Bank account name" value={profile.bank.account_name} full />
          <Field name="bank_sort_code" label="Sort code (UK)" value={profile.bank.sort_code} placeholder="12-34-56" />
          <Field name="bank_account_number" label="Account number (UK)" value={profile.bank.account_number} placeholder="12345678" />
          <Field name="bank_iban" label="IBAN (Ireland)" value={profile.bank.iban} placeholder="IE29 AIBK 9311 5212 3456 78" />
          <Field name="bank_bic" label="BIC (Ireland)" value={profile.bank.bic} placeholder="AIBKIE2D" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Social links</legend>
        <div className={styles.form}>
          {SOCIAL_NETWORKS.map((n) => (
            <Field key={n} name={`social_${n}`} label={SOCIAL_LABELS[n]} value={profile.socials[n]} placeholder={n === "whatsapp" ? "https://wa.me/447700900123" : "https://…"} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Hide from your card</legend>
        <p className={styles.fieldHint}>Ticked details stay saved here but don&apos;t show on your public page or in Save contact.</p>
        <div className={styles.checkGrid}>
          {(Object.keys(HIDEABLE_FIELDS) as HideableField[]).map((f) => (
            <label key={f} className={styles.check}>
              <input type="checkbox" name="hidden" value={f} defaultChecked={hidden.has(f)} />
              {HIDEABLE_FIELDS[f]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Profile address</legend>
        <div className={styles.form}>
          <div className={styles.full}>
            <label htmlFor="slug">tapfolio.co.uk/</label>
            <input id="slug" name="slug" defaultValue={profile.slug} pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]" required />
            <p className={styles.fieldHint}>
              The address people can share. Your card keeps working if you change it, because the card has its own code.
            </p>
          </div>
        </div>
      </fieldset>

      <div className={styles.orderSummary}>
        <div>
          <strong className={styles.saveTitle}>Save changes</strong>
          <span>They show on your card straight away.</span>
        </div>
        <div className={styles.ctaRow} style={{ marginTop: 0 }}>
          <a className={`${styles.btn} ${styles.ghost}`} href={`/${slug}`} target="_blank" rel="noopener">
            View my card
          </a>
          <button className={styles.btn} type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {state.status !== "idle" && (
        <p className={`${styles.notice} ${state.status === "ok" ? styles.thanks : styles.formError}`} role={state.status === "ok" ? "status" : "alert"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
