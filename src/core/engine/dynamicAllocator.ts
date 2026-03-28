/**
 * Compute actual dynamic strategy allocations from real momentum data.
 *
 * Takes strategy config + momentum scores + optional unemployment data
 * → returns asset allocations that reflect current market conditions.
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

export interface UnemploymentInfo {
  isAbove: boolean;  // 현재 실업률 > 12개월 이동평균
  current: number;
  sma12: number;
}

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
  return assets
    .map((ac) => ({ ac, score: scoreFn(ac) }))
    .filter((x) => x.score != null)
    .sort((a, b) => b.score! - a.score!)
    .slice(0, n)
    .map((x) => x.ac);
}

/** Rank assets with positive score only, return top N */
function topNPositive(
  assets: string[],
  scoreFn: (ac: string) => number | null,
  n: number,
): string[] {
  return assets
    .map((ac) => ({ ac, score: scoreFn(ac) }))
    .filter((x) => x.score != null && x.score > 0)
    .sort((a, b) => b.score! - a.score!)
    .slice(0, n)
    .map((x) => x.ac);
}

function equalWeight(assets: string[]): StrategyAllocation[] {
  if (assets.length === 0) return [];
  const w = 100 / assets.length;
  return assets.map((ac) => ({ assetClass: ac, weight: w }));
}

function single(ac: string): StrategyAllocation[] {
  return [{ assetClass: ac, weight: 100 }];
}

/** Merge duplicate asset classes by summing weights */
function mergeAllocations(allocs: StrategyAllocation[]): StrategyAllocation[] {
  const map = new Map<string, number>();
  for (const a of allocs) {
    map.set(a.assetClass, (map.get(a.assetClass) ?? 0) + a.weight);
  }
  return Array.from(map.entries()).map(([assetClass, weight]) => ({ assetClass, weight }));
}

/**
 * Compute dynamic allocation based on strategy rules and real data.
 * @param strategy - Strategy definition
 * @param momentum - US ticker → momentum data
 * @param unemployment - Optional unemployment data for LAA
 * Returns null if insufficient data to compute.
 */
