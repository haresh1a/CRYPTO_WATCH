"use client";

import { useEffect, useRef, useState } from "react";
import { useKlines } from "@/hooks/useMarkets";
import { useQuote } from "@/hooks/useQuote";
import { ChartSkeleton } from "./LoadingSkeleton";
import { ErrorBoundary } from "./ErrorBoundary";
import type { Candle, ChartType, KlineInterval } from "@/types";
import { classNames, displaySymbol, formatPrice } from "@/lib/format";

type Props = {
  symbol: string;
  market: "spot" | "futures";
  interval: KlineInterval;
  chartType: ChartType;
  indicators: { ma: boolean; ema: boolean; vwap: boolean; bb: boolean };
};

const INTERVALS: KlineInterval[] = ["1m","5m","15m","1h","4h","1d"];

// Lightweight-charts has no SSR support. Load it once on the client
// and cache the module reference for the lifetime of the page.
let _lib: typeof import("lightweight-charts") | null = null;
async function getLib() {
  if (_lib) return _lib;
  _lib = await import("lightweight-charts");
  return _lib;
}

export function ChartPanel(props: Props) {
  const { symbol, market, interval, chartType, indicators } = props;
  const { candles, isLoading, error } = useKlines({ symbol, interval, market, limit: 500 });
  const { quote } = useQuote(symbol, market);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<Record<string, any>>({});
  const candlesRef = useRef<Candle[]>([]);
  const [chartReady, setChartReady] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  // Build the chart once and keep it across data updates.
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      if (!containerRef.current) return;
      const lib = await getLib();
      if (cancelled || !containerRef.current) return;

      const chart = lib.createChart(containerRef.current, {
        layout: { background: { color: "transparent" }, textColor: "#b6c2d4" },
        grid: { vertLines: { color: "#1d2533" }, horzLines: { color: "#1d2533" } },
        rightPriceScale: { borderColor: "#222b3b" },
        timeScale: { borderColor: "#222b3b", timeVisible: true, secondsVisible: false },
        crosshair: { mode: 1 },
        autoSize: true,
      });
      chartRef.current = chart;
      setChartReady(true);

      const resize = () => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(containerRef.current);

      cleanup = () => { ro.disconnect(); chart.remove(); };
    })();
    return () => {
      cancelled = true;
      cleanup?.();
      chartRef.current = null;
      seriesRef.current = {};
      setChartReady(false);
    };
  }, []);

  // Render the series based on chart type + indicator toggles.
  useEffect(() => {
    if (!chartReady || !chartRef.current || candles.length === 0) return;
    candlesRef.current = candles;
    const chart = chartRef.current;

    // Clear previous series.
    Object.values(seriesRef.current).forEach((s) => chart.removeSeries(s));
    seriesRef.current = {};

    if (chartType === "candles") {
      const s = chart.addCandlestickSeries({ upColor: "#26a69a", downColor: "#ef5350", borderVisible: false });
      s.setData(toCandles(candles));
      seriesRef.current.main = s;
    } else if (chartType === "heikin") {
      const s = chart.addCandlestickSeries({ upColor: "#26a69a", downColor: "#ef5350", borderVisible: false });
      s.setData(toHeikin(candles));
      seriesRef.current.main = s;
    } else {
      const s = chart.addLineSeries({ color: "#5b8cff", lineWidth: 2 });
      s.setData(candles.map((c) => ({ time: c.time, value: c.close })));
      seriesRef.current.main = s;
    }

    if (indicators.ma) seriesRef.current.ma = addLine(chart, candles, 20, "#f0b429");
    if (indicators.ema) seriesRef.current.ema = addLine(chart, candles, 50, "#7ba1ff");
    if (indicators.vwap) seriesRef.current.vwap = addVWAP(chart, candles);
    if (indicators.bb) Object.assign(seriesRef.current, addBB(chart, candles));

    chart.timeScale().fitContent();
  }, [candles, chartType, indicators, chartReady]);

  // Live tick: every ~1.5s, update the LAST (in-progress) candle
  // so the chart visually moves as the price moves. We only update
  // close, high, and low — open stays pinned to the candle's start.
  useEffect(() => {
    if (!chartReady || !chartRef.current || !quote) return;
    const main = seriesRef.current.main;
    if (!main) return;
    const candlesNow = candlesRef.current;
    if (candlesNow.length === 0) return;

    const last = candlesNow[candlesNow.length - 1];
    const price = quote.lastPrice;
    if (!Number.isFinite(price)) return;
    setLivePrice(price);

    // For candles + heikin, update with the new close + extend high/low.
    // For line, just push the new value.
    if (chartType === "line") {
      main.update({ time: last.time, value: price });
    } else {
      main.update({
        time: last.time,
        open: last.open,
        close: price,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
      });
    }
  }, [quote, chartReady, chartType]);

  return (
    <ErrorBoundary label="Chart">
      <section aria-label="Chart" className="panel flex flex-col">
        <header className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-fg">{symbol ? displaySymbol(symbol) : "—"}</h2>
            <p className="text-xs text-fg-muted">{market} · {interval} · {chartType}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-fg">
              {livePrice != null ? formatPrice(livePrice) : formatPrice(quote?.lastPrice)}
            </p>
            {quote && (
              <p
                className={classNames(
                  "text-xs tabular-nums",
                  quote.priceChangePercent >= 0 ? "text-success" : "text-danger",
                )}
              >
                {quote.priceChangePercent >= 0 ? "+" : ""}
                {quote.priceChangePercent.toFixed(2)}%
              </p>
            )}
          </div>
        </header>
        <div className="relative h-[420px]">
          {(isLoading || candles.length === 0) && (
            <div className="absolute inset-0 z-10"><ChartSkeleton /></div>
          )}
          {error && (
            <p role="alert" className="absolute inset-0 z-10 grid place-items-center text-sm text-danger">
              Failed to load candles.
            </p>
          )}
          <div ref={containerRef} className="absolute inset-0" />
        </div>
        <div className="px-3 py-2 border-t border-border flex flex-wrap gap-1 text-xs">
          {INTERVALS.map((i) => (
            <span key={i} className="text-fg-muted">{i}{INTERVALS.indexOf(i) < INTERVALS.length - 1 ? " ·" : ""}</span>
          ))}
        </div>
      </section>
    </ErrorBoundary>
  );
}

