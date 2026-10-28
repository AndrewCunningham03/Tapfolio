import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import type { BatchCard, BatchStock, Material } from "./batches";
import { CARD_URL_BASE } from "./site";

// Everything the card supplier needs for one batch: a spreadsheet with one row
// per card (its link goes on the chip and the QR code) plus the print artwork.
// The artwork lives in design/cards (see SPEC.md there) and is bundled with the
// download route via outputFileTracingIncludes in next.config.ts.

const ARTWORK = path.join(process.cwd(), "design", "cards");
const FONT = { name: "Arial", size: 11 };
const BOLD = { ...FONT, bold: true };
const thin = { style: "thin" as const, color: { argb: "FFBFBFBF" } };

export function packName(batch: BatchStock): string {
  const slug = batch.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `Tapfolio-batch-${batch.id}${slug ? `-${slug}` : ""}`;
}

function materials(cards: BatchCard[]): Material[] {
  return (["metal", "plastic"] as const).filter((m) => cards.some((c) => c.material === m));
}

function summary(cards: BatchCard[]): string {
  return materials(cards)
    .map((m) => `${cards.filter((c) => c.material === m).length} ${m}`)
    .join(" + ");
}

export async function buildSheet(batch: BatchStock, cards: BatchCard[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tapfolio";

  // One row per physical card. Headers match design/cards/SPEC.md.
  const sheet = wb.addWorksheet("Cards", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "card_id", key: "card_id", width: 12 },
    { header: "url", key: "url", width: 40 },
    { header: "material", key: "material", width: 12 },
    { header: "front_artwork", key: "front", width: 30 },
    { header: "back_artwork", key: "back", width: 30 },
  ];
  for (const c of cards) {
    sheet.addRow({
      card_id: c.id,
      url: `${CARD_URL_BASE}${c.id}`,
      material: c.material,
      front: `tapfolio-${c.material}-front.pdf`,
      back: `tapfolio-${c.material}-back.pdf`,
    });
  }
  sheet.eachRow((row, n) => {
    row.height = 20;
    row.eachCell((cell) => {
      cell.font = n === 1 ? { ...BOLD, color: { argb: "FFFFFFFF" } } : FONT;
      if (n === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3D2E" } };
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
      cell.numFmt = "@";
      cell.alignment = { vertical: "middle" };
    });
  });

  // What to do with each row.
  const how = wb.addWorksheet("Instructions");
  how.getColumn(1).width = 4;
  how.getColumn(2).width = 100;
  const lines: [string, string][] = [
    ["h", `Tapfolio card order: ${cards.length} cards (${summary(cards)})`],
    ["", `Batch ${batch.id}${batch.label ? `, "${batch.label}"` : ""}. Each row on the Cards sheet is one physical card with its own link.`],
    ["", ""],
    ["h", "For each card"],
    ["1", "NFC chip (NXP NTAG213): write the url as an NDEF URI record, then lock the chip (read-only)."],
    ["2", "QR code on the back: the same url, exactly as written (upper case keeps the code small)."],
    ["", "Error correction M. Size 18 x 18 mm. Top-left corner at x = 58.6 mm, y = 17.99 mm from the top-left of the trimmed card."],
    ["", "Plastic: print black (K100) on the white panel. Metal: leave the QR modules unengraved so the code reads dark on light."],
    ["3", "Artwork: use the front and back files named on the row (in the supplier pack, with Tapfolio-card-spec.txt)."],
    ["4", "Check: tap and scan each card. Both should open the same url and show \"This card isn't set up yet\"."],
    ["", "That is expected: Tapfolio links each card to its owner after delivery."],
    ["", ""],
    ["h", "Card"],
    ["", "CR80, 85.60 x 53.98 mm. Plastic: 0.76-0.84 mm PVC, matte. Metal: 0.8 mm matte black stainless steel with ferrite layer or chip window."],
    ["", "Full details, colours and positions: Tapfolio-card-spec.txt. Please send a digital proof before production."],
  ];
  lines.forEach(([tag, text], i) => {
    const row = how.getRow(i + 1);
    row.getCell(1).value = tag === "h" ? "" : tag;
    row.getCell(2).value = text;
    row.getCell(1).font = BOLD;
    row.getCell(2).font = tag === "h" ? { ...BOLD, size: i === 0 ? 14 : 12 } : FONT;
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function buildCsv(cards: BatchCard[]): string {
  return ["card_id,url,material", ...cards.map((c) => `${c.id},${CARD_URL_BASE}${c.id},${c.material}`)].join("\r\n") + "\r\n";
}

/** Zip of the spreadsheet, the same links as CSV, the spec, the proof and the artwork for the materials in this batch. */
export async function buildPack(batch: BatchStock, cards: BatchCard[]): Promise<Uint8Array> {
  const name = packName(batch);
  const zip = new JSZip();
  zip.file(`${name}-links.xlsx`, await buildSheet(batch, cards));
  zip.file(`${name}-links.csv`, buildCsv(cards));
  zip.file("Tapfolio-card-spec.txt", await readFile(path.join(ARTWORK, "SPEC.md")));
  zip.file("tapfolio-card-proof.png", await readFile(path.join(ARTWORK, "out", "proof.png")));
  for (const m of materials(cards)) {
    for (const side of ["front", "back"]) {
      for (const ext of ["pdf", "svg"]) {
        const file = `tapfolio-${m}-${side}.${ext}`;
        zip.file(file, await readFile(path.join(ARTWORK, "out", "print", file)));
      }
    }
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
