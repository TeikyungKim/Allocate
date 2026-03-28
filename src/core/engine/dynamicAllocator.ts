/**
 * Compute actual dynamic strategy allocations from real momentum data.
 *
 * Takes strategy config + momentum scores → returns asset allocations
 * that reflect the current market conditions.
 */
import { Strategy, StrategyAllocation } from '../../data/strategies';
import { TickerMomentum } from '../../services/priceService';

/** Map: asset class → US reference ticker */
const AC_TO_US: Record<string, string> = {
  '미국주식': 'SPY', '선진국주식': 'EFA', '신흥국주식': 'EEM',
  '미국채권': 'AGG', '장기채': 'TLT', '중기채': 'IEF', '단기채': 'SHY',
  '금': 'GLD', '원자재': 'DBC', '리츠': 'VNQ', '나스닥': 'QQQ',
  '소형가치주': 'VBR', '현금': 'BIL', '미국배당': 'SCHD',
  '미국가치': 'VTV', '하이일드': 'HYG', '투자등급채': 'LQD',
};

type MomentumMap = Record<string, TickerMomentum>;

function getMomentum(momentum: MomentumMap, assetClass: string): TickerMomentum | null {
  const ticker = AC_TO_US[assetClass];
  return ticker ? momentum[ticker] ?? null : null;
}

function getScore13612W(momentum: MomentumMap, ac: string): number | null {
  return getMomentum(momentum, ac)?.score13612W ?? null;
}

function getR12m(momentum: MomentumMap, ac: string): number | null {
  return getMomentum(momentum, ac)?.r12m ?? null;
}

function getAvgMom(momentum: MomentumMap, ac: string): number | null {
  return getMomentum(momentum, ac)?.avgMomentum ?? null;
}

function getAboveSMA(momentum: MomentumMap, ac: string): boolean | null {
  return getMomentum(momentum, ac)?.aboveSMA10m ?? null;
}

function getR6m(momentum: MomentumMap, ac: string): number | null {
  return getMomentum(momentum, ac)?.r6m ?? null;
}

/** Rank assets by score, return top N */
function topN(
  assets: string[],
  scoreFn: (ac: string) => number | null,
  n: number,
): string[] {
  const scored = assets
    .map((ac) => ({ ac, score: scoreFn(ac) }))
    .filter((x) => x.score != null)
    .sort((a, b) => b.score! - a.score!);
  return scored.slice(0, n).map((x) => x.ac);
}

/** Rank assets with positive score only, return top N */
function topNPositive(
  assets: string[],
  scoreFn: (ac: string) => number | null,
  n: number,
): string[] {
  const scored = assets
    .map((ac) => ({ ac, score: scoreFn(ac) }))
    .filter((x) => x.score != null && x.score > 0)
    .sort((a, b) => b.score! - a.score!);
  return scored.slice(0, n).map((x) => x.ac);
}

function equalWeight(assets: string[]): StrategyAllocation[] {
  if (assets.length === 0) return [];
  const w = 100 / assets.length;
  return assets.map((ac) => ({ assetClass: ac, weight: w }));
}

function single(ac: string): StrategyAllocation[] {
  return [{ assetClass: ac, weight: 100 }];
}

/**
 * Compute dynamic allocation based on strategy rules and real momentum data.
 * Returns null if insufficient data to compute.
 */
