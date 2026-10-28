import "server-only";
import { getUser, isAdmin } from "@/lib/auth";
import { getBatch } from "@/lib/batches";
import { getAdminClient } from "@/lib/supabase/admin";

/** The batch for a download route, or the error response to send instead. */
export async function loadBatch(rawId: string) {
  if (!isAdmin(await getUser())) return { error: new Response("Not allowed.", { status: 403 }) };
  const db = getAdminClient();
  if (!db) return { error: new Response("Supabase is not configured.", { status: 500 }) };

  const id = Number(rawId);
  const found = Number.isInteger(id) && id > 0 ? await getBatch(db, id) : null;
  if (!found) return { error: new Response("No such batch.", { status: 404 }) };
  return found;
}

export function attachment(body: Uint8Array, filename: string, type: string): Response {
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
