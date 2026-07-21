// Smoke test for the alerts endpoints.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getServerSupabase: vi.fn() }));

import { GET, POST } from "@/app/api/alerts/route";
import { PATCH, DELETE } from "@/app/api/alerts/[id]/route";
import { requireUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";

function makeReq(url: string, init: RequestInit = {}): Request {
  return new Request(url, init);
}

function chain(result: { data?: any; error?: any } = {}) {
  const c: any = {};
  for (const m of ["select","insert","update","delete","eq","is","order","single"]) c[m] = vi.fn().mockReturnValue(c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return c;
}

describe("/api/alerts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (requireUser as any).mockResolvedValue({ id: "u1" });
  });

  it("GET returns the user's alerts", async () => {
    const c = chain({ data: [{ id: "a1", symbol: "BTCUSDT", market_type: "spot", condition: "above", threshold: "100", pct_window: null, active: true, delivery: "toast", triggered_at: null, triggered_price: null, created_at: "2026-01-01" }], error: null });
    (getServerSupabase as any).mockReturnValue({ from: () => c });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0].symbol).toBe("BTCUSDT");
  });

  it("POST validates the body", async () => {
    const req = makeReq("http://localhost/api/alerts", { method: "POST", body: JSON.stringify({ symbol: "BTC" }) });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("DELETE removes the row", async () => {
    const c = chain({ error: null });
    (getServerSupabase as any).mockReturnValue({ from: () => c });
    const res = await DELETE(makeReq("http://localhost/api/alerts/a1") as any, { params: Promise.resolve({ id: "a1" }) });
    expect(res.status).toBe(200);
  });

  it("PATCH on nothing returns 400", async () => {
    const req = makeReq("http://localhost/api/alerts/a1", { method: "PATCH", body: JSON.stringify({}) });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "a1" }) });
    expect(res.status).toBe(400);
  });
});
