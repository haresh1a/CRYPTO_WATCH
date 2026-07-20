"use client";

import { useTrades } from "@/hooks/useMarkets";
import { ErrorBoundary } from "./ErrorBoundary";
import { classNames, formatPrice, formatRelative } from "@/lib/format";

type Props = { symbol: string; market: "spot" | "futures" };

export function RecentTrades({ symbol, market }: Props) {
  const { trades, isLoading, error } = useTrades(symbol, market);

  return (
    <ErrorBoundary label="Recent trades">
      <section aria-label="Recent trades" className="panel flex flex-col">
        <header className="px-3 py-2 border-b border-border">
          <h2 className="text-sm font-medium text-fg">Recent Trades</h2>
        </header>
        {isLoading ? (
          <p className="p-3 text-sm text-fg-muted">Loading…</p>
        ) : error ? (
          <p role="alert" className="p-3 text-sm text-danger">Trades unavailable.</p>
        ) : trades.length === 0 ? (
          <p className="p-3 text-sm text-fg-muted">No trades yet.</p>
        ) : (
          <ul className="text-xs">
            {trades.slice(0, 30).map((t) => (
              <li key={t.id} className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1">
                <span className={classNames("tabular-nums", t.isBuyerMaker ? "text-danger" : "text-success")}>
                  {formatPrice(t.price)}
                </span>
                <span className="tabular-nums text-fg-secondary text-right">{t.qty.toFixed(4)}</span>
                <span className="text-fg-muted text-right">{formatRelative(t.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ErrorBoundary>
  );
}