export function computeDynamicAllocation(
  strategy: Strategy,
  momentum: MomentumMap,
): StrategyAllocation[] | null {
  const dc = strategy.dynamicConfig;
  if (!dc) return null;

  const off = dc.offensiveAssets ?? [];
  const def = dc.defensiveAssets ?? [];
  const canary = dc.canaryAssets ?? [];

  switch (dc.method) {
    case 'dual-momentum': {
      const rSPY = getR12m(momentum, '미국주식');
      const rEFA = getR12m(momentum, '선진국주식');
      if (rSPY == null || rEFA == null) return null;
      const winner = rSPY >= rEFA ? '미국주식' : '선진국주식';
      const winnerR = rSPY >= rEFA ? rSPY : rEFA;
      return winnerR > 0 ? single(winner) : single('미국채권');
    }

    case 'adm': {
      const sSPY = getAvgMom(momentum, '미국주식');
      const sEFA = getAvgMom(momentum, '선진국주식');
      if (sSPY == null || sEFA == null) return null;
      const winner = sSPY >= sEFA ? '미국주식' : '선진국주식';
      const winnerS = sSPY >= sEFA ? sSPY : sEFA;
      return winnerS > 0 ? single(winner) : single('미국채권');
    }

    case 'cam': {
      const sSPY = getAvgMom(momentum, '미국주식');
      const sEFA = getAvgMom(momentum, '선진국주식');
      if (sSPY == null || sEFA == null) return null;
      const winner = sSPY >= sEFA ? '미국주식' : '선진국주식';
      const winnerS = sSPY >= sEFA ? sSPY : sEFA;
      return winnerS > 0 ? single(winner) : single('미국채권');
    }

    case 'gtaa': {
      // 5 assets: include if above SMA_10m, equal weight 20% each
      const passing: string[] = [];
      for (const ac of off) {
        const above = getAboveSMA(momentum, ac);
        if (above == null) return null; // insufficient data
        if (above) passing.push(ac);
      }
      if (passing.length === 0) return single('단기채');
      // Each passing asset gets 20% (fixed), rest goes to cash
      const result: StrategyAllocation[] = passing.map((ac) => ({ assetClass: ac, weight: 20 }));
      const cashWeight = 100 - passing.length * 20;
      if (cashWeight > 0) result.push({ assetClass: '단기채', weight: cashWeight });
      return result;
    }

    case 'vaa':
    case 'vigilant': {
      // All offensive must have 13612W > 0 → top-1, else defensive top-1
      const scores = off.map((ac) => ({ ac, score: getScore13612W(momentum, ac) }));
      if (scores.some((s) => s.score == null)) return null;
      const allPositive = scores.every((s) => s.score! > 0);
      if (allPositive) {
        const best = topN(off, (ac) => getScore13612W(momentum, ac), 1);
        return single(best[0]);
      }
      const bestDef = topN(def, (ac) => getScore13612W(momentum, ac), 1);
      return bestDef.length > 0 ? single(bestDef[0]) : single(def[0] ?? '단기채');
    }

    case 'daa': {
      // Canary: both > 0 → top-6 offensive. One < 0 → 50/50. Both < 0 → defensive
      const cScores = canary.map((ac) => getScore13612W(momentum, ac));
      if (cScores.some((s) => s == null)) return null;
      const negCount = cScores.filter((s) => s! <= 0).length;

      const scoreFn = (ac: string) => getScore13612W(momentum, ac);

      if (negCount === 0) {
        // All canary positive → offensive top-6 equal weight
        const top = topN(off, scoreFn, 6);
        return equalWeight(top);
      } else if (negCount === 1) {
        // One negative → 50% offensive top-3 + 50% defensive top-1
        const topOff = topN(off, scoreFn, 3);
        const topDef = topN(def, scoreFn, 1);
        const result: StrategyAllocation[] = topOff.map((ac) => ({
          assetClass: ac, weight: 50 / topOff.length,
        }));
        if (topDef.length > 0) result.push({ assetClass: topDef[0], weight: 50 });
        return result;
      } else {
        // Both negative → defensive top-1
        const topDef = topN(def, scoreFn, 1);
        return topDef.length > 0 ? single(topDef[0]) : single('단기채');
      }
    }

    case 'baa': {
      // Canary both > 0 → offensive top-1. Else → defensive top-1
      const cScores = canary.map((ac) => getScore13612W(momentum, ac));
      if (cScores.some((s) => s == null)) return null;
      const allPos = cScores.every((s) => s! > 0);
      const scoreFn = (ac: string) => getScore13612W(momentum, ac);
      if (allPos) {
        const best = topN(off, scoreFn, 1);
        return single(best[0]);
      }
      const bestDef = topN(def, scoreFn, 1);
      return bestDef.length > 0 ? single(bestDef[0]) : single('단기채');
    }

    case 'papa-dm': {
      // 3 legs, each independent dual momentum
      const legs: [string, string, number][] = [
        ['미국주식', '선진국주식', 34],
        ['장기채', '미국채권', 33],
        ['금', '리츠', 33],
      ];
      const result: StrategyAllocation[] = [];
      for (const [a, b, weight] of legs) {
        const rA = getR12m(momentum, a);
        const rB = getR12m(momentum, b);
        if (rA == null || rB == null) return null;
        const winner = rA >= rB ? a : b;
        const winnerR = rA >= rB ? rA : rB;
        result.push({ assetClass: winnerR > 0 ? winner : '단기채', weight });
      }
      // Merge duplicate 단기채
      return mergeAllocations(result);
    }

    case 'edm': {
      // 3 legs: dual momentum + absolute momentum for each
      const r12SPY = getR12m(momentum, '미국주식');
      const r12EFA = getR12m(momentum, '선진국주식');
      const r12REIT = getR12m(momentum, '리츠');
      const r12GOLD = getR12m(momentum, '금');
      if (r12SPY == null || r12EFA == null || r12REIT == null || r12GOLD == null) return null;

      const result: StrategyAllocation[] = [];
      // Leg 1: SPY vs EFA
      const leg1Winner = r12SPY >= r12EFA ? '미국주식' : '선진국주식';
      const leg1R = r12SPY >= r12EFA ? r12SPY : r12EFA;
      result.push({ assetClass: leg1R > 0 ? leg1Winner : '미국채권', weight: 34 });
      // Leg 2: REIT absolute
      result.push({ assetClass: r12REIT > 0 ? '리츠' : '미국채권', weight: 33 });
      // Leg 3: Gold absolute
      result.push({ assetClass: r12GOLD > 0 ? '금' : '미국채권', weight: 33 });
      return mergeAllocations(result);
    }

    case 'paa': {
      // Breadth: count assets above SMA
      const total = off.length;
      let bf = 0;
      for (const ac of off) {
        const above = getAboveSMA(momentum, ac);
        if (above == null) return null;
        if (above) bf++;
      }
      const bondWeight = Math.pow(1 - bf / total, 2) * 100;
      const offWeight = 100 - bondWeight;
      if (offWeight <= 0) return single('단기채');

      // Offensive: top-6 with positive momentum
      const scoreFn = (ac: string) => getScore13612W(momentum, ac);
      const topOff = topNPositive(off, scoreFn, 6);
      if (topOff.length === 0) return single('단기채');
      const result: StrategyAllocation[] = topOff.map((ac) => ({
        assetClass: ac, weight: offWeight / topOff.length,
      }));
      if (bondWeight > 0.5) result.push({ assetClass: '단기채', weight: bondWeight });
      return result;
    }

    case 'pdm': {
      // PAA breadth + dual momentum
      const total = off.length;
      let bf = 0;
      for (const ac of off) {
        const above = getAboveSMA(momentum, ac);
        if (above == null) return null;
        if (above) bf++;
      }
      const bondWeight = Math.pow(1 - bf / total, 2) * 100;
      const offWeight = 100 - bondWeight;

      if (offWeight <= 0) {
        const bestDef = topN(def, (ac) => getScore13612W(momentum, ac), 1);
        return bestDef.length > 0 ? single(bestDef[0]) : single('단기채');
      }

      // Dual momentum for offensive portion
      const rSPY = getR12m(momentum, '미국주식');
      const rEFA = getR12m(momentum, '선진국주식');
      if (rSPY == null || rEFA == null) return null;
      const winner = rSPY >= rEFA ? '미국주식' : '선진국주식';
      const winnerR = rSPY >= rEFA ? rSPY : rEFA;
      const offAsset = winnerR > 0 ? winner : (def[0] ?? '단기채');

      const result: StrategyAllocation[] = [{ assetClass: offAsset, weight: offWeight }];
      if (bondWeight > 0.5) {
        const bestDef = topN(def, (ac) => getScore13612W(momentum, ac), 1);
        result.push({ assetClass: bestDef[0] ?? '단기채', weight: bondWeight });
      }
      return mergeAllocations(result);
    }

    case 'gpm': {
      // Generalized: breadth + top-K
      const total = off.length;
      let bf = 0;
      for (const ac of off) {
        const s = getScore13612W(momentum, ac);
        if (s == null) return null;
        if (s > 0) bf++;
      }
      const protectWeight = Math.pow(1 - bf / total, 2) * 100;
      const offWeight = 100 - protectWeight;

      if (offWeight <= 0) {
        const bestDef = topN(def, (ac) => getScore13612W(momentum, ac), 1);
        return bestDef.length > 0 ? single(bestDef[0]) : single('단기채');
      }

      const scoreFn = (ac: string) => getScore13612W(momentum, ac);
      const topOff = topNPositive(off, scoreFn, dc.topN ?? 1);
      if (topOff.length === 0) return single('단기채');

      const result: StrategyAllocation[] = topOff.map((ac) => ({
        assetClass: ac, weight: offWeight / topOff.length,
      }));
      if (protectWeight > 0.5) {
        const bestDef = topN(def, scoreFn, 1);
        result.push({ assetClass: bestDef[0] ?? '단기채', weight: protectWeight });
      }
      return result;
    }

    case 'aaa': {
      // Top 5 by R_6m, simplified equal weight (no min-variance without daily data)
      const scored = off
        .map((ac) => ({ ac, r6: getR6m(momentum, ac) }))
        .filter((x) => x.r6 != null)
        .sort((a, b) => b.r6! - a.r6!);
      if (scored.length === 0) return null;
      const top5 = scored.slice(0, 5).filter((x) => x.r6! > 0);
      if (top5.length === 0) return single('단기채');
      return equalWeight(top5.map((x) => x.ac));
    }

    case 'laa':
      // Needs unemployment data — cannot compute, use default
      return null;

    default:
      return null;
  }
}

/** Merge duplicate asset classes by summing weights */
function mergeAllocations(allocs: StrategyAllocation[]): StrategyAllocation[] {
  const map = new Map<string, number>();
  for (const a of allocs) {
    map.set(a.assetClass, (map.get(a.assetClass) ?? 0) + a.weight);
  }
  return Array.from(map.entries()).map(([assetClass, weight]) => ({ assetClass, weight }));
}
