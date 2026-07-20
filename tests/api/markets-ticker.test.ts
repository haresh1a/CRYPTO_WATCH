// Smoke tests for the markets ticker route. We mock the upstream
// Binance client to avoid a network round-trip and exercise the
// normalisation + filter logic.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/binance", () => ({
  get24hTickers: vi.fn(),
  getTradableSymbols: vi.fn(),
}));

import { GET } from "@/app/api/markets/ticker/route";
import { get24hTickers, getTradableSymbols } from "@/lib/binance";

const sampleTicker = {
  symbol: "BTCUSDT",
  marketType: "spot" as const,
  lastPrice: 30000,
  priceChangePercent: 2.5,
  priceChange: 750,
  highPrice: 30500,
  lowPrice: 29500,
  volume: 1000,
  quoteVolume: 30_000_000,
  openTime: 0,
  closeTime: 0,
};

function makeReq(qs: Record<string, string>): Request {
  const u = new URL("http://localhost/api/markets/ticker");
  for (const [k, v] of Object.entries(qs)) u.searchParams.set(k, v);
  return new Request(u.toString());
}

describe("GET /api/markets/ticker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (get24hTickers as any).mockResolvedValue([sampleTicker]);
    (getTradableSymbols as any).mockResolvedValue(["BTCUSDT", "ETHUSDT"]);
  });

  it("returns tickers filtered to tradable set", async () => {
    const res = await GET(makeReq({ market: "spot" }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tickers).toHaveLength(1);
    expect(body.tickers[0].symbol).toBe("BTCUSDT");
  });

  it("rejects bad market", async () => {
    const res = await GET(makeReq({ market: "forex" }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("bad_request");
  });

  it("gainers filter sorts by change desc", async () => {
    (get24hTickers as any).mockResolvedValue([
      sampleTicker,
      { ...sampleTicker, symbol: "ETHUSDT", priceChangePercent: 10 },
      { ...sampleTicker, symbol: "XRPUSDT", priceChangePercent: -2 },
    ]);
    const res = await GET(makeReq({ market: "spot", filter: "gainers" }) as any);
    const body = await res.json();
    expect(body.tickers[0].symbol).toBe("ETHUSDT");
  });
});
