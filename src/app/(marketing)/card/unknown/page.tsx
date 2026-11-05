import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import { CardNotice, NoticeAside } from "../notice";

export const metadata: Metadata = { title: "Card not found", robots: { index: false } };

export default function UnknownCardPage() {
  return (
    <CardNotice title="We couldn't find that card" tone="unknown">
      <p>
        The link on this card doesn&apos;t match any Tapfolio card. If you typed it in, check it and try again, or ask
        the person who gave you the card for their details.
      </p>
      <NoticeAside title="Bought this card from us?">
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&apos;ll get it working.
        </p>
      </NoticeAside>
    </CardNotice>
  );
}
