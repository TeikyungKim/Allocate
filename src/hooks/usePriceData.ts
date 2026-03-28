/**
 * React hook for fetching and caching historical price data.
 * Data is served from GitHub Pages (updated daily by GitHub Actions).
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getMultipleTickerPrices,
  calcTickerMomentum,
  TickerMomentum,
} from '../services/priceService';

export interface PriceDataState {
  /** ticker → momentum data */
  momentum: Record<string, TickerMomentum>;
  /** Is data currently being fetched? */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Last fetched timestamp */
  lastFetchedAt: string | null;
  /** Refresh data (clear cache and re-fetch) */
  refresh: () => void;
}

/**
 * Hook to fetch price data for a list of tickers.
 * Computes momentum scores automatically.
 */
export function usePriceData(tickers: string[]): PriceDataState {
  const [momentum, setMomentum] = useState<Record<string, TickerMomentum>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tickerKey = tickers.sort().join(',');

  const fetchData = useCallback(async () => {
    if (tickers.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const priceMap = await getMultipleTickerPrices(tickers);
      const momentumMap: Record<string, TickerMomentum> = {};

      for (const [ticker, data] of Object.entries(priceMap)) {
        const m = calcTickerMomentum(data.prices);
        momentumMap[ticker] = { ticker, ...m };
      }

      setMomentum(momentumMap);
      if (Object.keys(momentumMap).length > 0) {
        setLastFetchedAt(new Date().toISOString());
      }
    } catch (e: any) {
      setError(e.message ?? '데이터를 가져올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [tickerKey, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    momentum,
    loading,
    error,
    lastFetchedAt,
    refresh,
  };
}
