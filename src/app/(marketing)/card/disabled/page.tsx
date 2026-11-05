import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import { CardNotice, NoticeAside } from "../notice";

export const metadata: Metadata = { title: "Card deactivated", robots: { index: false } };

export default function DisabledCardPage() {
  return (
    <CardNotice title="This card has been deactivated" tone="off">
      <p>
        Its owner has switched this card off, usually because it was lost or replaced. If they gave you a newer card,
        tap that one instead.
      </p>
      <NoticeAside>
        <p>
          Switched off by mistake, or found it again? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and
          we&apos;ll turn it back on.
        </p>
      </NoticeAside>
    </CardNotice>
  );
}
