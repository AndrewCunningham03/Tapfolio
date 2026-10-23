// Generates Tapfolio card artwork.
//
//   npm run build
//
// out/print/    files for the supplier: vector PDF (CMYK) + SVG, text outlined
// out/preview/  PNG previews with a sample QR code
// out/proof.png all four sides on one sheet
//
// All coordinates are millimetres from the top-left corner of the trimmed card.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as opentypeNs from "opentype.js";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import { Resvg } from "@resvg/resvg-js";
import QRCode from "qrcode";

const opentype = opentypeNs.default ?? opentypeNs;
const here = path.dirname(fileURLToPath(import.meta.url));
const out = (...p) => path.join(here, "out", ...p);

// ---------------------------------------------------------------------------
// Fonts: Manrope (SIL Open Font License), converted to outlines.
// ---------------------------------------------------------------------------
function loadFont(weight) {
  const file = path.join(here, "node_modules/@expo-google-fonts/manrope", weight, `Manrope_${weight}.ttf`);
  const buf = fs.readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}
const FONT = {
  extrabold: loadFont("800ExtraBold"),
  bold: loadFont("700Bold"),
  semibold: loadFont("600SemiBold"),
  medium: loadFont("500Medium"),
};

// ---------------------------------------------------------------------------
// Geometry: ISO/IEC 7810 ID-1 (CR80), the size of a bank card.
// ---------------------------------------------------------------------------
const TRIM = { w: 85.6, h: 53.98, r: 3.18 };
const BLEED = 3; // printed cards: background runs 3 mm past the trim
const MARGIN = 6; // text and logos stay at least this far inside the trim

// QR panel on the back. The supplier prints a different QR in it for every card.
const PANEL = { size: 24, r: 2.2, x: TRIM.w - MARGIN - 24, y: (TRIM.h - 24) / 2 };
const QR = { size: 18, x: PANEL.x + 3, y: PANEL.y + 3 };

const SAMPLE_URL = "HTTPS://TAPFOLIO.CO.UK/C/7KQ2XMP";

// ---------------------------------------------------------------------------
// Colours: screen value → print CMYK. CMYK values are starting points; match
// them to the supplier's printed proof.
// ---------------------------------------------------------------------------
const C = {
  ink: { hex: "#0B1F17", cmyk: [80, 30, 65, 80] }, // card background
  wave: { hex: "#163A2A", cmyk: [80, 25, 65, 60] }, // background pattern
  yellow: { hex: "#FACC15", cmyk: [0, 20, 95, 0] },
  paper: { hex: "#F4F7F5", cmyk: [3, 0, 3, 0] },
  platinum: { hex: "#C9CED6", cmyk: [20, 12, 8, 0] },
  white: { hex: "#FFFFFF", cmyk: [0, 0, 0, 0] },
  black: { hex: "#000000", cmyk: [0, 0, 0, 100] }, // QR modules; "engrave" on metal
};

// Metal card preview only: black stainless steel and the brighter laser-engraved metal.
const STEEL = "#1D1F22";
const ENGRAVED = "#BFC4CA";

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
const n = (v) => +v.toFixed(3);

function measure(font, str, size, tracking = 0) {
  const glyphs = font.stringToGlyphs(str);
  const s = size / font.unitsPerEm;
  let w = 0;
  glyphs.forEach((g, i) => {
    w += g.advanceWidth * s;
    if (i < glyphs.length - 1) w += font.getKerningValue(g, glyphs[i + 1]) * s + tracking * size;
  });
  return w;
}

/** Text as outlined paths. `y` is the baseline; `tracking` is in em. */
function text(str, { font, size, x, y, fill, anchor = "start", tracking = 0 }) {
  const width = measure(font, str, size, tracking);
  let cx = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
  const glyphs = font.stringToGlyphs(str);
  const s = size / font.unitsPerEm;
  let d = "";
  glyphs.forEach((g, i) => {
    d += g.getPath(cx, y, size).toPathData(3);
    cx += g.advanceWidth * s;
    if (i < glyphs.length - 1) cx += font.getKerningValue(g, glyphs[i + 1]) * s + tracking * size;
  });
  return `<path d="${d}" fill="${fill}"/>`;
}

function wordmark({ x, y, size, tap, folio }) {
  const font = FONT.extrabold;
  const tapWidth = measure(font, "Tap", size);
  return (
    text("Tap", { font, size, x, y, fill: tap }) +
    text("folio", { font, size, x: x + tapWidth - 0.02 * size, y, fill: folio })
  );
}

