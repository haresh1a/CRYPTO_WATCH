// Polls a single symbol's current price through our own proxy.
// Used by the chart to keep the in-progress candle ticking.
// 1.5s cadence is a sweet spot — fast enough to feel live, slow
// enough to stay well under Binance's 1200 req/min anon limit
// even with many concurrent viewers.

"use client";

import useSWR from "swr";

type Quote = {
  symbol: string;
  market: "spot" | "futures";
  lastPrice: number;
  highPrice: number;
  lowPrice: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  time: number;
};

const fetcher = async (url: string): Promise<Quote> => {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`quote ${res.status}`);
  return res.json();
};

export function useQuote(symbol: string, market: "spot" | "futures") {
  const { data, error } = useSWR<Quote>(
    symbol ? `/api/markets/quote?symbol=${symbol.toUpperCase()}&market=${market}` : null,
    fetcher,
    { refreshInterval: 1_500, revalidateOnFocus: false, dedupingInterval: 1_000 },
  );
  return { quote: data, error };
}
