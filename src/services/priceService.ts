/**
 * Historical price data service using Twelve Data API.
 * - Free tier: 800 req/day, 8 req/min
 * - CORS OK: works from browser
 * - Supports US ETFs (SPY, EFA...) and Korean ETFs (069500, 360750...)
 *
 * Prices are cached in AsyncStorage with 24h TTL to minimize API calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.twelvedata.com';
const CACHE_PREFIX = '@allocate:prices:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// API key from env — set EXPO_PUBLIC_TWELVE_DATA_API_KEY in .env
function getApiKey(): string | null {
  try {
    return process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY ?? null;
  } catch {
    return null;
  }
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
 * Fetch weekly close prices for a single ticker (52 weeks = 1 year).
 * Returns oldest → newest.
 */
async function fetchFromAPI(ticker: string): Promise<PricePoint[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const url = `${API_BASE}/time_series?symbol=${encodeURIComponent(ticker)}&interval=1week&outputsize=60&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }

  const json = await res.json();
  if (json.status === 'error') {
    throw new Error(json.message ?? 'API_ERROR');
  }

  const values: { datetime: string; close: string }[] = json.values ?? [];
  if (values.length === 0) throw new Error('NO_DATA');

  // API returns newest first → reverse to oldest first
  return values
    .map((v) => ({ date: v.datetime, close: parseFloat(v.close) }))
    .reverse();
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
 * Get price data for a ticker (cache first, then API).
 */
export async function getTickerPrices(ticker: string): Promise<TickerPriceData> {
  const cached = await getCache(ticker);
  if (cached) return cached;

  const prices = await fetchFromAPI(ticker);
  const data: TickerPriceData = {
    ticker,
    prices,
    fetchedAt: new Date().toISOString(),
  };
  await setCache(data);
  return data;
}

/**
 * Fetch price data for multiple tickers.
 * Returns a map: ticker → TickerPriceData.
 * Fetches in parallel with rate limiting (max 6 concurrent).
 */
export async function getMultipleTickerPrices(
  tickers: string[],
): Promise<Record<string, TickerPriceData>> {
  const result: Record<string, TickerPriceData> = {};
  const errors: Record<string, string> = {};

  // Deduplicate
  const unique = [...new Set(tickers)];

  // Fetch in batches of 6 to respect rate limits (8/min)
  const BATCH_SIZE = 6;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (ticker) => {
      try {
        const data = await getTickerPrices(ticker);
        result[ticker] = data;
      } catch (e: any) {
        errors[ticker] = e.message ?? 'UNKNOWN';
      }
    });
    await Promise.all(promises);

    // Wait 8s between batches if more remain (rate limit: 8/min)
    if (i + BATCH_SIZE < unique.length) {
      await new Promise((r) => setTimeout(r, 8000));
    }
  }

  return result;
}

/**
 * Check if the API key is configured.
 */
export function isApiKeyConfigured(): boolean {
  return !!getApiKey();
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
  r1m: number | null;   // 1-month return
  r3m: number | null;   // 3-month return
  r6m: number | null;   // 6-month return
  r12m: number | null;  // 12-month return
  score13612W: number | null;
  avgMomentum: number | null;  // avg of available lookbacks
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
