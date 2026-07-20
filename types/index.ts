// ----- Domain types shared across the app. Keep this file
// framework-agnostic so it can be imported by API routes,
// server components, and the browser.

export type MarketType = "spot" | "futures";

export type Ticker = {
  symbol: string;
  marketType: MarketType;
  lastPrice: number;
  priceChangePercent: number;
  priceChange: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  openTime?: number;
  closeTime?: number;
};

export type Candle = {
  time: number; // unix seconds — required by lightweight-charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type KlineInterval =
  | "1m" | "3m" | "5m" | "15m" | "30m"
  | "1h" | "2h" | "4h" | "6h" | "8h" | "12h"
  | "1d" | "3d" | "1w" | "1M";

export type ChartType = "candles" | "heikin" | "line";

export type OrderBookLevel = { price: number; qty: number };
export type OrderBookSnapshot = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId: number;
};

export type Trade = {
  id: number;
  price: number;
  qty: number;
  time: number; // unix ms
  isBuyerMaker: boolean;
};

export type Alert = {
  id: string;
  symbol: string;
  marketType: MarketType;
  condition: "above" | "below" | "pct_change";
  threshold: number;
  pctWindow: "1h" | "24h" | "7d" | null;
  active: boolean;
  triggeredAt: string | null;
  triggeredPrice: number | null;
  delivery: "toast" | "email" | "toast+email";
  createdAt: string;
};

export type WatchItem = {
  id: string;
  symbol: string;
  marketType: MarketType;
  note: string | null;
  createdAt: string;
};

export type Holding = {
  id: string;
  symbol: string;
  amount: number;
  costBasis: number;
  quoteCurrency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FuturesPosition = {
  id: string;
  symbol: string;
  side: "long" | "short";
  leverage: number;
  entryPrice: number;
  markPrice: number | null;
  size: number;
  margin: number | null;
  liquidation: number | null;
  closed: boolean;
  closedAt: string | null;
  closePrice: number | null;
  realizedPnl: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  symbol: string;
  title: string | null;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type AIInsight = {
  symbol: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-1
  summary: string;
  bullets: string[];
  generatedAt: string;
};
