import { NextRequest } from "next/server";
import { getAllSymbols, getTradableSymbols } from "@/lib/binance";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

const Query = z.object({
  market: z.enum(["spot", "futures"]).default("spot"),
});

// Returns both the lightweight symbol list and the tradable subset.
export async function GET(req: NextRequest) {
  return handle(async () => {
    const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) throw errors.badRequest("invalid query", parsed.error.flatten());

    const { market } = parsed.data;
    const [all, tradable] = await Promise.all([
      getAllSymbols(market).catch(() => []),
      getTradableSymbols(market).catch(() => []),
    ]);

    return { all, tradable };
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;