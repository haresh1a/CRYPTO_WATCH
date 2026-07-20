"use client";

import { useGlobalMarket } from "@/hooks/useMarkets";
import { classNames, formatPercent, formatPrice } from "@/lib/format";

export function GlobalMarketHeader() {
  const { data, isLoading, error } = useGlobalMarket();

  if (isLoading || !data) {
    return (
      <div className="panel p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm" aria-busy={true}>
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
      </div>
    );
  }
  if (error) return null;

  const fng = data.fearGreed?.value ?? 50;
  const fngClass = fng < 25 ? "text-danger" : fng < 45 ? "text-warning" : fng < 55 ? "text-fg-secondary" : fng < 75 ? "text-success" : "text-success";

  return (
    <div className="panel p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <Stat label="Total market cap" value={formatPrice(data.global.totalMarketCapUsd)} />
      <Stat
        label="24h change"
        value={formatPercent(data.global.marketCapChangePct24h)}
        tone={data.global.marketCapChangePct24h >= 0 ? "gain" : "loss"}
      />
      <Stat label="BTC dominance" value={`${data.global.btcDominance.toFixed(1)}%`} />
      <div>
        <p className="text-xs text-fg-muted">Fear &amp; Greed</p>
        <p className={classNames("text-lg font-semibold mt-1", fngClass)}>{fng} · {data.fearGreed.classification}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div>
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={classNames("text-lg font-semibold mt-1 tabular-nums", tone === "gain" && "text-success", tone === "loss" && "text-danger")}>{value}</p>
    </div>
  );
}
