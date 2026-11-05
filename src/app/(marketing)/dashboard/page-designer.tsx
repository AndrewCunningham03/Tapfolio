"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  IMAGE_MAX_SIDE,
  IMAGE_TYPES,
  MAX_PHOTOS,
  MAX_VIDEO_BYTES,
  MAX_VIDEOS,
  VIDEO_TYPES,
  type UploadKind,
} from "@/lib/media-limits";
import {
  BUTTON_STYLES,
  FONT_OPTIONS,
  THEME_PRESETS,
  normaliseTheme,
  themeVars,
  type ButtonStyleId,
  type FontId,
  type PresetId,
  type ThemeChoice,
} from "@/lib/themes";
import { colourFromLogoUrl } from "./logo-colours";
import { deleteMedia, finishUpload, removeImage, requestUpload, saveTheme } from "./media-actions";
import { PagePreview, type PreviewLink } from "./preview";
import { SECTIONS } from "./sections";
import ds from "./dashboard.module.css";
import x from "./design-extras.module.css";
import styles from "../marketing.module.css";

export type DesignerMedia = { id: number; kind: "photo" | "video"; url: string };

const BUCKET = "profile-media";

const makeBucket = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!).storage.from(
    BUCKET,
  );
// One storage client for the whole page (several would each start their own sign-in listener).
let bucket: ReturnType<typeof makeBucket> | null = null;
const mediaBucket = () => (bucket ??= makeBucket());

/** Shrink a photo in the browser (keeps uploads small and pages fast). */
async function shrinkImage(file: File, maxSide: number): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("We can't read that image. Please use a JPG or PNG."));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not prepare the image."))), "image/jpeg", 0.85),
    );
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function upload(kind: UploadKind, file: File) {
  let body: Blob = file;
  let type = file.type;
  let width: number | undefined;
  let height: number | undefined;
  if (kind !== "video") {
    if (!IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/"))
      throw new Error("Please choose a photo (JPG, PNG or WebP).");
    ({ blob: body, width, height } = await shrinkImage(file, IMAGE_MAX_SIDE[kind]));
    type = "image/jpeg";
  } else {
    if (!VIDEO_TYPES.includes(file.type)) throw new Error("Videos must be MP4, WebM or MOV.");
    if (file.size > MAX_VIDEO_BYTES) throw new Error("That video is over 50 MB. Try a shorter clip.");
  }

  const ticket = await requestUpload(kind, type, body.size);
  if (!ticket.ok) throw new Error(ticket.message);
  const { error } = await mediaBucket().uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: type });
  if (error) throw new Error("The upload failed. Please check your connection and try again.");
  const result = await finishUpload(kind, ticket.path, width, height);
  if (!result.ok) throw new Error(result.message);
}

type Status = { ok: boolean; message: string } | null;

/**
 * Uploads and saves for one section. Each section has its own, so the message
 * shows next to whatever the customer just pressed.
 */
function useMediaTools() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startRefresh] = useTransition();

  const done = (message: string) => {
    setStatus({ ok: true, message });
    startRefresh(() => router.refresh());
  };

  async function onFiles(kind: UploadKind, files: FileList | null, input: HTMLInputElement) {
    if (!files?.length) return;
    setStatus(null);
    setBusy(kind);
    try {
      for (const file of Array.from(files)) await upload(kind, file);
      done(
        kind === "avatar"
          ? "Photo saved. It's on your page now."
          : kind === "cover"
            ? "Cover photo saved. It's on your page now."
            : "Added to your gallery.",
      );
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Upload failed." });
      startRefresh(() => router.refresh());
    } finally {
      setBusy(null);
      input.value = "";
    }
  }

  async function run(label: string, fn: () => Promise<{ ok: boolean; message?: string }>, success: string) {
    setStatus(null);
    setBusy(label);
    let result: { ok: boolean; message?: string };
    try {
      result = await fn();
    } catch {
      result = { ok: false, message: "Something went wrong. Please try again." };
    } finally {
      setBusy(null);
    }
    if (result.ok) done(success);
    else setStatus({ ok: false, message: result.message ?? "Something went wrong." });
  }

  return { status, busy, onFiles, run };
}

