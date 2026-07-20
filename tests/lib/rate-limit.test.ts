import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit, clientIp } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to limit, then blocks", () => {
    const opts = { key: "user:1:ai", limit: 3, windowMs: 60_000 };
    expect(rateLimit(opts).ok).toBe(true);
    expect(rateLimit(opts).ok).toBe(true);
    expect(rateLimit(opts).ok).toBe(true);
    const blocked = rateLimit(opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window", () => {
    const opts = { key: "user:2:ai", limit: 1, windowMs: 1_000 };
    expect(rateLimit(opts).ok).toBe(true);
    expect(rateLimit(opts).ok).toBe(false);
    vi.advanceTimersByTime(1_500);
    expect(rateLimit(opts).ok).toBe(true);
  });

  it("clientIp prefers x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8", "x-real-ip": "9.9.9.9" });
    expect(clientIp(h)).toBe("1.2.3.4");
  });

  it("clientIp falls back to x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("clientIp returns 'anonymous' when no headers", () => {
    expect(clientIp(new Headers())).toBe("anonymous");
  });
});
