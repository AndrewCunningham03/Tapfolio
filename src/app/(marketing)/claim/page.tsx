import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { addressLines } from "@/lib/address";
import { isCardId, normalise } from "@/lib/ids";
import type { ShippingDetails } from "@/lib/orders";
import { CONTACT_EMAIL } from "@/lib/site";
import { getAdminClient } from "@/lib/supabase/admin";
import { CardNotice, NoticeAside } from "../card/notice";
import { AssignPanel, type WaitingOrder } from "./assign-panel";

export const metadata: Metadata = { title: "Card not set up yet", robots: { index: false } };

// Unclaimed cards land here. A visitor just sees that the card isn't set up yet; when the
// owner scans a card with their phone, they get the paid orders waiting for one, with an Assign button.
export default function ClaimPage({ searchParams }: PageProps<"/claim">) {
  return (
    <CardNotice title="This card isn't set up yet" tone="setup">
      <Suspense fallback={<Visitor />}>
        {searchParams.then((p) => (
          <Scanned card={String(p.card ?? "")} />
        ))}
      </Suspense>
    </CardNotice>
  );
}

function Visitor() {
  return (
    <>
      <p>
        This Tapfolio card is new and hasn&apos;t been linked to anyone&apos;s page yet. If someone has just given it to
        you, ask them for their details for now.
      </p>
      <NoticeAside>
        <p>
          We&apos;re getting it ready, and it will open your page as soon as it&apos;s linked. Any questions, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </NoticeAside>
    </>
  );
}

async function Scanned({ card }: { card: string }) {
  await connection(); // depends on who is looking
  const cardId = normalise(card);
  const db = getAdminClient();
  if (!db || !isCardId(cardId) || !isAdmin(await getUser())) return <Visitor />;

  const { data: found } = await db
    .from("cards")
    .select("id, status")
    .eq("id", cardId)
    .maybeSingle<{ id: string; status: string }>();
  if (!found) return <p>Card {cardId} isn&apos;t in your stock.</p>;
  if (found.status !== "unclaimed")
    return (
      <p>
        Card {cardId} is already {found.status}. It can&apos;t be assigned again.
      </p>
    );

  const { data } = await db
    .from("card_orders")
    .select("id, name, email, country, created_at, shipping_address")
    .eq("status", "paid")
    .is("card_id", null)
    .order("created_at", { ascending: true })
    .limit(10)
    .returns<
      {
        id: number;
        name: string;
        email: string;
        country: string;
        created_at: string;
        shipping_address: ShippingDetails | null;
      }[]
    >();

  const orders: WaitingOrder[] = (data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    email: o.email,
    ordered: new Date(o.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Europe/London",
    }),
    address: addressLines(o),
  }));
  return <AssignPanel cardId={cardId} orders={orders} />;
}
