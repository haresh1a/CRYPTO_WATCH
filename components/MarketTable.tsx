"use client";

import { useMemo, useState } from "react";
import { useTickers } from "@/hooks/useMarkets";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "./LoadingSkeleton";
import { ErrorBoundary } from "./ErrorBoundary";
import { useToast } from "./Toast";
import { classNames, displaySymbol, formatPercent, formatPrice, formatVolume, splitSymbol } from "@/lib/format";
import type { Ticker } from "@/types";

type Filter = "all" | "spot" | "futures" | "gainers" | "losers" | "watchlist";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "spot", label: "Spot" },
  { id: "futures", label: "Futures" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
  { id: "watchlist", label: "Watchlist" },
];

export function MarketTable({ onSelect, selectedSymbol }: {
  onSelect: (t: Ticker) => void;
  selectedSymbol?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { items: watchlist, add, remove } = useWatchlist(user?.id ?? null);
  const { toast } = useToast();

  // Fetch both markets in parallel — the table switches between them.
  const { tickers: spot, isLoading: loadingSpot, error: spotErr } = useTickers("spot");
  const { tickers: futures, isLoading: loadingFutures, error: futuresErr } = useTickers("futures");

  // Use a single source for whichever market we're showing.
  const source = filter === "futures" ? futures : spot;
  const isLoading = filter === "futures" ? loadingFutures : loadingSpot;
  const error = filter === "futures" ? futuresErr : spotErr;

  // Apply search + sub-filter.
  const rows = useMemo(() => {
    let list = source;
    if (filter === "spot") list = list.filter((t) => t.marketType === "spot");
    if (filter === "futures") list = list.filter((t) => t.marketType === "futures");
    if (filter === "gainers") list = list.filter((t) => t.priceChangePercent > 0).sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    if (filter === "losers") list = list.filter((t) => t.priceChangePercent < 0).sort((a, b) => a.priceChangePercent - b.priceChangePercent);
    if (filter === "watchlist") {
      const ws = new Set(watchlist.map((w) => `${w.symbol}:${w.marketType}`));
      list = list.filter((t) => ws.has(`${t.symbol}:${t.marketType}`));
    }
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((t) => t.symbol.includes(q) || splitSymbol(t.symbol).base.includes(q));
    }
    return list.slice(0, 300);
  }, [source, filter, search, watchlist]);

  const watchKey = (t: Ticker) => `${t.symbol}:${t.marketType}`;
  const isWatched = (t: Ticker) => watchlist.some((w) => w.symbol === t.symbol && w.marketType === t.marketType);

  const toggleWatch = async (t: Ticker) => {
    try {
      if (isWatched(t)) {
        const w = watchlist.find((w) => w.symbol === t.symbol && w.marketType === t.marketType);
        if (w) await remove(w.id);
        toast({ title: "Removed from watchlist", variant: "default" });
      } else {
        await add({ symbol: t.symbol, marketType: t.marketType });
        toast({ title: "Added to watchlist", variant: "success" });
      }
    } catch (e) {
      toast({ title: "Watchlist update failed", description: e instanceof Error ? e.message : "Try again", variant: "danger" });
    }
  };

  return (
    <ErrorBoundary label="Market table">
      <section aria-label="Market table" className="panel flex flex-col h-full min-h-0">
        <div className="p-3 border-b border-border flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div role="tablist" aria-label="Filter" className="flex items-center gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={classNames("tab", filter === f.id && "tab-active")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <label className="sr-only" htmlFor="market-search">Search markets</label>
          <input
            id="market-search"
            className="input"
            placeholder="Search BTC, ETH, SOL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputMode="search"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-2 text-xs text-fg-muted border-b border-border">
          <span>Market</span>
          <span className="text-right">Last</span>
          <span className="text-right">24h %</span>
          <span className="text-right">Vol</span>
          <span className="w-6" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto" tabIndex={0} aria-label="Market rows">
          {isLoading ? (
            <TableSkeleton />
          ) : error ? (
            <p role="alert" className="p-3 text-sm text-danger">Failed to load markets.</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-fg-muted text-center">No markets match the current filter.</p>
          ) : (
            <ul>
              {rows.map((t) => {
                const isSelected = selectedSymbol === t.symbol;
                return (
                  <li
                    key={`${t.marketType}:${t.symbol}`}
                    className={classNames(
                      "grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-3 py-2 cursor-pointer border-b border-border/40 hover:bg-bg-hover",
                      isSelected && "bg-bg-hover",
                    )}
                    onClick={() => onSelect(t)}
                    onKeyDown={(e) => { if (e.key === "Enter") onSelect(t); }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`${t.symbol} at ${t.lastPrice}, 24h change ${t.priceChangePercent.toFixed(2)}%`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-fg truncate">{displaySymbol(t.symbol)}</span>
                      {t.marketType === "futures" && <span className="pill bg-warning/15 text-warning">PERP</span>}
                    </span>
                    <span className="text-right tabular-nums text-fg">{formatPrice(t.lastPrice)}</span>
                    <span className={classNames(
                      "text-right tabular-nums",
                      t.priceChangePercent >= 0 ? "text-success" : "text-danger",
                    )}>
                      {formatPercent(t.priceChangePercent)}
                    </span>
                    <span className="text-right tabular-nums text-fg-secondary">{formatVolume(t.quoteVolume)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatch(t); }}
                      aria-label={isWatched(t) ? "Remove from watchlist" : "Add to watchlist"}
                      className={classNames(
                        "w-6 h-6 flex items-center justify-center rounded text-fg-muted hover:text-fg",
                        isWatched(t) && "text-warning",
                      )}
                    >
                      {isWatched(t) ? "★" : "☆"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}

// (legacy helper removed)
