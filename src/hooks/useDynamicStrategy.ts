/**
 * Hook that returns a strategy with real-time dynamic allocations applied.
 * For static strategies, returns the original strategy unchanged.
 * For dynamic strategies, fetches momentum + unemployment data and computes actual allocations.
 */
import { useMemo, useState, useEffect } from 'react';
import { Strategy } from '../data/strategies';
import { usePriceData } from './usePriceData';
import { computeDynamicAllocation, UnemploymentInfo } from '../core/engine/dynamicAllocator';
import { fetchUnemploymentData, analyzeUnemployment } from '../services/priceService';

/** Map: asset class → US reference ticker */
const AC_TO_US: Record<string, string> = {
  '미국주식': 'SPY', '선진국주식': 'EFA', '신흥국주식': 'EEM',
  '미국채권': 'AGG', '장기채': 'TLT', '중기채': 'IEF', '단기채': 'SHY',
  '금': 'GLD', '원자재': 'DBC', '리츠': 'VNQ', '나스닥': 'QQQ',
  '소형가치주': 'VBR', '현금': 'BIL', '미국배당': 'SCHD',
  '미국가치': 'VTV', '하이일드': 'HYG', '투자등급채': 'LQD',
};

export function useDynamicStrategy(strategy: Strategy): {
  effectiveStrategy: Strategy;
  isDynamic: boolean;
  loading: boolean;
  unemploymentInfo: UnemploymentInfo | null;
} {
  const dc = strategy.dynamicConfig;

  // Collect all asset classes from dynamic config
  const allAssets = useMemo(() => {
    if (!dc) return [];
    const set = new Set<string>();
    dc.offensiveAssets?.forEach((a) => set.add(a));
    dc.defensiveAssets?.forEach((a) => set.add(a));
    dc.canaryAssets?.forEach((a) => set.add(a));
    return Array.from(set);
  }, [dc]);

  const usTickers = useMemo(() => {
    return [...new Set(allAssets.map((ac) => AC_TO_US[ac]).filter(Boolean))];
  }, [allAssets]);

  const priceData = usePriceData(usTickers);

  // Fetch unemployment data for LAA
  const [unemploymentInfo, setUnemploymentInfo] = useState<UnemploymentInfo | null>(null);
  useEffect(() => {
    if (dc?.method === 'laa') {
      fetchUnemploymentData().then((data) => {
        if (data) {
          const info = analyzeUnemployment(data);
          setUnemploymentInfo(info);
        }
      });
    }
  }, [dc?.method]);

  const result = useMemo(() => {
    if (!dc || Object.keys(priceData.momentum).length === 0) {
      // LAA can work with just unemployment data
      if (dc?.method === 'laa' && unemploymentInfo) {
        const computed = computeDynamicAllocation(strategy, priceData.momentum, unemploymentInfo);
        if (computed) {
          return { effectiveStrategy: { ...strategy, defaultAllocations: computed }, isDynamic: true };
        }
      }
      return { effectiveStrategy: strategy, isDynamic: false };
    }

    const computed = computeDynamicAllocation(strategy, priceData.momentum, unemploymentInfo);
    if (!computed) {
      return { effectiveStrategy: strategy, isDynamic: false };
    }

    return {
      effectiveStrategy: { ...strategy, defaultAllocations: computed },
      isDynamic: true,
    };
  }, [strategy, dc, priceData.momentum, unemploymentInfo]);

  return {
    ...result,
    loading: priceData.loading,
    unemploymentInfo,
  };
}
