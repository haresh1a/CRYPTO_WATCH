"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/useUserData";
import { useTickers } from "@/hooks/useMarkets";
import { useToast } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { classNames, displaySymbol, formatPercent, formatPrice } from "@/lib/format";
import type { Holding } from "@/types";

export function PortfolioTracker() {
  const { user } = useAuth();
  const { items, add, update, remove } = usePortfolio(user?.id ?? null);
  const { tickers } = useTickers("spot");
  const { toast } = useToast();

  const [draft, setDraft] = useState<{ symbol: string; amount: string; costBasis: string }>({ symbol: "", amount: "", costBasis: "" });

  const livePrice = (sym: string) => tickers.find((t) => t.symbol === `${sym}USDT`)?.lastPrice ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in to save holdings", variant: "warning" }); return; }
    const symbol = draft.symbol.trim().toUpperCase();
    const amount = Number(draft.amount);
    const cost = Number(draft.costBasis);
    if (!symbol || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(cost) || cost <= 0) {
      toast({ title: "Fill all fields with positive numbers", variant: "danger" });
      return;
    }
    try {
      await add({ symbol, amount, costBasis: cost, quoteCurrency: "USDT", notes: null });
      setDraft({ symbol: "", amount: "", costBasis: "" });
      toast({ title: "Holding added", variant: "success" });
    } catch (err) {
      toast({ title: "Could not add holding", description: err instanceof Error ? err.message : "Try again", variant: "danger" });
    }
  };

  const rows = items.map((h) => {
    const price = livePrice(h.symbol) ?? h.costBasis;
    const value = price * h.amount;
    const cost = h.costBasis * h.amount;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { h, price, value, pnl, pnlPct };
  });

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.h.costBasis * r.h.amount, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <ErrorBoundary label="Portfolio">
      <section aria-label="Portfolio" className="space-y-3">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-fg">Portfolio</h1>
          <p className="text-sm text-fg-muted">{rows.length} positions</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Value" value={formatPrice(totalValue)} />
          <Stat label="Cost basis" value={formatPrice(totalCost)} />
          <Stat label="P&L" value={formatPrice(totalPnl)} tone={totalPnl >= 0 ? "gain" : "loss"} />
          <Stat label="P&L %" value={formatPercent(totalPnlPct)} tone={totalPnlPct >= 0 ? "gain" : "loss"} />
        </div>

        <form onSubmit={submit} className="panel p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Symbol (e.g. BTC)</span>
            <input className="input" value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Amount</span>
            <input className="input" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-fg-muted text-xs">Avg cost (USDT)</span>
            <input className="input" inputMode="decimal" value={draft.costBasis} onChange={(e) => setDraft({ ...draft, costBasis: e.target.value })} />
          </label>
          <button type="submit" className="btn-primary self-end">Add</button>
        </form>

        <div className="panel">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-fg-muted text-center">No holdings yet. Add one above to track value and P&L.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-fg-muted">
                <tr>
                  <th className="text-left p-3">Asset</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Avg cost</th>
                  <th className="text-right p-3">Last</th>
                  <th className="text-right p-3">Value</th>
                  <th className="text-right p-3">P&L</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ h, price, value, pnl, pnlPct }) => (
                  <tr key={h.id} className="border-t border-border/40">
                    <td className="p-3 font-medium text-fg">{displaySymbol(h.symbol + "USDT")}</td>
                    <td className="p-3 text-right tabular-nums text-fg">{h.amount}</td>
                    <td className="p-3 text-right tabular-nums text-fg-secondary">{formatPrice(h.costBasis)}</td>
                    <td className="p-3 text-right tabular-nums text-fg-secondary">{formatPrice(price)}</td>
                    <td className="p-3 text-right tabular-nums text-fg">{formatPrice(value)}</td>
                    <td className={classNames("p-3 text-right tabular-nums", pnl >= 0 ? "text-success" : "text-danger")}>
                      {formatPrice(pnl)} ({formatPercent(pnlPct)})
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => remove(h.id)}
                        className="btn text-xs"
                        aria-label={`Delete ${h.symbol}`}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div className="panel p-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={classNames("text-lg font-semibold mt-1", tone === "gain" && "text-success", tone === "loss" && "text-danger")}>{value}</p>
    </div>
  );
}
