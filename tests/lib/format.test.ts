import { describe, it, expect } from "vitest";
import { formatPrice, formatPercent, formatVolume, splitSymbol, displaySymbol, classNames } from "@/lib/format";

describe("format", () => {
  it("formatPrice handles small and large values", () => {
    expect(formatPrice(0.0001234)).toMatch(/0\.000123/);
    expect(formatPrice(12345.6)).toMatch(/12,345/);
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(NaN)).toBe("—");
  });

  it("formatPercent rounds to 2 dp", () => {
    expect(formatPercent(12.345)).toBe("12.35%");
    expect(formatPercent(-1.2)).toBe("-1.20%");
  });

  it("formatVolume uses compact notation", () => {
    expect(formatVolume(2_500_000_000)).toMatch(/2\.5B/);
    expect(formatVolume(null)).toBe("—");
  });

  it("splitSymbol identifies quote tokens", () => {
    expect(splitSymbol("BTCUSDT")).toEqual({ base: "BTC", quote: "USDT" });
    expect(splitSymbol("ETHUSDC")).toEqual({ base: "ETH", quote: "USDC" });
    expect(splitSymbol("EURUSDT")).toEqual({ base: "EUR", quote: "USDT" });
    expect(splitSymbol("WEIRD")).toEqual({ base: "WEIRD", quote: "USD" });
  });

  it("displaySymbol formats pairs", () => {
    expect(displaySymbol("BTCUSDT")).toBe("BTC/USDT");
    expect(displaySymbol("ETHUSDC")).toBe("ETH/USDC");
  });

  it("classNames filters falsy", () => {
    expect(classNames("a", false, undefined, "b", null)).toBe("a b");
  });
});
