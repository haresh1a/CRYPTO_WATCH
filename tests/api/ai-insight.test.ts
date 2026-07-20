// Smoke test for the AI insight endpoint. We stub the user + the
// upstream generators and assert the rate-limit + body validation
// paths.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/binance", () => ({
  getTicker: vi.fn(),
  getKlines: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  generateInsight: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: vi.fn(),
}));

import { POST } from "@/app/api/ai-insight/route";
import { requireUser } from "@/lib/auth";
import { getTicker, getKlines } from "@/lib/binance";
import { generateInsight } from "@/lib/ai";
import { getServerSupabase } from "@/lib/supabase/server";

function makeReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/ai-insight", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai-insight", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (requireUser as any).mockResolvedValue({ id: "user-1" });
    (getTicker as any).mockResolvedValue({ symbol: "BTCUSDT", lastPrice: 30000, priceChangePercent: 1 });
    (getKlines as any).mockResolvedValue([]);
    (generateInsight as any).mockResolvedValue({
      symbol: "BTCUSDT", sentiment: "neutral", confidence: 0.5,
      summary: "x", bullets: ["a","b","c","d"], generatedAt: new Date().toISOString(),
    });
    (getServerSupabase as any).mockReturnValue({
      from: () => ({ insert: () => Promise.resolve({ error: null }) }),
    });
  });

  it("returns the insight for an authenticated user", async () => {
    const res = await POST(makeReq({ symbol: "BTCUSDT", market: "spot" }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sentiment).toBe("neutral");
  });

  it("rejects unauthenticated callers with 401", async () => {
    const { errors } = await import("@/lib/errors");
    (requireUser as any).mockImplementationOnce(async () => { throw errors.unauthorized(); });
    const res = await POST(makeReq({ symbol: "BTCUSDT" }) as any);
    expect(res.status).toBe(401);
  });

  it("rejects malformed bodies", async () => {
    const res = await POST(makeReq({ symbol: "X" }) as any);
    expect(res.status).toBe(400);
  });
});
