import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheGet, cacheSet, cached, swr } from "@/lib/cache";

describe("cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T00:00:00Z"));
  });

  it("set + get respects TTL", () => {
    cacheSet("k", "v", 1000);
    expect(cacheGet("k")).toBe("v");
    vi.advanceTimersByTime(1500);
    expect(cacheGet("k")).toBeUndefined();
  });

  it("cached returns hit without calling factory", async () => {
    cacheSet("k2", 42, 5000);
    const fn = vi.fn(async () => 100);
    await expect(cached("k2", 5000, fn)).resolves.toBe(42);
    expect(fn).not.toHaveBeenCalled();
  });

  it("cached calls factory on miss", async () => {
    const fn = vi.fn(async () => 7);
    await expect(cached("k3", 5000, fn)).resolves.toBe(7);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("swr returns fresh value, then stale + refetch", async () => {
    const fn = vi.fn(async () => "v1");
    await expect(swr("k4", 1000, fn)).resolves.toBe("v1");

    // Within TTL — no refetch.
    await expect(swr("k4", 1000, fn)).resolves.toBe("v1");
    expect(fn).toHaveBeenCalledOnce();

    // After TTL but before staleAt — returns stale, schedules refresh.
    const fn2 = vi.fn(async () => "v2");
    vi.advanceTimersByTime(1500);
    await expect(swr("k4", 1000, fn2)).resolves.toBe("v1");
    // Flush queued microtasks (the swr background refresh).
    await vi.runAllTimersAsync();
    expect(fn2).toHaveBeenCalled();
  });
});