export function computeDynamicAllocation(
  strategy: Strategy,
  momentum: MomentumMap,
  unemployment?: UnemploymentInfo | null,
): StrategyAllocation[] | null {
  const dc = strategy.dynamicConfig;
  if (!dc) return null;

  const off = dc.offensiveAssets ?? [];
  const def = dc.defensiveAssets ?? [];
  const canary = dc.canaryAssets ?? [];

  switch (dc.method) {
    // ── 듀얼 모멘텀 계열 ──────────────────────────

    case 'dual-momentum': {
      // SPY vs EFA 12개월 수익률 비교 → 승자, 절대 모멘텀 필터
      const rSPY = getR12m(momentum, '미국주식');
      const rEFA = getR12m(momentum, '선진국주식');
      if (rSPY == null || rEFA == null) return null;
      const winner = rSPY >= rEFA ? '미국주식' : '선진국주식';
      const winnerR = rSPY >= rEFA ? rSPY : rEFA;
      return winnerR > 0 ? single(winner) : single('미국채권');
    }

    case 'adm': {
      // 가속 듀얼 모멘텀: (R_1m + R_3m + R_6m) / 3 평균으로 비교
      const sSPY = getAvgMom(momentum, '미국주식');
      const sEFA = getAvgMom(momentum, '선진국주식');
      if (sSPY == null || sEFA == null) return null;
      const winner = sSPY >= sEFA ? '미국주식' : '선진국주식';
      const winnerS = sSPY >= sEFA ? sSPY : sEFA;
      return winnerS > 0 ? single(winner) : single('미국채권');
    }

    case 'cam': {
      // 복합 절대 모멘텀: 4기간 평균 (1/3/6/12m)
      const sSPY = getAvgMom(momentum, '미국주식');
      const sEFA = getAvgMom(momentum, '선진국주식');
      if (sSPY == null || sEFA == null) return null;
      const winner = sSPY >= sEFA ? '미국주식' : '선진국주식';
      const winnerS = sSPY >= sEFA ? sSPY : sEFA;
      return winnerS > 0 ? single(winner) : single('미국채권');
    }

    case 'papa-dm': {
      // 3레그 각각 독립 듀얼 모멘텀 (R_12m)
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
      return mergeAllocations(result);
    }

    case 'edm': {
      // 확장 듀얼 모멘텀: 주식 듀얼 + 리츠 절대 + 금 절대
      const r12SPY = getR12m(momentum, '미국주식');
      const r12EFA = getR12m(momentum, '선진국주식');
      const r12REIT = getR12m(momentum, '리츠');
      const r12GOLD = getR12m(momentum, '금');
      if (r12SPY == null || r12EFA == null || r12REIT == null || r12GOLD == null) return null;

      const result: StrategyAllocation[] = [];
      const leg1Winner = r12SPY >= r12EFA ? '미국주식' : '선진국주식';
      const leg1R = r12SPY >= r12EFA ? r12SPY : r12EFA;
      result.push({ assetClass: leg1R > 0 ? leg1Winner : '미국채권', weight: 34 });
      result.push({ assetClass: r12REIT > 0 ? '리츠' : '미국채권', weight: 33 });
      result.push({ assetClass: r12GOLD > 0 ? '금' : '미국채권', weight: 33 });
      return mergeAllocations(result);
    }

    // ── SMA 필터 계열 ──────────────────────────────

    case 'gtaa': {
      // 5자산 각각 현재가 > SMA_10m 이면 포함 (각 20%), 나머지 현금
      const passing: string[] = [];
      for (const ac of off) {
        const above = getAboveSMA(momentum, ac);
        if (above == null) return null;
        if (above) passing.push(ac);
      }
      if (passing.length === 0) return single('단기채');
      const result: StrategyAllocation[] = passing.map((ac) => ({ assetClass: ac, weight: 20 }));
      const cashWeight = 100 - passing.length * 20;
      if (cashWeight > 0) result.push({ assetClass: '단기채', weight: cashWeight });
      return result;
    }

    // ── 13612W 모멘텀 계열 ─────────────────────────

    case 'vaa':
    case 'vigilant': {
      // 공격 전부 양수 → top-1, 하나라도 음수 → 방어 top-1
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
      // 카나리아 2개 점검 → 0개 음수: top-6 공격 / 1개: 50:50 / 2개: 방어
      const cScores = canary.map((ac) => getScore13612W(momentum, ac));
      if (cScores.some((s) => s == null)) return null;
      const negCount = cScores.filter((s) => s! <= 0).length;
      const scoreFn = (ac: string) => getScore13612W(momentum, ac);

      if (negCount === 0) {
        const top = topN(off, scoreFn, 6);
        return equalWeight(top);
      } else if (negCount === 1) {
        const topOff = topN(off, scoreFn, 3);
        const topDef = topN(def, scoreFn, 1);
        const result: StrategyAllocation[] = topOff.map((ac) => ({
          assetClass: ac, weight: 50 / topOff.length,
        }));
        if (topDef.length > 0) result.push({ assetClass: topDef[0], weight: 50 });
        return result;
      } else {
        const topDef = topN(def, scoreFn, 1);
        return topDef.length > 0 ? single(topDef[0]) : single('단기채');
      }
    }

    case 'baa': {
      // 카나리아 전부 양수 → 공격 top-1, 그 외 → 방어 top-1
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

    // ── 브레드스(Breadth) 보호 계열 ──────────────────

    case 'paa': {
      // BF = SMA 위 자산 수, 채권비중 = (1 - BF/N)^2
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
      // PAA 브레드스 + 듀얼 모멘텀 결합
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
      // 일반화 보호 모멘텀: 브레드스 + Top-K
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

    // ── 모멘텀 + 최적화 ──────────────────────────────

    case 'aaa': {
      // 6개월 모멘텀 상위 5개, 동일비중 (최소분산은 일간 데이터 필요)
      const scored = off
        .map((ac) => ({ ac, r6: getR6m(momentum, ac) }))
        .filter((x) => x.r6 != null)
        .sort((a, b) => b.r6! - a.r6!);
      if (scored.length === 0) return null;
      const top5 = scored.slice(0, 5).filter((x) => x.r6! > 0);
      if (top5.length === 0) return single('단기채');
      return equalWeight(top5.map((x) => x.ac));
    }

    // ── 실업률 기반 ──────────────────────────────────

    case 'laa': {
      // 기본: 미국주식 25%, 선진국주식 25%, 미국채권 25%, 금 25%
      // 실업률 > 12개월 SMA → 미국주식 25% → 단기채 25%로 교체
      if (!unemployment) return null;

      const result: StrategyAllocation[] = [
        { assetClass: unemployment.isAbove ? '단기채' : '미국주식', weight: 25 },
        { assetClass: '선진국주식', weight: 25 },
        { assetClass: '미국채권', weight: 25 },
        { assetClass: '금', weight: 25 },
      ];
      return result;
    }

    default:
      return null;
  }
}
