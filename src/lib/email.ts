import "server-only";

/**
 * Sends an email through Resend (https://resend.com), or does nothing until RESEND_API_KEY is set,
 * so the site works the same without it. Returns whether the email was handed to Resend.
 * Never throws: an email problem must not break whatever triggered it (a payment, say).
 */
export async function sendEmail(opts: { to: string; subject: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("email skipped (RESEND_API_KEY not set):", opts.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Until tapfolio.co.uk is verified in Resend, its test sender can only email the account owner.
        from: process.env.EMAIL_FROM ?? "Tapfolio <onboarding@resend.dev>",
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("email failed:", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("email failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** The address that gets the shop's alerts: the first admin. */
export function ownerEmail(): string | null {
  return (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim() || null;
}