function StatusLine({ status }: { status: Status }) {
  // Always rendered, so screen readers announce each new message.
  return (
    <div role="status">
      {status && (
        <p className={`${styles.notice} ${status.ok ? styles.thanks : styles.formError} ${ds.sectionStatus}`}>
          {!status.ok && <strong>Not saved. </strong>}
          {status.message}
        </p>
      )}
    </div>
  );
}

function SectionHead({ title, intro }: { title: string; intro: React.ReactNode }) {
  return (
    <>
      <legend>
        <h2 className={ds.sectionTitle}>{title}</h2>
      </legend>
      <p className={ds.sectionIntro}>{intro}</p>
    </>
  );
}

const fileButton = `${styles.btn} ${styles.ghost} ${styles.btnSmall} ${ds.tap}`;

/** Profile photo or logo, and the cover picture. Saved as soon as one is chosen. */
export function PhotoSection(props: { photoUrl?: string; coverUrl?: string }) {
  const { status, busy, onFiles, run } = useMediaTools();
  const id = SECTIONS.photo.id;
  const confirmRemove = (what: string) => window.confirm(`Remove your ${what}? You can add a new one any time.`);

  return (
    <fieldset className={ds.section} id={id}>
      <SectionHead
        title="Photo or logo"
        intro="The first thing people see on your page. Pictures save as soon as you choose them, no need to press Save."
      />
      <div className={styles.imageSlots}>
        <div className={styles.imageSlot}>
          <div className={`${styles.slotPreview} ${styles.slotRound}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
            {props.photoUrl ? <img src={props.photoUrl} alt="Your profile photo" /> : <span>No photo</span>}
          </div>
          <p className={ds.slotTitle}>Photo or logo</p>
          <p className={ds.slotHint}>A square picture works best: your face or your logo.</p>
          <div className={ds.slotActions}>
            <label className={fileButton} aria-disabled={busy !== null}>
              {busy === "avatar" ? "Uploading…" : props.photoUrl ? "Change photo or logo" : "Add photo or logo"}
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                disabled={busy !== null}
                onChange={(e) => onFiles("avatar", e.target.files, e.target)}
              />
            </label>
            {props.photoUrl && (
              <button
                type="button"
                className={`${styles.linkButton} ${ds.textButton}`}
                disabled={busy !== null}
                onClick={() =>
                  confirmRemove("photo or logo") && run("avatar-remove", () => removeImage("avatar"), "Photo removed.")
                }
              >
                Remove<span className={ds.srOnly}> photo or logo</span>
              </button>
            )}
          </div>
        </div>
        <div className={styles.imageSlot}>
          <div className={`${styles.slotPreview} ${styles.slotWide}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
            {props.coverUrl ? <img src={props.coverUrl} alt="Your cover photo" /> : <span>No cover photo</span>}
          </div>
          <p className={ds.slotTitle}>
            Cover photo <span className={ds.slotHint}>(optional)</span>
          </p>
          <p className={ds.slotHint}>A wide picture across the top of your page, such as your work, shop or van.</p>
          <div className={ds.slotActions}>
            <label className={fileButton} aria-disabled={busy !== null}>
              {busy === "cover" ? "Uploading…" : props.coverUrl ? "Change cover photo" : "Add cover photo"}
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                disabled={busy !== null}
                onChange={(e) => onFiles("cover", e.target.files, e.target)}
              />
            </label>
            {props.coverUrl && (
              <button
                type="button"
                className={`${styles.linkButton} ${ds.textButton}`}
                disabled={busy !== null}
                onClick={() =>
                  confirmRemove("cover photo") &&
                  run("cover-remove", () => removeImage("cover"), "Cover photo removed.")
                }
              >
                Remove<span className={ds.srOnly}> cover photo</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <StatusLine status={status} />
    </fieldset>
  );
}

/** Colours, font and button shape, with a live preview. Nothing is saved until "Save look" is pressed. */
const themeKey = (t: ThemeChoice) => JSON.stringify(normaliseTheme(t));

type LogoNote = { ok: true; accent: string; background: string } | { ok: false; message: string } | null;

export function ColoursSection(props: {
  theme: ThemeChoice;
  name: string;
  jobTitle?: string | null;
  organisation?: string | null;
  /** The saved profile photo or logo: shown in the preview, and read for "Pick colours from my logo". */
  photoUrl?: string;
  coverUrl?: string;
  /** The customer's own link buttons, drawn in the preview when there are any. */
  customLinks?: PreviewLink[];
}) {
  const { status, busy, run } = useMediaTools();
  const uid = useId();
  const [theme, setTheme] = useState<ThemeChoice>(props.theme);
  const [savedKey, setSavedKey] = useState(() => themeKey(props.theme));
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoNote, setLogoNote] = useState<LogoNote>(null);
  const [logoUndo, setLogoUndo] = useState<ThemeChoice | null>(null);
  const id = SECTIONS.colours.id;

  const vars = themeVars(theme);
  const unsaved = themeKey(theme) !== savedKey;
  const font = theme.font ?? "clean";
  const buttons = theme.buttons ?? "rounded";

  /** A change made by hand: the logo suggestion no longer applies. */
  const edit = (next: ThemeChoice) => {
    setTheme(next);
    setLogoNote(null);
    setLogoUndo(null);
  };

  async function matchLogo() {
    if (!props.photoUrl) return;
    setLogoBusy(true);
    setLogoNote(null);
    const result = await colourFromLogoUrl(props.photoUrl);
    setLogoBusy(false);
    if (!result.ok) {
      setLogoNote({
        ok: false,
        message:
          result.reason === "no-colour"
            ? "We couldn't find a clear colour in your picture. It may be black and white. Choose your colours yourself, above."
            : "We couldn't read your picture just now. You can still choose your colours yourself, above.",
      });
      return;
    }
    const { accent, background } = result.colours;
    setLogoUndo(theme);
    setTheme((t) => ({ ...t, preset: "custom", accent, background }));
    setLogoNote({ ok: true, accent, background });
  }

  const save = () =>
    run(
      "theme",
      async () => {
        const saving = themeKey(theme);
        const result = await saveTheme(theme);
        if (result.ok) setSavedKey(saving);
        return result;
      },
      "Look saved. Your page shows it now.",
    );

  return (
    <fieldset className={ds.section} id={id}>
      <SectionHead
        title="Colours and style"
        intro="Pick a look for your page and watch the preview change. Nothing goes on your page until you press Save look. Text colours adjust automatically so it's always easy to read."
      />
      <div className={x.designLayout}>
        <PagePreview
          theme={theme}
          name={props.name}
          jobTitle={props.jobTitle}
          organisation={props.organisation}
          photoUrl={props.photoUrl}
          coverUrl={props.coverUrl}
          customLinks={props.customLinks}
          unsaved={unsaved}
        />

        <div className={x.controls}>
          <div className={x.group}>
            <h3 className={x.groupTitle} id={`${uid}-colours`}>
              Colours
            </h3>
            <div className={x.presetGrid} role="radiogroup" aria-labelledby={`${uid}-colours`}>
              {(Object.keys(THEME_PRESETS) as PresetId[]).map((preset) => {
                const p = THEME_PRESETS[preset];
                return (
                  <label
                    key={preset}
                    className={`${x.option} ${x.presetOption}`}
                    data-checked={theme.preset === preset}
                  >
                    <input
                      type="radio"
                      name="theme"
                      checked={theme.preset === preset}
                      onChange={() => edit({ preset, font: theme.font, buttons: theme.buttons })}
                    />
                    <span
                      className={x.chip}
                      style={{ background: `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50%)` }}
                    />
                    <span>{p.label}</span>
                  </label>
                );
              })}
              <label className={`${x.option} ${x.presetOption}`} data-checked={theme.preset === "custom"}>
                <input
                  type="radio"
                  name="theme"
                  checked={theme.preset === "custom"}
                  onChange={() => edit({ ...theme, preset: "custom", background: theme.background ?? "#ffffff" })}
                />
                <span
                  className={x.chip}
                  style={{ background: "conic-gradient(#f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #f43f5e)" }}
                />
                <span>Custom</span>
              </label>
            </div>

            <div className={x.pickRow}>
              {theme.preset === "custom" && (
                <label>
                  Background
                  <input
                    type="color"
                    className={ds.colourPick}
                    value={theme.background ?? "#ffffff"}
                    onChange={(e) => edit({ ...theme, background: e.target.value })}
                  />
                </label>
              )}
              <label>
                Buttons and highlights
                <input
                  type="color"
                  className={ds.colourPick}
                  value={theme.accent ?? vars["--accent"]}
                  onChange={(e) => edit({ ...theme, accent: e.target.value })}
                />
              </label>
              {theme.accent && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.ghost} ${styles.btnSmall} ${ds.tap}`}
                  onClick={() => edit({ ...theme, accent: undefined })}
                >
                  Reset button colour
                </button>
              )}
            </div>
          </div>

          <div className={x.group}>
            <h3 className={x.groupTitle} id={`${uid}-logo`}>
              Match your logo
            </h3>
            <p className={x.groupHint} id={`${uid}-logo-hint`}>
              {props.photoUrl
                ? "Takes the main colour from your photo or logo and tries it on your page. You can change it afterwards."
                : "Add a photo or logo at the top of this page first, then this can pick its colours."}
            </p>
            <div className={x.logoActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.ghost} ${ds.tap}`}
                disabled={!props.photoUrl || logoBusy}
                aria-describedby={`${uid}-logo-hint`}
                onClick={matchLogo}
              >
                {logoBusy ? "Looking at your logo…" : "Pick colours from my logo"}
              </button>
              {logoUndo && (
                <button
                  type="button"
                  className={`${styles.linkButton} ${ds.textButton}`}
                  onClick={() => {
                    setTheme(logoUndo);
                    setLogoUndo(null);
                    setLogoNote(null);
                  }}
                >
                  Undo logo colours
                </button>
              )}
            </div>
            <div role="status">
              {logoNote && (
                <p className={x.note}>
                  {logoNote.ok ? (
                    <>
                      <span className={x.noteChips} aria-hidden="true">
                        <i style={{ background: logoNote.background }} />
                        <i style={{ background: logoNote.accent }} />
                      </span>
                      Colours picked from your logo. Check the preview, then press Save look.
                    </>
                  ) : (
                    logoNote.message
                  )}
                </p>
              )}
            </div>
          </div>

          <div className={x.group}>
            <h3 className={x.groupTitle} id={`${uid}-font`}>
              Font
            </h3>
            <div className={x.choiceGrid} role="radiogroup" aria-labelledby={`${uid}-font`}>
              {(Object.keys(FONT_OPTIONS) as FontId[]).map((f) => (
                <label key={f} className={`${x.option} ${x.fontOption}`} data-checked={font === f}>
                  <input
                    type="radio"
                    name="look-font"
                    checked={font === f}
                    onChange={() => edit({ ...theme, font: f })}
                  />
                  <span className={x.fontAa} style={{ fontFamily: FONT_OPTIONS[f].stack }} aria-hidden="true">
                    Aa
                  </span>
                  <span style={{ fontFamily: FONT_OPTIONS[f].stack }}>{FONT_OPTIONS[f].label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={x.group}>
            <h3 className={x.groupTitle} id={`${uid}-buttons`}>
              Button style
            </h3>
            <p className={x.groupHint}>The shape of Save contact and the other buttons on your page.</p>
            <div className={x.choiceGrid} role="radiogroup" aria-labelledby={`${uid}-buttons`}>
              {(Object.keys(BUTTON_STYLES) as ButtonStyleId[]).map((b) => (
                <label key={b} className={`${x.option} ${x.buttonOption}`} data-checked={buttons === b}>
                  <input
                    type="radio"
                    name="look-buttons"
                    checked={buttons === b}
                    onChange={() => edit({ ...theme, buttons: b })}
                  />
                  {/* A sample button in the page's own colours, so the choice is easy to compare. */}
                  <span
                    className={x.sampleCard}
                    aria-hidden="true"
                    style={
                      {
                        background: vars["--card"],
                        "--btn-radius": BUTTON_STYLES[b].radius,
                        "--sample-accent": vars["--accent"],
                        "--sample-on-accent": vars["--accent-text"],
                        "--sample-text": vars["--text"],
                      } as React.CSSProperties
                    }
                  >
                    <span className={x.sampleBtn} data-style={b}>
                      Save contact
                    </span>
                  </span>
                  <span className={x.optionLabel}>{BUTTON_STYLES[b].label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={x.group}>
            <div className={x.saveRow}>
              <button type="button" className={`${styles.btn} ${ds.tap}`} disabled={busy !== null} onClick={save}>
                {busy === "theme" ? "Saving…" : "Save look"}
              </button>
              <p className={x.saveHint} data-unsaved={unsaved ? "true" : "false"}>
                {unsaved ? "You have changes that aren't saved yet." : "Your page already shows this look."}
              </p>
            </div>
            <StatusLine status={status} />
          </div>
        </div>
      </div>
    </fieldset>
  );
}

/** Photos and videos of the customer's work. Each upload or delete saves straight away. */
export function GallerySection({ media }: { media: DesignerMedia[] }) {
  const { status, busy, onFiles, run } = useMediaTools();
  const photos = media.filter((m) => m.kind === "photo").length;
  const videos = media.filter((m) => m.kind === "video").length;
  const id = SECTIONS.gallery.id;

  return (
    <fieldset className={ds.section} id={id}>
      <SectionHead
        title="Photos and videos"
        intro={
          <>
            Show off your work: up to {MAX_PHOTOS} photos ({photos} used) and {MAX_VIDEOS} videos of up to 50 MB each (
            {videos} used). MP4 videos play on every phone. They save as soon as you choose them.
          </>
        }
      />
      <div className={`${styles.ctaRow} ${ds.uploadRow}`}>
        <label
          className={`${styles.btn} ${styles.btnSmall} ${ds.tap}`}
          aria-disabled={photos >= MAX_PHOTOS || busy !== null}
        >
          {busy === "photo" ? "Uploading…" : "Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className={styles.fileInput}
            disabled={photos >= MAX_PHOTOS || busy !== null}
            onChange={(e) => onFiles("photo", e.target.files, e.target)}
          />
        </label>
        <label
          className={`${styles.btn} ${styles.btnSmall} ${ds.tap}`}
          aria-disabled={videos >= MAX_VIDEOS || busy !== null}
        >
          {busy === "video" ? "Uploading video…" : "Add a video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className={styles.fileInput}
            disabled={videos >= MAX_VIDEOS || busy !== null}
            onChange={(e) => onFiles("video", e.target.files, e.target)}
          />
        </label>
      </div>
      {media.length > 0 && (
        <ul className={`${styles.mediaGrid} ${ds.mediaList}`} aria-label="Your gallery">
          {media.map((m, i) => (
            <li key={m.id} className={styles.mediaItem}>
              {m.kind === "video" ? (
                <video src={m.url} muted playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- user upload
                <img src={m.url} alt="" loading="lazy" />
              )}
              <button
                type="button"
                className={ds.deleteMedia}
                aria-label={`Delete ${m.kind} ${i + 1}`}
                disabled={busy !== null}
                onClick={() =>
                  window.confirm(`Delete this ${m.kind} from your page?`) &&
                  run(`del-${m.id}`, () => deleteMedia(m.id), "Deleted.")
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <StatusLine status={status} />
    </fieldset>
  );
}
