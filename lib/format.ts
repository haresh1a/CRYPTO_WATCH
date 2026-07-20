// Shared formatting helpers. Safe to import from both server and
// client. Avoid pulling in Intl polyfills — we only need a small
// subset of formatters, all of which are available in Node 18+.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const usdSmall = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
});
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value >= 1 ? usd.format(value) : usdSmall.format(value);
}

export function formatVolume(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return compact.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return pct.format(value / 100);
}

export function formatChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function formatRelative(value: string | number | Date | null | undefined): string {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Binance-style "BTCUSDT" -> "BTC/USDT" without a quote suffix
// (USDC, USDT, BUSD, TUSD, FDUSD, USDP, DAI all collapse to USD).
const QUOTE_TOKENS = ["USDT", "BUSD", "USDC", "TUSD", "FDUSD", "USDP", "DAI", "EUR", "TRY", "BTC", "ETH"];
export function splitSymbol(symbol: string): { base: string; quote: string } {
  const upper = symbol.toUpperCase();
  for (const q of QUOTE_TOKENS) {
    if (upper.endsWith(q) && upper.length > q.length) {
      return { base: upper.slice(0, -q.length), quote: q };
    }
  }
  return { base: upper, quote: "USD" };
}

export function displaySymbol(symbol: string): string {
  const { base, quote } = splitSymbol(symbol);
  return `${base}/${quote}`;
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
