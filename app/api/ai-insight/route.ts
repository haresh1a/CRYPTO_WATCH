// AI insight proxy. The browser NEVER sees ANTHROPIC_API_KEY —
// this route authenticates the user, rate-limits them, fetches
// fresh ticker + candle data, asks the model, and returns the
// structured insight. We log usage to ai_usage for cost tracking.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getKlines, getTicker } from "@/lib/binance";
import { generateInsight } from "@/lib/ai";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

const Body = z.object({
  symbol: z.string().min(3).max(40),
  market: z.enum(["spot", "futures"]).default("spot"),
});

const LIMIT = 30;        // requests
const WINDOW_MS = 60_000; // per minute

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const ip = clientIp(req.headers);
    const rl = rateLimit({ key: `ai:${user.id}:${ip}`, limit: LIMIT, windowMs: WINDOW_MS });
    if (!rl.ok) {
      throw errors.rateLimited("AI rate limit reached, slow down", { reset: rl.reset });
    }

    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw errors.badRequest("invalid body", body.error.flatten());

    const { symbol, market } = body.data;

    // Fetch inputs in parallel.
    const [ticker, candles] = await Promise.all([
      getTicker(symbol, market),
      getKlines({ symbol, interval: "1h", market, limit: 60 }),
    ]);

    const insight = await generateInsight({ symbol: symbol.toUpperCase(), ticker, candles });

    // Best-effort usage log. Don't fail the request on a DB hiccup.
    try {
      const supabase = getServerSupabase();
      await supabase.from("ai_usage").insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        tokens_in: 0,  // not exposed by Anthropic's count_tokens endpoint here
        tokens_out: 0,
        cost_usd: 0,
      });
    } catch (err) {
      console.error("[ai] usage log failed", err);
    }

    return insight;
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;