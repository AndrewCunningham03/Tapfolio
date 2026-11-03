import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tapfolio · A business card that opens your own page",
    template: "%s · Tapfolio",
  },
  description:
    "An NFC and QR business card for the UK and Ireland. Customers tap or scan it to save your contact, call you or pay you. Update your page any time without reprinting.",
  openGraph: { siteName: "Tapfolio", type: "website" },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
