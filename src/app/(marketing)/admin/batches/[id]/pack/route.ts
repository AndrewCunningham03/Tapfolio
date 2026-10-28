import { buildPack, packName } from "@/lib/supplier-pack";
import { attachment, loadBatch } from "../load";

// The zip to send the card supplier: spreadsheet, CSV, spec and artwork.
export async function GET(_req: Request, ctx: RouteContext<"/admin/batches/[id]/pack">) {
  const found = await loadBatch((await ctx.params).id);
  if ("error" in found) return found.error;
  return attachment(await buildPack(found.batch, found.cards), `${packName(found.batch)}.zip`, "application/zip");
}
