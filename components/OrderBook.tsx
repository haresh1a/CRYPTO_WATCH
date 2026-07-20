"use client";

import { useOrderBook } from "@/hooks/useMarkets";
import { ErrorBoundary } from "./ErrorBoundary";
import { PanelSkeleton } from "./LoadingSkeleton";
import { classNames, formatPrice } from "@/lib/format";

type Props = { symbol: string; market: "spot" | "futures" };

export function OrderBook({ symbol, market }: Props) {
  const { book, isLoading, error } = useOrderBook(symbol, market);

  return (
    <ErrorBoundary label="Order book">
      <section aria-label="Order book" className="panel flex flex-col">
        <header className="px-3 py-2 border-b border-border">
          <h2 className="text-sm font-medium text-fg">Order Book</h2>
        </header>
        {isLoading ? (
          <div className="p-3"><PanelSkeleton height="h-80" /></div>
        ) : error || !book ? (
          <p role="alert" className="p-3 text-sm text-danger">Order book unavailable.</p>
        ) : (
          <div className="grid grid-cols-2 text-xs text-fg-muted px-3 py-1">
            <span>Price</span><span className="text-right">Size</span>
            <div className="col-span-2 space-y-0.5 max-h-40 overflow-y-auto">
              {book.asks.slice(0, 12).reverse().map((l, i) => (
                <div key={`a${i}`} className="grid grid-cols-2">
                  <span className="text-danger tabular-nums">{formatPrice(l.price)}</span>
                  <span className="text-right text-fg-secondary tabular-nums">{l.qty.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className="col-span-2 my-1 text-center text-fg-muted text-xs">— spread —</div>
            <div className="col-span-2 space-y-0.5 max-h-40 overflow-y-auto">
              {book.bids.slice(0, 12).map((l, i) => (
                <div key={`b${i}`} className="grid grid-cols-2">
                  <span className="text-success tabular-nums">{formatPrice(l.price)}</span>
                  <span className="text-right text-fg-secondary tabular-nums">{l.qty.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </ErrorBoundary>
  );
}
