import { NextRequest } from "next/server";
import { getTopCoins, getGlobalMarketData } from "@/lib/coingecko";
import { getFearGreed } from "@/lib/fear-greed";
import { handle } from "@/lib/api";
import { errors } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Query = z.object({
  limit: z.coerce.number().int().min(1).max(250).optional(),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    const url = new URL(req.url);
    const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) throw errors.badRequest("invalid query", parsed.error.flatten());
    const [coins, global, fng] = await Promise.all([
      getTopCoins(parsed.data.limit ?? 100),
      getGlobalMarketData(),
      getFearGreed(),
    ]);
    return { coins, global, fearGreed: fng };
  });
}
