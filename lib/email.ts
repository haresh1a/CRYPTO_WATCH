// Resend email sender. Server-only. Gracefully no-ops when the
// key isn't configured so local dev never crashes — the route
// that uses this just logs the alert to the console instead.

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  if (!key || !from) {
    console.warn("[email] RESEND_API_KEY or ALERT_FROM_EMAIL not set; skipping send", { to: payload.to });
    return { ok: false, error: "email_not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function alertEmail(opts: {
  symbol: string;
  condition: "above" | "below" | "pct_change";
  threshold: number;
  price: number;
}): { subject: string; html: string; text: string } {
  const subj = `[CryptoWatch] ${opts.symbol} ${opts.condition} ${opts.threshold}`;
  const text =
    `Your ${opts.symbol} alert has triggered.\n\n` +
    `Condition: ${opts.condition} ${opts.threshold}\n` +
    `Current price: ${opts.price}\n\n` +
    `Manage your alerts: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://cryptowatch.app"}/alerts`;
  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#0a0e17;color:#e8eef7;padding:24px">
  <div style="max-width:560px;margin:auto;background:#10151f;border:1px solid #222b3b;border-radius:12px;padding:24px">
    <h1 style="margin:0 0 8px;font-size:20px">${opts.symbol} alert</h1>
    <p style="margin:0 0 16px;color:#b6c2d4">Condition: <strong>${opts.condition} ${opts.threshold}</strong></p>
    <p style="margin:0 0 16px">Current price: <strong>${opts.price}</strong></p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://cryptowatch.app"}/alerts"
       style="display:inline-block;background:#5b8cff;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">
       Manage alerts
    </a>
  </div>
</body></html>`;
  return { subject: subj, html, text };
}
