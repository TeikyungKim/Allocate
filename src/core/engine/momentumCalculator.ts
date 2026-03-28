/**
 * Momentum calculation utilities for dynamic strategies.
 *
 * Note: This app uses static/embedded price data, so momentum calculations
 * are simplified. In a real app, you'd fetch historical price data.
 * For now, we provide the calculation framework that works with
 * the static default allocations as fallback.
 */

export interface PriceData {
  date: string;
  close: number;
}

/**
 * Calculate simple return over N months
 */
export function calcReturn(prices: PriceData[], months: number): number {
  if (prices.length < 2) return 0;
  const current = prices[prices.length - 1].close;
  const daysBack = months * 21; // approximate trading days
  const idx = Math.max(0, prices.length - 1 - daysBack);
  const past = prices[idx].close;
  return past > 0 ? (current - past) / past : 0;
}

/**
 * Calculate 13612W momentum score (weighted: 12×1M + 4×3M + 2×6M + 1×12M)
 */
export function calc13612W(prices: PriceData[]): number {
  const r1 = calcReturn(prices, 1);
  const r3 = calcReturn(prices, 3);
  const r6 = calcReturn(prices, 6);
  const r12 = calcReturn(prices, 12);
  return 12 * r1 + 4 * r3 + 2 * r6 + 1 * r12;
}

/**
 * Calculate simple moving average over N months
 */
export function calcSMA(prices: PriceData[], months: number): number {
  const days = months * 21;
  const slice = prices.slice(-days);
  if (slice.length === 0) return 0;
  return slice.reduce((sum, p) => sum + p.close, 0) / slice.length;
}

/**
 * Check if current price is above SMA
 */
export function isAboveSMA(prices: PriceData[], months: number): boolean {
  if (prices.length === 0) return false;
  return prices[prices.length - 1].close > calcSMA(prices, months);
}

/**
 * Calculate average momentum across multiple lookback periods
 */
export function calcAverageMomentum(prices: PriceData[], lookbackMonths: number[]): number {
  if (lookbackMonths.length === 0) return 0;
  const sum = lookbackMonths.reduce((acc, m) => acc + calcReturn(prices, m), 0);
  return sum / lookbackMonths.length;
}

/**
 * Rank assets by momentum score, return top N
 */
export function rankByMomentum(
  assetScores: { assetClass: string; score: number }[],
  topN: number,
): string[] {
  return assetScores
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((a) => a.assetClass);
}