/** The three-arc contactless symbol. (x, y) is the top-left of its 24-unit box. */
function contactless({ x, y, height, color, weight = 2 }) {
  return (
    `<g transform="translate(${n(x)} ${n(y)}) scale(${n(height / 24)})" fill="none" stroke="${color}" ` +
    `stroke-width="${weight}" stroke-linecap="round">` +
    `<path d="M6 8.5a6 6 0 0 1 0 7"/><path d="M10 6a10 10 0 0 1 0 12"/><path d="M14 3.5a14 14 0 0 1 0 17"/></g>`
  );
}

/** Concentric arcs opening to the right, like a contactless signal. */
function waves({ cx, cy, radii, sweep, width, color }) {
  const a = (sweep * Math.PI) / 180;
  return radii
    .map((r, i) => {
      const stroke = typeof color === "function" ? color(i) : color;
      const [x1, y1] = [cx + r * Math.cos(-a), cy + r * Math.sin(-a)];
      const [x2, y2] = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      return `<path d="M${n(x1)} ${n(y1)}A${r} ${r} 0 0 1 ${n(x2)} ${n(y2)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
    })
    .join("");
}

function rect({ x, y, w, h, r = 0, fill }) {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}" fill="${fill}"/>`;
}

function qrCode(url, { x, y, size, fill }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const m = size / count;
  let d = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.modules.get(row, col)) d += `M${n(x + col * m)} ${n(y + row * m)}h${n(m)}v${n(m)}h${n(-m)}z`;
    }
  }
  return `<path d="${d}" fill="${fill}" shape-rendering="crispEdges"/>`;
}

// ---------------------------------------------------------------------------
// Designs. Each returns SVG markup in trim coordinates.
// `sample` adds a sample QR code (previews only; print files leave it to the supplier).
// ---------------------------------------------------------------------------

const BODY_SIZE = 2.3; // ≈ 6.5 pt, the smallest text on the card

function backCopy({ heading, body, icon, tap, folio }) {
  return (
    contactless({ x: MARGIN - 1.5, y: 9, height: 7, color: icon, weight: 2.2 }) +
    text("Tap or scan", { font: FONT.bold, size: 4.4, x: MARGIN, y: 24.5, fill: heading }) +
    text("Hold near the top of a phone,", { font: FONT.medium, size: BODY_SIZE, x: MARGIN, y: 30, fill: body }) +
    text("or scan the code with the camera.", { font: FONT.medium, size: BODY_SIZE, x: MARGIN, y: 33.6, fill: body }) +
    wordmark({ x: MARGIN, y: TRIM.h - 7, size: 3.4, tap, folio })
  );
}

const DESIGNS = {
  "plastic-front": {
    label: "Plastic · front",
    material: "plastic",
    draw: () =>
      rect({ x: -BLEED, y: -BLEED, w: TRIM.w + 2 * BLEED, h: TRIM.h + 2 * BLEED, fill: C.ink.hex }) +
      waves({
        cx: 50,
        cy: TRIM.h / 2,
        radii: [9, 16, 23, 30, 37, 44],
        sweep: 58,
        width: 2.4,
        color: (i) => (i === 0 ? C.yellow.hex : C.wave.hex),
      }) +
      text("TAP TO CONNECT", { font: FONT.semibold, size: 2.1, x: MARGIN, y: 10, fill: C.platinum.hex, tracking: 0.2 }) +
      wordmark({ x: MARGIN, y: TRIM.h - 7, size: 6.4, tap: C.paper.hex, folio: C.yellow.hex }),
  },

  "plastic-back": {
    label: "Plastic · back",
    material: "plastic",
    draw: ({ sample }) =>
      rect({ x: -BLEED, y: -BLEED, w: TRIM.w + 2 * BLEED, h: TRIM.h + 2 * BLEED, fill: C.ink.hex }) +
      backCopy({ heading: C.paper.hex, body: C.platinum.hex, icon: C.yellow.hex, tap: C.paper.hex, folio: C.yellow.hex }) +
      rect({ x: PANEL.x, y: PANEL.y, w: PANEL.size, h: PANEL.size, r: PANEL.r, fill: C.white.hex }) +
      (sample ? qrCode(SAMPLE_URL, { ...QR, fill: C.black.hex }) : ""),
  },

  // Metal: black = laser-engraved. No background and no bleed; the steel is the background.
  "metal-front": {
    label: "Metal · front",
    material: "metal",
    draw: () =>
      waves({ cx: 50, cy: TRIM.h / 2, radii: [9, 13, 17, 21, 25, 29, 33, 37, 41, 45], sweep: 58, width: 0.3, color: C.black.hex }) +
      text("PLATINUM", { font: FONT.semibold, size: 2.1, x: MARGIN, y: 10, fill: C.black.hex, tracking: 0.3 }) +
      wordmark({ x: MARGIN, y: TRIM.h - 7, size: 6.4, tap: C.black.hex, folio: C.black.hex }),
  },

  "metal-back": {
    label: "Metal · back",
    material: "metal",
    // The QR panel is engraved solid (bright); the QR modules are left unengraved
    // (dark), so phones read dark-on-light like a printed code.
    draw: ({ sample }) =>
      backCopy({ heading: C.black.hex, body: C.black.hex, icon: C.black.hex, tap: C.black.hex, folio: C.black.hex }) +
      rect({ x: PANEL.x, y: PANEL.y, w: PANEL.size, h: PANEL.size, r: PANEL.r, fill: C.black.hex }) +
      (sample ? qrCode(SAMPLE_URL, { ...QR, fill: C.white.hex }) : ""),
  },
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function svgDoc(width, height, body) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(width)}mm" height="${n(height)}mm" ` +
    `viewBox="0 0 ${n(width)} ${n(height)}">${body}</svg>`
  );
}

