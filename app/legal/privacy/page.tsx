import Link from "next/link";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto panel p-6 lg:p-8 space-y-4 text-sm text-fg-secondary">
      <header>
        <Link href="/" className="text-fg-muted hover:text-fg text-xs">← Back to markets</Link>
        <h1 className="text-2xl font-semibold text-fg mt-2">Privacy policy</h1>
        <p className="text-xs text-fg-muted">Last updated: 2026-07-13</p>
      </header>

      <section>
        <h2 className="text-base font-medium text-fg">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-fg">Account data</strong> — email and (if you use Google) your name and avatar, supplied by you and your OAuth provider via Supabase Auth.</li>
          <li><strong className="text-fg">App data</strong> — your watchlist, alerts, holdings, futures positions, and notes, all stored in our Supabase Postgres database tied to your user id.</li>
          <li><strong className="text-fg">Usage data</strong> — we log AI-insight requests (symbol, timestamp, approximate token count) for cost visibility and rate limiting.</li>
          <li><strong className="text-fg">Standard server logs</strong> — Vercel records request metadata (IP, user agent, path, status) for 30 days for security and debugging.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">What we do not collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>We do not place tracking cookies, advertising pixels, or analytics scripts.</li>
          <li>We do not sell your data. We do not share it with advertisers.</li>
          <li>We do not hold exchange API keys or any credentials that could move your money.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">How data is processed</h2>
        <p>
          All data is stored in Supabase (hosted on AWS) within the region you select at project creation. AI insights are generated server-side by Anthropic; we send the symbol, the last hour of price candles, and the current ticker — no user content, no account info, no PII. Email alerts are sent via Resend and include only the alert details.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Your rights</h2>
        <p>
          You can export or delete your data at any time. Use the account settings page (or email us). Deletion is final and propagates within 30 days.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Children</h2>
        <p>The service is not directed at children under 16. Do not sign up if you are under 16.</p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Changes</h2>
        <p>Material changes are announced on the site and via email.</p>
      </section>
    </article>
  );
}
