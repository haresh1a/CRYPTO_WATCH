// Tiny health endpoint. Returns ok + cached response from our
// own upstream fetches. Used by the footer's status pill.

import { NextResponse } from "next/server";
import { get24hTickers } from "@/lib/binance";
import { getFearGreed } from "@/lib/fear-greed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const t0 = Date.now();
  try {
    // Cheap probes — these hit the in-memory cache most of the time.
    const [tickers, fng] = await Promise.all([
      get24hTickers("spot"),
      getFearGreed(),
    ]);

    return NextResponse.json({
      ok: true,
      markets: tickers.length,
      fng: fng.value,
      latencyMs: Date.now() - t0,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 503 },
    );
  }
}