/** Print file: plastic includes bleed; metal is exactly trim size. */
function printSvg(design) {
  const bleed = design.material === "plastic" ? BLEED : 0;
  return svgDoc(TRIM.w + 2 * bleed, TRIM.h + 2 * bleed, `<g transform="translate(${bleed} ${bleed})">${design.draw({ sample: false })}</g>`);
}

/** Preview: trimmed with rounded corners, sample QR, metal shown as steel. */
function previewBody(design, id) {
  let art = design.draw({ sample: true });
  if (design.material === "metal") {
    art = rect({ x: 0, y: 0, w: TRIM.w, h: TRIM.h, fill: STEEL }) + art.replaceAll(C.black.hex, ENGRAVED).replaceAll(C.white.hex, STEEL);
  }
  return (
    `<clipPath id="clip-${id}"><rect width="${TRIM.w}" height="${TRIM.h}" rx="${TRIM.r}"/></clipPath>` +
    `<g clip-path="url(#clip-${id})">${art}</g>`
  );
}

const toPt = (mm) => (mm * 72) / 25.4;

function cmykFor([rgb, opacity]) {
  const hex = "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
  const match = Object.values(C).find((c) => c.hex.toUpperCase() === hex);
  if (!match) throw new Error(`No CMYK value defined for ${hex}`);
  return [match.cmyk, opacity];
}

function writePdf(svg, widthMm, heightMm, file, title) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: [toPt(widthMm), toPt(heightMm)],
      margin: 0,
      info: { Title: title, Author: "Tapfolio", Subject: "Card artwork" },
    });
    const stream = fs.createWriteStream(file);
    doc.pipe(stream);
    SVGtoPDF(doc, svg, 0, 0, { width: toPt(widthMm), height: toPt(heightMm), colorCallback: cmykFor });
    doc.end();
    stream.on("finish", resolve);
  });
}

function writePng(svg, file, width) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false } }).render().asPng();
  fs.writeFileSync(file, png);
}

function proofSheet() {
  const pad = 10;
  const labelH = 9;
  const gap = 10;
  const ids = Object.keys(DESIGNS);
  const W = pad * 2 + TRIM.w * 2 + gap;
  const H = pad * 2 + (labelH + TRIM.h) * 2 + gap + 12;
  let body = rect({ x: 0, y: 0, w: W, h: H, fill: "#EEF1EF" });
  ids.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pad + col * (TRIM.w + gap);
    const y = pad + row * (labelH + TRIM.h + gap);
    body += text(DESIGNS[id].label, { font: FONT.semibold, size: 3.2, x, y: y + 5, fill: "#0B1F17" });
    body += `<g transform="translate(${x} ${y + labelH})">${previewBody(DESIGNS[id], id)}</g>`;
  });
  body += text(`Sample QR shown: ${SAMPLE_URL}. Every card gets its own code.`, {
    font: FONT.medium,
    size: 2.6,
    x: pad,
    y: H - pad + 2,
    fill: "#5B6B63",
  });
  return svgDoc(W, H, body);
}

fs.mkdirSync(out("print"), { recursive: true });
fs.mkdirSync(out("preview"), { recursive: true });

for (const [id, design] of Object.entries(DESIGNS)) {
  const svg = printSvg(design);
  const bleed = design.material === "plastic" ? BLEED : 0;
  fs.writeFileSync(out("print", `tapfolio-${id}.svg`), svg);
  await writePdf(svg, TRIM.w + 2 * bleed, TRIM.h + 2 * bleed, out("print", `tapfolio-${id}.pdf`), `Tapfolio ${design.label}`);
  writePng(svgDoc(TRIM.w, TRIM.h, previewBody(design, id)), out("preview", `tapfolio-${id}.png`), 1600);
  console.log(`✓ ${id}`);
}
writePng(proofSheet(), out("proof.png"), 2400);
console.log("✓ proof.png");
