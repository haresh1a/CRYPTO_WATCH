"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";
import { useToast } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { classNames, displaySymbol, formatPercent, formatPrice, formatRelative } from "@/lib/format";
import type { MarketType } from "@/types";

type Props = { symbol: string; market: MarketType; price: number };

export function AlertsPanel({ symbol, market, price }: Props) {
  const { user } = useAuth();
  const { alerts, add, setActive, remove } = useAlerts(user?.id ?? null);
  const { toast } = useToast();
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState<string>("");
  const [delivery, setDelivery] = useState<"toast" | "email" | "toast+email">("toast+email");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in to create alerts", variant: "warning" }); return; }
    const t = Number(threshold);
    if (!Number.isFinite(t) || t <= 0) { toast({ title: "Enter a valid threshold", variant: "danger" }); return; }
    try {
      await add({ symbol, marketType: market, condition, threshold: t, pctWindow: null, delivery });
      setThreshold("");
      toast({ title: "Alert created", description: `${symbol} ${condition} ${t}`, variant: "success" });
    } catch (err) {
      toast({ title: "Could not create alert", description: err instanceof Error ? err.message : "Try again", variant: "danger" });
    }
  };

  const symbolAlerts = alerts.filter((a) => a.symbol === symbol);

  return (
    <ErrorBoundary label="Alerts">
      <section aria-label="Price alerts" className="panel flex flex-col">
        <header className="px-3 py-2 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg">Alerts</h2>
          <span className="text-xs text-fg-muted">Last {formatPrice(price)}</span>
        </header>

        {!user && (
          <p className="p-3 text-xs text-fg-muted">
            Sign in to save alerts to your account. Guests can browse but alerts only live in this session.
          </p>
        )}

        <form onSubmit={submit} className="p-3 grid grid-cols-2 gap-2 text-sm">
          <label className="col-span-2 grid gap-1">
            <span className="text-fg-muted text-xs">Condition</span>
            <div className="flex gap-1">
              {(["above","below"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={classNames("tab flex-1", condition === c && "tab-active")}
                  aria-pressed={condition === c}
                  onClick={() => setCondition(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>
          <label className="col-span-2 grid gap-1">
            <span className="text-fg-muted text-xs">Threshold (USD)</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder={price ? price.toFixed(2) : "0.00"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
          <label className="col-span-2 grid gap-1">
            <span className="text-fg-muted text-xs">Delivery</span>
            <select
              className="input"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value as typeof delivery)}
            >
              <option value="toast">Toast only</option>
              <option value="email">Email only</option>
              <option value="toast+email">Toast + Email</option>
            </select>
          </label>
          <button type="submit" className="btn-primary col-span-2 text-sm">Create alert</button>
        </form>

        <div className="border-t border-border">
          {symbolAlerts.length === 0 ? (
            <p className="p-3 text-xs text-fg-muted">No alerts for {displaySymbol(symbol)}.</p>
          ) : (
            <ul>
              {symbolAlerts.map((a) => (
                <li key={a.id} className="px-3 py-2 border-b border-border/40 flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="text-fg">
                      <span className="text-fg-muted">{a.condition}</span> {formatPrice(a.threshold)}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {a.active ? `active · ${formatRelative(a.createdAt)}` : `fired ${formatRelative(a.triggeredAt)} @ ${formatPrice(a.triggeredPrice)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {a.active && (
                      <button
                        onClick={() => setActive(a.id, false)}
                        className="btn text-xs"
                        aria-label="Pause alert"
                      >Pause</button>
                    )}
                    <button onClick={() => remove(a.id)} className="btn text-xs" aria-label="Delete alert">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}
