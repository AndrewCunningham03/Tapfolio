// "Pick colours from my logo": finds the main brand colour in the customer's
// saved photo or logo and suggests a matching accent and background for a
// custom theme. Everything runs in the browser, on a small copy of the image.
//
// The colour maths (suggestFromPixels) is plain code with no browser calls, so
// it can be tested from node; only colourFromLogoUrl touches the DOM.

export type LogoColours = { accent: string; background: string };

export type LogoResult =
  | { ok: true; colours: LogoColours }
  // no-colour: the picture loaded but is black, white or grey. unreadable: the browser would not let us look at it.
  | { ok: false; reason: "no-colour" | "unreadable" };

// ---------------------------------------------------------------------------
// Colour helpers

type Rgb = [number, number, number];

const toHex = ([r, g, b]: Rgb) =>
  "#" +
  [r, g, b]
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const fromHex = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function luminance(hex: string): number {
  const [r, g, b] = fromHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------------------
// Finding the colour

/** Buttons and highlights need to stand out from the page by at least this much (WCAG's 3:1 for graphics). */
const MIN_CONTRAST = 3;

const HUE_BINS = 24; // 15 degrees each
const SHADES = 4; // saturation and brightness steps inside a hue
/** Pixels this dark, or this close to white or grey, are the logo's "paper" and "ink", not its colour. */
const MIN_BRIGHTNESS = 0.2;
const MIN_SATURATION = 0.28;
/** A colour must cover at least this share of the logo to count (so a stray speck is ignored). */
const MIN_COVERAGE = 0.015;

/**
 * The main colour in some RGBA pixels (as from canvas getImageData), or null if
 * there is no clear colour. Transparent, dark, white and grey pixels are
 * ignored. The most common hue wins; inside it, the most common shade, so
 * soft edges don't wash the result out.
 */
export function dominantColour(pixels: ArrayLike<number>): string | null {
  type Bucket = { n: number; r: number; g: number; b: number };
  const buckets: Bucket[][] = Array.from({ length: HUE_BINS }, () =>
    Array.from({ length: SHADES * SHADES }, () => ({ n: 0, r: 0, g: 0, b: 0 })),
  );
  const hueWeight = new Array<number>(HUE_BINS).fill(0);
  const hueCount = new Array<number>(HUE_BINS).fill(0);
  let opaque = 0;

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    opaque++;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const value = max / 255;
    const sat = max === 0 ? 0 : (max - min) / max;
    if (value < MIN_BRIGHTNESS || sat < MIN_SATURATION) continue;

    const [hue] = rgbToHsl([r, g, b]);
    const bin = Math.floor(hue / (360 / HUE_BINS)) % HUE_BINS;
    const shade =
      Math.min(SHADES - 1, Math.floor(((sat - MIN_SATURATION) / (1 - MIN_SATURATION)) * SHADES)) * SHADES +
      Math.min(SHADES - 1, Math.floor(((value - MIN_BRIGHTNESS) / (1 - MIN_BRIGHTNESS)) * SHADES));
    const bucket = buckets[bin][shade];
    bucket.n++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    // Vivid pixels count for more than faded ones.
    hueWeight[bin] += sat * (0.5 + 0.5 * value);
    hueCount[bin]++;
  }
  if (opaque === 0) return null;

  // Each hue also gets credit from its neighbours, so one colour split across two bins still wins.
  const near = (values: number[], h: number) =>
    values[h] + 0.5 * (values[(h + 1) % HUE_BINS] + values[(h + HUE_BINS - 1) % HUE_BINS]);
  let best = -1;
  let bestScore = 0;
  for (let h = 0; h < HUE_BINS; h++) {
    const score = near(hueWeight, h);
    if (score > bestScore) {
      best = h;
      bestScore = score;
    }
  }
  // Coverage counts pixels, not weight, so a dark brown logo on cream (few, dull pixels) still counts.
  if (best < 0 || near(hueCount, best) < opaque * MIN_COVERAGE) return null;

  const winner = buckets[best].reduce((a, b) => (b.n > a.n ? b : a));
  if (winner.n === 0) return null;
  return toHex([winner.r / winner.n, winner.g / winner.n, winner.b / winner.n]);
}

/**
 * Turn a logo colour into an accent and background that work together: a soft
 * tint of the colour behind it (or a deep shade if it is too light for that),
 * with the accent nudged darker or lighter until it clearly stands out. The
 * page then works out its text colours from the background, as for any theme.
 */
export function pairWithBackground(colour: string): LogoColours {
  const [hue, rawSat, rawLight] = rgbToHsl(fromHex(colour));
  const sat = Math.max(rawSat, 0.3);
  let light = Math.min(0.85, Math.max(0.12, rawLight)); // never pure white or black
  const make = (l: number) => toHex(hslToRgb(hue, sat, l));
  const tint = (l: number) => toHex(hslToRgb(hue, Math.min(Math.max(sat, 0.3), 0.55), l));

  const lightBg = tint(0.95);
  const darkBg = tint(0.09);
  let accent = make(light);

  // Prefer a light page; use a dark one when the colour is too bright to show up on it.
  let background = lightBg;
  if (contrastRatio(accent, lightBg) < MIN_CONTRAST && contrastRatio(accent, darkBg) > contrastRatio(accent, lightBg)) {
    background = darkBg;
  }

  const step = background === lightBg ? -0.02 : 0.02;
  for (let i = 0; i < 50 && contrastRatio(accent, background) < MIN_CONTRAST; i++) {
    light = Math.min(0.97, Math.max(0.03, light + step));
    accent = make(light);
  }
  return { accent, background };
}

/** Accent and background for some RGBA pixels, or null if the picture has no clear colour. */
export function suggestFromPixels(pixels: ArrayLike<number>): LogoColours | null {
  const colour = dominantColour(pixels);
  return colour ? pairWithBackground(colour) : null;
}

// ---------------------------------------------------------------------------
// In the browser

/** The picture is shrunk to about this many pixels on its longest side before it is read. Thin strokes need enough to keep their true colour. */
const SAMPLE_SIDE = 160;
const LOAD_TIMEOUT_MS = 15000;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Needed to read the pixels back: the storage bucket sends the matching CORS header.
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => reject(new Error("timeout")), LOAD_TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

/** The same address with a harmless extra parameter, so the browser asks again instead of reusing a copy loaded without CORS. */
function freshUrl(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set("tf-colours", "1");
    return u.toString();
  } catch {
    return url;
  }
}

function readPixels(img: HTMLImageElement): Uint8ClampedArray {
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (!longest) throw new Error("empty");
  const scale = Math.min(1, SAMPLE_SIDE / longest);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height).data; // throws if the canvas is tainted (no CORS)
}

/**
 * Suggest an accent and background from the picture at `url`. Never throws:
 * a picture we can't read gives { ok: false, reason: "unreadable" }.
 */
export async function colourFromLogoUrl(url: string): Promise<LogoResult> {
  // Two tries: as is, then with a fresh address (see freshUrl).
  for (const address of [url, freshUrl(url)]) {
    try {
      const pixels = readPixels(await loadImage(address));
      const colours = suggestFromPixels(pixels);
      return colours ? { ok: true, colours } : { ok: false, reason: "no-colour" };
    } catch {
      // try again, then give up quietly
    }
  }
  return { ok: false, reason: "unreadable" };
}