function toCandles(c: Candle[]) {
  return c.map((x) => ({ time: x.time, open: x.open, high: x.high, low: x.low, close: x.close }));
}

function toHeikin(c: Candle[]) {
  const out: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let prev: { open: number; close: number } | null = null;
  for (const k of c) {
    const closeVal: number = (k.open + k.high + k.low + k.close) / 4;
    const openVal: number = prev ? (prev.open + prev.close) / 2 : (k.open + k.close) / 2;
    const highVal: number = Math.max(k.high, openVal, closeVal);
    const lowVal:  number = Math.min(k.low,  openVal, closeVal);
    out.push({ time: k.time, open: openVal, high: highVal, low: lowVal, close: closeVal });
    prev = { open: openVal, close: closeVal };
  }
  return out;
}

function addLine(chart: any, candles: Candle[], period: number, color: string) {
  const s = chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
  const data: { time: number; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) data.push({ time: candles[i].time, value: sum / period });
  }
  s.setData(data);
  return s;
}

function addVWAP(chart: any, candles: Candle[]) {
  const s = chart.addLineSeries({ color: "#3fcf8e", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
  const data: { time: number; value: number }[] = [];
  let pv = 0, v = 0;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    v += c.volume;
    if (v > 0) data.push({ time: c.time, value: pv / v });
  }
  s.setData(data);
  return s;
}

function addBB(chart: any, candles: Candle[]) {
  const period = 20, mult = 2;
  const data = candles.map((c, i) => {
    if (i < period - 1) return null;
    const slice = candles.slice(i - period + 1, i + 1).map((x) => x.close);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    return { time: c.time, mid: mean, upper: mean + mult * sd, lower: mean - mult * sd };
  }).filter(Boolean) as { time: number; mid: number; upper: number; lower: number }[];

  const upper = chart.addLineSeries({ color: "#7ba1ff", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
  const lower = chart.addLineSeries({ color: "#7ba1ff", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
  const mid   = chart.addLineSeries({ color: "#b6c2d4", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
  upper.setData(data.map((d) => ({ time: d.time, value: d.upper })));
  lower.setData(data.map((d) => ({ time: d.time, value: d.lower })));
  mid.setData(data.map((d) => ({ time: d.time, value: d.mid })));
  return { bbUpper: upper, bbLower: lower, bbMid: mid };
}
