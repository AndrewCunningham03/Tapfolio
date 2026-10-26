"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useRef, useState } from "react";
import { DEFAULT_DESIGN, FINISHES, LAYOUTS, LIMITS, type CardDesign, type Finish, type Layout } from "@/lib/card-design";
import { CONTACT_EMAIL } from "@/lib/site";
import { COUNTRIES } from "../countries";
import { Price, useCurrency } from "../currency";
import { submitCardOrder, type OrderState } from "./actions";
import { CardBack, CardFront } from "./card-preview";
import { ACCEPTED_TYPES, loadLogo, makeMask, tint, toPngBlob } from "./logo";
import styles from "../marketing.module.css";

const initial: OrderState = { status: "idle" };

export function Designer() {
  const currency = useCurrency();
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [logoSource, setLogoSource] = useState<HTMLCanvasElement | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(submitCardOrder, initial);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CardDesign>(key: K, value: CardDesign[K]) => setDesign((d) => ({ ...d, [key]: value }));

  // The engraving mask only changes with the logo or invert option; the tint also follows the metal.
  const logoMask = useMemo(() => (logoSource ? makeMask(logoSource, design.logoInvert) : null), [logoSource, design.logoInvert]);
  const logoPreview = useMemo(
    () => (logoMask ? tint(logoMask, FINISHES[design.finish].engrave) : undefined),
    [logoMask, design.finish],
  );
  const logoEmpty = Boolean(logoSource) && !logoMask;

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoSource(await loadLogo(file));
    } catch (err) {
      setLogoSource(null);
      setLogoError(err instanceof Error ? err.message : "We couldn't read that image.");
    }
  }

  function removeLogo() {
    setLogoSource(null);
    setLogoError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.delete("logo_file");
    form.set("finish", design.finish);
    form.set("layout", design.layout);
    form.set("name_on_card", design.name);
    form.set("title_on_card", design.title);
    form.set("back_text", design.backText);
    form.set("logo_invert", String(design.logoInvert));
    form.set("currency", currency);
    if (logoSource) form.set("logo", await toPngBlob(logoSource), "logo.png");
    startTransition(() => action(form));
  }

  const cardPrice = FINISHES[design.finish].price;

  if (state.status === "ok") {
    return (
      <div className={`${styles.notice} ${styles.thanks} ${styles.orderDone}`} role="status">
        <h2>Thanks, your card is on its way to the workshop.</h2>
        <p>
          We&apos;ll email you a proof of your {FINISHES[design.finish].label.toLowerCase()} card and a payment link within
          one working day. Nothing is engraved until you approve the proof.
        </p>
        <div className={styles.doneCards}>
          <CardFront design={design} logo={logoPreview} />
        </div>
        <Link className={`${styles.btn} ${styles.ghost}`} href="/">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.designer}>
      <div className={styles.previewCol}>
        <div className={styles.previewStage}>
          <div className={styles.previewCard}>
            <CardFront design={design} logo={logoPreview} />
          </div>
          <div className={styles.previewCard}>
            <CardBack design={design} />
          </div>
        </div>
        <p className={styles.previewNote}>
          Live preview. Your card is laser engraved, so your logo is cut in one colour. We email a proof before anything
          is made. The QR code shown is a sample; yours is unique.
        </p>
      </div>

      <form className={styles.designForm} onSubmit={onSubmit}>
        <fieldset>
          <legend>
            <span>1</span> Choose your metal
          </legend>
          <div className={styles.swatches} role="radiogroup" aria-label="Finish">
            {(Object.keys(FINISHES) as Finish[]).map((f) => (
              <label key={f} className={styles.swatch} data-checked={design.finish === f}>
                <input type="radio" name="finish" value={f} checked={design.finish === f} onChange={() => set("finish", f)} />
                <span className={styles.swatchChip} style={{ background: `linear-gradient(135deg, ${FINISHES[f].base}, ${FINISHES[f].sheen})` }} />
                <span className={styles.swatchLabel}>{FINISHES[f].label}</span>
                <span className={styles.swatchPrice}>
                  <Price of={FINISHES[f].price} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span>2</span> Pick a layout
          </legend>
          <div className={styles.layouts} role="radiogroup" aria-label="Layout">
            {(Object.keys(LAYOUTS) as Layout[]).map((l) => (
              <label key={l} className={styles.layoutOption} data-checked={design.layout === l}>
                <input type="radio" name="layout" value={l} checked={design.layout === l} onChange={() => set("layout", l)} />
                <strong>{LAYOUTS[l].label}</strong>
                <span>{LAYOUTS[l].hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span>3</span> Make it yours
          </legend>
          <div className={styles.form}>
            <div>
              <label htmlFor="card-name">Name on the card</label>
              <input id="card-name" value={design.name} maxLength={LIMITS.name} placeholder="John Smith" onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label htmlFor="card-title">Job title (optional)</label>
              <input id="card-title" value={design.title} maxLength={LIMITS.title} placeholder="Owner, Gas Safe Engineer" onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className={styles.full}>
              <label htmlFor="card-logo">Your logo (optional)</label>
              <div className={styles.logoRow}>
                <input ref={fileRef} id="card-logo" name="logo_file" type="file" accept={ACCEPTED_TYPES.join(",")} onChange={onLogo} />
                {logoSource && (
                  <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} onClick={removeLogo}>
                    Remove
                  </button>
                )}
              </div>
              {logoSource && (
                <label className={styles.check}>
                  <input type="checkbox" checked={design.logoInvert} onChange={(e) => set("logoInvert", e.target.checked)} />
                  My logo is light on a dark background
                </label>
              )}
              {logoEmpty && <p className={styles.fieldHint}>We can&apos;t see any marks to engrave. Try the option above.</p>}
              {logoError && <p className={styles.fieldError}>{logoError}</p>}
              <p className={styles.fieldHint}>PNG, JPG or WebP. A logo on a plain background works best.</p>
            </div>
            <div className={styles.full}>
              <label htmlFor="card-back">Line on the back (optional)</label>
              <input id="card-back" value={design.backText} maxLength={LIMITS.back} placeholder="smithplumbing.co.uk" onChange={(e) => set("backText", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span>4</span> Your details
          </legend>
          <div className={styles.form}>
            <div className={styles.honeypot} aria-hidden="true">
              <label>
                Leave this empty <input name="company_url" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div>
              <label htmlFor="name">Your name</label>
              <input id="name" name="name" required autoComplete="name" />
            </div>
            <div>
              <label htmlFor="business">Business name</label>
              <input id="business" name="business" autoComplete="organization" />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="country">Where should we deliver?</label>
              <select id="country" name="country" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qty">Number of cards</label>
              <select id="qty" name="quantity" defaultValue="1">
                <option>1</option>
                <option>2–5</option>
                <option>6–20</option>
                <option>21–50</option>
                <option>50+</option>
              </select>
            </div>
            <div className={styles.full}>
              <label htmlFor="msg">Anything else? (optional)</label>
              <textarea id="msg" name="message" placeholder="Team orders, a different design idea, deadlines…" />
            </div>
          </div>
        </fieldset>

        <div className={styles.orderSummary}>
          <div>
            <strong>
              <Price of={cardPrice} />
            </strong>{" "}
            {FINISHES[design.finish].label.toLowerCase()} card, then <Price of="monthly" /> a month
            <span>No payment now. We email your proof and a payment link first. Cancel any time.</span>
          </div>
          <button className={styles.btn} type="submit" disabled={pending}>
            {pending ? "Sending…" : "Request my card"}
          </button>
        </div>
        <p className={styles.formNote}>
          We only use your details to make and deliver your card. See our <Link href="/privacy">privacy policy</Link>.
        </p>
        {state.status === "error" && (
          <div className={`${styles.notice} ${styles.formError}`} role="alert">
            {state.message ?? (
              <>
                Sorry, your order didn&apos;t send. Please try again, or email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Card order")}`}>{CONTACT_EMAIL}</a>.
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
