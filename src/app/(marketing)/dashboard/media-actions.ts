"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { getUser } from "@/lib/auth";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PHOTOS,
  MAX_VIDEO_BYTES,
  MAX_VIDEOS,
  VIDEO_TYPES,
  type UploadKind,
} from "@/lib/media-limits";
import { MEDIA_BUCKET, profileTag } from "@/lib/profiles";
import { normaliseTheme } from "@/lib/themes";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** The signed-in customer's own profile (row-level security guarantees ownership). */
async function ownProfile() {
  if (!(await getUser())) return null;
  const supabase = await getServerClient();
  const { data } = await supabase.from("profiles").select("id, slug, photo_path, cover_path").limit(1).maybeSingle();
  const db = getAdminClient();
  return data && db ? { profile: data, db } : null;
}

const fail = (message: string) => ({ ok: false as const, message });

/** Step 1: check the upload is allowed and hand the browser a one-time upload link. */
export async function requestUpload(kind: UploadKind, contentType: string, size: number): Promise<Result<{ path: string; token: string }>> {
  const own = await ownProfile();
  if (!own) return fail("Please sign in again.");
  const { profile, db } = own;

  const isVideo = kind === "video";
  if (!(isVideo ? VIDEO_TYPES : IMAGE_TYPES).includes(contentType)) {
    return fail(isVideo ? "Videos must be MP4, WebM or MOV." : "Images must be JPG, PNG or WebP.");
  }
  if (size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    return fail(isVideo ? "That video is over 50 MB. Try a shorter clip." : "That image is too large.");
  }

  if (kind === "photo" || kind === "video") {
    const { count } = await db.from("profile_media").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).eq("kind", kind);
    const max = kind === "photo" ? MAX_PHOTOS : MAX_VIDEOS;
    if ((count ?? 0) >= max) return fail(`You can have up to ${max} ${kind}s. Delete one to add another.`);
  }

  const path = `${profile.id}/${kind}/${randomUUID()}.${EXT[contentType]}`;
  const { data, error } = await db.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return fail("We couldn't start the upload. Please try again.");
  return { ok: true, path, token: data.token };
}

/** Step 2: after the browser uploads, attach the file to the profile. */
export async function finishUpload(kind: UploadKind, path: string, width?: number, height?: number): Promise<Result> {
  const own = await ownProfile();
  if (!own) return fail("Please sign in again.");
  const { profile, db } = own;
  if (!path.startsWith(`${profile.id}/${kind}/`)) return fail("That upload doesn't belong to you.");

  // Make sure the file really arrived.
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data: found } = await db.storage.from(MEDIA_BUCKET).list(folder, { search: name });
  if (!found?.some((f) => f.name === name)) return fail("The upload didn't finish. Please try again.");

  if (kind === "avatar" || kind === "cover") {
    const column = kind === "avatar" ? "photo_path" : "cover_path";
    const old = kind === "avatar" ? profile.photo_path : profile.cover_path;
    const { error } = await db.from("profiles").update({ [column]: path }).eq("id", profile.id);
    if (error) return fail("We couldn't save that image.");
    if (old) await db.storage.from(MEDIA_BUCKET).remove([old]);
  } else {
    const { data: last } = await db.from("profile_media").select("position").eq("profile_id", profile.id).order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("profile_media").insert({
      profile_id: profile.id,
      kind,
      path,
      width: width ? Math.round(width) : null,
      height: height ? Math.round(height) : null,
      position: (last?.position ?? -1) + 1,
    });
    if (error) {
      await db.storage.from(MEDIA_BUCKET).remove([path]);
      return fail("We couldn't add that to your gallery.");
    }
  }
  updateTag(profileTag(profile.slug));
  return { ok: true };
}

export async function deleteMedia(id: number): Promise<Result> {
  const own = await ownProfile();
  if (!own) return fail("Please sign in again.");
  const { profile, db } = own;
  const { data: item } = await db.from("profile_media").select("id, path").eq("id", id).eq("profile_id", profile.id).maybeSingle();
  if (!item) return fail("That item wasn't found.");
  await db.from("profile_media").delete().eq("id", item.id);
  await db.storage.from(MEDIA_BUCKET).remove([item.path]);
  updateTag(profileTag(profile.slug));
  return { ok: true };
}

export async function removeImage(kind: "avatar" | "cover"): Promise<Result> {
  const own = await ownProfile();
  if (!own) return fail("Please sign in again.");
  const { profile, db } = own;
  const old = kind === "avatar" ? profile.photo_path : profile.cover_path;
  await db.from("profiles").update({ [kind === "avatar" ? "photo_path" : "cover_path"]: null }).eq("id", profile.id);
  if (old) await db.storage.from(MEDIA_BUCKET).remove([old]);
  updateTag(profileTag(profile.slug));
  return { ok: true };
}

export async function saveTheme(raw: unknown): Promise<Result> {
  if (!(await getUser())) return fail("Please sign in again.");
  const supabase = await getServerClient();
  const { data: profile } = await supabase.from("profiles").select("id, slug").limit(1).maybeSingle();
  if (!profile) return fail("We couldn't find your profile.");
  // Runs as the customer: row-level security and column grants apply.
  const { error } = await supabase.from("profiles").update({ theme: normaliseTheme(raw) }).eq("id", profile.id);
  if (error) return fail("We couldn't save your colours.");
  updateTag(profileTag(profile.slug));
  return { ok: true };
}
