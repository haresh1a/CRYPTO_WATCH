// Lightweight ticker for the live "last price" tick on the chart.
// Polled every ~1.5s by the chart so the current candle updates
// as the price moves. Cached server-side for 1s — 1 request per
// second per user is fine for Binance's public data and lets us
// fan out to many concurrent chart subscribers.

import { NextRequest } from "next/server";
import { getTicker } from "@/lib/binance";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

const Query = z.object({
  symbol: z.string().min(3).max(40),
  market: z.enum(["spot", "futures"]).default("spot"),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) throw errors.badRequest("invalid query", parsed.error.flatten());

    const { symbol, market } = parsed.data;
    const t = await getTicker(symbol, market);

    return {
      symbol: t.symbol,
      market: t.marketType,
      lastPrice: t.lastPrice,
      highPrice: t.highPrice,
      lowPrice: t.lowPrice,
      priceChangePercent: t.priceChangePercent,
      volume: t.volume,
      quoteVolume: t.quoteVolume,
      time: Date.now(),
    };
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;