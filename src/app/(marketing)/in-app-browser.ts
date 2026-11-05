// Apps that open links in their own built-in browser, where Google refuses to
// sign anyone in ("disallowed_useragent"). Checked in order: Instagram and
// Messenger also carry Facebook's FBAN/FBAV markers.
const IN_APP_BROWSERS: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/MessengerForiOS|MessengerLite|Orca-Android|FB_IAB\/MESSENGER/i, "Messenger"],
  [/FBAN\/|FBAV\/|FB_IAB\/|FB4A|FBIOS|\[FB/i, "Facebook"],
  [/Barcelona/, "Threads"],
  [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
  [/LinkedInApp/i, "LinkedIn"],
  [/Snapchat/i, "Snapchat"],
];

export type InAppBrowser = { app: string; platform: "ios" | "android" | "other" };

/** The app whose built-in browser this is, or null for a normal browser. */
export function detectInAppBrowser(userAgent: string | null | undefined): InAppBrowser | null {
  if (!userAgent) return null;
  const match = IN_APP_BROWSERS.find(([pattern]) => pattern.test(userAgent));
  if (!match) return null;
  const platform = /iPhone|iPad|iPod/i.test(userAgent) ? "ios" : /Android/i.test(userAgent) ? "android" : "other";
  return { app: match[1], platform };
}
