import Link from "next/link";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <article className="prose-like max-w-3xl mx-auto panel p-6 lg:p-8 space-y-4 text-sm text-fg-secondary">
      <header>
        <Link href="/" className="text-fg-muted hover:text-fg text-xs">← Back to markets</Link>
        <h1 className="text-2xl font-semibold text-fg mt-2">Terms of service</h1>
        <p className="text-xs text-fg-muted">Last updated: 2026-07-13</p>
      </header>

      <section>
        <h2 className="text-base font-medium text-fg">1. Acceptance</h2>
        <p>By accessing CryptoWatch Pro you agree to these terms. If you don&apos;t, don&apos;t use the service.</p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">2. Service description</h2>
        <p>
          CryptoWatch Pro is a tracking and analysis tool for cryptocurrency markets. It displays public market data, lets you keep a watchlist, set price alerts, and maintain a manual record of holdings, futures positions, and trade notes. The service does not place trades, does not custody funds, and does not connect to exchange APIs on your behalf.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">3. No financial advice</h2>
        <p>
          Nothing on this site is investment, financial, legal, or tax advice. AI-generated insights are produced by a language model based on the price data we feed it; they are not predictions and may be wrong. You are solely responsible for your trading decisions.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">4. Account responsibilities</h2>
        <p>
          You are responsible for keeping your account credentials secure. You agree not to use the service for any unlawful purpose, to scrape or relabel the data at industrial scale, or to attempt to disrupt the service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">5. Data accuracy</h2>
        <p>
          Market data is sourced from third parties (Binance, CoinGecko, alternative.me) via our own proxy and may be delayed, inaccurate, or unavailable. Always verify the price on the source exchange before trading.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">6. Termination</h2>
        <p>
          We may suspend or terminate access at any time for users who violate these terms. You can delete your account at any time from your profile settings; we will purge your data within 30 days.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">7. Changes</h2>
        <p>We may update these terms. Material changes will be announced on the site and via email if you have an account.</p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">8. Contact</h2>
        <p>Questions? Open an issue on the <a href="https://github.com/sigma-code-op/CRYPTO_WATCH/issues" target="_blank" rel="noopener noreferrer" className="text-fg hover:underline">GitHub repo</a>.</p>
      </section>
    </article>
  );
}
