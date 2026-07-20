"use client";

// Hooks for fetching market data from our own /api routes. We
// always go through the backend — never Binance directly. Each
// hook returns a small `{ data, error, loading, refresh }` shape
// so callers can render proper loading + error states.

import useSWR from "swr";
import type { Candle, KlineInterval, OrderBookSnapshot, Ticker, Trade } from "@/types";

async function jsonFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? `Request failed: ${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export function useTickers(market: "spot" | "futures", filter: "all" | "gainers" | "losers" = "all", limit = 200) {
  const { data, error, isLoading, mutate } = useSWR<{ tickers: Ticker[] }>(
    `/api/markets/ticker?market=${market}&filter=${filter}&limit=${limit}`,
    jsonFetcher as <T = unknown>(url: string) => Promise<T>,
    { refreshInterval: 8_000, revalidateOnFocus: true, dedupingInterval: 4_000 },
  );
  return {
    tickers: data?.tickers ?? [],
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useKlines(opts: { symbol: string; interval: KlineInterval; market: "spot" | "futures"; limit?: number }) {
  const { symbol, interval, market, limit = 500 } = opts;
  const key = symbol ? `/api/markets/klines?symbol=${symbol}&interval=${interval}&market=${market}&limit=${limit}` : null;
  const { data, error, isLoading } = useSWR<{ candles: Candle[] }>(key, jsonFetcher as <T = unknown>(url: string) => Promise<T>, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });
  return { candles: data?.candles ?? [], error, isLoading };
}

export function useOrderBook(symbol: string, market: "spot" | "futures") {
  const key = symbol ? `/api/markets/orderbook?symbol=${symbol}&market=${market}&limit=50` : null;
  const { data, error, isLoading } = useSWR<OrderBookSnapshot>(
    key,
    jsonFetcher as <T = unknown>(url: string) => Promise<T>,
    { refreshInterval: 4_000 },
  );
  return {
    book: data,
    error,
    isLoading,
  };
}

export function useTrades(symbol: string, market: "spot" | "futures") {
  const key = symbol ? `/api/markets/trades?symbol=${symbol}&market=${market}&limit=60` : null;
  const { data, error, isLoading } = useSWR<{ trades: Trade[] }>(key, jsonFetcher as <T = unknown>(url: string) => Promise<T>, { refreshInterval: 4_000 });
  return { trades: data?.trades ?? [], error, isLoading };
}

export function useGlobalMarket() {
  const { data, error, isLoading } = useSWR<{ global: { totalMarketCapUsd: number; totalVolumeUsd: number; btcDominance: number; ethDominance: number; marketCapChangePct24h: number }; fearGreed: { value: number; classification: string } }>(
    "/api/markets/coins?limit=50",
    jsonFetcher as <T = unknown>(url: string) => Promise<T>,
    { refreshInterval: 60_000, dedupingInterval: 30_000 },
  );
  return { data, error, isLoading };
}
