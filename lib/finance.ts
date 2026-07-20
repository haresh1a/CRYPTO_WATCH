// Finance math used by the futures tracker, portfolio, and alerts.
// Pure (no DOM, no network) so it can be unit-tested and reused
// on both the server and the client.
//
// IMPORTANT: these are TRACKING ESTIMATES. They do not replace
// the real margin / liquidation formulas used by Binance. We
// document the assumptions inline so users can see what we are
// and are not accounting for (funding fees, maker/taker fees,
// maintenance margin tier, etc.).

export type Side = "long" | "short";

/** Direction multiplier: +1 for long, -1 for short. */
export function direction(side: Side): 1 | -1 {
  return side === "long" ? 1 : -1;
}

/** Unrealised PnL for an isolated-margin position. */
export function unrealisedPnl(opts: {
  side: Side;
  entryPrice: number;
  markPrice: number;
  size: number;
}): number {
  const dir = direction(opts.side);
  return (opts.markPrice - opts.entryPrice) * opts.size * dir;
}

/** Initial margin required to open an isolated-margin position. */
export function initialMargin(opts: { entryPrice: number; size: number; leverage: number }): number {
  if (opts.leverage <= 0) return 0;
  return (opts.entryPrice * opts.size) / opts.leverage;
}

/** Unrealised PnL as a percentage of initial margin (ROE). */
export function unrealisedPnlPercent(opts: {
  side: Side;
  entryPrice: number;
  markPrice: number;
  size: number;
  leverage: number;
}): number {
  const margin = initialMargin({ entryPrice: opts.entryPrice, size: opts.size, leverage: opts.leverage });
  if (margin <= 0) return 0;
  const pnl = unrealisedPnl(opts);
  return (pnl / margin) * 100;
}

/** Realised PnL when closing an isolated-margin position. */
export function realisedPnl(opts: { side: Side; entryPrice: number; closePrice: number; size: number }): number {
  const dir = direction(opts.side);
  return (opts.closePrice - opts.entryPrice) * opts.size * dir;
}

/**
 * Estimated liquidation price for an ISOLATED-MARGIN position.
 *
 *   long:  liq = entry * (1/leverage + MMR)
 *   short: liq = entry * max(0, 1/leverage - MMR)
 *
 * Where MMR is the maintenance margin rate. We default to 0.5%
 * which roughly matches Binance USDT perpetuals at < 50k USD
 * notional. For larger positions the real MMR is tier-based; the
 * user should check the exchange's risk table.
 *
 * Real Binance isolated-margin formula also subtracts the
 * "maintenance amount" (a flat USD floor per tier) but for most
 * retail positions at < 50k notional, this is negligible.
 */
export function estimatedLiquidation(opts: {
  side: Side;
  entryPrice: number;
  leverage: number;
  maintenanceMarginRate?: number; // default 0.005 (0.5%)
}): number {
  if (opts.leverage <= 0 || opts.entryPrice <= 0) return 0;
  const mmr = opts.maintenanceMarginRate ?? 0.005;
  const ratio = 1 / opts.leverage;
  if (opts.side === "long") {
    return opts.entryPrice * (ratio + mmr);
  }
  return opts.entryPrice * Math.max(0, ratio - mmr);
}

/** Distance from current mark to liq, as % of mark. Positive = safe. */
export function distanceToLiquidationPct(opts: {
  side: Side;
  entryPrice: number;
  markPrice: number;
  leverage: number;
}): number {
  const liq = estimatedLiquidation({ side: opts.side, entryPrice: opts.entryPrice, leverage: opts.leverage });
  if (liq <= 0 || opts.markPrice <= 0) return 0;
  return ((opts.markPrice - liq) / opts.markPrice) * 100 * direction(opts.side);
}

// ----- SPOT -----

export function positionValue(amount: number, price: number): number {
  return amount * price;
}

export function unrealisedSpotPnl(opts: { amount: number; costBasis: number; price: number }): number {
  const value = positionValue(opts.amount, opts.price);
  const cost = positionValue(opts.amount, opts.costBasis);
  return value - cost;
}

export function unrealisedSpotPnlPercent(opts: { costBasis: number; price: number }): number {
  if (opts.costBasis <= 0) return 0;
  return ((opts.price - opts.costBasis) / opts.costBasis) * 100;
}

// ----- ALERTS -----

/** Pure percent change between two prices. Returns 0 if previous is 0. */
export function pctChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/** Hit-test for a percent-change alert. Sign must match and magnitude must be at least |threshold|. */
export function pctChangeHit(delta: number, threshold: number): boolean {
  if (delta === 0 || threshold === 0) return false;
  return Math.sign(delta) === Math.sign(threshold) && Math.abs(delta) >= Math.abs(threshold);
}
