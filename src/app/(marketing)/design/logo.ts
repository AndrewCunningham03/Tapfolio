// Browser-side logo handling for the card designer. A laser engraves one
// colour, so a logo becomes a mask: marks are engraved, everything else is
// bare metal.

const MAX_SIDE = 1200; // px; plenty for a ~50 mm wide engraving
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // what we accept from the user, before shrinking

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file isn't an image we can read.")); };
    img.src = url;
  });
}

/** The logo scaled down to at most MAX_SIDE, as a canvas. */
export async function loadLogo(file: File): Promise<HTMLCanvasElement> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Please upload a PNG, JPG or WebP image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That image is over 8 MB. Please use a smaller one.");
  const img = await readImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * One-colour mask of the logo, cropped to its marks. Dark marks on a light
 * background are engraved; `invert` engraves the light parts instead.
 */
export function makeMask(source: HTMLCanvasElement, invert: boolean): HTMLCanvasElement | null {
  const { width, height } = source;
  const data = source.getContext("2d")!.getImageData(0, 0, width, height);
  const px = data.data;
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let i = 0; i < px.length; i += 4) {
    const luminance = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const visible = px[i + 3] > 128;
    const mark = visible && (invert ? luminance >= 160 : luminance < 160);
    px[i] = px[i + 1] = px[i + 2] = 0;
    px[i + 3] = mark ? 255 : 0;
    if (mark) {
      const p = i / 4, x = p % width, y = (p - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null; // nothing to engrave

  const full = document.createElement("canvas");
  full.width = width;
  full.height = height;
  full.getContext("2d")!.putImageData(data, 0, 0);

  const cropped = document.createElement("canvas");
  cropped.width = maxX - minX + 1;
  cropped.height = maxY - minY + 1;
  cropped.getContext("2d")!.drawImage(full, -minX, -minY);
  return cropped;
}

/** The mask filled with the engraving colour of the chosen metal, as a data URL. */
export function tint(mask: HTMLCanvasElement, color: string): string {
  const out = document.createElement("canvas");
  out.width = mask.width;
  out.height = mask.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

/** The scaled-down original, for upload (production makes its own mask from it). */
export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not prepare the logo."))), "image/png"),
  );
}
