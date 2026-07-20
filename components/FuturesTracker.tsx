"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFutures } from "@/hooks/useUserData";
import { useTickers } from "@/hooks/useMarkets";
import { useToast } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { classNames, displaySymbol, formatPercent, formatPrice } from "@/lib/format";
import { estimatedLiquidation, unrealisedPnl, unrealisedPnlPercent, distanceToLiquidationPct } from "@/lib/finance";
import type { FuturesPosition } from "@/types";

const SIDE_OPTIONS = ["long", "short"] as const;

export function FuturesTracker() {
  const { user } = useAuth();
  const { items, add, update, remove } = useFutures(user?.id ?? null);
  const { tickers } = useTickers("futures");
  const { toast } = useToast();

  const [draft, setDraft] = useState({
    symbol: "BTCUSDT", side: "long" as FuturesPosition["side"],
    entryPrice: "", size: "", leverage: "5", margin: "", liquidation: "",
  });

  const liveMark = (sym: string) => tickers.find((t) => t.symbol === sym)?.lastPrice ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in to save positions", variant: "warning" }); return; }
    const entry = Number(draft.entryPrice);
    const size = Number(draft.size);
    const lev = Number(draft.leverage);
    if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(size) || size <= 0 || !Number.isFinite(lev) || lev <= 0) {
      toast({ title: "Invalid position values", variant: "danger" });
      return;
    }
    const liq = draft.liquidation ? Number(draft.liquidation) : estimatedLiquidation({
      side: draft.side, entryPrice: entry, leverage: lev,
    });
    const margin = draft.margin ? Number(draft.margin) : (entry * size) / lev;
    try {
      await add({
        symbol: draft.symbol.toUpperCase(),
        side: draft.side,
        leverage: lev,
        entryPrice: entry,
        size,
        margin,
        liquidation: liq,
        notes: null,
      });
      setDraft({ ...draft, entryPrice: "", size: "", margin: "", liquidation: "" });
      toast({ title: "Position added", variant: "success" });
    } catch (err) {
      toast({ title: "Could not add position", description: err instanceof Error ? err.message : "Try again", variant: "danger" });
    }
  };

  const open = items.filter((p) => !p.closed);
  const closed = items.filter((p) => p.closed);

  return (
    <ErrorBoundary label="Futures">
      <section aria-label="Futures positions" className="space-y-3">
        <header>
          <h1 className="text-xl font-semibold text-fg">Futures</h1>
          <p className="text-sm text-fg-muted">Track your positions. We never hold exchange keys — entries are manual.</p>
        </header>

        <form onSubmit={submit} className="panel p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-sm">
          <label className="grid gap-1 col-span-2">
            <span className="text-fg-muted text-xs">Symbol</span>
            <input className="input" value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value.toUpperCase() })} />
          </label>
          <label className="grid gap-1 col-span-2">
            <span className="text-fg-muted text-xs">Side</span>
            <div className="flex gap-1">
              {SIDE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={classNames("tab flex-1", draft.side === s && "tab-active")}
                  aria-pressed={draft.side === s}
                  onClick={() => setDraft({ ...draft, side: s })}
                >{s}</button>
              ))}
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Entry</span>
            <input className="input" inputMode="decimal" value={draft.entryPrice} onChange={(e) => setDraft({ ...draft, entryPrice: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Size</span>
            <input className="input" inputMode="decimal" value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Leverage</span>
            <input className="input" inputMode="decimal" value={draft.leverage} onChange={(e) => setDraft({ ...draft, leverage: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Margin (opt)</span>
            <input className="input" inputMode="decimal" value={draft.margin} onChange={(e) => setDraft({ ...draft, margin: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Liq (opt)</span>
            <input className="input" inputMode="decimal" value={draft.liquidation} onChange={(e) => setDraft({ ...draft, liquidation: e.target.value })} />
          </label>
          <button type="submit" className="btn-primary col-span-2 sm:col-span-1 self-end">Add</button>
        </form>

        <div className="panel">
          <h2 className="text-sm font-medium text-fg px-3 py-2 border-b border-border">Open ({open.length})</h2>
          {open.length === 0 ? (
            <p className="p-6 text-sm text-fg-muted text-center">No open positions.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-fg-muted">
                <tr>
                  <th className="text-left p-3">Symbol</th>
                  <th className="text-left p-3">Side</th>
                  <th className="text-right p-3">Lev</th>
                  <th className="text-right p-3">Entry</th>
                  <th className="text-right p-3">Mark</th>
                  <th className="text-right p-3">Liq est.</th>
                  <th className="text-right p-3">Size</th>
                  <th className="text-right p-3">uPnL</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {open.map((p) => {
                  const mark = liveMark(p.symbol) ?? p.markPrice ?? p.entryPrice;
                  const uPnl = unrealisedPnl({ side: p.side, entryPrice: p.entryPrice, markPrice: mark, size: p.size });
                  const uPnlPct = unrealisedPnlPercent({
                    side: p.side, entryPrice: p.entryPrice, markPrice: mark, size: p.size, leverage: p.leverage,
                  });
                  const liqEst = estimatedLiquidation({ side: p.side, entryPrice: p.entryPrice, leverage: p.leverage });
                  const liqDistPct = distanceToLiquidationPct({
                    side: p.side, entryPrice: p.entryPrice, markPrice: mark, leverage: p.leverage,
                  });
                  const liqDanger = liqDistPct < 5 && liqDistPct > 0;
                  return (
                    <tr key={p.id} className="border-t border-border/40">
                      <td className="p-3 font-medium text-fg">{displaySymbol(p.symbol)}</td>
                      <td className={classNames("p-3 capitalize", p.side === "long" ? "text-success" : "text-danger")}>{p.side}</td>
                      <td className="p-3 text-right tabular-nums text-fg-secondary">{p.leverage}x</td>
                      <td className="p-3 text-right tabular-nums text-fg-secondary">{formatPrice(p.entryPrice)}</td>
                      <td className="p-3 text-right tabular-nums text-fg">{formatPrice(mark)}</td>
                      <td className={classNames(
                        "p-3 text-right tabular-nums",
                        liqDanger ? "text-danger" : "text-fg-muted",
                      )} title={liqDanger ? "Within 5% of liquidation" : undefined}>
                        {formatPrice(liqEst || p.liquidation)}
                        <span className="block text-[10px] text-fg-muted/70">
                          {liqDistPct > 0 ? `${liqDistPct.toFixed(1)}% away` : "at/under"}
                        </span>
                      </td>
                      <td className="p-3 text-right tabular-nums text-fg-secondary">{p.size}</td>
                      <td className={classNames("p-3 text-right tabular-nums", uPnl >= 0 ? "text-success" : "text-danger")}>
                        {formatPrice(uPnl)} ({formatPercent(uPnlPct)})
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          className="btn text-xs"
                          onClick={() => update(p.id, { markPrice: mark })}
                          aria-label="Update mark price"
                        >Mark</button>
                        <button
                          className="btn text-xs"
                          onClick={() => update(p.id, { closePrice: mark, close: true })}
                          aria-label="Close position"
                        >Close</button>
                        <button className="btn text-xs" onClick={() => remove(p.id)} aria-label="Delete">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {closed.length > 0 && (
          <div className="panel">
            <h2 className="text-sm font-medium text-fg px-3 py-2 border-b border-border">Closed ({closed.length})</h2>
            <table className="w-full text-sm">
              <thead className="text-xs text-fg-muted">
                <tr>
                  <th className="text-left p-3">Symbol</th>
                  <th className="text-left p-3">Side</th>
                  <th className="text-right p-3">Entry</th>
                  <th className="text-right p-3">Close</th>
                  <th className="text-right p-3">Realised PnL</th>
                </tr>
              </thead>
              <tbody>
                {closed.map((p) => (
                  <tr key={p.id} className="border-t border-border/40">
                    <td className="p-3 font-medium text-fg">{displaySymbol(p.symbol)}</td>
                    <td className="p-3 capitalize text-fg-secondary">{p.side}</td>
                    <td className="p-3 text-right tabular-nums text-fg-secondary">{formatPrice(p.entryPrice)}</td>
                    <td className="p-3 text-right tabular-nums text-fg-secondary">{formatPrice(p.closePrice)}</td>
                    <td className={classNames("p-3 text-right tabular-nums", (p.realizedPnl ?? 0) >= 0 ? "text-success" : "text-danger")}>
                      {formatPrice(p.realizedPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ErrorBoundary>
  );
}
