"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketTable } from "@/components/MarketTable";
import { ChartPanel } from "@/components/ChartPanel";
import { OrderBook } from "@/components/OrderBook";
import { RecentTrades } from "@/components/RecentTrades";
import { AlertsPanel } from "@/components/AlertsPanel";
import { NotesPanel } from "@/components/NotesPanel";
import { AIInsightPanel } from "@/components/AIInsightPanel";
import { GlobalMarketHeader } from "@/components/GlobalMarketHeader";
import { classNames } from "@/lib/format";
import type { ChartType, KlineInterval, MarketType, Ticker } from "@/types";

const INTERVALS: KlineInterval[] = ["1m","5m","15m","1h","4h","1d","1w"];

export default function HomePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialSymbol = sp.get("symbol") ?? "BTCUSDT";
  const initialMarket = (sp.get("market") as MarketType) ?? "spot";
  const initialInterval = (sp.get("interval") as KlineInterval) ?? "1h";
  const initialType = (sp.get("type") as ChartType) ?? "candles";

  const [selected, setSelected] = useState<Ticker | null>({
    symbol: initialSymbol,
    marketType: initialMarket,
    lastPrice: 0,
    priceChangePercent: 0,
    priceChange: 0,
    highPrice: 0,
    lowPrice: 0,
    volume: 0,
    quoteVolume: 0,
  });
  const [interval, setInterval] = useState<KlineInterval>(initialInterval);
  const [chartType, setChartType] = useState<ChartType>(initialType);
  const [indicators, setIndicators] = useState({ ma: false, ema: false, vwap: false, bb: false });

  const onSelect = (t: Ticker) => {
    setSelected(t);
    const params = new URLSearchParams({
      symbol: t.symbol, market: t.marketType, interval, type: chartType,
    });
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const toggleIndicator = (k: keyof typeof indicators) =>
    setIndicators((curr) => ({ ...curr, [k]: !curr[k] }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      <div className="lg:h-[calc(100vh-7rem)]">
        <MarketTable onSelect={onSelect} selectedSymbol={selected?.symbol} />
      </div>

      <div className="space-y-4 min-w-0">
        <GlobalMarketHeader />

        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Interval" className="flex items-center gap-1 panel p-1">
            {INTERVALS.map((i) => (
              <button
                key={i}
                role="tab"
                aria-selected={interval === i}
                onClick={() => setInterval(i)}
                className={classNames("tab", interval === i && "tab-active")}
              >{i}</button>
            ))}
          </div>
          <div role="tablist" aria-label="Chart type" className="flex items-center gap-1 panel p-1">
            {(["candles","heikin","line"] as ChartType[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={chartType === t}
                onClick={() => setChartType(t)}
                className={classNames("tab", chartType === t && "tab-active")}
              >{t}</button>
            ))}
          </div>
          <div role="group" aria-label="Indicators" className="flex items-center gap-1 panel p-1 flex-wrap">
            {(["ma","ema","vwap","bb"] as const).map((k) => (
              <button
                key={k}
                aria-pressed={indicators[k]}
                onClick={() => toggleIndicator(k)}
                className={classNames("tab", indicators[k] && "tab-active")}
              >{k.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {selected && (
          <ChartPanel
            symbol={selected.symbol}
            market={selected.marketType}
            interval={interval}
            chartType={chartType}
            indicators={indicators}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {selected && <OrderBook symbol={selected.symbol} market={selected.marketType} />}
          {selected && <RecentTrades symbol={selected.symbol} market={selected.marketType} />}
          {selected && <AlertsPanel symbol={selected.symbol} market={selected.marketType} price={selected.lastPrice} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {selected && <AIInsightPanel symbol={selected.symbol} market={selected.marketType} />}
          <NotesPanel symbol={selected?.symbol} />
        </div>
      </div>
    </div>
  );
}
