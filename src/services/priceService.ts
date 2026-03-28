/**
 * Historical price data service.
 *
 * Data source: GitHub Pages (updated daily by GitHub Actions + Twelve Data API)
 * URL pattern: https://{owner}.github.io/{repo}/prices/{TICKER}.json
 *
 * - No API key needed in the app
 * - No CORS issues (GitHub Pages serves with proper headers)
 * - Cached in AsyncStorage with 6h TTL
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@allocate:prices:';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (data updated daily)

/**
 * GitHub Pages base URL for price data.
 * Set EXPO_PUBLIC_PRICE_DATA_URL in .env to override (e.g., for custom domain).
 * Default: GitHub Pages URL derived from repo.
 */
function getPriceBaseUrl(): string {
  const custom = process.env.EXPO_PUBLIC_PRICE_DATA_URL;
  if (custom) return custom.replace(/\/$/, '');
  // Default: TeikyungKim.github.io/Allocate
  return 'https://teikyungkim.github.io/Allocate/prices';
}

export interface PricePoint {
  date: string;   // YYYY-MM-DD
  close: number;
}

export interface TickerPriceData {
  ticker: string;
  prices: PricePoint[];    // oldest → newest
  fetchedAt: string;       // ISO timestamp
}

/**
 * Fetch price data for a ticker from GitHub Pages.
 */
async function fetchFromGitHubPages(ticker: string): Promise<TickerPriceData> {
  const url = `${getPriceBaseUrl()}/${encodeURIComponent(ticker)}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }
  const data: TickerPriceData = await res.json();
  if (!data.prices || data.prices.length === 0) {
    throw new Error('NO_DATA');
  }
  return data;
}

/**
 * Get cached price data for a ticker, or null if stale/missing.
 */
async function getCache(ticker: string): Promise<TickerPriceData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + ticker);
    if (!raw) return null;
    const data: TickerPriceData = JSON.parse(raw);
    const age = Date.now() - new Date(data.fetchedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCache(data: TickerPriceData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + data.ticker, JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * Get price data for a ticker (cache first, then GitHub Pages).
 */
export async function getTickerPrices(ticker: string): Promise<TickerPriceData> {
  const cached = await getCache(ticker);
  if (cached) return cached;

  const data = await fetchFromGitHubPages(ticker);
  await setCache(data);
  return data;
}

/**
 * Fetch price data for multiple tickers in parallel.
 * Returns a map: ticker → TickerPriceData.
 */
export async function getMultipleTickerPrices(
  tickers: string[],
): Promise<Record<string, TickerPriceData>> {
  const result: Record<string, TickerPriceData> = {};
  const unique = [...new Set(tickers)];

  // GitHub Pages has no rate limit → fetch all in parallel
  const promises = unique.map(async (ticker) => {
    try {
      const data = await getTickerPrices(ticker);
      result[ticker] = data;
    } catch {
      // Skip failed tickers silently
    }
  });
  await Promise.all(promises);

  return result;
}

/**
 * Check if price data is available (always true — no API key needed).
 */
export function isApiKeyConfigured(): boolean {
  return true;
}

/**
 * Clear all cached price data.
 */
export async function clearPriceCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const priceKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (priceKeys.length > 0) {
      await AsyncStorage.multiRemove(priceKeys);
    }
  } catch { /* ignore */ }
}

/**
 * Fetch the manifest to check data freshness.
 */
export async function fetchManifest(): Promise<{
  tickers: string[];
  updatedAt: string;
  count: number;
} | null> {
  try {
    const url = `${getPriceBaseUrl()}/manifest.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Momentum helpers (work directly with PricePoint[]) ──

/**
 * Get the close price approximately N months ago from a price array (oldest → newest).
 * Weekly data: 1 month ≈ 4 weeks.
 */
function priceNMonthsAgo(prices: PricePoint[], months: number): number | null {
  const weeksBack = months * 4;
  const idx = prices.length - 1 - weeksBack;
  if (idx < 0 || idx >= prices.length) return null;
  return prices[idx].close;
}

function latestPrice(prices: PricePoint[]): number | null {
  if (prices.length === 0) return null;
  return prices[prices.length - 1].close;
}

/**
 * Calculate N-month return.
 */
export function calcReturnFromPrices(prices: PricePoint[], months: number): number | null {
  const current = latestPrice(prices);
  const past = priceNMonthsAgo(prices, months);
  if (current == null || past == null || past === 0) return null;
  return (current - past) / past;
}

/**
 * Calculate 13612W momentum score.
 * Score = 12 × R_1m + 4 × R_3m + 2 × R_6m + 1 × R_12m
 */
export function calc13612WFromPrices(prices: PricePoint[]): number | null {
  const r1 = calcReturnFromPrices(prices, 1);
  const r3 = calcReturnFromPrices(prices, 3);
  const r6 = calcReturnFromPrices(prices, 6);
  const r12 = calcReturnFromPrices(prices, 12);
  if (r1 == null || r3 == null || r6 == null || r12 == null) return null;
  return 12 * r1 + 4 * r3 + 2 * r6 + 1 * r12;
}

/**
 * Calculate average momentum across multiple lookback periods.
 */
export function calcAvgMomentumFromPrices(prices: PricePoint[], months: number[]): number | null {
  const returns = months.map((m) => calcReturnFromPrices(prices, m));
  if (returns.some((r) => r == null)) return null;
  const sum = (returns as number[]).reduce((a, b) => a + b, 0);
  return sum / returns.length;
}

/**
 * Calculate SMA (simple moving average) for N months using weekly data.
 */
export function calcSMAFromPrices(prices: PricePoint[], months: number): number | null {
  const weeks = months * 4;
  if (prices.length < weeks) return null;
  const slice = prices.slice(-weeks);
  const sum = slice.reduce((s, p) => s + p.close, 0);
  return sum / slice.length;
}

/**
 * Check if current price is above SMA.
 */
export function isAboveSMAFromPrices(prices: PricePoint[], months: number): boolean | null {
  const current = latestPrice(prices);
  const sma = calcSMAFromPrices(prices, months);
  if (current == null || sma == null) return null;
  return current > sma;
}

/**
 * Comprehensive momentum data for a single ticker.
 */
export interface TickerMomentum {
  ticker: string;
  currentPrice: number | null;
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  r12m: number | null;
  score13612W: number | null;
  avgMomentum: number | null;
  sma10m: number | null;
  aboveSMA10m: boolean | null;
}

export function calcTickerMomentum(prices: PricePoint[]): Omit<TickerMomentum, 'ticker'> {
  return {
    currentPrice: latestPrice(prices),
    r1m: calcReturnFromPrices(prices, 1),
    r3m: calcReturnFromPrices(prices, 3),
    r6m: calcReturnFromPrices(prices, 6),
    r12m: calcReturnFromPrices(prices, 12),
    score13612W: calc13612WFromPrices(prices),
    avgMomentum: calcAvgMomentumFromPrices(prices, [1, 3, 6, 12]),
    sma10m: calcSMAFromPrices(prices, 10),
    aboveSMA10m: isAboveSMAFromPrices(prices, 10),
  };
}
