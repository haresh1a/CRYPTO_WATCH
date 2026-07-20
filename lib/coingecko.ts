// CoinGecko public client, server-side only. Cached aggressively
// (60s) per the spec. Free tier, no key — we use the public API
// with a custom User-Agent to avoid the worst of the rate limits.

import { swr } from "./cache";

const BASE = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 8_000;

async function cgFetch<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
        "user-agent": "CryptoWatchPro/1.0 (+https://github.com/sigma-code-op/CRYPTO_WATCH)",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`coingecko ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export type GlobalMarketData = {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  marketCapChangePct24h: number;
};

type RawGlobal = {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    active_cryptocurrencies: number;
    market_cap_change_percentage_24h_usd: number;
  };
};

export async function getGlobalMarketData(): Promise<GlobalMarketData> {
  return swr("cg:global", 60_000, async () => {
    const raw = await cgFetch<RawGlobal>("/global");
    const d = raw.data;
    return {
      totalMarketCapUsd: d.total_market_cap.usd,
      totalVolumeUsd: d.total_volume.usd,
      btcDominance: d.market_cap_percentage.btc,
      ethDominance: d.market_cap_percentage.eth,
      activeCryptocurrencies: d.active_cryptocurrencies,
      marketCapChangePct24h: d.market_cap_change_percentage_24h_usd,
    };
  });
}

export type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  priceChange24h: number;
  priceChangePct24h: number;
  sparkline: number[];
};

type RawCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: { price: number[] };
};

export async function getTopCoins(limit = 100): Promise<Coin[]> {
  return swr(`cg:top:${limit}`, 60_000, async () => {
    const params = new URLSearchParams({
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: String(Math.min(Math.max(limit, 1), 250)),
      page: "1",
      sparkline: "true",
      price_change_percentage: "24h",
    });
    const raw = await cgFetch<RawCoin[]>(`/coins/markets?${params}`);
    return raw.map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      image: c.image,
      currentPrice: c.current_price,
      marketCap: c.market_cap,
      marketCapRank: c.market_cap_rank,
      totalVolume: c.total_volume,
      priceChange24h: c.price_change_24h,
      priceChangePct24h: c.price_change_percentage_24h,
      sparkline: c.sparkline_in_7d?.price ?? [],
    }));
  });
}
