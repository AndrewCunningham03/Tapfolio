// Creates a batch of blank (unclaimed) cards and the spreadsheet the card
// supplier uses to program each chip and print each QR code.
//
//   npm run batch -- --qty 5 --material plastic --label "Samples" [--supplier "Name"]
//
// Writes batches/<date>-<material>-<label>.csv with: card_id, url, material.
// Each card works as soon as it is assigned to a customer in /admin; until
// then, tapping it shows "This card isn't set up yet".

import fs from "node:fs";
import path from "node:path";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Same rules as src/lib/ids.ts and src/lib/site.ts.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32: no I, L, O, U
const CARD_URL_BASE = "HTTPS://TAPFOLIO.CO.UK/C/";
const newCardId = () => Array.from({ length: 7 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

function args() {
  const out = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) out[argv[i].replace(/^--/, "")] = argv[i + 1];
  return out;
}

function env() {
  const file = path.join(root, ".env.local");
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  );
}

const { qty = "5", material = "plastic", label = "Batch", supplier = null } = args();
const quantity = Number(qty);
if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5000) throw new Error("--qty must be 1 to 5000");
if (!["plastic", "metal"].includes(material)) throw new Error("--material must be plastic or metal");
const tier = material === "metal" ? "platinum" : "standard";

const e = env();
const db = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const { data: batch, error: batchError } = await db
  .from("batches")
  .insert({ label: `${label} (${material})`, supplier, tier, quantity })
  .select("id")
  .single();
if (batchError) throw new Error(`Could not create the batch: ${batchError.message}`);

const ids = [];
while (ids.length < quantity) {
  const id = newCardId();
  const { error } = await db.from("cards").insert({ id, batch_id: batch.id, tier });
  if (!error) ids.push(id);
  else if (error.code !== "23505") throw new Error(`Could not create card: ${error.message}`); // 23505 = ID clash, try another
}

const date = new Date().toISOString().slice(0, 10);
const slug = `${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dir = path.join(root, "batches");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${date}-${material}-${slug}.csv`);
fs.writeFileSync(file, ["card_id,url,material", ...ids.map((id) => `${id},${CARD_URL_BASE}${id},${material}`)].join("\r\n") + "\r\n");

console.log(`Batch ${batch.id}: ${ids.length} ${material} cards → ${path.relative(root, file)}`);
ids.forEach((id) => console.log(`  ${CARD_URL_BASE}${id}`));
