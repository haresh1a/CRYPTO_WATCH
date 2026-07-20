import Link from "next/link";

export const metadata = { title: "Financial disclaimer" };

export default function DisclaimerPage() {
  return (
    <article className="max-w-3xl mx-auto panel p-6 lg:p-8 space-y-4 text-sm text-fg-secondary">
      <header>
        <Link href="/" className="text-fg-muted hover:text-fg text-xs">← Back to markets</Link>
        <h1 className="text-2xl font-semibold text-fg mt-2">Financial disclaimer</h1>
      </header>

      <p className="text-fg">
        CryptoWatch Pro is an information and tracking tool. It is not a broker, dealer, investment adviser, or financial planner.
      </p>

      <section>
        <h2 className="text-base font-medium text-fg">No recommendations</h2>
        <p>
          Nothing displayed on this site — including price targets, AI-generated insights, indicator overlays, or any other content — constitutes a recommendation to buy, sell, or hold any asset. You should not rely on information from this site as the basis for any investment decision.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Risk warning</h2>
        <p>
          Trading cryptocurrencies, derivatives, and other digital assets carries substantial risk and is not suitable for every investor. You may lose all of your invested capital. Past performance is not indicative of future results. Leverage amplifies both gains and losses. The market is volatile, 24/7, and can move sharply in either direction with little warning.
        </p>
        <p>Only trade with money you can afford to lose entirely. If you are unsure, consult a licensed financial adviser in your jurisdiction.</p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Data accuracy</h2>
        <p>
          We aggregate market data from third-party sources. We do our best to keep it accurate but we make no warranty as to its correctness, completeness, or timeliness. Always verify the price on the source exchange before placing any order.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">AI-generated content</h2>
        <p>
          The &ldquo;AI Insight&rdquo; feature uses a large language model. Its output may be incorrect, biased, or hallucinated. Treat it as a starting point for your own analysis, not as a conclusion.
        </p>
      </section>

      <section>
        <h2 className="text-base font-medium text-fg">Jurisdiction</h2>
        <p>
          CryptoWatch Pro does not provide services to residents of jurisdictions where crypto-asset trading is restricted or prohibited. You are responsible for ensuring your use of the site is lawful in your jurisdiction.
        </p>
      </section>
    </article>
  );
}
