import { buildSheet, packName } from "@/lib/supplier-pack";
import { attachment, loadBatch } from "../load";

// Just the spreadsheet of links, for when the supplier already has the artwork.
export async function GET(_req: Request, ctx: RouteContext<"/admin/batches/[id]/sheet">) {
  const found = await loadBatch((await ctx.params).id);
  if ("error" in found) return found.error;
  return attachment(
    await buildSheet(found.batch, found.cards),
    `${packName(found.batch)}-links.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
