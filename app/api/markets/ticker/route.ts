import { NextRequest } from "next/server";
import { get24hTickers, getTradableSymbols } from "@/lib/binance";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import type { Ticker } from "@/types";

// Returns 24h tickers for either market. Optional `filter` param
// supports client-side tabs: `gainers`, `losers`, `watchlist` (the
// watchlist variant is handled separately so it can join the DB).
export async function GET(req: NextRequest) {
  return handle(async () => {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const market = (sp.get("market") ?? "spot") as "spot" | "futures";
    if (market !== "spot" && market !== "futures") {
      throw errors.badRequest("market must be 'spot' or 'futures'");
    }

    const limit = Math.min(Number(sp.get("limit") ?? 200), 1000);
    const filter = (sp.get("filter") ?? "all") as "all" | "gainers" | "losers";

    const [tickers, allowed] = await Promise.all([
      get24hTickers(market),
      getTradableSymbols(market).catch(() => null),
    ]);

    let filtered: Ticker[] = allowed
      ? tickers.filter((t) => allowed.includes(t.symbol))
      : tickers;

    if (filter === "gainers") {
      filtered = filtered.filter((t) => t.priceChangePercent > 0)
        .sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    } else if (filter === "losers") {
      filtered = filtered.filter((t) => t.priceChangePercent < 0)
        .sort((a, b) => a.priceChangePercent - b.priceChangePercent);
    } else {
      filtered = filtered.sort((a, b) => b.quoteVolume - a.quoteVolume);
    }

    return { tickers: filtered.slice(0, limit) };
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;