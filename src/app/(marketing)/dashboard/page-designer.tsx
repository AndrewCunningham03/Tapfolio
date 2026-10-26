"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { IMAGE_MAX_SIDE, IMAGE_TYPES, MAX_PHOTOS, MAX_VIDEO_BYTES, MAX_VIDEOS, VIDEO_TYPES, type UploadKind } from "@/lib/media-limits";
import { THEME_PRESETS, themeVars, type PresetId, type ThemeChoice } from "@/lib/themes";
import { deleteMedia, finishUpload, removeImage, requestUpload, saveTheme } from "./media-actions";
import styles from "../marketing.module.css";

export type DesignerMedia = { id: number; kind: "photo" | "video"; url: string };

const BUCKET = "profile-media";

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

export function PageDesigner(props: {
  theme: ThemeChoice;
  photoUrl?: string;
  coverUrl?: string;
  media: DesignerMedia[];
  name: string;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeChoice>(props.theme);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const storage = useMemo(
    () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!).storage.from(BUCKET),
    [],
  );

  const photos = props.media.filter((m) => m.kind === "photo").length;
  const videos = props.media.filter((m) => m.kind === "video").length;
  const done = (message: string) => {
    setStatus({ ok: true, message });
    startRefresh(() => router.refresh());
  };

  async function upload(kind: UploadKind, file: File) {
    let body: Blob = file;
    let type = file.type;
    let width: number | undefined;
    let height: number | undefined;
    if (kind !== "video") {
      if (!IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/")) throw new Error("Please choose a photo (JPG, PNG or WebP).");
      ({ blob: body, width, height } = await shrinkImage(file, IMAGE_MAX_SIDE[kind]));
      type = "image/jpeg";
    } else {
      if (!VIDEO_TYPES.includes(file.type)) throw new Error("Videos must be MP4, WebM or MOV.");
      if (file.size > MAX_VIDEO_BYTES) throw new Error("That video is over 50 MB. Try a shorter clip.");
    }

    const ticket = await requestUpload(kind, type, body.size);
    if (!ticket.ok) throw new Error(ticket.message);
    const { error } = await storage.uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: type });
    if (error) throw new Error("The upload failed. Please check your connection and try again.");
    const result = await finishUpload(kind, ticket.path, width, height);
    if (!result.ok) throw new Error(result.message);
  }

  async function onFiles(kind: UploadKind, files: FileList | null, input: HTMLInputElement) {
    if (!files?.length) return;
    setStatus(null);
    setBusy(kind);
    try {
      for (const file of Array.from(files)) await upload(kind, file);
      done(kind === "avatar" ? "Profile photo updated." : kind === "cover" ? "Cover photo updated." : "Added to your gallery.");
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
    const result = await fn();
    setBusy(null);
    if (result.ok) done(success);
    else setStatus({ ok: false, message: result.message ?? "Something went wrong." });
  }

  const preview = themeVars(theme) as React.CSSProperties;

  return (
    <div className={styles.designForm}>
      <fieldset>
        <legend>Colours</legend>
        <div className={styles.themeGrid}>
          <div className={styles.swatches} role="radiogroup" aria-label="Theme">
            {(Object.keys(THEME_PRESETS) as PresetId[]).map((id) => {
              const p = THEME_PRESETS[id];
              return (
                <label key={id} className={styles.swatch} data-checked={theme.preset === id}>
                  <input type="radio" name="theme" checked={theme.preset === id} onChange={() => setTheme({ preset: id })} />
                  <span className={styles.swatchChip} style={{ background: `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50%)` }} />
                  <span className={styles.swatchLabel}>{p.label}</span>
                </label>
              );
            })}
            <label className={styles.swatch} data-checked={theme.preset === "custom"}>
              <input type="radio" name="theme" checked={theme.preset === "custom"} onChange={() => setTheme({ preset: "custom", background: theme.background ?? "#ffffff", accent: theme.accent })} />
              <span className={styles.swatchChip} style={{ background: "conic-gradient(#f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #f43f5e)" }} />
              <span className={styles.swatchLabel}>Custom</span>
            </label>
          </div>

          <div className={styles.miniPreview} style={preview} aria-label="Preview of your colours">
            <div className={styles.miniBanner} />
            <div className={styles.miniAvatar} />
            <strong>{props.name}</strong>
            <span>Save contact</span>
            <i />
            <i />
          </div>
        </div>

        <div className={styles.colourRow}>
          {theme.preset === "custom" && (
            <label>
              Background
              <input type="color" value={theme.background ?? "#ffffff"} onChange={(e) => setTheme({ ...theme, background: e.target.value })} />
            </label>
          )}
          <label>
            Buttons and highlights
            <input
              type="color"
              value={theme.accent ?? (theme.preset === "custom" ? "#178046" : THEME_PRESETS[theme.preset].accent)}
              onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
            />
          </label>
          {theme.accent && (
            <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`} onClick={() => setTheme({ ...theme, accent: undefined })}>
              Reset button colour
            </button>
          )}
          <button type="button" className={styles.btn} disabled={busy !== null} onClick={() => run("theme", () => saveTheme(theme), "Colours saved. Your card shows them now.")}>
            {busy === "theme" ? "Saving…" : "Save colours"}
          </button>
        </div>
        <p className={styles.fieldHint}>Text colours adjust automatically so your page is always easy to read.</p>
      </fieldset>

      <fieldset>
        <legend>Profile and cover photo</legend>
        <div className={styles.imageSlots}>
          <div className={styles.imageSlot}>
            <div className={`${styles.slotPreview} ${styles.slotRound}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
              {props.photoUrl ? <img src={props.photoUrl} alt="Your profile photo" /> : <span>No photo</span>}
            </div>
            <label className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`}>
              {busy === "avatar" ? "Uploading…" : props.photoUrl ? "Change photo or logo" : "Add photo or logo"}
              <input type="file" accept="image/*" hidden disabled={busy !== null} onChange={(e) => onFiles("avatar", e.target.files, e.target)} />
            </label>
            {props.photoUrl && (
              <button type="button" className={styles.linkButton} onClick={() => run("avatar-remove", () => removeImage("avatar"), "Profile photo removed.")}>
                Remove
              </button>
            )}
          </div>
          <div className={styles.imageSlot}>
            <div className={`${styles.slotPreview} ${styles.slotWide}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
              {props.coverUrl ? <img src={props.coverUrl} alt="Your cover photo" /> : <span>No cover photo</span>}
            </div>
            <label className={`${styles.btn} ${styles.ghost} ${styles.btnSmall}`}>
              {busy === "cover" ? "Uploading…" : props.coverUrl ? "Change cover photo" : "Add cover photo"}
              <input type="file" accept="image/*" hidden disabled={busy !== null} onChange={(e) => onFiles("cover", e.target.files, e.target)} />
            </label>
            {props.coverUrl && (
              <button type="button" className={styles.linkButton} onClick={() => run("cover-remove", () => removeImage("cover"), "Cover photo removed.")}>
                Remove
              </button>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Photos and videos</legend>
        <p className={styles.fieldHint}>
          Show off your work: up to {MAX_PHOTOS} photos ({photos} used) and {MAX_VIDEOS} videos of up to 50 MB each ({videos} used).
          MP4 videos play on every phone.
        </p>
        <div className={styles.ctaRow} style={{ marginTop: 12 }}>
          <label className={`${styles.btn} ${styles.btnSmall}`} aria-disabled={photos >= MAX_PHOTOS || busy !== null}>
            {busy === "photo" ? "Uploading…" : "Add photos"}
            <input type="file" accept="image/*" multiple hidden disabled={photos >= MAX_PHOTOS || busy !== null} onChange={(e) => onFiles("photo", e.target.files, e.target)} />
          </label>
          <label className={`${styles.btn} ${styles.btnSmall}`} aria-disabled={videos >= MAX_VIDEOS || busy !== null}>
            {busy === "video" ? "Uploading video…" : "Add a video"}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" hidden disabled={videos >= MAX_VIDEOS || busy !== null} onChange={(e) => onFiles("video", e.target.files, e.target)} />
          </label>
        </div>
        {props.media.length > 0 && (
          <div className={styles.mediaGrid}>
            {props.media.map((m) => (
              <div key={m.id} className={styles.mediaItem}>
                {m.kind === "video" ? (
                  <video src={m.url} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- user upload
                  <img src={m.url} alt="" loading="lazy" />
                )}
                <button type="button" aria-label={`Delete this ${m.kind}`} disabled={busy !== null} onClick={() => run(`del-${m.id}`, () => deleteMedia(m.id), "Deleted.")}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {status && (
        <p className={`${styles.notice} ${status.ok ? styles.thanks : styles.formError}`} role={status.ok ? "status" : "alert"}>
          {status.message}
        </p>
      )}
    </div>
  );
}
