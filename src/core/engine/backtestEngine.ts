/**
 * Backtest engine using historical price data.
 * Simulates monthly rebalancing for static strategies.
 */
import { PricePoint } from '../../services/priceService';

export interface BacktestResult {
  dates: string[];          // YYYY-MM-DD
  cumulativeReturns: number[]; // 1.0 = start, 1.15 = +15%
  totalReturn: number;      // e.g., 0.45 = +45%
  cagr: number;             // annualized return
  maxDrawdown: number;      // e.g., -0.25 = -25%
  sharpe: number;           // annualized Sharpe ratio (risk-free = 0)
  volatility: number;       // annualized volatility
  monthlyReturns: number[]; // individual monthly returns
}

interface AllocationInput {
  ticker: string;
  weight: number; // 0~100
}

/**
 * Align price arrays to common dates, using the intersection of available dates.
 */
function alignPriceData(
  priceMap: Record<string, PricePoint[]>,
  tickers: string[],
): { dates: string[]; priceMatrix: Record<string, number[]> } {
  // Find common dates across all tickers
  const dateSets = tickers.map((t) => new Set(priceMap[t]?.map((p) => p.date) ?? []));
  if (dateSets.length === 0) return { dates: [], priceMatrix: {} };

  let commonDates = dateSets[0];
  for (let i = 1; i < dateSets.length; i++) {
    commonDates = new Set([...commonDates].filter((d) => dateSets[i].has(d)));
  }

  const sortedDates = [...commonDates].sort();

  const priceMatrix: Record<string, number[]> = {};
  for (const ticker of tickers) {
    const priceByDate = new Map(priceMap[ticker]?.map((p) => [p.date, p.close]) ?? []);
    priceMatrix[ticker] = sortedDates.map((d) => priceByDate.get(d) ?? 0);
  }

  return { dates: sortedDates, priceMatrix };
}

/**
 * Run backtest for a static allocation strategy.
 * Uses monthly rebalancing (every ~4 weeks for weekly data).
 */
export function runBacktest(
  allocations: AllocationInput[],
  priceMap: Record<string, PricePoint[]>,
): BacktestResult | null {
  const tickers = allocations.filter((a) => a.weight > 0).map((a) => a.ticker);
  if (tickers.length === 0) return null;

  // Check all tickers have data
  for (const t of tickers) {
    if (!priceMap[t] || priceMap[t].length < 52) return null; // need at least 1 year
  }

  const { dates, priceMatrix } = alignPriceData(priceMap, tickers);
  if (dates.length < 52) return null;

  const weights = new Map(allocations.map((a) => [a.ticker, a.weight / 100]));

  // Monthly sampling: pick every ~4th data point (weekly data)
  const monthlyIndices: number[] = [0];
  for (let i = 4; i < dates.length; i += 4) {
    monthlyIndices.push(i);
  }
  // Include the last point
  if (monthlyIndices[monthlyIndices.length - 1] !== dates.length - 1) {
    monthlyIndices.push(dates.length - 1);
  }

  const cumulativeReturns: number[] = [1.0];
  const monthlyReturns: number[] = [];
  const resultDates: string[] = [dates[monthlyIndices[0]]];

  for (let m = 1; m < monthlyIndices.length; m++) {
    const prevIdx = monthlyIndices[m - 1];
    const curIdx = monthlyIndices[m];

    // Calculate weighted return for this period
    let periodReturn = 0;
    for (const ticker of tickers) {
      const prevPrice = priceMatrix[ticker][prevIdx];
      const curPrice = priceMatrix[ticker][curIdx];
      if (prevPrice === 0) continue;
      const tickerReturn = (curPrice - prevPrice) / prevPrice;
      periodReturn += tickerReturn * (weights.get(ticker) ?? 0);
    }

    const newCumReturn = cumulativeReturns[cumulativeReturns.length - 1] * (1 + periodReturn);
    cumulativeReturns.push(newCumReturn);
    monthlyReturns.push(periodReturn);
    resultDates.push(dates[curIdx]);
  }

  // Calculate stats
  const totalReturn = cumulativeReturns[cumulativeReturns.length - 1] - 1;
  const years = monthlyReturns.length / 12;
  const cagr = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

  // Max drawdown
  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const v of cumulativeReturns) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < maxDrawdown) maxDrawdown = dd;
  }

  // Volatility and Sharpe
  const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / monthlyReturns.length;
  const monthlyVol = Math.sqrt(variance);
  const volatility = monthlyVol * Math.sqrt(12);
  const sharpe = volatility > 0 ? (cagr / volatility) : 0;

  return {
    dates: resultDates,
    cumulativeReturns,
    totalReturn,
    cagr,
    maxDrawdown,
    sharpe,
    volatility,
    monthlyReturns,
  };
}
