"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusPill } from "./StatusPill";
import { classNames } from "@/lib/format";

type Col = { title: string; links: { href: string; label: string; external?: boolean }[] };

const COLS: Col[] = [
  {
    title: "Product",
    links: [
      { href: "/",          label: "Markets" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/futures",   label: "Futures" },
      { href: "/notes",     label: "Journal" },
    ],
  },
  {
    title: "Data sources",
    links: [
      { href: "https://www.binance.com/en/spot",  label: "Binance Spot",  external: true },
      { href: "https://www.binance.com/en/futures", label: "Binance Futures", external: true },
      { href: "https://www.coingecko.com",        label: "CoinGecko",     external: true },
      { href: "https://alternative.me/crypto/fear-and-greed-index/", label: "Fear & Greed", external: true },
    ],
  },
  {
    title: "Powered by",
    links: [
      { href: "https://nextjs.org",  label: "Next.js",  external: true },
      { href: "https://supabase.com", label: "Supabase", external: true },
      { href: "https://vercel.com",   label: "Vercel",   external: true },
      { href: "https://www.tradingview.com/lightweight-charts/", label: "Lightweight Charts", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms",      label: "Terms of service" },
      { href: "/legal/privacy",    label: "Privacy policy" },
      { href: "/legal/disclaimer", label: "Financial disclaimer" },
      { href: "/legal/cookies",    label: "Cookie policy" },
    ],
  },
];

const SOCIAL = [
  { href: "https://github.com/sigma-code-op/CRYPTO_WATCH", label: "GitHub",   icon: Github },
  { href: "https://x.com/cryptowatch",                     label: "X / Twitter", icon: XIcon },
  { href: "https://discord.gg/cryptowatch",                 label: "Discord",  icon: Discord },
];

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.8 1.1.8 2.3v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.84l-5.36-7-6.13 7H1.41l8.04-9.18L1 2h7.02l4.85 6.42L18.244 2Zm-2.4 18h1.84L7.27 4H5.32l10.524 16Z" />
    </svg>
  );
}
function Discord(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.32 4.37a19.79 19.79 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.27 18.27 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.89 1.52.07.07 0 0 0-.03.03C.53 9.04-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2 .02-.04 0-.09-.04-.1a13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1 0-.13c.13-.1.25-.2.37-.3a.08.08 0 0 1 .08-.01 14.2 14.2 0 0 0 12.06 0 .08.08 0 0 1 .09.01c.12.1.24.2.37.3a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.88.89a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .09.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.7-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.4 0-1.33.96-2.41 2.16-2.41 1.2 0 2.18 1.09 2.16 2.4 0 1.33-.96 2.41-2.16 2.41Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.4 0-1.33.96-2.41 2.16-2.41 1.2 0 2.18 1.09 2.16 2.4 0 1.33-.95 2.41-2.16 2.41Z" />
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  return (
    <footer
      aria-labelledby="footer-heading"
      className="mt-16 border-t border-border bg-bg-panel/60"
    >
      <h2 id="footer-heading" className="sr-only">Site footer</h2>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand block — spans 2 cols on md+ */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold text-fg">
              <span className="inline-block w-7 h-7 rounded-md bg-gradient-to-br from-brand to-success" aria-hidden />
              <span>CryptoWatch Pro</span>
            </Link>
            <p className="text-sm text-fg-secondary mt-3 max-w-xs">
              A real-time crypto market terminal. Spot, futures, charts, alerts, portfolio, journal, and AI — all in one place.
            </p>
            <div className="mt-4">
              <StatusPill />
            </div>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-border text-fg-secondary hover:text-fg hover:border-border-strong hover:bg-bg-hover transition-colors"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-fg-muted">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => {
                  const isActive = !link.external && pathname === link.href;
                  const cls = classNames(
                    "text-sm hover:text-fg transition-colors",
                    isActive ? "text-fg" : "text-fg-secondary",
                  );
                  return (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cls}
                        >
                          {link.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <Link href={link.href} className={cls}>{link.label}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        {/* Disclaimer band */}
        <div className="mt-10 p-4 rounded-lg border border-border bg-bg-base/50 text-xs text-fg-muted">
          <p>
            <strong className="text-fg-secondary">Not financial advice.</strong>{" "}
            CryptoWatch Pro is a tracking and analysis tool. It does not place trades, hold custody of your funds, or provide investment recommendations. Cryptocurrency trading is volatile and carries substantial risk; only trade with capital you can afford to lose. Market data is sourced from Binance, CoinGecko, and alternative.me via our own proxy and may be delayed by up to a few seconds. Always verify prices on the source exchange before trading.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-fg-muted">
          <p>
            © {year} CryptoWatch Pro · Released under the{" "}
            <a
              href="https://github.com/sigma-code-op/CRYPTO_WATCH/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-secondary hover:text-fg"
            >MIT License</a>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Built with Next.js · Supabase · Vercel</span>
            <span aria-hidden>·</span>
            <a
              href="https://github.com/sigma-code-op/CRYPTO_WATCH/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-secondary hover:text-fg"
            >Changelog</a>
            <span aria-hidden>·</span>
            <a
              href="https://github.com/sigma-code-op/CRYPTO_WATCH/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-secondary hover:text-fg"
            >Report an issue</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
