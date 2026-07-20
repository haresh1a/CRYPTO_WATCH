// Binance public REST client. Server-side only — the browser never
// talks to Binance directly. We fetch JSON with a short timeout,
// validate the shape, and surface upstream errors with enough
// context to debug (without leaking the URL back to the client).

import { swr, cached as cachedSWR } from "./cache";
import type { Candle, KlineInterval, OrderBookSnapshot, Ticker, Trade } from "@/types";

const BASE = "https://api.binance.com";
const FUTURES = "https://fapi.binance.com";
const TIMEOUT_MS = 8_000;

async function binanceFetch<T>(path: string, market: "spot" | "futures" = "spot"): Promise<T> {
  const base = market === "futures" ? FUTURES : BASE;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
      // We deliberately don't add cache headers here; the in-memory
      // swr() wrapper handles caching at the application layer.
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`binance ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// ----- 24hr ticker -----
// Binance returns one row per symbol. We normalise spot + futures
// into the same Ticker shape, attach the market type, and let the
// route handler filter / sort downstream.
type RawTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  priceChange: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
};

function normaliseTicker(raw: RawTicker, marketType: "spot" | "futures"): Ticker {
  return {
    symbol: raw.symbol,
    marketType,
    lastPrice: Number(raw.lastPrice),
    priceChangePercent: Number(raw.priceChangePercent),
    priceChange: Number(raw.priceChange),
    highPrice: Number(raw.highPrice),
    lowPrice: Number(raw.lowPrice),
    volume: Number(raw.volume),
    quoteVolume: Number(raw.quoteVolume),
    openTime: raw.openTime,
    closeTime: raw.closeTime,
  };
}

export async function get24hTickers(market: "spot" | "futures"): Promise<Ticker[]> {
  const key = `binance:24h:${market}`;
  return swr(key, market === "spot" ? 6_000 : 5_000, async () => {
    const raw = await binanceFetch<RawTicker[]>("/api/v3/ticker/24hr", market);
    return raw.map((r) => normaliseTicker(r, market));
  });
}

export async function getTicker(symbol: string, market: "spot" | "futures"): Promise<Ticker> {
  const upper = symbol.toUpperCase();
  const key = `binance:ticker:${market}:${upper}`;
  return swr(key, 4_000, async () => {
    const raw = await binanceFetch<RawTicker>(`/api/v3/ticker/24hr?symbol=${encodeURIComponent(upper)}`, market);
    return normaliseTicker(raw, market);
  });
}

// ----- Klines (candles) -----
type RawKline = [
  number, // open time ms
  string, string, string, string, // OHLC
  string, // close time
  string, // quote asset volume
  number, // number of trades
  string, string, // taker buy base, taker buy quote
  string, // ignore
];
export async function getKlines(opts: {
  symbol: string;
  interval: KlineInterval;
  market: "spot" | "futures";
  limit?: number;          // default 500
  startTime?: number;
  endTime?: number;
}): Promise<Candle[]> {
  const { symbol, interval, market, limit = 500, startTime, endTime } = opts;
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    limit: String(Math.min(Math.max(limit, 1), 1000)),
  });
  if (startTime) params.set("startTime", String(startTime));
  if (endTime) params.set("endTime", String(endTime));
  // Spot + futures USD-M kline endpoints are identical in shape.
  const path = market === "futures" ? `/fapi/v1/klines?${params}` : `/api/v3/klines?${params}`;
  const raw = await binanceFetch<RawKline[]>(path, market);
  return raw.map(([t, o, h, l, c, v]) => ({
    time: Math.floor(t / 1000),
    open: Number(o),
    high: Number(h),
    low: Number(l),
    close: Number(c),
    volume: Number(v),
  }));
}

// ----- Order book -----
type RawDepth = {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
};
export async function getOrderBook(symbol: string, market: "spot" | "futures", limit = 50): Promise<OrderBookSnapshot> {
  const upper = symbol.toUpperCase();
  const params = new URLSearchParams({ symbol: upper, limit: String(Math.min(Math.max(limit, 5), 5000)) });
  const path = market === "futures"
    ? `/fapi/v1/depth?${params}`
    : `/api/v3/depth?${params}`;
  const raw = await binanceFetch<RawDepth>(path, market);
  return {
    lastUpdateId: raw.lastUpdateId,
    bids: raw.bids.map(([p, q]) => ({ price: Number(p), qty: Number(q) })),
    asks: raw.asks.map(([p, q]) => ({ price: Number(p), qty: Number(q) })),
  };
}

// ----- Recent trades -----
type RawTrade = { id: number; price: string; qty: string; time: number; isBuyerMaker: boolean };
export async function getTrades(symbol: string, market: "spot" | "futures", limit = 60): Promise<Trade[]> {
  const upper = symbol.toUpperCase();
  const params = new URLSearchParams({ symbol: upper, limit: String(Math.min(Math.max(limit, 1), 1000)) });
  const path = market === "futures" ? `/fapi/v1/trades?${params}` : `/api/v3/trades?${params}`;
  const raw = await binanceFetch<RawTrade[]>(path, market);
  return raw.map((t) => ({
    id: t.id,
    price: Number(t.price),
    qty: Number(t.qty),
    time: t.time,
    isBuyerMaker: t.isBuyerMaker,
  }));
}

// ----- Symbol metadata (used to filter out leveraged tokens etc.) -----
type RawExchangeInfo = {
  symbols: Array<{ symbol: string; status: string; baseAsset: string; quoteAsset: string; isSpotTradingAllowed?: boolean; contractType?: string }>;
};
export async function getTradableSymbols(market: "spot" | "futures"): Promise<string[]> {
  const key = `binance:symbols:${market}`;
  return swr(key, 60_000, async () => {
    const path = market === "futures" ? "/fapi/v1/exchangeInfo" : "/api/v3/exchangeInfo";
    const info = await binanceFetch<RawExchangeInfo>(path, market);
    return info.symbols
      .filter((s) => {
        if (s.status !== "TRADING") return false;
        if (market === "spot") return s.isSpotTradingAllowed !== false;
        // For futures prefer perpetual (perpetual contracts only).
        return s.contractType === "PERPETUAL";
      })
      .map((s) => s.symbol);
  });
}

export async function getAllSymbols(market: "spot" | "futures"): Promise<{ symbol: string; base: string; quote: string }[]> {
  const key = `binance:all:${market}`;
  return swr(key, 60_000, async () => {
    const path = market === "futures" ? "/fapi/v1/exchangeInfo" : "/api/v3/exchangeInfo";
    const info = await binanceFetch<RawExchangeInfo>(path, market);
    return info.symbols
      .filter((s) => s.status === "TRADING")
      .map((s) => ({ symbol: s.symbol, base: s.baseAsset, quote: s.quoteAsset }));
  });
}

// ----- Windowed percent change (1h / 24h / 7d) -----
// The 24h ticker only gives 24h. For 1h and 7d we derive from
// klines. Cached so we don't hammer Binance on every cron tick.

export type PctWindow = "1h" | "24h" | "7d";

export async function getWindowedPctChange(
  symbol: string,
  market: "spot" | "futures",
  window: PctWindow,
): Promise<number> {
  const upper = symbol.toUpperCase();
  if (window === "24h") {
    const t = await getTicker(upper, market);
    return t.priceChangePercent;
  }
  const interval: KlineInterval = window === "1h" ? "1m" : "1d";
  const limit = window === "1h" ? 65 : 8;
  const key = `binance:pct:${market}:${upper}:${window}`;
  return cachedSWR(key, window === "1h" ? 60_000 : 5 * 60_000, async () => {
    const candles = await getKlines({ symbol: upper, interval, market, limit });
    if (candles.length < 2) return 0;
    const baselineIdx = window === "1h" ? candles.length - 61 : candles.length - 8;
    if (baselineIdx < 0) return 0;
    const baseline = candles[baselineIdx].close;
    const current = candles[candles.length - 1].close;
    if (baseline <= 0) return 0;
    return ((current - baseline) / baseline) * 100;
  });
}
