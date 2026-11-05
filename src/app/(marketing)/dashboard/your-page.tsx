import { PUBLIC_HOST, SECTIONS } from "./sections";
import { ShareLink } from "./share-link";
import ds from "./dashboard.module.css";

/** What's filled in so far (from the saved profile, so it updates after each save or upload). */
export type SetupState = { photo: boolean; about: boolean; phone: boolean; pay: boolean; socials: boolean };

const STEPS: { key: keyof SetupState; todo: string; done: string; hint?: string; target: string }[] = [
  { key: "photo", todo: "Add a photo or logo", done: "Photo or logo added", target: SECTIONS.photo.id },
  { key: "about", todo: "Say what you do", done: "About you written", target: SECTIONS.details.id },
  { key: "phone", todo: "Add your phone number", done: "Phone number added", target: SECTIONS.contact.id },
  {
    key: "pay",
    todo: "Add a way to get paid",
    done: "Way to get paid added",
    hint: "A Revolut, PayPal, Monzo or card link, or bank details",
    target: SECTIONS.pay.id,
  },
  {
    key: "socials",
    todo: "Add your social links",
    done: "Social links added",
    hint: "If you use Facebook, Instagram, WhatsApp and so on",
    target: SECTIONS.socials.id,
  },
];

/** Ready to share: the essentials plus at least one way to get paid or follow you. */
export const isSetUp = (s: SetupState) => s.photo && s.about && s.phone && (s.pay || s.socials);

/** The customer's link, with a short set-up checklist until the page is ready. */
export function YourPage({ slug, setup }: { slug: string; setup: SetupState }) {
  const ready = isSetUp(setup);
  const done = STEPS.filter((s) => setup[s.key]).length;

  return (
    <section className={ds.yourPage} id="your-page" aria-labelledby="your-page-title">
      <div>
        <h2 className={ds.panelTitle} id="your-page-title">
          {ready ? "Your page" : "Set up your page"}
        </h2>
        <p className={ds.pageUrl}>
          <span className={ds.srOnly}>Your link: </span>
          {PUBLIC_HOST}/<strong>{slug}</strong>
        </p>
      </div>

      {!ready && (
        <>
          <p className={ds.setupIntro}>
            This is what people see when they tap or scan your card. Fill in these few things and it&apos;s ready to
            share.
          </p>
          <div className={ds.progressRow}>
            <div className={ds.progress} aria-hidden="true">
              <span style={{ width: `${(done / STEPS.length) * 100}%` }} />
            </div>
            <span>
              {done} of {STEPS.length} done
            </span>
          </div>
          <ol className={ds.steps}>
            {STEPS.map((s) => (
              <li key={s.key} className={setup[s.key] ? ds.stepDone : undefined}>
                <a href={`#${s.target}`}>
                  <span className={ds.stepMark} aria-hidden="true" />
                  <span>
                    <span className={ds.srOnly}>{setup[s.key] ? "Done: " : "To do: "}</span>
                    {setup[s.key] ? s.done : s.todo}
                    {!setup[s.key] && s.hint && <span className={ds.stepHint}>{s.hint}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </>
      )}

      <ShareLink slug={slug} />
    </section>
  );
}
