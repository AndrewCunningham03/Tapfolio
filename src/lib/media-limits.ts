// Upload rules for profile photos and videos, shared by the dashboard (to
// check before uploading) and the server (which enforces them).

export type UploadKind = "avatar" | "cover" | "photo" | "video";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const MAX_PHOTOS = 12;
export const MAX_VIDEOS = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // after shrinking in the browser, photos are far smaller
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // Supabase free-plan limit per file

/** Longest side, in pixels, that images are shrunk to before upload. */
export const IMAGE_MAX_SIDE: Record<Exclude<UploadKind, "video">, number> = {
  avatar: 600,
  cover: 1600,
  photo: 1600,
};
