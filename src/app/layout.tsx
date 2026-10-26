import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tapfolio · The metal business card customers can tap and pay",
    template: "%s · Tapfolio",
  },
  description:
    "A solid metal NFC business card. Tap it on any phone to share your details, save your number and take payment. Update it any time without reprinting.",
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
